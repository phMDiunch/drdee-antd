// src/server/services/labo-item.service.ts
import {
  laboItemRepo,
  type LaboItemCreateInput,
  type LaboItemUpdateInput,
} from "@/server/repos/labo-item.repo";
import { ERR, ServiceError } from "./errors";
import { requireAdmin } from "./auth.service";
import {
  CreateLaboItemRequestSchema,
  UpdateLaboItemRequestSchema,
} from "@/shared/validation/labo-item.schema";
import type { UserCore } from "@/shared/types/user";
import { mapLaboItemToResponse } from "./labo-item/_mappers";

function normalizeName(name: string) {
  return name.trim();
}

export const laboItemService = {
  /**
   * GET /labo-items
   */
  async list(currentUser: UserCore | null, includeArchived: boolean) {
    requireAdmin(currentUser);

    const rows = await laboItemRepo.list(includeArchived);
    return rows.map(mapLaboItemToResponse);
  },

  /**
   * GET /labo-items/:id
   */
  async getById(currentUser: UserCore | null, id: string) {
    requireAdmin(currentUser);

    const row = await laboItemRepo.getById(id);
    if (!row) throw ERR.NOT_FOUND("Danh mục răng giả không tồn tại.");
    return mapLaboItemToResponse(row);
  },

  /**
   * POST /labo-items (admin only)
   */
  async create(currentUser: UserCore | null, body: unknown) {
    requireAdmin(currentUser);

    if (!currentUser?.employeeId) {
      throw ERR.FORBIDDEN("Tài khoản admin chưa liên kết nhân viên.");
    }

    const parsed = CreateLaboItemRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw ERR.INVALID(
        parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ."
      );
    }

    const data: LaboItemCreateInput = {
      name: normalizeName(parsed.data.name),
      description: parsed.data.description ?? null,
      serviceGroup: parsed.data.serviceGroup.trim(),
      unit: parsed.data.unit.trim(),
      createdById: currentUser.employeeId,
      updatedById: currentUser.employeeId,
    };

    // Unique validate (name)
    const byName = await laboItemRepo.getByName(data.name);
    if (byName) throw ERR.CONFLICT("Tên răng giả đã tồn tại.");

    const created = await laboItemRepo.create(data);
    return mapLaboItemToResponse(created);
  },

  /**
   * PUT /labo-items/:id (admin only)
   */
  async update(currentUser: UserCore | null, body: unknown) {
    requireAdmin(currentUser);

    if (!currentUser?.employeeId) {
      throw ERR.FORBIDDEN("Tài khoản admin chưa liên kết nhân viên.");
    }

    const parsed = UpdateLaboItemRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw ERR.INVALID(
        parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ."
      );
    }

    const { id } = parsed.data;

    const existing = await laboItemRepo.getById(id);
    if (!existing) throw ERR.NOT_FOUND("Danh mục răng giả không tồn tại.");

    const data: Partial<LaboItemUpdateInput> = {
      name: normalizeName(parsed.data.name),
      description: parsed.data.description ?? null,
      serviceGroup: parsed.data.serviceGroup.trim(),
      unit: parsed.data.unit.trim(),
      updatedById: currentUser.employeeId,
      archivedAt: parsed.data.archivedAt ?? existing.archivedAt,
    };

    // Unique validate (exclude self)
    if (data.name && data.name !== existing.name) {
      const dup = await laboItemRepo.getByName(data.name);
      if (dup && dup.id !== id) throw ERR.CONFLICT("Tên răng giả đã tồn tại.");
    }

    const updated = await laboItemRepo.update(id, data);
    return mapLaboItemToResponse(updated);
  },

  /**
   * DELETE /labo-items/:id (admin only)
   */
  async remove(currentUser: UserCore | null, id: string) {
    requireAdmin(currentUser);

    const existing = await laboItemRepo.getById(id);
    if (!existing) throw ERR.NOT_FOUND("Danh mục răng giả không tồn tại.");

    const linked = await laboItemRepo.countLinked(id);
    if (linked.total > 0) {
      // Gợi ý chuyển sang Archive
      throw new ServiceError(
        "HAS_LINKED_DATA",
        "Danh mục đang có dữ liệu liên kết, chỉ có thể lưu trữ (Archive).",
        409
      );
    }

    const deleted = await laboItemRepo.delete(id);
    return mapLaboItemToResponse(deleted);
  },

  /**
   * POST /labo-items/:id/archive (admin only)
   */
  async archive(currentUser: UserCore | null, id: string) {
    requireAdmin(currentUser);

    const existing = await laboItemRepo.getById(id);
    if (!existing) throw ERR.NOT_FOUND("Danh mục răng giả không tồn tại.");

    const updated = await laboItemRepo.archive(id);
    return mapLaboItemToResponse(updated);
  },

  /**
   * POST /labo-items/:id/unarchive (admin only)
   */
  async unarchive(currentUser: UserCore | null, id: string) {
    requireAdmin(currentUser);

    const existing = await laboItemRepo.getById(id);
    if (!existing) throw ERR.NOT_FOUND("Danh mục răng giả không tồn tại.");

    const updated = await laboItemRepo.unarchive(id);
    return mapLaboItemToResponse(updated);
  },
};
