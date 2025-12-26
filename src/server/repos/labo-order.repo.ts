// src/server/repos/labo-order.repo.ts
import { prisma } from "@/services/prisma/prisma";
import type { Prisma } from "@prisma/client";
import type {
  CreateLaboOrderRequest,
  UpdateLaboOrderRequest,
} from "@/shared/validation/labo-order.schema";

/**
 * Complex Pattern: API Schema + Server Fields
 * Following appointment.repo.ts pattern
 */
export type LaboOrderCreateInput = CreateLaboOrderRequest & {
  laboServiceId: string; // 🔒 Server-controlled: Link to LaboService (audit trail)
  unitPrice: number; // 🔒 Server-controlled: Snapshot from LaboService
  totalCost: number; // 🔒 Server-controlled: unitPrice * quantity
  warranty: string; // 🔒 Server-controlled: Snapshot from LaboService
  clinicId: string; // 🔒 Server-controlled: từ currentUser.clinicId
  createdById: string; // 🔒 Server-controlled: từ currentUser.employeeId
  updatedById: string; // 🔒 Server-controlled: từ currentUser.employeeId
};

export type LaboOrderUpdateInput = Partial<
  Omit<UpdateLaboOrderRequest, "id">
> & {
  totalCost?: number; // 🔒 Server-controlled: recalculate if quantity changes
  updatedById?: string; // 🔒 Server-controlled: track who made the update
};

/**
 * Include clause for LaboOrder queries
 * Nested objects: customer, doctor, supplier, laboItem, receivedBy, createdBy, updatedBy
 */
const includeFullLaboOrder = {
  customer: {
    select: {
      id: true,
      fullName: true,
      customerCode: true,
    },
  },
  doctor: {
    select: {
      id: true,
      fullName: true,
    },
  },
  supplier: {
    select: {
      id: true,
      name: true,
      shortName: true,
    },
  },
  laboItem: {
    select: {
      id: true,
      name: true,
      serviceGroup: true,
      unit: true,
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
  sentBy: {
    select: {
      id: true,
      fullName: true,
    },
  },
  receivedBy: {
    select: {
      id: true,
      fullName: true,
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
} satisfies Prisma.LaboOrderInclude;

/**
 * Labo Order Repository
 * Implements Complex + Server Fields pattern for transactional data
 */
export const laboOrderRepo = {
  /**
   * Get daily labo orders (sent or returned on specific date)
   * Used for Daily View - Collapsible Tables
   * Returns items + count + statistics
   */
  async getDailyLaboOrders(params: {
    date?: string; // YYYY-MM-DD format (optional when customerId provided)
    type?: "sent" | "returned"; // Optional when customerId provided
    clinicId?: string;
    customerId?: string; // NEW: Filter by customer for customer detail view
  }) {
    const { date, type, clinicId, customerId } = params;

    // Build where conditions
    const where: Prisma.LaboOrderWhereInput = {
      ...(clinicId && { clinicId }),
      ...(customerId && { customerId }), // NEW: Filter by customer
    };

    // Date filters (only apply if date and type provided - daily view)
    if (date && type) {
      // Convert YYYY-MM-DD string to Date range (start of day to end of day)
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      if (type === "sent") {
        where.sentDate = {
          gte: startOfDay,
          lte: endOfDay,
        };
      } else {
        where.returnDate = {
          gte: startOfDay,
          lte: endOfDay,
        };
      }
    }

    // Fetch orders with nested relations
    const items = await prisma.laboOrder.findMany({
      where,
      include: includeFullLaboOrder,
      orderBy: customerId
        ? { treatmentDate: "desc" } // Customer view: newest treatment first
        : type === "sent"
        ? { createdAt: "desc" } // Sent orders: newest first
        : { returnDate: "asc" }, // Returned orders: earliest first
    });

    // Calculate statistics (only for daily view)
    const total = items.length;
    let sent = 0;
    let returned = 0;

    if (date && type) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      sent = items.filter(
        (o) => o.sentDate >= startOfDay && o.sentDate <= endOfDay
      ).length;
      returned = items.filter(
        (o) =>
          o.returnDate && o.returnDate >= startOfDay && o.returnDate <= endOfDay
      ).length;
    }

    const totalCost = items.reduce((sum, o) => sum + o.totalCost, 0);
    const warrantyOrders = items.filter(
      (o) => o.orderType === "Bảo hành"
    ).length;
    const newOrders = items.filter((o) => o.orderType === "Làm mới").length;

    return {
      items,
      count: total,
      statistics: {
        total,
        sent,
        returned,
        totalCost,
        warrantyOrders,
        newOrders,
      },
    };
  },

  /**
   * Get single order by ID
   */
  async getById(id: string) {
    return prisma.laboOrder.findUnique({
      where: { id },
      include: includeFullLaboOrder,
    });
  },

  /**
   * Create new labo order
   * Server will snapshot pricing from LaboService
   */
  async create(data: LaboOrderCreateInput) {
    return prisma.laboOrder.create({
      data: {
        customerId: data.customerId,
        doctorId: data.doctorId,
        treatmentDate: data.treatmentDate
          ? new Date(data.treatmentDate)
          : new Date(),
        orderType: data.orderType,
        sentById: data.sentById,
        laboServiceId: data.laboServiceId,
        supplierId: data.supplierId,
        laboItemId: data.laboItemId,
        clinicId: data.clinicId,

        // Snapshot pricing
        unitPrice: data.unitPrice,
        quantity: data.quantity,
        totalCost: data.totalCost,
        warranty: data.warranty,

        // Dates (sentDate auto-set to now() at database level)
        expectedFitDate: data.expectedFitDate
          ? new Date(data.expectedFitDate)
          : null,

        // Details
        detailRequirement: data.detailRequirement ?? null,

        // Tracking
        createdById: data.createdById,
        updatedById: data.updatedById,
      },
      include: includeFullLaboOrder,
    });
  },

  /**
   * Update labo order
   * Cannot change pricing snapshot, only quantity (recalculate totalCost)
   */
  async update(id: string, data: LaboOrderUpdateInput) {
    const updateData: Prisma.LaboOrderUpdateInput = {};

    // Always update updatedBy relation if provided
    if (data.updatedById) {
      updateData.updatedBy = {
        connect: { id: data.updatedById },
      };
    }

    // Optional fields
    if (data.quantity !== undefined) {
      updateData.quantity = data.quantity;
      if (data.totalCost !== undefined) {
        updateData.totalCost = data.totalCost; // Recalculated by service layer
      }
    }

    if (data.sentDate !== undefined) {
      updateData.sentDate = new Date(data.sentDate);
    }

    if (data.expectedFitDate !== undefined) {
      updateData.expectedFitDate = data.expectedFitDate
        ? new Date(data.expectedFitDate)
        : null;
    }

    if (data.returnDate !== undefined) {
      updateData.returnDate = data.returnDate
        ? new Date(data.returnDate)
        : null;
    }

    if (data.detailRequirement !== undefined) {
      updateData.detailRequirement = data.detailRequirement ?? null;
    }

    if (data.treatmentDate !== undefined) {
      updateData.treatmentDate = new Date(data.treatmentDate);
    }

    if (data.orderType !== undefined) {
      updateData.orderType = data.orderType;
    }

    if (data.sentById !== undefined) {
      updateData.sentBy = {
        connect: { id: data.sentById },
      };
    }

    if (data.receivedById !== undefined) {
      updateData.receivedBy = data.receivedById
        ? { connect: { id: data.receivedById } }
        : { disconnect: true };
    }

    return prisma.laboOrder.update({
      where: { id },
      data: updateData,
      include: includeFullLaboOrder,
    });
  },

  /**
   * Receive labo order (set returnDate and receivedById)
   * Used for Quick Action: "Nhận mẫu"
   */
  async receiveLaboOrder(orderId: string, receivedById: string) {
    return prisma.laboOrder.update({
      where: { id: orderId },
      data: {
        returnDate: new Date(), // Set to current date
        receivedById,
      },
      include: includeFullLaboOrder,
    });
  },

  /**
   * Soft delete labo order (Hard delete - no archivedAt field in schema)
   */
  async delete(id: string) {
    return prisma.laboOrder.delete({ where: { id } });
  },

  /**
   * Check if order can be edited by employee
   * Business rule: Employee can only edit orders with returnDate === null
   */
  async canEditByEmployee(orderId: string): Promise<boolean> {
    const order = await prisma.laboOrder.findUnique({
      where: { id: orderId },
      select: { returnDate: true },
    });

    return order ? order.returnDate === null : false;
  },
};
