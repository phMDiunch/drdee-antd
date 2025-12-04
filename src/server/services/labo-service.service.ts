// src/server/services/labo-service.service.ts
import {
  laboServiceRepo,
  type LaboServiceCreateInput,
  type LaboServiceUpdateInput,
} from "@/server/repos/labo-service.repo";
import { ERR, ServiceError } from "./errors";
import { requireAdmin } from "./auth.service";
import {
  CreateLaboServiceRequestSchema,
  UpdateLaboServiceRequestSchema,
} from "@/shared/validation/labo-service.schema";
import type { UserCore } from "@/shared/types/user";
import { mapLaboServiceToResponse } from "./labo-service/_mappers";

export const laboServiceService = {
  /**
   * GET /labo-services
   */
  async list(
    currentUser: UserCore | null,
    params?: { sortBy?: string; sortOrder?: string; supplierId?: string }
  ) {
    requireAdmin(currentUser);

    const rows = await laboServiceRepo.list(params);
    return rows.map(mapLaboServiceToResponse);
  },

  /**
   * GET /labo-services/:id
   */
  async getById(currentUser: UserCore | null, id: string) {
    requireAdmin(currentUser);

    const row = await laboServiceRepo.getById(id);
    if (!row) throw ERR.NOT_FOUND("Bảng giá không tồn tại.");
    return mapLaboServiceToResponse(row);
  },

  /**
   * POST /labo-services (admin only)
   */
  async create(currentUser: UserCore | null, body: unknown) {
    requireAdmin(currentUser);

    if (!currentUser?.employeeId) {
      throw ERR.FORBIDDEN("Tài khoản admin chưa liên kết nhân viên.");
    }

    const parsed = CreateLaboServiceRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw ERR.INVALID(
        parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ."
      );
    }

    const data: LaboServiceCreateInput = {
      supplierId: parsed.data.supplierId,
      laboItemId: parsed.data.laboItemId,
      price: parsed.data.price,
      warranty: parsed.data.warranty,
      createdById: currentUser.employeeId,
      updatedById: currentUser.employeeId,
    };

    // Unique validate: Check if this combination already exists
    const existing = await laboServiceRepo.getBySupplierAndLaboItem(
      data.supplierId,
      data.laboItemId
    );
    if (existing) {
      throw ERR.CONFLICT("Dịch vụ này đã có trong bảng giá xưởng.");
    }

    const created = await laboServiceRepo.create(data);
    return mapLaboServiceToResponse(created);
  },

  /**
   * PUT /labo-services/:id (admin only)
   */
  async update(currentUser: UserCore | null, body: unknown) {
    requireAdmin(currentUser);

    if (!currentUser?.employeeId) {
      throw ERR.FORBIDDEN("Tài khoản admin chưa liên kết nhân viên.");
    }

    const parsed = UpdateLaboServiceRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw ERR.INVALID(
        parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ."
      );
    }

    const { id } = parsed.data;

    const existing = await laboServiceRepo.getById(id);
    if (!existing) throw ERR.NOT_FOUND("Bảng giá không tồn tại.");

    const data: LaboServiceUpdateInput = {
      price: parsed.data.price,
      warranty: parsed.data.warranty,
      updatedById: currentUser.employeeId,
    };

    const updated = await laboServiceRepo.update(id, data);
    return mapLaboServiceToResponse(updated);
  },

  /**
   * DELETE /labo-services/:id (admin only)
   */
  async remove(currentUser: UserCore | null, id: string) {
    requireAdmin(currentUser);

    const existing = await laboServiceRepo.getById(id);
    if (!existing) throw ERR.NOT_FOUND("Bảng giá không tồn tại.");

    const linkedCount = await laboServiceRepo.countLinked(id);
    if (linkedCount > 0) {
      throw new ServiceError(
        "HAS_LINKED_DATA",
        "Không thể xóa. Dịch vụ này đã có đơn hàng.",
        409
      );
    }

    const deleted = await laboServiceRepo.delete(id);
    return mapLaboServiceToResponse(deleted);
  },
};
