// src/server/repos/sales-activity.repo.ts
import { prisma } from "@/services/prisma/prisma";
import type { Prisma } from "@prisma/client";
import type {
  CreateSalesActivityRequest,
  UpdateSalesActivityRequest,
} from "@/shared/validation/sales-activity.schema";

/**
 * Complex Pattern: API Schema + Server Fields
 * Following treatment-log.repo.ts pattern
 */
export type SalesActivityCreateInput = CreateSalesActivityRequest & {
  saleId: string; // 🔒 Server-controlled: from currentUser.employeeId
};

export type SalesActivityUpdateInput = Partial<UpdateSalesActivityRequest>;

/**
 * Prisma include for full relations
 */
const salesActivityInclude = {
  consultedService: {
    select: {
      id: true,
      consultedServiceName: true,
      stage: true,
      customer: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          customerCode: true,
          dob: true,
        },
      },
    },
  },
  sale: {
    select: {
      id: true,
      fullName: true,
    },
  },
} satisfies Prisma.SalesActivityLogInclude;

/**
 * Sales Activity Repository
 * Implements Complex + Server Fields pattern for audit/tracking data
 */
export const salesActivityRepo = {
  /**
   * Create new sales activity log
   */
  async create(data: SalesActivityCreateInput) {
    return prisma.salesActivityLog.create({
      data,
      include: salesActivityInclude,
    });
  },

  /**
   * Find by ID with relations
   */
  async findById(id: string) {
    return prisma.salesActivityLog.findUnique({
      where: { id },
      include: salesActivityInclude,
    });
  },

  /**
   * Update sales activity log
   */
  async update(id: string, data: SalesActivityUpdateInput) {
    return prisma.salesActivityLog.update({
      where: { id },
      data,
      include: salesActivityInclude,
    });
  },

  /**
   * Delete sales activity log (hard delete)
   */
  async delete(id: string) {
    return prisma.salesActivityLog.delete({
      where: { id },
    });
  },

  /**
   * List sales activities with filtering and pagination
   *
   * Permission filter: Applied at service layer
   * - Employee: consultedService.consultingSaleId = userId OR consultedService.saleOnlineId = userId
   * - Admin: No filter (see all)
   */
  async list(params: {
    customerId?: string;
    consultedServiceId?: string;
    saleId?: string;
    pageSize: number;
    sortField: "contactDate" | "createdAt";
    sortDirection: "asc" | "desc";
    permissionFilter?: Prisma.SalesActivityLogWhereInput; // Applied by service layer
  }) {
    const {
      customerId,
      consultedServiceId,
      saleId,
      pageSize,
      sortField,
      sortDirection,
      permissionFilter,
    } = params;

    // Build where clause
    const where: Prisma.SalesActivityLogWhereInput = {
      AND: [
        permissionFilter || {}, // Permission filter from service layer
        customerId ? { consultedService: { customerId } } : {},
        consultedServiceId ? { consultedServiceId } : {},
        saleId ? { saleId } : {},
      ],
    };

    // Fetch activities with limit
    const items = await prisma.salesActivityLog.findMany({
      where,
      include: salesActivityInclude,
      orderBy: {
        [sortField]: sortDirection,
      },
      take: pageSize,
    });

    // Get total count
    const total = await prisma.salesActivityLog.count({ where });

    return { items, total };
  },

  /**
   * Find by consulted service (for Customer Detail tab)
   * Returns all activities for a specific service, ordered by contactDate DESC
   */
  async findByConsultedService(consultedServiceId: string) {
    return prisma.salesActivityLog.findMany({
      where: { consultedServiceId },
      include: salesActivityInclude,
      orderBy: { contactDate: "desc" },
      take: 200, // Load all with reasonable limit
    });
  },

  /**
   * List sales activities for daily view with statistics
   * Used for Daily View page
   * Returns: { items, totalCustomers, totalServices }
   */
  async listDaily(params: { date: string; clinicId: string }) {
    const { date, clinicId } = params;

    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);

    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);

    const items = await prisma.salesActivityLog.findMany({
      where: {
        contactDate: { gte: dateStart, lte: dateEnd },
        consultedService: { clinicId },
      },
      include: salesActivityInclude,
      orderBy: { contactDate: "desc" },
    });

    // Strategy: Calculate everything from one source (items) in JS
    const customerIds = new Set<string>();
    const serviceIds = new Set<string>();
    const distribution = { call: 0, message: 0, meet: 0 };

    items.forEach((item) => {
      customerIds.add(item.consultedService.customer.id);
      serviceIds.add(item.consultedServiceId);

      const type = item.contactType as keyof typeof distribution;
      if (distribution[type] !== undefined) {
        distribution[type]++;
      }
    });

    return {
      items,
      statistics: {
        totalActivities: items.length,
        totalCustomers: customerIds.size,
        totalServices: serviceIds.size,
        contactTypeDistribution: distribution,
      },
    };
  },
};
