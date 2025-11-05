// src/server/services/consulted-service.service.ts
import { ServiceError } from "./errors";
import {
  CreateConsultedServiceRequestSchema,
  UpdateConsultedServiceRequestSchema,
  GetConsultedServicesQuerySchema,
  GetConsultedServicesDailyQuerySchema,
  ConsultedServicesListResponseSchema,
  ConsultedServicesDailyResponseSchema,
  ConsultedServiceResponseSchema,
} from "@/shared/validation/consulted-service.schema";
import type { UserCore } from "@/shared/types/user";
import { consultedServiceRepo } from "@/server/repos/consulted-service.repo";
import { dentalServiceRepo } from "@/server/repos/dental-service.repo";
import { mapConsultedServiceToResponse } from "./consulted-service/_mappers";
import { consultedServicePermissions } from "@/shared/permissions/consulted-service.permissions";

/**
 * Require authenticated user (not just admin)
 */
function requireAuth(user: UserCore | null | undefined) {
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

export const consultedServiceService = {
  /**
   * List consulted services with filters and pagination
   */
  async list(currentUser: UserCore | null, query: unknown) {
    requireAuth(currentUser);

    const parsed = GetConsultedServicesQuerySchema.parse(query);
    const {
      page,
      pageSize,
      search,
      customerId,
      clinicId,
      serviceStatus,
      treatmentStatus,
      sortField,
      sortDirection,
    } = parsed;

    /**
     * Clinic Filtering Strategy:
     * Similar to appointment service - customer-centric vs clinic-centric
     */
    let effectiveClinicId: string | undefined;

    if (customerId) {
      // CASE 1: Customer-centric view (cross-clinic)
      effectiveClinicId = undefined;
    } else {
      // CASE 2: Clinic-centric view
      effectiveClinicId =
        currentUser?.role === "admin"
          ? clinicId
          : currentUser?.clinicId ?? undefined;

      if (!effectiveClinicId && currentUser?.role !== "admin") {
        throw new ServiceError(
          "MISSING_CLINIC",
          "Nhân viên phải thuộc về một chi nhánh",
          403
        );
      }
    }

    const { items, total } = await consultedServiceRepo.list({
      search,
      page,
      pageSize,
      customerId,
      clinicId: effectiveClinicId,
      serviceStatus,
      treatmentStatus,
      sortField,
      sortDirection,
    });

    const mappedItems = items.map(mapConsultedServiceToResponse);
    const totalPages = Math.ceil(total / pageSize);

    const response = {
      items: mappedItems,
      total,
      page,
      pageSize,
      totalPages,
    };

    return ConsultedServicesListResponseSchema.parse(response);
  },

  /**
   * Get consulted services for daily view
   */
  async listDaily(currentUser: UserCore | null, query: unknown) {
    requireAuth(currentUser);

    const parsed = GetConsultedServicesDailyQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new ServiceError(
        "VALIDATION_ERROR",
        "Tham số truy vấn không hợp lệ",
        400
      );
    }

    const { date, clinicId } = parsed.data;

    // Parse date
    const targetDate = new Date(date);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const day = targetDate.getDate();

    const dateStart = new Date(year, month, day, 0, 0, 0);
    const dateEnd = new Date(year, month, day, 23, 59, 59, 999);

    // Scope clinic access
    let effectiveClinicId: string | undefined = clinicId;
    if (currentUser?.role !== "admin") {
      effectiveClinicId = currentUser?.clinicId ?? undefined;
    }

    if (!effectiveClinicId) {
      throw new ServiceError("MISSING_CLINIC", "Vui lòng chọn chi nhánh", 400);
    }

    const result = await consultedServiceRepo.listDaily({
      clinicId: effectiveClinicId,
      dateStart,
      dateEnd,
    });

    const response = {
      items: result.items.map(mapConsultedServiceToResponse),
      count: result.count,
      statistics: result.statistics,
    };

    return ConsultedServicesDailyResponseSchema.parse(response);
  },

  /**
   * Get consulted service by ID
   */
  async getById(currentUser: UserCore | null, id: string) {
    requireAuth(currentUser);

    const service = await consultedServiceRepo.findById(id);
    if (!service) {
      throw new ServiceError("NOT_FOUND", "Không tìm thấy dịch vụ tư vấn", 404);
    }

    const mapped = mapConsultedServiceToResponse(service);
    return ConsultedServiceResponseSchema.parse(mapped);
  },

  /**
   * Create new consulted service
   */
  async create(currentUser: UserCore | null, body: unknown) {
    requireAuth(currentUser);

    // Validate request
    const parsed = CreateConsultedServiceRequestSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      throw new ServiceError(
        "VALIDATION_ERROR",
        firstError?.message || "Dữ liệu không hợp lệ",
        400
      );
    }

    const data = parsed.data;

    // 1. Check appointment check-in requirement
    const checkedInAppointment =
      await consultedServiceRepo.findTodayCheckedInAppointment({
        customerId: data.customerId,
        clinicId: data.clinicId,
      });

    if (!checkedInAppointment) {
      throw new ServiceError(
        "CHECKIN_REQUIRED",
        "Khách hàng chưa check-in hôm nay",
        400
      );
    }

    // 2. Fetch dental service for denormalized data
    const dentalService = await dentalServiceRepo.getById(data.dentalServiceId);
    if (!dentalService) {
      throw new ServiceError(
        "NOT_FOUND",
        "Không tìm thấy dịch vụ nha khoa",
        404
      );
    }

    // 3. Validate preferentialPrice
    const minPrice = dentalService.minPrice ?? 0;
    const price = dentalService.price;
    const preferentialPrice = data.preferentialPrice;

    // Rule: preferentialPrice === 0 (free) OR [minPrice, price]
    if (preferentialPrice > 0 && preferentialPrice < minPrice) {
      throw new ServiceError(
        "INVALID_PRICE",
        `Giá ưu đãi phải là 0 (miễn phí) hoặc từ ${minPrice.toLocaleString()} đến ${price.toLocaleString()}`,
        400
      );
    }

    if (preferentialPrice > price) {
      throw new ServiceError(
        "INVALID_PRICE",
        `Giá ưu đãi không được vượt quá giá niêm yết ${price.toLocaleString()}`,
        400
      );
    }

    // 4. Validate tooth positions if unit is "Răng"
    if (
      dentalService.unit === "Răng" &&
      (!data.toothPositions || data.toothPositions.length === 0)
    ) {
      throw new ServiceError(
        "VALIDATION_ERROR",
        "Vui lòng chọn vị trí răng",
        400
      );
    }

    // 5. Calculate financial fields
    const finalPrice = preferentialPrice * data.quantity;
    const debt = finalPrice; // Initially, no payment made

    // 6. Prepare create input
    const createInput = {
      ...data,
      appointmentId: checkedInAppointment.id,
      consultedServiceName: dentalService.name,
      consultedServiceUnit: dentalService.unit,
      price: dentalService.price,
      finalPrice,
      debt,
      amountPaid: 0,
      serviceStatus: "Chưa chốt" as const,
      treatmentStatus: "Chưa điều trị" as const,
      consultationDate: new Date(),
      createdById: currentUser!.employeeId!,
      updatedById: currentUser!.employeeId!,
    };

    // 7. Create in database
    const created = await consultedServiceRepo.create(createInput);

    const mapped = mapConsultedServiceToResponse(created);
    return ConsultedServiceResponseSchema.parse(mapped);
  },

  /**
   * Update consulted service
   */
  async update(id: string, currentUser: UserCore | null, body: unknown) {
    requireAuth(currentUser);

    // 1. Fetch existing service
    const existing = await consultedServiceRepo.findById(id);
    if (!existing) {
      throw new ServiceError("NOT_FOUND", "Không tìm thấy dịch vụ tư vấn", 404);
    }

    // 2. Validate request
    const parsed = UpdateConsultedServiceRequestSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      throw new ServiceError(
        "VALIDATION_ERROR",
        firstError?.message || "Dữ liệu không hợp lệ",
        400
      );
    }

    const data = parsed.data;

    // 3. Check permissions
    try {
      consultedServicePermissions.validateUpdateFields(
        currentUser!,
        existing,
        data
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không có quyền chỉnh sửa";
      throw new ServiceError("PERMISSION_DENIED", message, 403);
    }

    // 4. Validate preferentialPrice if changed
    if (data.preferentialPrice !== undefined) {
      const minPrice = existing.dentalService.minPrice ?? 0;
      const price = existing.dentalService.price;
      const preferentialPrice = data.preferentialPrice;

      if (preferentialPrice > 0 && preferentialPrice < minPrice) {
        throw new ServiceError(
          "INVALID_PRICE",
          `Giá ưu đãi phải là 0 (miễn phí) hoặc từ ${minPrice.toLocaleString()} đến ${price.toLocaleString()}`,
          400
        );
      }

      if (preferentialPrice > price) {
        throw new ServiceError(
          "INVALID_PRICE",
          `Giá ưu đãi không được vượt quá giá niêm yết ${price.toLocaleString()}`,
          400
        );
      }
    }

    // 5. Validate tooth positions if unit is "Răng" and toothPositions changed
    if (data.toothPositions !== undefined) {
      if (
        existing.consultedServiceUnit === "Răng" &&
        (!data.toothPositions || data.toothPositions.length === 0)
      ) {
        throw new ServiceError(
          "VALIDATION_ERROR",
          "Vui lòng chọn vị trí răng",
          400
        );
      }
    }

    // 6. Recalculate financial fields if needed
    const updateInput: Record<string, unknown> = { ...data };

    const newQuantity = data.quantity ?? existing.quantity;
    const newPreferentialPrice =
      data.preferentialPrice ?? existing.preferentialPrice;

    if (data.quantity !== undefined || data.preferentialPrice !== undefined) {
      const calculatedFinalPrice = newPreferentialPrice * newQuantity;
      updateInput.finalPrice = calculatedFinalPrice;
      updateInput.debt = calculatedFinalPrice - existing.amountPaid;
    }

    // 7. Admin-only validation: serviceStatus change
    if (
      data.serviceStatus === "Đã chốt" &&
      existing.serviceStatus === "Chưa chốt"
    ) {
      if (!data.serviceConfirmDate) {
        updateInput.serviceConfirmDate = new Date();
      }
    }

    // 8. Track updater
    updateInput.updatedById = currentUser!.employeeId!;

    // 9. Update in database
    const updated = await consultedServiceRepo.update(id, updateInput);

    const mapped = mapConsultedServiceToResponse(updated);
    return ConsultedServiceResponseSchema.parse(mapped);
  },

  /**
   * Delete consulted service
   */
  async delete(id: string, currentUser: UserCore | null) {
    requireAuth(currentUser);

    // 1. Fetch existing service
    const existing = await consultedServiceRepo.findById(id);
    if (!existing) {
      throw new ServiceError("NOT_FOUND", "Không tìm thấy dịch vụ tư vấn", 404);
    }

    // 2. Check permissions
    // Employee: Can only delete "Chưa chốt" services
    // Admin: Can delete all
    if (currentUser!.role !== "admin" && existing.serviceStatus === "Đã chốt") {
      throw new ServiceError(
        "PERMISSION_DENIED",
        "Không thể xóa dịch vụ đã chốt",
        403
      );
    }

    // 3. Hard delete
    await consultedServiceRepo.delete(id);

    return { success: true, message: "Đã xóa dịch vụ tư vấn" };
  },

  /**
   * Confirm consulted service (set status to "Đã chốt")
   */
  async confirm(id: string, currentUser: UserCore | null) {
    requireAuth(currentUser);

    // 1. Fetch existing service
    const existing = await consultedServiceRepo.findById(id);
    if (!existing) {
      throw new ServiceError("NOT_FOUND", "Không tìm thấy dịch vụ tư vấn", 404);
    }

    // 2. Validate: already confirmed
    if (existing.serviceStatus === "Đã chốt") {
      throw new ServiceError(
        "ALREADY_CONFIRMED",
        "Dịch vụ đã được chốt trước đó",
        400
      );
    }

    // 3. Confirm
    const updated = await consultedServiceRepo.confirm(
      id,
      currentUser!.employeeId!
    );

    const mapped = mapConsultedServiceToResponse(updated);
    return ConsultedServiceResponseSchema.parse(mapped);
  },
};
