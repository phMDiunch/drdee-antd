// src/server/services/supplier.service.ts
import {
  supplierRepo,
  type SupplierCreateInput,
  type SupplierUpdateInput,
} from "@/server/repos/supplier.repo";
import { ERR, ServiceError } from "./errors";
import { requireAdmin } from "./auth.service";
import {
  CreateSupplierRequestSchema,
  UpdateSupplierRequestSchema,
} from "@/shared/validation/supplier.schema";
import type { UserCore } from "@/shared/types/user";
import { mapSupplierToResponse } from "./supplier/_mappers";

function normalizeName(name: string) {
  return name.trim();
}

export const supplierService = {
  /**
   * GET /suppliers
   */
  async list(currentUser: UserCore | null, includeArchived: boolean) {
    // Admin only
    requireAdmin(currentUser);

    const rows = await supplierRepo.list(includeArchived);
    return rows.map(mapSupplierToResponse);
  },

  /**
   * GET /suppliers/:id
   */
  async getById(currentUser: UserCore | null, id: string) {
    // Admin only
    requireAdmin(currentUser);

    const row = await supplierRepo.getById(id);
    if (!row) throw ERR.NOT_FOUND("Nhà cung cấp không tồn tại.");
    return mapSupplierToResponse(row);
  },

  /**
   * POST /suppliers (admin only)
   */
  async create(currentUser: UserCore | null, body: unknown) {
    requireAdmin(currentUser);

    if (!currentUser?.employeeId) {
      throw ERR.FORBIDDEN("Tài khoản admin chưa liên kết nhân viên.");
    }

    const parsed = CreateSupplierRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw ERR.INVALID(
        parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ."
      );
    }

    const data: SupplierCreateInput = {
      name: normalizeName(parsed.data.name),
      shortName: parsed.data.shortName ?? null,
      supplierGroup: parsed.data.supplierGroup ?? null,
      phone: parsed.data.phone ?? null,
      email: parsed.data.email ?? null,
      address: parsed.data.address ?? null,
      taxCode: parsed.data.taxCode ?? null,
      note: parsed.data.note ?? null,
      createdById: currentUser.employeeId,
      updatedById: currentUser.employeeId,
    };

    // Unique validate (name)
    const byName = await supplierRepo.getByName(data.name);
    if (byName) throw ERR.CONFLICT("Tên nhà cung cấp đã tồn tại.");

    const created = await supplierRepo.create(data);
    return mapSupplierToResponse(created);
  },

  /**
   * PUT /suppliers/:id (admin only)
   */
  async update(currentUser: UserCore | null, body: unknown) {
    requireAdmin(currentUser);

    if (!currentUser?.employeeId) {
      throw ERR.FORBIDDEN("Tài khoản admin chưa liên kết nhân viên.");
    }

    const parsed = UpdateSupplierRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw ERR.INVALID(
        parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ."
      );
    }

    const { id } = parsed.data;

    const existing = await supplierRepo.getById(id);
    if (!existing) throw ERR.NOT_FOUND("Nhà cung cấp không tồn tại.");

    const data: Partial<SupplierUpdateInput> = {
      name: normalizeName(parsed.data.name),
      shortName: parsed.data.shortName ?? null,
      supplierGroup: parsed.data.supplierGroup ?? null,
      phone: parsed.data.phone ?? null,
      email: parsed.data.email ?? null,
      address: parsed.data.address ?? null,
      taxCode: parsed.data.taxCode ?? null,
      note: parsed.data.note ?? null,
      updatedById: currentUser.employeeId,
      archivedAt: parsed.data.archivedAt ?? existing.archivedAt,
    };

    // Unique validate (exclude self)
    if (data.name && data.name !== existing.name) {
      const dup = await supplierRepo.getByName(data.name);
      if (dup && dup.id !== id)
        throw ERR.CONFLICT("Tên nhà cung cấp đã tồn tại.");
    }

    const updated = await supplierRepo.update(id, data);
    return mapSupplierToResponse(updated);
  },

  /**
   * DELETE /suppliers/:id (admin only)
   */
  async remove(currentUser: UserCore | null, id: string) {
    requireAdmin(currentUser);

    const existing = await supplierRepo.getById(id);
    if (!existing) throw ERR.NOT_FOUND("Nhà cung cấp không tồn tại.");

    const linked = await supplierRepo.countLinked(id);
    if (linked.total > 0) {
      // Gợi ý chuyển sang Archive
      throw new ServiceError(
        "HAS_LINKED_DATA",
        "NCC đang có dữ liệu liên kết, chỉ được phép Archive.",
        409
      );
    }

    const deleted = await supplierRepo.delete(id);
    return mapSupplierToResponse(deleted);
  },

  /**
   * POST /suppliers/:id/archive (admin only)
   */
  async archive(currentUser: UserCore | null, id: string) {
    requireAdmin(currentUser);

    const existing = await supplierRepo.getById(id);
    if (!existing) throw ERR.NOT_FOUND("Nhà cung cấp không tồn tại.");

    const updated = await supplierRepo.archive(id);
    return mapSupplierToResponse(updated);
  },

  /**
   * POST /suppliers/:id/unarchive (admin only)
   */
  async unarchive(currentUser: UserCore | null, id: string) {
    requireAdmin(currentUser);

    const existing = await supplierRepo.getById(id);
    if (!existing) throw ERR.NOT_FOUND("Nhà cung cấp không tồn tại.");

    const updated = await supplierRepo.unarchive(id);
    return mapSupplierToResponse(updated);
  },
};
