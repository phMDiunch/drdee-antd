// src/server/repos/sales-activity-log.repo.ts
import { prisma } from "@/services/prisma/prisma";
import type {
  CreateActivityLogRequest,
  UpdateActivityLogRequest,
} from "@/shared/validation/sales-activity-log.schema";

/**
 * Sales Activity Log Repository
 * Data access layer for sales activity tracking
 */

export interface ActivityLogCreateInput extends CreateActivityLogRequest {
  employeeId: string;
}

export const salesActivityLogRepo = {
  /**
   * Create a new activity log
   */
  async create(data: ActivityLogCreateInput) {
    return prisma.salesActivityLog.create({
      data: {
        consultedServiceId: data.consultedServiceId,
        employeeId: data.employeeId,
        contactType: data.contactType,
        contactDate: data.contactDate,
        content: data.content,
        nextContactDate: data.nextContactDate,
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });
  },

  /**
   * Update an existing activity log
   */
  async update(id: string, data: UpdateActivityLogRequest) {
    return prisma.salesActivityLog.update({
      where: { id },
      data: {
        contactType: data.contactType,
        contactDate: data.contactDate,
        content: data.content,
        nextContactDate: data.nextContactDate,
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });
  },

  /**
   * Delete an activity log
   */
  async delete(id: string) {
    return prisma.salesActivityLog.delete({
      where: { id },
    });
  },

  /**
   * Get activity log by ID
   */
  async findById(id: string) {
    return prisma.salesActivityLog.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        consultedService: {
          select: {
            id: true,
            consultedServiceName: true,
            customerId: true,
            clinicId: true,
          },
        },
      },
    });
  },

  /**
   * List activity logs for a consulted service
   */
  async listByConsultedServiceId(consultedServiceId: string) {
    const [items, count] = await Promise.all([
      prisma.salesActivityLog.findMany({
        where: { consultedServiceId },
        orderBy: { contactDate: "desc" },
        include: {
          employee: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
      }),
      prisma.salesActivityLog.count({
        where: { consultedServiceId },
      }),
    ]);

    return { items, count };
  },

  /**
   * List activity logs for an employee (my activities)
   */
  async listByEmployeeId(employeeId: string, limit = 50) {
    const [items, count] = await Promise.all([
      prisma.salesActivityLog.findMany({
        where: { employeeId },
        orderBy: { contactDate: "desc" },
        take: limit,
        include: {
          employee: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
            },
          },
          consultedService: {
            select: {
              id: true,
              consultedServiceName: true,
              customer: {
                select: {
                  id: true,
                  fullName: true,
                  phone: true,
                },
              },
            },
          },
        },
      }),
      prisma.salesActivityLog.count({
        where: { employeeId },
      }),
    ]);

    return { items, count };
  },
};
