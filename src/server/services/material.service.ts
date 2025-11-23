// src/server/services/material.service.ts
import {
  materialRepo,
  type MaterialCreateInput,
  type MaterialUpdateInput,
} from "@/server/repos/material.repo";
import { ERR, ServiceError } from "./errors";
import { requireAdmin } from "./auth.service";
import {
  CreateMaterialRequestSchema,
  UpdateMaterialRequestSchema,
} from "@/shared/validation/material.schema";
import type { UserCore } from "@/shared/types/user";
import { mapMaterialToResponse } from "./material/_mappers";

function normalizeName(name: string) {
  return name.trim();
}

export const materialService = {
  /**
   * GET /materials
   */
  async list(currentUser: UserCore | null, includeArchived: boolean) {
    // Admin only
    requireAdmin(currentUser);

    const rows = await materialRepo.list(includeArchived);
    return rows.map(mapMaterialToResponse);
  },

  /**
   * GET /materials/:id
   */
  async getById(currentUser: UserCore | null, id: string) {
    // Admin only
    requireAdmin(currentUser);

    const row = await materialRepo.getById(id);
    if (!row) throw ERR.NOT_FOUND("Vật tư không tồn tại.");
    return mapMaterialToResponse(row);
  },

  /**
   * POST /materials (admin only)
   */
  async create(currentUser: UserCore | null, body: unknown) {
    requireAdmin(currentUser);

    if (!currentUser?.employeeId) {
      throw ERR.FORBIDDEN("Tài khoản admin chưa liên kết nhân viên.");
    }

    const parsed = CreateMaterialRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw ERR.INVALID(
        parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ."
      );
    }

    // Generate next code
    const code = await materialRepo.generateNextCode();

    const data: MaterialCreateInput = {
      code,
      name: normalizeName(parsed.data.name),
      description: parsed.data.description ?? null,
      unit: parsed.data.unit,
      materialType: parsed.data.materialType,
      department: parsed.data.department,
      category: parsed.data.category ?? null,
      subCategory: parsed.data.subCategory ?? null,
      minStockLevel: parsed.data.minStockLevel ?? null,
      imageUrl: parsed.data.imageUrl ?? null,
      tags: parsed.data.tags ?? [],
      createdById: currentUser.employeeId,
      updatedById: currentUser.employeeId,
    };

    // Unique validate (name)
    const byName = await materialRepo.getByName(data.name);
    if (byName) throw ERR.CONFLICT("Tên vật tư đã tồn tại.");

    const created = await materialRepo.create(data);
    return mapMaterialToResponse(created);
  },

  /**
   * PUT /materials/:id (admin only)
   */
  async update(currentUser: UserCore | null, body: unknown) {
    requireAdmin(currentUser);

    if (!currentUser?.employeeId) {
      throw ERR.FORBIDDEN("Tài khoản admin chưa liên kết nhân viên.");
    }

    const parsed = UpdateMaterialRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw ERR.INVALID(
        parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ."
      );
    }

    const { id } = parsed.data;

    const existing = await materialRepo.getById(id);
    if (!existing) throw ERR.NOT_FOUND("Vật tư không tồn tại.");

    const data: Partial<MaterialUpdateInput> = {
      name: normalizeName(parsed.data.name),
      description: parsed.data.description ?? null,
      unit: parsed.data.unit,
      materialType: parsed.data.materialType,
      department: parsed.data.department,
      category: parsed.data.category ?? null,
      subCategory: parsed.data.subCategory ?? null,
      minStockLevel: parsed.data.minStockLevel ?? null,
      imageUrl: parsed.data.imageUrl ?? null,
      tags: parsed.data.tags ?? [],
      updatedById: currentUser.employeeId,
      archivedAt: parsed.data.archivedAt ?? existing.archivedAt,
    };

    // Unique validate (exclude self)
    if (data.name && data.name !== existing.name) {
      const dup = await materialRepo.getByName(data.name);
      if (dup && dup.id !== id) throw ERR.CONFLICT("Tên vật tư đã tồn tại.");
    }

    const updated = await materialRepo.update(id, data);
    return mapMaterialToResponse(updated);
  },

  /**
   * DELETE /materials/:id (admin only)
   */
  async remove(currentUser: UserCore | null, id: string) {
    requireAdmin(currentUser);

    const existing = await materialRepo.getById(id);
    if (!existing) throw ERR.NOT_FOUND("Vật tư không tồn tại.");

    const linked = await materialRepo.countLinked(id);
    if (linked.total > 0) {
      // Gợi ý chuyển sang Archive
      throw new ServiceError(
        "HAS_LINKED_DATA",
        "Vật tư đang có dữ liệu liên kết, chỉ được phép Archive.",
        409
      );
    }

    const deleted = await materialRepo.delete(id);
    return mapMaterialToResponse(deleted);
  },

  /**
   * POST /materials/:id/archive (admin only)
   */
  async archive(currentUser: UserCore | null, id: string) {
    requireAdmin(currentUser);

    const existing = await materialRepo.getById(id);
    if (!existing) throw ERR.NOT_FOUND("Vật tư không tồn tại.");

    const updated = await materialRepo.archive(id);
    return mapMaterialToResponse(updated);
  },

  /**
   * POST /materials/:id/unarchive (admin only)
   */
  async unarchive(currentUser: UserCore | null, id: string) {
    requireAdmin(currentUser);

    const existing = await materialRepo.getById(id);
    if (!existing) throw ERR.NOT_FOUND("Vật tư không tồn tại.");

    const updated = await materialRepo.unarchive(id);
    return mapMaterialToResponse(updated);
  },
};
