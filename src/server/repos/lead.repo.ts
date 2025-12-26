// src/server/repos/lead.repo.ts
import { prisma } from "@/services/prisma/prisma";
import type { Prisma } from "@prisma/client";
import type {
  CreateLeadRequest,
  UpdateLeadRequest,
} from "@/shared/validation/lead.schema";

/**
 * Lead Repository
 * Works with Customer table, filters by type="LEAD"
 */

export type LeadRepoCreateInput = CreateLeadRequest & {
  createdById: string;
  updatedById: string;
};

export type LeadRepoUpdateInput = Partial<UpdateLeadRequest> & {
  updatedById: string;
};

export const leadRepo = {
  /**
   * Create Lead (type="LEAD")
   */
  async create(data: LeadRepoCreateInput) {
    return prisma.customer.create({
      data: {
        ...data,
        type: "LEAD", // Always LEAD
        customerCode: null, // NULL for LEAD
        firstVisitDate: null, // NULL for LEAD
        clinicId: null, // NULL for LEAD (no clinic assigned)
      },
      include: {
        clinic: {
          select: { id: true, name: true, clinicCode: true, shortName: true, colorCode: true },
        },
        createdBy: { select: { id: true, fullName: true } },
      },
    });
  },

  /**
   * Find Lead by ID
   */
  async findById(id: string) {
    return prisma.customer.findFirst({
      where: {
        id,
        type: "LEAD", // Filter by type
      },
      include: {
        clinic: {
          select: { id: true, name: true, clinicCode: true, shortName: true, colorCode: true },
        },
        createdBy: { select: { id: true, fullName: true } },
        updatedBy: { select: { id: true, fullName: true } },
      },
    });
  },

  /**
   * Find Lead by phone
   */
  async findByPhone(phone: string) {
    return prisma.customer.findFirst({
      where: {
        phone,
        type: "LEAD", // Filter by type
      },
      include: {
        clinic: {
          select: { id: true, name: true, clinicCode: true, shortName: true, colorCode: true },
        },
      },
    });
  },

  /**
   * List Leads for daily view
   */
  async listDaily(params: {
    date: string; // YYYY-MM-DD format
    search?: string;
    page?: number;
    pageSize?: number;
    sortField?: string;
    sortDirection?: "asc" | "desc";
  }) {
    const page = params.page || 1;
    const pageSize = params.pageSize || 100;
    const skip = (page - 1) * pageSize;

    // Parse date range
    const selectedDate = new Date(params.date);
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const where: Prisma.CustomerWhereInput = {
      type: "LEAD", // Always filter LEAD
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    };

    if (params.search) {
      where.OR = [
        { phone: { contains: params.search, mode: "insensitive" } },
        { fullName: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const orderBy: Prisma.CustomerOrderByWithRelationInput = {
      [params.sortField || "createdAt"]: params.sortDirection || "desc",
    };

    const [items, count] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          clinic: {
            select: { id: true, clinicCode: true, name: true, shortName: true, colorCode: true },
          },
          createdBy: { select: { id: true, fullName: true } },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    return { items, count };
  },

  /**
   * Update Lead
   */
  async update(id: string, data: LeadRepoUpdateInput) {
    return prisma.customer.update({
      where: { id },
      data,
      include: {
        clinic: {
          select: { id: true, name: true, clinicCode: true, shortName: true, colorCode: true },
        },
        updatedBy: { select: { id: true, fullName: true } },
      },
    });
  },

  /**
   * Delete Lead
   */
  async delete(id: string) {
    return prisma.customer.delete({
      where: { id },
    });
  },
};
