// src/server/services/master-data.service.ts
import { masterDataRepo } from "@/server/repos/master-data.repo";
import { ERR } from "./errors";
import { requireAdmin } from "./auth.service";
import {
  CreateMasterDataRequestSchema,
  UpdateMasterDataRequestSchema,
  type CreateMasterDataRequest,
} from "@/shared/validation/master-data.schema";
import type { UserCore } from "@/shared/types/user";
import { mapMasterDataToResponse } from "./master-data/_mappers";

function normalizeKey(key: string) {
  return key.trim().toLowerCase();
}

export const masterDataService = {
  /**
   * GET /api/v1/master-data
   * Chỉ cần login, không cần admin
   */
  async list(
    currentUser: UserCore | null,
    rootId?: string | null,
    includeInactive?: boolean
  ) {
    const rows = await masterDataRepo.list(rootId, includeInactive);
    return rows.map(mapMasterDataToResponse);
  },

  /**
   * GET /api/v1/master-data/roots
   * Get root categories only
   */
  async getRoots(currentUser: UserCore | null, includeInactive?: boolean) {
    const rows = await masterDataRepo.getRoots(includeInactive);
    return rows.map(mapMasterDataToResponse);
  },

  /**
   * GET /api/v1/master-data/:id
   */
  async getById(currentUser: UserCore | null, id: string) {
    const row = await masterDataRepo.getById(id);
    if (!row) throw ERR.NOT_FOUND("Dữ liệu chủ không tồn tại.");
    return mapMasterDataToResponse(row);
  },

  /**
   * POST create (admin only)
   */
  async create(currentUser: UserCore | null, body: unknown) {
    requireAdmin(currentUser);

    const parsed = CreateMasterDataRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw ERR.INVALID(
        parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ."
      );
    }

    const data: CreateMasterDataRequest = {
      ...parsed.data,
      key: normalizeKey(parsed.data.key),
    };

    // Check unique key (globally unique now)
    const existing = await masterDataRepo.getByKey(data.key);
    if (existing) throw ERR.CONFLICT("Mã này đã tồn tại.");

    // Auto-set rootId based on parentId
    if (data.parentId) {
      const parent = await masterDataRepo.getById(data.parentId);
      if (!parent) throw ERR.INVALID("Parent không tồn tại.");

      // Set rootId: nếu parent là root (rootId=null) thì dùng parent.id, nếu không thì inherit parent.rootId
      data.rootId = parent.rootId ?? parent.id;

      // Validate hierarchy: Chỉ trong cùng root
      if (parent.allowHierarchy === false && parent.parentId !== null) {
        throw ERR.INVALID("Parent này không cho phép có con.");
      }
    } else {
      // Root item: rootId = null
      data.rootId = null;
    }

    const created = await masterDataRepo.create(data);
    return mapMasterDataToResponse(created);
  },

  /**
   * PUT update (admin only)
   */
  async update(currentUser: UserCore | null, body: unknown) {
    requireAdmin(currentUser);

    const parsed = UpdateMasterDataRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw ERR.INVALID(
        parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ."
      );
    }

    const { id } = parsed.data;
    const existing = await masterDataRepo.getById(id);
    if (!existing) throw ERR.NOT_FOUND("Dữ liệu chủ không tồn tại.");

    const data = {
      ...parsed.data,
      key: normalizeKey(parsed.data.key),
    };

    // Check unique key (exclude self)
    if (data.key !== existing.key) {
      const dup = await masterDataRepo.getByKey(data.key);
      if (dup && dup.id !== id) throw ERR.CONFLICT("Mã này đã tồn tại.");
    }

    // Don't allow changing rootId/parentId (keep category)
    data.rootId = existing.rootId;
    data.parentId = existing.parentId;

    // Check allowHierarchy: Nếu đã có children, không cho đổi allowHierarchy thành false
    if (data.allowHierarchy === false && existing.allowHierarchy === true) {
      const children = await masterDataRepo.getChildren(id);
      if (children.length > 0) {
        throw ERR.CONFLICT(
          "Không thể tắt phân cấp khi đã có mục con. Hãy xóa các mục con trước."
        );
      }
    }

    const updated = await masterDataRepo.update(id, data);
    return mapMasterDataToResponse(updated);
  },

  /**
   * Toggle active/inactive (soft delete/restore) - admin only
   */
  async toggleActive(
    currentUser: UserCore | null,
    id: string,
    isActive: boolean
  ) {
    requireAdmin(currentUser);

    const existing = await masterDataRepo.getById(id);
    if (!existing) throw ERR.NOT_FOUND("Dữ liệu chủ không tồn tại.");

    const updated = await masterDataRepo.toggleActive(id, isActive);
    return mapMasterDataToResponse(updated);
  },

  /**
   * DELETE (hard delete - permanent) - admin only
   */
  async remove(currentUser: UserCore | null, id: string) {
    requireAdmin(currentUser);

    const existing = await masterDataRepo.getById(id);
    if (!existing) throw ERR.NOT_FOUND("Dữ liệu chủ không tồn tại.");

    // Check if has children
    const children = await masterDataRepo.getChildren(id);
    if (children.length > 0)
      throw ERR.CONFLICT(
        "Không thể xóa mục có mục con. Hãy xóa các mục con trước."
      );

    // Hard delete (permanent deletion)
    await masterDataRepo.hardDelete(id);
    return { success: true };
  },
};
