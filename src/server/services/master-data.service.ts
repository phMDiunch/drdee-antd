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
import slugify from "slugify";

/**
 * Generate slug from text (consistent with frontend)
 */
function generateSlug(text: string) {
  return slugify(text, {
    lower: true,
    locale: "vi",
    strict: true,
  });
}

export const masterDataService = {
  /**
   * GET /api/v1/master-data
   * Return ALL master data (client will filter)
   */
  async list() {
    const rows = await masterDataRepo.list();
    return rows.map(mapMasterDataToResponse);
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
      category: generateSlug(parsed.data.category),
      key: generateSlug(parsed.data.key),
    };

    // Check unique [category, key]
    const existing = await masterDataRepo.getByCategoryAndKey(
      data.category,
      data.key
    );
    if (existing) throw ERR.CONFLICT("Mã này đã tồn tại trong category.");

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

    // Don't allow changing category or key
    const data = {
      value: parsed.data.value,
    };

    const updated = await masterDataRepo.update(id, data);
    return mapMasterDataToResponse(updated);
  },

  /**
   * DELETE (hard delete - permanent) - admin only
   */
  async remove(currentUser: UserCore | null, id: string) {
    requireAdmin(currentUser);

    const existing = await masterDataRepo.getById(id);
    if (!existing) throw ERR.NOT_FOUND("Dữ liệu chủ không tồn tại.");

    // Hard delete (permanent deletion) - no children check needed
    await masterDataRepo.hardDelete(id);
    return { success: true };
  },
};
