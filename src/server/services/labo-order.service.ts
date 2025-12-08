// src/server/services/labo-order.service.ts
import {
  laboOrderRepo,
  type LaboOrderCreateInput,
  type LaboOrderUpdateInput,
} from "@/server/repos/labo-order.repo";
import { laboServiceRepo } from "@/server/repos/labo-service.repo";
import { ERR, ServiceError } from "./errors";
import { requireEmployee } from "./auth.service";
import { laboOrderPermissions } from "@/shared/permissions/labo-order.permissions";
import {
  CreateLaboOrderRequestSchema,
  UpdateLaboOrderRequestSchema,
  GetDailyLaboOrdersQuerySchema,
  ReceiveLaboOrderRequestSchema,
} from "@/shared/validation/labo-order.schema";
import type { UserCore } from "@/shared/types/user";
import { mapLaboOrderToResponse } from "./labo-order/_mappers";

export const laboOrderService = {
  /**
   * GET /labo-orders/daily - Get daily labo orders (sent or returned)
   * Permission: labo-orders:view-daily (admin + employee)
   */
  async getDailyLaboOrders(currentUser: UserCore | null, query: unknown) {
    requireEmployee(currentUser);

    // Validate query params
    const parsed = GetDailyLaboOrdersQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw ERR.INVALID(
        parsed.error.issues[0]?.message ?? "Query params không hợp lệ."
      );
    }

    const { date, type, clinicId } = parsed.data;

    // Clinic access control
    let targetClinicId = clinicId;
    if (currentUser?.role !== "admin") {
      // Employee: locked to own clinic
      if (!currentUser?.clinicId) {
        throw ERR.FORBIDDEN("Tài khoản chưa được gán phòng khám.");
      }
      targetClinicId = currentUser.clinicId;
    }

    // Fetch daily orders
    const result = await laboOrderRepo.getDailyLaboOrders({
      date,
      type,
      clinicId: targetClinicId,
    });

    return {
      items: result.items.map(mapLaboOrderToResponse),
      total: result.total,
    };
  },

  /**
   * GET /labo-orders/:id
   * Permission: labo-orders:view (admin + employee)
   */
  async getById(currentUser: UserCore | null, id: string) {
    requireEmployee(currentUser);

    const row = await laboOrderRepo.getById(id);
    if (!row) throw ERR.NOT_FOUND("Đơn hàng không tồn tại.");

    // Clinic access control
    if (
      currentUser?.role !== "admin" &&
      row.clinicId !== currentUser?.clinicId
    ) {
      throw ERR.FORBIDDEN("Bạn không có quyền xem đơn hàng này.");
    }

    return mapLaboOrderToResponse(row);
  },

  /**
   * POST /labo-orders (create)
   * Permission: labo-orders:create (admin + employee)
   */
  async create(currentUser: UserCore | null, body: unknown) {
    requireEmployee(currentUser);

    if (!currentUser?.employeeId) {
      throw ERR.FORBIDDEN("Tài khoản chưa liên kết nhân viên.");
    }

    if (!currentUser?.clinicId) {
      throw ERR.FORBIDDEN("Tài khoản chưa được gán phòng khám.");
    }

    // Validate request body
    const parsed = CreateLaboOrderRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw ERR.INVALID(
        parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ."
      );
    }

    // Fetch LaboService for pricing snapshot
    const laboService = await laboServiceRepo.getBySupplierAndLaboItem(
      parsed.data.supplierId,
      parsed.data.laboItemId
    );

    if (!laboService) {
      throw ERR.NOT_FOUND(
        "Không tìm thấy bảng giá cho xưởng và loại răng giả này."
      );
    }

    // Calculate totalCost based on orderType
    const unitPrice = laboService.price;
    const totalCost =
      parsed.data.orderType === "Bảo hành"
        ? 0
        : unitPrice * parsed.data.quantity;

    // Prepare create input with server-controlled fields
    const data: LaboOrderCreateInput = {
      customerId: parsed.data.customerId,
      doctorId: parsed.data.doctorId,
      treatmentDate: parsed.data.treatmentDate,
      orderType: parsed.data.orderType,
      sentById: parsed.data.sentById,
      laboServiceId: laboService.id,
      supplierId: parsed.data.supplierId,
      laboItemId: parsed.data.laboItemId,
      quantity: parsed.data.quantity,
      // sendDate is auto-set to now() at database level
      expectedFitDate: parsed.data.expectedFitDate ?? null,
      detailRequirement: parsed.data.detailRequirement ?? null,

      // Snapshot pricing from LaboService
      unitPrice,
      totalCost,
      warranty: laboService.warranty,

      // Server-controlled fields
      clinicId: currentUser.clinicId,
      createdById: currentUser.employeeId,
      updatedById: currentUser.employeeId,
    };

    const created = await laboOrderRepo.create(data);
    return mapLaboOrderToResponse(created);
  },

  /**
   * PUT /labo-orders/:id (update)
   * Permission: labo-orders:update (admin + employee)
   * Business rule: Employee can only edit orders with returnDate === null
   * Admin can edit: treatmentDate, orderType, sentById, sendDate + all basic fields
   * Employee can edit: quantity, expectedFitDate, detailRequirement only
   */
  async update(currentUser: UserCore | null, body: unknown) {
    requireEmployee(currentUser);

    if (!currentUser?.employeeId) {
      throw ERR.FORBIDDEN("Tài khoản chưa liên kết nhân viên.");
    }

    // Validate request body
    const parsed = UpdateLaboOrderRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw ERR.INVALID(
        parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ."
      );
    }

    const { id, ...updates } = parsed.data;

    // Check if order exists
    const existing = await laboOrderRepo.getById(id);
    if (!existing) throw ERR.NOT_FOUND("Đơn hàng không tồn tại.");

    // Use permission file for validation
    try {
      laboOrderPermissions.validateUpdate(
        {
          role: currentUser.role,
          employeeId: currentUser.employeeId,
          clinicId: currentUser.clinicId,
        },
        existing,
        updates
      );
    } catch (error) {
      throw new ServiceError(
        "PERMISSION_DENIED",
        error instanceof Error
          ? error.message
          : "Không có quyền sửa đơn hàng labo",
        403
      );
    }

    // Prepare update input
    const updateData: LaboOrderUpdateInput = {
      updatedById: currentUser.employeeId,
    };

    // Basic fields (Employee + Admin)
    if (updates.quantity !== undefined) {
      updateData.quantity = updates.quantity;
      // Recalculate totalCost based on orderType
      const currentOrderType = updates.orderType ?? existing.orderType;
      updateData.totalCost =
        currentOrderType === "Bảo hành"
          ? 0
          : existing.unitPrice * updates.quantity;
    }

    if (updates.expectedFitDate !== undefined) {
      updateData.expectedFitDate = updates.expectedFitDate ?? null;
    }

    if (updates.detailRequirement !== undefined) {
      updateData.detailRequirement = updates.detailRequirement ?? null;
    }

    // Admin-only fields (permission already validated above)
    if (updates.treatmentDate !== undefined) {
      updateData.treatmentDate = updates.treatmentDate;
    }

    if (updates.orderType !== undefined) {
      updateData.orderType = updates.orderType;
      // Recalculate totalCost when orderType changes
      const currentQuantity = updates.quantity ?? existing.quantity;
      updateData.totalCost =
        updates.orderType === "Bảo hành"
          ? 0
          : existing.unitPrice * currentQuantity;
    }

    if (updates.sentById !== undefined) {
      updateData.sentById = updates.sentById;
    }

    if (updates.sendDate !== undefined) {
      updateData.sendDate = updates.sendDate;
    }

    if (updates.returnDate !== undefined) {
      updateData.returnDate = updates.returnDate ?? null;
    }

    if (updates.receivedById !== undefined) {
      updateData.receivedById = updates.receivedById ?? null;
    }

    const updated = await laboOrderRepo.update(id, updateData);
    return mapLaboOrderToResponse(updated);
  },

  /**
   * DELETE /labo-orders/:id
   * Permission: labo-orders:delete (admin only)
   */
  async remove(currentUser: UserCore | null, id: string) {
    // Admin only
    if (currentUser?.role !== "admin") {
      throw ERR.FORBIDDEN("Chỉ admin mới có quyền xóa đơn hàng.");
    }

    const existing = await laboOrderRepo.getById(id);
    if (!existing) throw ERR.NOT_FOUND("Đơn hàng không tồn tại.");

    const deleted = await laboOrderRepo.delete(id);
    return mapLaboOrderToResponse(deleted);
  },

  /**
   * POST /labo-orders/receive (receive labo order)
   * Permission: labo-orders:receive (admin + employee)
   * Quick action: Set returnDate = now, receivedById = currentUserId
   */
  async receiveLaboOrder(currentUser: UserCore | null, body: unknown) {
    requireEmployee(currentUser);

    if (!currentUser?.employeeId) {
      throw ERR.FORBIDDEN("Tài khoản chưa liên kết nhân viên.");
    }

    // Validate request body
    const parsed = ReceiveLaboOrderRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw ERR.INVALID(
        parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ."
      );
    }

    const { orderId } = parsed.data;

    // Check if order exists
    const existing = await laboOrderRepo.getById(orderId);
    if (!existing) throw ERR.NOT_FOUND("Đơn hàng không tồn tại.");

    // Clinic access control
    if (
      currentUser?.role !== "admin" &&
      existing.clinicId !== currentUser?.clinicId
    ) {
      throw ERR.FORBIDDEN("Bạn không có quyền xác nhận nhận mẫu này.");
    }

    // Validate: returnDate must be null
    if (existing.returnDate !== null) {
      throw ERR.INVALID("Đơn hàng này đã được nhận mẫu.");
    }

    // Receive order
    const received = await laboOrderRepo.receiveLaboOrder(
      orderId,
      currentUser.employeeId
    );

    return mapLaboOrderToResponse(received);
  },
};
