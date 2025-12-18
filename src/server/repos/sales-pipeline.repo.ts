// src/server/repos/sales-pipeline.repo.ts
import { prisma } from "@/services/prisma/prisma";
import type { Prisma } from "@prisma/client";
import type { CreateSalesActivityRequest } from "@/shared/validation/sales-activity.schema";

/**
 * ============================================================================
 * TYPE DEFINITIONS
 * ============================================================================
 */

/**
 * Complex Pattern: API Schema + Server Fields
 */
export type SalesActivityCreateInput = Omit<
  CreateSalesActivityRequest,
  "consultedServiceId"
> & {
  consultedServiceId: string;
  employeeId: string; // 🔒 Server-controlled: từ currentUser.employeeId
};

/**
 * Include pattern for sales activity queries
 */
const salesActivityInclude = {
  employee: {
    select: {
      id: true,
      fullName: true,
    },
  },
} satisfies Prisma.SalesActivityLogInclude;

/**
 * Include pattern for consulted service in pipeline
 */
const pipelineServiceInclude = {
  customer: {
    select: {
      id: true,
      fullName: true,
      phone: true,
    },
  },
  dentalService: {
    select: {
      id: true,
      name: true,
      requiresFollowUp: true,
    },
  },
  consultingSale: {
    select: {
      id: true,
      fullName: true,
    },
  },
} satisfies Prisma.ConsultedServiceInclude;

/**
 * ============================================================================
 * PIPELINE CONSULTED SERVICE OPERATIONS
 * ============================================================================
 */

/**
 * Get pipeline services for dashboard (month view)
 * Filters by month, clinic, and optionally by sale (for employee role)
 */
export const salesPipelineRepo = {
  /**
   * List services in pipeline for a given month
   */
  async listPipelineServices(params: {
    clinicId?: string;
    dateStart: Date;
    dateEnd: Date;
    saleId?: string; // Optional: filter by sale for employee role
  }) {
    const where: Prisma.ConsultedServiceWhereInput = {
      consultationDate: {
        gte: params.dateStart,
        lte: params.dateEnd,
      },
      dentalService: {
        requiresFollowUp: true,
      },
      // Include both claimed and unclaimed services
      // If saleId is provided (employee role), filter only their services
      ...(params.saleId && { consultingSaleId: params.saleId }),
    };

    if (params.clinicId) {
      where.clinicId = params.clinicId;
    }

    const [items, count] = await Promise.all([
      prisma.consultedService.findMany({
        where,
        include: pipelineServiceInclude,
        orderBy: [{ consultationDate: "desc" }, { createdAt: "desc" }],
      }),
      prisma.consultedService.count({ where }),
    ]);

    return { items, count };
  },

  /**
   * Find consulted service by ID with pipeline includes
   */
  async findById(id: string) {
    return prisma.consultedService.findUnique({
      where: { id },
      include: pipelineServiceInclude,
    });
  },

  /**
   * Claim a pipeline service (assign sale)
   */
  async claimService(consultedServiceId: string, saleId: string) {
    return prisma.consultedService.update({
      where: { id: consultedServiceId },
      data: {
        consultingSaleId: saleId,
        updatedById: saleId, // Track who made the change
        updatedAt: new Date(),
      },
      include: pipelineServiceInclude,
    });
  },

  /**
   * Reassign a pipeline service to a new sale
   */
  async reassignService(
    consultedServiceId: string,
    newSaleId: string,
    updatedById: string
  ) {
    return prisma.consultedService.update({
      where: { id: consultedServiceId },
      data: {
        consultingSaleId: newSaleId,
        updatedById,
        updatedAt: new Date(),
      },
      include: pipelineServiceInclude,
    });
  },

  /**
   * Check if service is already claimed
   */
  async isServiceClaimed(consultedServiceId: string): Promise<boolean> {
    const service = await prisma.consultedService.findUnique({
      where: { id: consultedServiceId },
      select: { consultingSaleId: true },
    });
    return service?.consultingSaleId !== null;
  },

  /**
   * Get latest sales activity for a consulted service
   */
  async getLatestActivity(consultedServiceId: string) {
    return prisma.salesActivityLog.findFirst({
      where: { consultedServiceId },
      orderBy: { contactDate: "desc" },
      include: salesActivityInclude,
    });
  },

  /**
   * Get latest activities for multiple consulted services (batch)
   * Returns a map of consultedServiceId -> latest activity
   */
  async getLatestActivitiesForServices(consultedServiceIds: string[]) {
    if (consultedServiceIds.length === 0) return {};

    // Get all activities for these services
    const activities = await prisma.salesActivityLog.findMany({
      where: { consultedServiceId: { in: consultedServiceIds } },
      include: salesActivityInclude,
      orderBy: { contactDate: "desc" },
    });

    // Group by consultedServiceId and keep only the latest
    const latestMap: Record<string, (typeof activities)[0]> = {};
    for (const activity of activities) {
      if (!latestMap[activity.consultedServiceId]) {
        latestMap[activity.consultedServiceId] = activity;
      }
    }

    return latestMap;
  },
};

/**
 * ============================================================================
 * SALES ACTIVITY LOG OPERATIONS
 * ============================================================================
 */

export const salesActivityRepo = {
  /**
   * Create a new sales activity log
   */
  async create(data: SalesActivityCreateInput) {
    return prisma.salesActivityLog.create({
      data: {
        consultedServiceId: data.consultedServiceId,
        employeeId: data.employeeId,
        contactType: data.contactType,
        content: data.content,
        nextContactDate: data.nextContactDate || null,
      },
      include: salesActivityInclude,
    });
  },

  /**
   * List all activities for a consulted service (ordered by most recent first)
   */
  async listByConsultedService(consultedServiceId: string) {
    return prisma.salesActivityLog.findMany({
      where: { consultedServiceId },
      include: salesActivityInclude,
      orderBy: { contactDate: "desc" },
    });
  },

  /**
   * List activities by employee (for personal dashboard)
   */
  async listByEmployee(employeeId: string, limit?: number) {
    return prisma.salesActivityLog.findMany({
      where: { employeeId },
      include: salesActivityInclude,
      orderBy: { contactDate: "desc" },
      take: limit,
    });
  },

  /**
   * Find activity by ID
   */
  async findById(id: string) {
    return prisma.salesActivityLog.findUnique({
      where: { id },
      include: salesActivityInclude,
    });
  },

  /**
   * Get activity count for a consulted service
   */
  async countByConsultedService(consultedServiceId: string): Promise<number> {
    return prisma.salesActivityLog.count({
      where: { consultedServiceId },
    });
  },
};
