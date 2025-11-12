// src/server/services/payment-voucher.service.ts
import { ServiceError } from "./errors";
import {
  CreatePaymentVoucherRequestSchema,
  UpdatePaymentVoucherRequestSchema,
  GetPaymentVouchersQuerySchema,
  GetPaymentVouchersDailyQuerySchema,
  PaymentVouchersListResponseSchema,
  PaymentVouchersDailyResponseSchema,
  PaymentVoucherResponseSchema,
  UnpaidServicesResponseSchema,
} from "@/shared/validation/payment-voucher.schema";
import type { UserCore } from "@/shared/types/user";
import { paymentVoucherRepo } from "@/server/repos/payment-voucher.repo";
import type {
  PaymentVoucherCreateInput,
  PaymentVoucherUpdateInput,
} from "@/server/repos/payment-voucher.repo";
import { mapPaymentVoucherToResponse } from "./payment-voucher/_mappers";
import { paymentVoucherPermissions } from "@/shared/permissions/payment-voucher.permissions";
import { prisma } from "@/services/prisma/prisma";

/**
 * Require authenticated user (not just admin)
 */
function requireAuth(user: UserCore | null | undefined) {
  if (!user) {
    throw new ServiceError("UNAUTHORIZED", "Bạn chưa đăng nhập", 401);
  }
  if (!user.employeeId) {
    throw new ServiceError(
      "MISSING_EMPLOYEE_ID",
      "Tài khoản chưa được liên kết với nhân viên",
      403
    );
  }
}

export const paymentVoucherService = {
  /**
   * Create new payment voucher
   */
  async create(currentUser: UserCore | null, body: unknown) {
    requireAuth(currentUser);

    const parsed = CreatePaymentVoucherRequestSchema.parse(body);

    // Validate permissions
    const canCreate = paymentVoucherPermissions.canCreate(currentUser!);
    if (!canCreate.allowed) {
      throw new ServiceError(
        "PERMISSION_DENIED",
        canCreate.reason || "Không có quyền tạo phiếu thu",
        403
      );
    }

    // Get clinic ID
    const clinicId =
      currentUser?.role === "admin"
        ? currentUser.clinicId
        : currentUser?.clinicId;

    if (!clinicId) {
      throw new ServiceError(
        "MISSING_CLINIC",
        "Không thể xác định chi nhánh",
        400
      );
    }

    // Validate unpaid services
    const unpaid = await paymentVoucherRepo.getUnpaidServices(
      parsed.customerId
    );

    for (const detail of parsed.details) {
      const service = unpaid.items.find(
        (s) => s.id === detail.consultedServiceId
      );

      if (!service) {
        throw new ServiceError(
          "INVALID_SERVICE",
          "Dịch vụ không tồn tại hoặc không còn nợ",
          400
        );
      }

      if (detail.amount > service.debt) {
        throw new ServiceError(
          "AMOUNT_EXCEEDS_DEBT",
          `Số tiền thu (${detail.amount.toLocaleString()}) vượt quá công nợ (${service.debt.toLocaleString()}) của dịch vụ ${
            service.consultedServiceName
          }`,
          400
        );
      }
    }

    // Calculate total amount
    const totalAmount = parsed.details.reduce(
      (sum, detail) => sum + detail.amount,
      0
    );

    // Prepare data
    const data: PaymentVoucherCreateInput = {
      ...parsed,
      paymentNumber: "", // Will be generated in repo
      paymentDate: new Date(),
      totalAmount,
      cashierId: currentUser!.employeeId!,
      clinicId,
      createdById: currentUser!.employeeId!,
      updatedById: currentUser!.employeeId!,
    };

    // Execute
    const created = await paymentVoucherRepo.create(data);

    if (!created) {
      throw new ServiceError("CREATE_FAILED", "Không thể tạo phiếu thu", 500);
    }

    // Map response
    return PaymentVoucherResponseSchema.parse(
      mapPaymentVoucherToResponse(created)
    );
  },

  /**
   * Update payment voucher
   */
  async update(id: string, currentUser: UserCore | null, body: unknown) {
    requireAuth(currentUser);

    const parsed = UpdatePaymentVoucherRequestSchema.parse(body);

    // Fetch existing voucher
    const existing = await paymentVoucherRepo.findById(id);
    if (!existing) {
      throw new ServiceError("NOT_FOUND", "Phiếu thu không tồn tại", 404);
    }

    // Validate permissions
    try {
      paymentVoucherPermissions.validateUpdate(currentUser!, existing, parsed);
    } catch (error) {
      throw new ServiceError(
        "PERMISSION_DENIED",
        error instanceof Error ? error.message : "Không có quyền sửa",
        403
      );
    }

    // Prepare update data
    const data: PaymentVoucherUpdateInput = {
      updatedById: currentUser!.employeeId!,
    };

    // Handle field updates based on permissions
    const permission = paymentVoucherPermissions.canEdit(
      currentUser!,
      existing
    );

    if (permission.fullAccess) {
      // Admin: Full access
      if (parsed.details) {
        // Validate unpaid services if details are changed
        const unpaid = await paymentVoucherRepo.getUnpaidServices(
          existing.customerId
        );

        // Add back current voucher amounts to get true unpaid
        const currentAmounts = new Map(
          existing.details.map((d) => [d.consultedServiceId, d.amount])
        );

        // Get all service IDs from both existing and new details
        const allServiceIds = new Set([
          ...existing.details.map((d) => d.consultedServiceId),
          ...parsed.details.map((d) => d.consultedServiceId),
        ]);

        // For services that are in the existing voucher but not in unpaid list,
        // we need to fetch them separately to validate
        const missingServiceIds = Array.from(allServiceIds).filter(
          (id) => !unpaid.items.some((s) => s.id === id)
        );

        let additionalServices: Array<{
          id: string;
          consultedServiceName: string;
          finalPrice: number;
          debt: number;
        }> = [];

        if (missingServiceIds.length > 0) {
          additionalServices = await prisma.consultedService.findMany({
            where: {
              id: { in: missingServiceIds },
              customerId: existing.customerId,
              serviceStatus: "Đã chốt",
            },
            select: {
              id: true,
              consultedServiceName: true,
              finalPrice: true,
              debt: true,
            },
          });
        }

        // Combine unpaid and additional services
        const allServices = [...unpaid.items, ...additionalServices];

        for (const detail of parsed.details) {
          const service = allServices.find(
            (s) => s.id === detail.consultedServiceId
          );

          if (!service) {
            throw new ServiceError(
              "INVALID_SERVICE",
              "Dịch vụ không tồn tại hoặc không còn nợ",
              400
            );
          }

          // Calculate available debt (current debt + what this voucher paid before)
          const previousAmount =
            currentAmounts.get(detail.consultedServiceId) || 0;
          const availableDebt = service.debt + previousAmount;

          if (detail.amount > availableDebt) {
            throw new ServiceError(
              "AMOUNT_EXCEEDS_DEBT",
              `Số tiền thu (${detail.amount.toLocaleString()}) vượt quá công nợ khả dụng (${availableDebt.toLocaleString()}) của dịch vụ ${
                service.consultedServiceName
              }`,
              400
            );
          }
        }

        data.details = parsed.details;
        data.totalAmount = parsed.details.reduce(
          (sum, detail) => sum + detail.amount,
          0
        );
      }

      if (parsed.notes !== undefined) {
        data.notes = parsed.notes;
      }

      // Admin can update cashierId and paymentDate
      if (parsed.cashierId !== undefined) {
        data.cashierId = parsed.cashierId;
      }

      if (parsed.paymentDate !== undefined) {
        // Convert ISO string to Date object
        data.paymentDate = new Date(parsed.paymentDate);
      }
    } else if (permission.limitedAccess) {
      // Non-admin today: Only notes and payment methods
      if (parsed.notes !== undefined) {
        data.notes = parsed.notes;
      }

      // Update payment methods only (keep amounts and services)
      if (parsed.details) {
        data.details = existing.details.map((existingDetail) => {
          const updatedDetail = parsed.details!.find(
            (d) => d.consultedServiceId === existingDetail.consultedServiceId
          );

          return {
            consultedServiceId: existingDetail.consultedServiceId,
            amount: existingDetail.amount, // Keep original amount
            paymentMethod: (updatedDetail?.paymentMethod ||
              existingDetail.paymentMethod) as
              | "Tiền mặt"
              | "Quẹt thẻ thường"
              | "Quẹt thẻ Visa"
              | "Chuyển khoản",
          };
        });

        data.totalAmount = existing.totalAmount; // Keep original total
      }
    }

    // Execute
    const updated = await paymentVoucherRepo.update(id, data);

    if (!updated) {
      throw new ServiceError(
        "UPDATE_FAILED",
        "Không thể cập nhật phiếu thu",
        500
      );
    }

    // Map response
    return PaymentVoucherResponseSchema.parse(
      mapPaymentVoucherToResponse(updated)
    );
  },

  /**
   * Delete payment voucher
   */
  async delete(id: string, currentUser: UserCore | null) {
    requireAuth(currentUser);

    // Fetch existing voucher
    const existing = await paymentVoucherRepo.findById(id);
    if (!existing) {
      throw new ServiceError("NOT_FOUND", "Phiếu thu không tồn tại", 404);
    }

    // Validate permissions
    const canDelete = paymentVoucherPermissions.canDelete(currentUser!);
    if (!canDelete.allowed) {
      throw new ServiceError(
        "PERMISSION_DENIED",
        canDelete.reason || "Không có quyền xóa phiếu thu",
        403
      );
    }

    // Execute
    await paymentVoucherRepo.delete(id);

    return { success: true };
  },

  /**
   * Get payment voucher by ID
   */
  async getById(currentUser: UserCore | null, id: string) {
    requireAuth(currentUser);

    const voucher = await paymentVoucherRepo.findById(id);
    if (!voucher) {
      throw new ServiceError("NOT_FOUND", "Phiếu thu không tồn tại", 404);
    }

    // Check view permission
    const canView = paymentVoucherPermissions.canView(currentUser!, voucher);
    if (!canView.allowed) {
      throw new ServiceError(
        "PERMISSION_DENIED",
        canView.reason || "Không có quyền xem phiếu thu",
        403
      );
    }

    return PaymentVoucherResponseSchema.parse(
      mapPaymentVoucherToResponse(voucher)
    );
  },

  /**
   * List payment vouchers with filters and pagination
   */
  async list(currentUser: UserCore | null, query: unknown) {
    requireAuth(currentUser);

    const parsed = GetPaymentVouchersQuerySchema.parse(query);
    const {
      page,
      pageSize,
      search,
      customerId,
      clinicId,
      sortField,
      sortDirection,
    } = parsed;

    /**
     * Clinic Filtering Strategy:
     * Similar to appointment/consulted-service
     */
    let effectiveClinicId: string | undefined;

    if (customerId) {
      // CASE 1: Customer-centric view (cross-clinic)
      effectiveClinicId = undefined;
    } else {
      // CASE 2: Clinic-centric view
      effectiveClinicId =
        currentUser?.role === "admin"
          ? clinicId
          : currentUser?.clinicId ?? undefined;

      if (!effectiveClinicId && currentUser?.role !== "admin") {
        throw new ServiceError(
          "MISSING_CLINIC",
          "Nhân viên phải thuộc về một chi nhánh",
          403
        );
      }
    }

    const { items, total } = await paymentVoucherRepo.list({
      search,
      page,
      pageSize,
      customerId,
      clinicId: effectiveClinicId,
      sortField,
      sortDirection,
    });

    const mappedItems = items.map(mapPaymentVoucherToResponse);
    const totalPages = Math.ceil(total / pageSize);

    const response = {
      items: mappedItems,
      total,
      page,
      pageSize,
      totalPages,
    };

    return PaymentVouchersListResponseSchema.parse(response);
  },

  /**
   * Get payment vouchers for daily view
   */
  async listDaily(currentUser: UserCore | null, query: unknown) {
    requireAuth(currentUser);

    const parsed = GetPaymentVouchersDailyQuerySchema.parse(query);
    const { date, clinicId } = parsed;

    // Parse date
    const targetDate = new Date(date);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const day = targetDate.getDate();

    const dateStart = new Date(year, month, day, 0, 0, 0);
    const dateEnd = new Date(year, month, day, 23, 59, 59, 999);

    // Scope clinic access
    let effectiveClinicId: string | undefined = clinicId;
    if (currentUser?.role !== "admin") {
      effectiveClinicId = currentUser?.clinicId ?? undefined;
    }

    if (!effectiveClinicId) {
      throw new ServiceError("MISSING_CLINIC", "Vui lòng chọn chi nhánh", 400);
    }

    const result = await paymentVoucherRepo.listDaily({
      clinicId: effectiveClinicId,
      dateStart,
      dateEnd,
    });

    const response = {
      items: result.items.map(mapPaymentVoucherToResponse),
      count: result.count,
      statistics: result.statistics,
    };

    return PaymentVouchersDailyResponseSchema.parse(response);
  },

  /**
   * Get unpaid services for a customer
   */
  async getUnpaidServices(customerId: string, currentUser: UserCore | null) {
    requireAuth(currentUser);

    const result = await paymentVoucherRepo.getUnpaidServices(customerId);

    return UnpaidServicesResponseSchema.parse(result);
  },
};
