// src/server/repos/master-data.repo.ts
import { prisma } from "@/services/prisma/prisma";
import type {
  CreateMasterDataRequest,
  UpdateMasterDataRequest,
} from "@/shared/validation/master-data.schema";

export const masterDataRepo = {
  /**
   * List master data with optional filters
   */
  async list(type?: string, includeInactive?: boolean) {
    return prisma.masterData.findMany({
      where: {
        ...(type && { type }),
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: { createdAt: "desc" },
    });
  },

  /**
   * Get single master data by ID
   */
  async getById(id: string) {
    return prisma.masterData.findUnique({ where: { id } });
  },

  /**
   * Get master data by type and key (for uniqueness check)
   */
  async getByTypeAndKey(type: string, key: string) {
    return prisma.masterData.findUnique({
      where: { unique_type_key: { type, key } },
    });
  },

  /**
   * Get children of a parent node
   */
  async getChildren(parentId: string) {
    return prisma.masterData.findMany({
      where: { parentId },
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
   * Soft delete (set isActive = false)
   */
  async softDelete(id: string) {
    return prisma.masterData.update({
      where: { id },
      data: { isActive: false },
    });
  },

  /**
   * Check circular reference: A -> B -> ... -> A
   */
  async checkCircularReference(
    childId: string,
    proposedParentId: string
  ): Promise<boolean> {
    let current = proposedParentId;
    const visited = new Set<string>();

    while (current) {
      if (current === childId) return true; // Found cycle
      if (visited.has(current)) return false; // Safety: Infinite loop

      visited.add(current);
      const parent = await this.getById(current);
      if (!parent || !parent.parentId) break;
      current = parent.parentId;
    }

    return false;
  },
};
