// src/server/repos/master-data.repo.ts
import { prisma } from "@/services/prisma/prisma";
import type {
  CreateMasterDataRequest,
  UpdateMasterDataRequest,
} from "@/shared/validation/master-data.schema";

export const masterDataRepo = {
  /**
   * List ALL master data (no filtering)
   */
  async list() {
    return prisma.masterData.findMany({
      orderBy: [{ category: "asc" }, { createdAt: "desc" }],
    });
  },

  /**
   * Get single master data by ID
   */
  async getById(id: string) {
    return prisma.masterData.findUnique({ where: { id } });
  },

  /**
   * Get master data by category + key (for uniqueness check)
   */
  async getByCategoryAndKey(category: string, key: string) {
    return prisma.masterData.findUnique({
      where: {
        category_key: { category, key },
      },
    });
  },

  /**
   * Create new master data
   */
  async create(data: CreateMasterDataRequest) {
    return prisma.masterData.create({ data });
  },

  /**
   * Update existing master data
   */
  async update(id: string, data: Partial<Omit<UpdateMasterDataRequest, "id">>) {
    return prisma.masterData.update({ where: { id }, data });
  },

  /**
   * Hard delete (permanent deletion)
   */
  async hardDelete(id: string) {
    return prisma.masterData.delete({
      where: { id },
    });
  },
};
