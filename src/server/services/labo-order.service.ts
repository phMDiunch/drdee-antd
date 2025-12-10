// src/server/services/labo-order.service.ts
import {
  laboOrderRepo,
  type LaboOrderCreateInput,
  type LaboOrderUpdateInput,
} from "@/server/repos/labo-order.repo";
import { laboServiceRepo } from "@/server/repos/labo-service.repo";
import { ServiceError } from "./errors";
import { laboOrderPermissions } from "@/shared/permissions/labo-order.permissions";
import {
  CreateLaboOrderRequestSchema,
  UpdateLaboOrderRequestSchema,
  GetDailyLaboOrdersQuerySchema,
  ReceiveLaboOrderRequestSchema,
  LaboOrderResponseSchema,
  LaboOrdersDailyResponseSchema,
} from "@/shared/validation/labo-order.schema";
import type { UserCore } from "@/shared/types/user";
import { mapLaboOrderToResponse } from "./labo-order/_mappers";

/**
 * Require authenticated employee
 */
function requireEmployee(user: UserCore | null | undefined) {
  if (!user) {
    throw new ServiceError("UNAUTHORIZED", "Bạn chưa đăng nhập", 401);
  }
  if (!user.employeeId) {
    throw new ServiceError(
      "MISSING_EMPLOYEE_ID",
      "Tài khoản chưa được liên kết với nhân viên",
      403
    );
  }
}

export const laboOrderService = {
  /**
   * Get daily labo orders (sent or returned)
   * Permission: labo-orders:view-daily (admin + employee)
   */
  async getDailyLaboOrders(currentUser: UserCore | null, query: unknown) {
    requireEmployee(currentUser);

    // Validate query params
    const parsed = GetDailyLaboOrdersQuerySchema.safeParse(query);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      throw new ServiceError(
        "VALIDATION_ERROR",
        firstError?.message || "Tham số truy vấn không hợp lệ",
        400
      );
    }

    const { date, type, clinicId, customerId } = parsed.data;

    // Clinic access control
    let targetClinicId = clinicId;
    if (currentUser?.role !== "admin") {
      // Employee: locked to own clinic
      if (!currentUser?.clinicId) {
        throw new ServiceError(
          "MISSING_CLINIC",
          "Tài khoản chưa được gán phòng khám",
          403
        );
      }
      targetClinicId = currentUser.clinicId;
    }

    // Fetch daily orders with statistics
    const result = await laboOrderRepo.getDailyLaboOrders({
      date,
      type,
      clinicId: targetClinicId,
      customerId, // NEW: Pass customerId for customer detail view
    });

    const response = {
      items: result.items.map(mapLaboOrderToResponse),
      count: result.count,
      statistics: result.statistics,
    };

    return LaboOrdersDailyResponseSchema.parse(response);
  },

  /**
   * Get labo order by ID
   * Permission: labo-orders:view (admin + employee)
   */
  async getById(currentUser: UserCore | null, id: string) {
    requireEmployee(currentUser);

    const row = await laboOrderRepo.getById(id);
    if (!row) {
      throw new ServiceError("NOT_FOUND", "Không tìm thấy đơn hàng labo", 404);
    }

    // Clinic access control
    if (
      currentUser?.role !== "admin" &&
      row.clinicId !== currentUser?.clinicId
    ) {
      throw new ServiceError(
        "PERMISSION_DENIED",
        "Bạn không có quyền xem đơn hàng này",
        403
      );
    }

    const mapped = mapLaboOrderToResponse(row);
    return LaboOrderResponseSchema.parse(mapped);
  },

  /**
   * Create new labo order
   * Permission: labo-orders:create (admin + employee)
   */
  async create(currentUser: UserCore | null, body: unknown) {
    requireEmployee(currentUser);

    if (!currentUser?.employeeId) {
      throw new ServiceError(
        "MISSING_EMPLOYEE_ID",
        "Tài khoản chưa liên kết nhân viên",
        403
      );
    }

    if (!currentUser?.clinicId) {
      throw new ServiceError(
        "MISSING_CLINIC",
        "Tài khoản chưa được gán phòng khám",
        403
      );
    }

    // Validate request body
    const parsed = CreateLaboOrderRequestSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      throw new ServiceError(
        "VALIDATION_ERROR",
        firstError?.message || "Dữ liệu không hợp lệ",
        400
      );
    }

    const data = parsed.data;

    // Fetch LaboService for pricing snapshot
    const laboService = await laboServiceRepo.getBySupplierAndLaboItem(
      data.supplierId,
      data.laboItemId
    );

    if (!laboService) {
      throw new ServiceError(
        "NOT_FOUND",
        "Không tìm thấy bảng giá cho xưởng và loại răng giả này",
        404
      );
    }

    // Calculate totalCost based on orderType
    const unitPrice = laboService.price;
    const totalCost =
      data.orderType === "Bảo hành" ? 0 : unitPrice * data.quantity;

    // Prepare create input with server-controlled fields
    const createInput: LaboOrderCreateInput = {
      customerId: data.customerId,
      doctorId: data.doctorId,
      treatmentDate: data.treatmentDate,
      orderType: data.orderType,
      sentById: data.sentById,
      laboServiceId: laboService.id,
      supplierId: data.supplierId,
      laboItemId: data.laboItemId,
      quantity: data.quantity,
      // sentDate is auto-set to now() at database level
      expectedFitDate: data.expectedFitDate ?? null,
      detailRequirement: data.detailRequirement ?? null,

      // Snapshot pricing from LaboService
      unitPrice,
      totalCost,
      warranty: laboService.warranty,

      // Server-controlled fields
      clinicId: currentUser.clinicId,
      createdById: currentUser.employeeId,
      updatedById: currentUser.employeeId,
    };

    const created = await laboOrderRepo.create(createInput);
    const mapped = mapLaboOrderToResponse(created);
    return LaboOrderResponseSchema.parse(mapped);
  },

  /**
   * Update labo order
   * Permission: labo-orders:update (admin + employee)
   * Business rule: Employee can only edit orders with returnDate === null
   */
  async update(currentUser: UserCore | null, body: unknown) {
    requireEmployee(currentUser);

    if (!currentUser?.employeeId) {
      throw new ServiceError(
        "MISSING_EMPLOYEE_ID",
        "Tài khoản chưa liên kết nhân viên",
        403
      );
    }

    // Validate request body
    const parsed = UpdateLaboOrderRequestSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      throw new ServiceError(
        "VALIDATION_ERROR",
        firstError?.message || "Dữ liệu không hợp lệ",
        400
      );
    }

    const { id, ...updates } = parsed.data;

    // Check if order exists
    const existing = await laboOrderRepo.getById(id!);
    if (!existing) {
      throw new ServiceError("NOT_FOUND", "Không tìm thấy đơn hàng labo", 404);
    }

    // Use permission file for validation
    try {
      laboOrderPermissions.validateUpdate(
        {
          role: currentUser.role,
          employeeId: currentUser.employeeId,
          clinicId: currentUser.clinicId,
        },
        existing,
        {
          ...updates,
          // Convert Date to string for permission validation
          sentDate: updates.sentDate?.toISOString(),
          returnDate: updates.returnDate?.toISOString() ?? null,
        }
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

    if (updates.sentDate !== undefined) {
      updateData.sentDate = updates.sentDate;
    }

    if (updates.returnDate !== undefined) {
      updateData.returnDate = updates.returnDate ?? null;
    }

    if (updates.receivedById !== undefined) {
      updateData.receivedById = updates.receivedById ?? null;
    }

    const updated = await laboOrderRepo.update(id!, updateData);
    const mapped = mapLaboOrderToResponse(updated);
    return LaboOrderResponseSchema.parse(mapped);
  },

  /**
   * Delete labo order
   * Permission: labo-orders:delete (admin only)
   */
  async remove(currentUser: UserCore | null, id: string) {
    // Admin only
    if (currentUser?.role !== "admin") {
      throw new ServiceError(
        "PERMISSION_DENIED",
        "Chỉ admin mới có quyền xóa đơn hàng labo",
        403
      );
    }

    const existing = await laboOrderRepo.getById(id);
    if (!existing) {
      throw new ServiceError("NOT_FOUND", "Không tìm thấy đơn hàng labo", 404);
    }

    await laboOrderRepo.delete(id);
    return { success: true, message: "Đã xóa đơn hàng labo" };
  },

  /**
   * Receive labo order (quick action)
   * Permission: labo-orders:receive (admin + employee)
   */
  async receiveLaboOrder(currentUser: UserCore | null, body: unknown) {
    requireEmployee(currentUser);

    if (!currentUser?.employeeId) {
      throw new ServiceError(
        "MISSING_EMPLOYEE_ID",
        "Tài khoản chưa liên kết nhân viên",
        403
      );
    }

    // Validate request body
    const parsed = ReceiveLaboOrderRequestSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      throw new ServiceError(
        "VALIDATION_ERROR",
        firstError?.message || "Dữ liệu không hợp lệ",
        400
      );
    }

    const { orderId } = parsed.data;

    // Check if order exists
    const existing = await laboOrderRepo.getById(orderId);
    if (!existing) {
      throw new ServiceError("NOT_FOUND", "Không tìm thấy đơn hàng labo", 404);
    }

    // Clinic access control
    if (
      currentUser?.role !== "admin" &&
      existing.clinicId !== currentUser?.clinicId
    ) {
      throw new ServiceError(
        "PERMISSION_DENIED",
        "Bạn không có quyền xác nhận nhận mẫu này",
        403
      );
    }

    // Validate: returnDate must be null
    if (existing.returnDate !== null) {
      throw new ServiceError(
        "ALREADY_RECEIVED",
        "Đơn hàng này đã được nhận mẫu",
        400
      );
    }

    // Receive order
    const received = await laboOrderRepo.receiveLaboOrder(
      orderId,
      currentUser.employeeId
    );

    const mapped = mapLaboOrderToResponse(received);
    return LaboOrderResponseSchema.parse(mapped);
  },
};
