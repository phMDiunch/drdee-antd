// src/server/repos/master-data.repo.ts
import { prisma } from "@/services/prisma/prisma";
import type {
  CreateMasterDataRequest,
  UpdateMasterDataRequest,
} from "@/shared/validation/master-data.schema";

export const masterDataRepo = {
  /**
   * List master data with optional filters
   * - rootId === undefined: Return ALL items (for tree view)
   * - rootId === null: Return only root items (parentId=null, rootId=null)
   * - rootId === string: Return items in that root category
   */
  async list(rootId?: string | null, includeInactive?: boolean) {
    const whereClause: Record<string, unknown> = {
      ...(includeInactive ? {} : { isActive: true }),
    };

    // Only add rootId filter if explicitly provided
    if (rootId === null) {
      // Get only root items
      whereClause.parentId = null;
      whereClause.rootId = null;
    } else if (rootId !== undefined) {
      // Get items in specific root category
      whereClause.rootId = rootId;
    }
    // If rootId === undefined, get ALL items (no filter)

    return prisma.masterData.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });
  },

  /**
   * Get root items only (parentId = null, rootId = null)
   */
  async getRoots(includeInactive?: boolean) {
    return prisma.masterData.findMany({
      where: {
        parentId: null,
        rootId: null,
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
   * Get master data by key (for uniqueness check - globally unique)
   */
  async getByKey(key: string) {
    return prisma.masterData.findUnique({
      where: { key },
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
   * Toggle isActive (soft delete/restore)
   */
  async toggleActive(id: string, isActive: boolean) {
    return prisma.masterData.update({
      where: { id },
      data: { isActive },
    });
  },

  /**
   * Hard delete (permanent deletion)
   */
  async hardDelete(id: string) {
    return prisma.masterData.delete({
      where: { id },
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
