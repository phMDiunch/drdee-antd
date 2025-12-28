// src/server/repos/payment-voucher.repo.ts
import { prisma } from "@/services/prisma/prisma";
import { type Prisma, PrismaClient } from "@prisma/client";
import type {
  CreatePaymentVoucherRequest,
  UpdatePaymentVoucherRequest,
} from "@/shared/validation/payment-voucher.schema";
import dayjs from "dayjs";

/**
 * Complex Pattern: API Schema + Server Fields
 * Following appointment.repo.ts and consulted-service.repo.ts gold standards
 */
export type PaymentVoucherCreateInput = CreatePaymentVoucherRequest & {
  paymentNumber: string; // 🔒 Auto-generated: {PREFIX}-{YYMM}-{XXXX}
  paymentDate: Date; // 🔒 Server-controlled: now()
  totalAmount: number; // 🔒 Calculated: sum of details amounts
  cashierId: string; // 🔒 Server-controlled: currentUser.employeeId
  clinicId: string; // 🔒 Server-controlled: from currentUser or admin selection
  accountTypeUsed: string; // 🔒 Server-controlled: "COMPANY" | "PERSONAL" - track which account was used
  createdById: string; // 🔒 Server-controlled: currentUser.employeeId
  updatedById: string; // 🔒 Server-controlled: currentUser.employeeId
};

export type PaymentVoucherUpdateInput = Partial<
  Omit<
    UpdatePaymentVoucherRequest,
    "customerId" | "paymentNumber" | "paymentDate" | "cashierId"
  >
> & {
  totalAmount?: number; // 🔒 Recalculated if details change
  paymentDate?: Date; // Admin can update (converted from ISO string in service)
  cashierId?: string; // Admin can update
  updatedById?: string; // 🔒 Server-controlled: track who made the update
};

/**
 * Prisma include for full relations
 */
const paymentVoucherInclude = {
  customer: {
    select: {
      id: true,
      fullName: true,
      customerCode: true,
      phone: true,
      clinicId: true, // For permission checks after customer clinic transfer
    },
  },
  cashier: {
    select: {
      id: true,
      fullName: true,
    },
  },
  details: {
    include: {
      consultedService: {
        select: {
          id: true,
          consultedServiceName: true,
          finalPrice: true,
        },
      },
    },
  },
  createdBy: {
    select: {
      id: true,
      fullName: true,
    },
  },
  updatedBy: {
    select: {
      id: true,
      fullName: true,
    },
  },
  clinic: {
    select: {
      id: true,
      clinicCode: true,
      name: true,
      shortName: true,
      colorCode: true,
    },
  },
} satisfies Prisma.PaymentVoucherInclude;

/**
 * Derive clinic prefix from clinicCode (same logic as customer.service.ts)
 * This ensures consistency between customer codes and payment numbers
 */
function deriveClinicPrefix(clinicCode: string): string {
  return clinicCode.trim().toUpperCase();
}

/**
 * Payment Voucher Repository
 * Implements Complex + Server Fields pattern for business data
 */
export const paymentVoucherRepo = {
  /**
   * Generate unique payment number with retry logic
   * Format: {PREFIX}-{YYMM}-{XXXX}
   * Fetches clinic from DB and derives prefix (same as customer code generation)
   */
  async generatePaymentNumber(
    clinicId: string,
    tx?: Omit<
      PrismaClient,
      "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
    >
  ): Promise<string> {
    const db = tx || prisma;

    // Fetch clinic to get clinicCode - Use tx if provided
    const clinic = await db.clinic.findUnique({
      where: { id: clinicId },
      select: { clinicCode: true },
    });

    if (!clinic?.clinicCode) {
      throw new Error("Chi nhánh không hợp lệ");
    }

    const prefix = deriveClinicPrefix(clinic.clinicCode);
    const yymm = dayjs().format("YYMM");

    // Find the latest payment number with same prefix-month to get next sequence
    const latest = await db.paymentVoucher.findFirst({
      where: {
        paymentNumber: {
          startsWith: `${prefix}-${yymm}-`,
        },
      },
      select: { paymentNumber: true },
      orderBy: { paymentNumber: "desc" },
    });

    let nextSequence = 1;
    if (latest) {
      // Extract sequence from payment number: PREFIX-YYMM-XXXX
      const parts = latest.paymentNumber.split("-");
      if (parts.length === 3) {
        const lastSequence = parseInt(parts[2], 10);
        if (!isNaN(lastSequence)) {
          nextSequence = lastSequence + 1;
        }
      }
    }

    const sequence = nextSequence.toString().padStart(4, "0");
    const paymentNumber = `${prefix}-${yymm}-${sequence}`;

    return paymentNumber;
  },

  /**
   * Create new payment voucher with details
   * Uses transaction to ensure atomicity with debt synchronization
   */
  async create(data: PaymentVoucherCreateInput) {
    return prisma.$transaction(async (tx) => {
      // Generate unique payment number
      const paymentNumber = await this.generatePaymentNumber(data.clinicId, tx);

      // Create voucher
      const voucher = await tx.paymentVoucher.create({
        data: {
          paymentNumber,
          customerId: data.customerId,
          paymentDate: data.paymentDate,
          totalAmount: data.totalAmount,
          notes: data.notes,
          cashierId: data.cashierId,
          clinicId: data.clinicId,
          createdById: data.createdById,
          updatedById: data.updatedById,
        },
      });

      // Create details and update consulted services
      for (const detail of data.details) {
        await tx.paymentVoucherDetail.create({
          data: {
            paymentVoucherId: voucher.id,
            consultedServiceId: detail.consultedServiceId,
            amount: detail.amount,
            paymentMethod: detail.paymentMethod,
            createdById: data.createdById,
          },
        });

        // Update consulted service - Fetch current state to recalculate debt correctly
        const currentService = await tx.consultedService.findUnique({
          where: { id: detail.consultedServiceId },
          select: { finalPrice: true, amountPaid: true },
        });

        if (currentService) {
          const newAmountPaid = currentService.amountPaid + detail.amount;
          const newDebt = Math.max(
            0,
            currentService.finalPrice - newAmountPaid
          );

          await tx.consultedService.update({
            where: { id: detail.consultedServiceId },
            data: {
              amountPaid: newAmountPaid,
              debt: newDebt,
            },
          });
        }
      }

      // Fetch full voucher with relations
      return tx.paymentVoucher.findUnique({
        where: { id: voucher.id },
        include: paymentVoucherInclude,
      });
    });
  },

  /**
   * Update payment voucher
   * Handles rollback of old amounts and application of new amounts
   */
  async update(id: string, data: PaymentVoucherUpdateInput) {
    return prisma.$transaction(async (tx) => {
      // Fetch existing voucher with details
      const existing = await tx.paymentVoucher.findUnique({
        where: { id },
        include: {
          details: true,
        },
      });

      if (!existing) {
        throw new Error("Phiếu thu không tồn tại");
      }

      // Rollback old amounts if details are being updated
      if (data.details) {
        for (const detail of existing.details) {
          // Fetch current state to recalculate debt correctly
          const currentService = await tx.consultedService.findUnique({
            where: { id: detail.consultedServiceId },
            select: { finalPrice: true, amountPaid: true },
          });

          if (currentService) {
            const newAmountPaid = currentService.amountPaid - detail.amount;
            const newDebt = Math.max(
              0,
              currentService.finalPrice - newAmountPaid
            );

            await tx.consultedService.update({
              where: { id: detail.consultedServiceId },
              data: {
                amountPaid: newAmountPaid,
                debt: newDebt,
              },
            });
          }
        }

        // Delete old details
        await tx.paymentVoucherDetail.deleteMany({
          where: { paymentVoucherId: id },
        });
      }

      // Update voucher
      const updated = await tx.paymentVoucher.update({
        where: { id },
        data: {
          notes: data.notes,
          totalAmount: data.totalAmount,
          cashierId: data.cashierId,
          paymentDate: data.paymentDate,
          updatedById: data.updatedById,
        },
      });

      // Create new details if provided
      if (data.details) {
        for (const detail of data.details) {
          await tx.paymentVoucherDetail.create({
            data: {
              paymentVoucherId: updated.id,
              consultedServiceId: detail.consultedServiceId,
              amount: detail.amount,
              paymentMethod: detail.paymentMethod,
              createdById: data.updatedById!,
            },
          });

          // Fetch current state to recalculate debt correctly
          const currentService = await tx.consultedService.findUnique({
            where: { id: detail.consultedServiceId },
            select: { finalPrice: true, amountPaid: true },
          });

          if (currentService) {
            const newAmountPaid = currentService.amountPaid + detail.amount;
            const newDebt = Math.max(
              0,
              currentService.finalPrice - newAmountPaid
            );

            await tx.consultedService.update({
              where: { id: detail.consultedServiceId },
              data: {
                amountPaid: newAmountPaid,
                debt: newDebt,
              },
            });
          }
        }
      }

      // Fetch full voucher with relations
      return tx.paymentVoucher.findUnique({
        where: { id: updated.id },
        include: paymentVoucherInclude,
      });
    });
  },

  /**
   * Delete payment voucher
   * Rolls back all amounts to consulted services
   */
  async delete(id: string) {
    return prisma.$transaction(async (tx) => {
      // Fetch existing voucher with details
      const existing = await tx.paymentVoucher.findUnique({
        where: { id },
        include: {
          details: true,
        },
      });

      if (!existing) {
        throw new Error("Phiếu thu không tồn tại");
      }

      // Rollback all amounts
      for (const detail of existing.details) {
        // Fetch current state to recalculate debt correctly
        const currentService = await tx.consultedService.findUnique({
          where: { id: detail.consultedServiceId },
          select: { finalPrice: true, amountPaid: true },
        });

        if (currentService) {
          const newAmountPaid = currentService.amountPaid - detail.amount;
          const newDebt = Math.max(
            0,
            currentService.finalPrice - newAmountPaid
          );

          await tx.consultedService.update({
            where: { id: detail.consultedServiceId },
            data: {
              amountPaid: newAmountPaid,
              debt: newDebt,
            },
          });
        }
      }

      // Delete details
      await tx.paymentVoucherDetail.deleteMany({
        where: { paymentVoucherId: id },
      });

      // Delete voucher
      await tx.paymentVoucher.delete({
        where: { id },
      });

      return { success: true };
    });
  },

  /**
   * Find payment voucher by ID
   */
  async findById(id: string) {
    return prisma.paymentVoucher.findUnique({
      where: { id },
      include: paymentVoucherInclude,
    });
  },

  /**
   * List payment vouchers with pagination and filters
   */
  async list(params: {
    search?: string;
    page: number;
    pageSize: number;
    customerId?: string;
    clinicId?: string;
    sortField: string;
    sortDirection: "asc" | "desc";
  }) {
    const {
      search,
      page,
      pageSize,
      customerId,
      clinicId,
      sortField,
      sortDirection,
    } = params;
    const skip = (page - 1) * pageSize;

    // Build where conditions
    const where: Prisma.PaymentVoucherWhereInput = {};

    if (customerId) {
      where.customerId = customerId;
    }

    if (clinicId) {
      where.clinicId = clinicId;
    }

    if (search) {
      where.OR = [
        { paymentNumber: { contains: search, mode: "insensitive" } },
        { customer: { fullName: { contains: search, mode: "insensitive" } } },
        {
          customer: { customerCode: { contains: search, mode: "insensitive" } },
        },
        { customer: { phone: { contains: search, mode: "insensitive" } } },
        { cashier: { fullName: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Build orderBy
    const orderBy: Prisma.PaymentVoucherOrderByWithRelationInput = {};
    if (sortField === "paymentNumber") {
      orderBy.paymentNumber = sortDirection;
    } else if (sortField === "customerName") {
      orderBy.customer = { fullName: sortDirection };
    } else if (sortField === "paymentDate") {
      orderBy.paymentDate = sortDirection;
    } else if (sortField === "totalAmount") {
      orderBy.totalAmount = sortDirection;
    } else if (sortField === "cashierName") {
      orderBy.cashier = { fullName: sortDirection };
    } else {
      orderBy.createdAt = sortDirection;
    }

    const [items, total] = await Promise.all([
      prisma.paymentVoucher.findMany({
        where,
        include: paymentVoucherInclude,
        orderBy,
        skip,
        take: pageSize,
      }),
      prisma.paymentVoucher.count({ where }),
    ]);

    return { items, total };
  },

  /**
   * List payment vouchers for daily view
   */
  async listDaily(params: {
    clinicId: string;
    dateStart: Date;
    dateEnd: Date;
  }) {
    const { clinicId, dateStart, dateEnd } = params;

    const where: Prisma.PaymentVoucherWhereInput = {
      clinicId,
      paymentDate: {
        gte: dateStart,
        lte: dateEnd,
      },
    };

    const items = await prisma.paymentVoucher.findMany({
      where,
      include: paymentVoucherInclude,
      orderBy: {
        paymentDate: "desc",
      },
    });

    // Calculate statistics
    let totalAmount = 0;
    const byMethod: Record<string, { amount: number; count: number }> = {
      "Tiền mặt": { amount: 0, count: 0 },
      "Quẹt thẻ thường": { amount: 0, count: 0 },
      "Quẹt thẻ Visa": { amount: 0, count: 0 },
      "Chuyển khoản": { amount: 0, count: 0 },
    };

    for (const voucher of items) {
      totalAmount += voucher.totalAmount;
      for (const detail of voucher.details) {
        if (byMethod[detail.paymentMethod]) {
          byMethod[detail.paymentMethod].amount += detail.amount;
          byMethod[detail.paymentMethod].count += 1;
        }
      }
    }

    return {
      items,
      count: items.length,
      statistics: {
        totalAmount,
        totalCount: items.length,
        byMethod,
      },
    };
  },

  /**
   * Get unpaid services for a customer
   */
  async getUnpaidServices(customerId: string) {
    const services = await prisma.consultedService.findMany({
      where: {
        customerId,
        serviceStatus: "Đã chốt",
        debt: {
          gt: 0,
        },
      },
      select: {
        id: true,
        consultedServiceName: true,
        finalPrice: true,
        amountPaid: true,
        debt: true,
        serviceStatus: true,
        dentalService: {
          select: {
            id: true,
            name: true,
            paymentAccountType: true,
          },
        },
      },
      orderBy: {
        serviceConfirmDate: "desc",
      },
    });

    const totalDebt = services.reduce((sum, service) => sum + service.debt, 0);

    return {
      items: services,
      totalDebt,
    };
  },
};
