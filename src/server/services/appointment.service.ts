// src/server/services/appointment.service.ts
import { ServiceError } from "./errors";
import {
  CreateAppointmentRequestSchema,
  UpdateAppointmentRequestSchema,
  AppointmentsListResponseSchema,
  GetAppointmentsQuerySchema,
  GetAppointmentsDailyQuerySchema,
  CheckDentistAvailabilityQuerySchema,
  AppointmentResponseSchema,
  DentistAvailabilityResponseSchema,
} from "@/shared/validation/appointment.schema";
import type { UserCore } from "@/shared/types/user";
import { appointmentRepo } from "@/server/repos/appointment.repo";
import { mapAppointmentToResponse } from "./appointment/_mappers";
import { appointmentPermissions } from "@/shared/permissions/appointment.permissions";

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

/**
 * Handle reschedule logic
 * If appointmentDateTime changes → reset status, clear check-in/out
 */
function handleReschedule(
  original: { appointmentDateTime: Date },
  updates: { appointmentDateTime?: Date }
): Partial<{ status: "Chờ xác nhận"; checkInTime: null; checkOutTime: null }> {
  if (!updates.appointmentDateTime) return {};

  const originalDate = new Date(original.appointmentDateTime);
  const newDate = new Date(updates.appointmentDateTime);

  // Compare dates (ignore time)
  originalDate.setHours(0, 0, 0, 0);
  newDate.setHours(0, 0, 0, 0);

  if (originalDate.getTime() !== newDate.getTime()) {
    return {
      status: "Chờ xác nhận" as const,
      checkInTime: null,
      checkOutTime: null,
    };
  }

  return {};
}

export const appointmentService = {
  /**
   * List appointments with filters and pagination
   */
  async list(currentUser: UserCore | null, query: unknown) {
    requireAuth(currentUser);

    const parsed = GetAppointmentsQuerySchema.parse(query);
    const {
      page,
      pageSize,
      search,
      customerId,
      clinicId,
      status,
      date,
      sortField,
      sortDirection,
    } = parsed;

    /**
     * Clinic Filtering Strategy:
     *
     * CASE 1: Customer Detail View (customerId provided)
     * - Show ALL appointments across all clinics (cross-clinic view)
     * - Rationale: Employee needs full context, prevent duplicate bookings
     * - Permission: View all, edit own clinic only (handled in frontend)
     *
     * CASE 2: Daily/List View (no customerId)
     * - Show only appointments of employee's clinic
     * - Rationale: Daily operations, clinic-specific workflow
     * - Permission: Employee see/edit own clinic, Admin see/edit all
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

    const { items, count } = await appointmentRepo.list({
      search,
      page,
      pageSize,
      customerId,
      clinicId: effectiveClinicId,
      status,
      date,
      sortField,
      sortDirection,
    });

    const mappedItems = items.map(mapAppointmentToResponse);
    const totalPages = Math.ceil(count / pageSize);

    const response = {
      items: mappedItems,
      count,
      page,
      pageSize,
      totalPages,
    };

    return AppointmentsListResponseSchema.parse(response);
  },

  /**
   * Get appointments for daily view
   * Following customer.service.listDaily gold standard
   */
  async listDaily(currentUser: UserCore | null, query: unknown) {
    requireAuth(currentUser);

    const parsed = GetAppointmentsDailyQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new ServiceError(
        "VALIDATION_ERROR",
        "Tham số truy vấn không hợp lệ",
        400
      );
    }

    const { date, clinicId } = parsed.data;

    // Parse date or use today
    const targetDate = date ? new Date(date) : new Date();
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const day = targetDate.getDate();

    const dateStart = new Date(year, month, day, 0, 0, 0);
    const dateEnd = new Date(year, month, day + 1, 0, 0, 0);

    // Scope clinic access
    let effectiveClinicId = clinicId;
    if (currentUser?.role !== "admin") {
      effectiveClinicId = currentUser?.clinicId || undefined;
    }

    if (!effectiveClinicId) {
      throw new ServiceError("MISSING_CLINIC", "Vui lòng chọn chi nhánh", 400);
    }

    const result = await appointmentRepo.listDaily({
      clinicId: effectiveClinicId,
      dateStart,
      dateEnd,
    });

    return {
      items: result.items.map(mapAppointmentToResponse),
      count: result.count,
    };
  },

  /**
   * Get appointment by ID
   */
  async getById(currentUser: UserCore | null, id: string) {
    requireAuth(currentUser);

    const appointment = await appointmentRepo.getById(id);
    if (!appointment) {
      throw new ServiceError("NOT_FOUND", "Không tìm thấy lịch hẹn", 404);
    }

    // Check clinic access
    if (
      currentUser?.role !== "admin" &&
      appointment.clinicId !== currentUser?.clinicId
    ) {
      throw new ServiceError(
        "FORBIDDEN",
        "Bạn không có quyền xem lịch hẹn này",
        403
      );
    }

    const mapped = mapAppointmentToResponse(appointment);
    return AppointmentResponseSchema.parse(mapped);
  },

  /**
   * Create appointment with business logic
   */
  async create(currentUser: UserCore | null, body: unknown) {
    requireAuth(currentUser);

    if (!currentUser?.clinicId || !currentUser?.employeeId) {
      throw new ServiceError(
        "MISSING_CLINIC_OR_EMPLOYEE",
        "User phải thuộc về một chi nhánh và có employeeId",
        403
      );
    }

    const parsed = CreateAppointmentRequestSchema.parse(body);

    // Validate: no past appointments (allow within last 2 minutes for walk-in edge case)
    // Note: "Đến đột xuất" is just a marker (createdAt ≈ appointmentDateTime),
    // treated same as "Đã đến" in all logic
    const now = new Date();
    const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);
    if (parsed.appointmentDateTime < twoMinutesAgo) {
      throw new ServiceError(
        "PAST_APPOINTMENT_NOT_ALLOWED",
        "Không thể tạo lịch hẹn trong quá khứ",
        400
      );
    }

    // Note: Both admin and employee can create appointments for any clinic
    // (e.g., booking customer to another branch)

    // Check customer conflict (1 customer/1 appointment/day)
    const existingAppointment =
      await appointmentRepo.findCustomerAppointmentOnDate({
        customerId: parsed.customerId,
        date: parsed.appointmentDateTime,
      });

    if (existingAppointment) {
      throw new ServiceError(
        "CUSTOMER_CONFLICT",
        "Khách hàng đã có lịch hẹn vào ngày này",
        409
      );
    }

    const data = {
      ...parsed,
      createdById: currentUser.employeeId,
      updatedById: currentUser.employeeId,
    };

    const created = await appointmentRepo.create(data);
    const mapped = mapAppointmentToResponse(created);
    return AppointmentResponseSchema.parse(mapped);
  },

  /**
   * Update appointment with permission checks and business logic
   */
  async update(currentUser: UserCore | null, id: string, body: unknown) {
    requireAuth(currentUser);

    if (!currentUser?.employeeId) {
      throw new ServiceError(
        "MISSING_EMPLOYEE_ID",
        "Tài khoản chưa được liên kết với nhân viên",
        403
      );
    }

    // Get fields from original body (not parsed) to check only fields actually sent
    const fields = Object.keys(body as Record<string, unknown>);
    const parsed = UpdateAppointmentRequestSchema.parse(body);

    // Get existing appointment
    const existing = await appointmentRepo.getById(id);
    if (!existing) {
      throw new ServiceError("NOT_FOUND", "Không tìm thấy lịch hẹn", 404);
    }

    // ✅ Use shared permission logic
    try {
      appointmentPermissions.validateUpdateFields(
        currentUser,
        existing,
        fields
      );
    } catch (error) {
      throw new ServiceError(
        "PERMISSION_DENIED",
        error instanceof Error ? error.message : "Không có quyền chỉnh sửa",
        403
      );
    }

    // Check customer conflict if changing date/customer
    if (parsed.appointmentDateTime || parsed.customerId) {
      const checkDate =
        parsed.appointmentDateTime || existing.appointmentDateTime;
      const checkCustomer = parsed.customerId || existing.customerId;

      const conflict = await appointmentRepo.findCustomerAppointmentOnDate({
        customerId: checkCustomer,
        date: checkDate,
        excludeAppointmentId: id,
      });

      if (conflict) {
        throw new ServiceError(
          "CUSTOMER_CONFLICT",
          "Khách hàng đã có lịch hẹn vào ngày này",
          409
        );
      }
    }

    // Handle reschedule logic
    const rescheduleUpdates = handleReschedule(existing, parsed);

    // Auto-set status when check-in time is provided
    let statusUpdate: { status?: typeof parsed.status } = {};
    if (parsed.checkInTime && !parsed.status) {
      statusUpdate = { status: "Đã đến" as const };
    }

    // Clear check-in/out if status is "Không đến"
    if (parsed.status === "Không đến") {
      parsed.checkInTime = null;
      parsed.checkOutTime = null;
    }

    // Validate check-in/out time relationship with existing data
    const finalCheckInTime = parsed.checkInTime ?? existing.checkInTime;
    const finalCheckOutTime = parsed.checkOutTime ?? existing.checkOutTime;

    if (finalCheckInTime && finalCheckOutTime) {
      const checkIn = new Date(finalCheckInTime);
      const checkOut = new Date(finalCheckOutTime);

      if (checkIn >= checkOut) {
        throw new ServiceError(
          "INVALID_TIME_ORDER",
          "Thời gian check-in phải trước check-out",
          400
        );
      }
    }

    const updates = {
      ...parsed,
      ...rescheduleUpdates,
      ...statusUpdate,
      updatedById: currentUser.employeeId,
    };

    const updated = await appointmentRepo.update(id, updates);
    const mapped = mapAppointmentToResponse(updated);
    return AppointmentResponseSchema.parse(mapped);
  },

  /**
   * Delete appointment with permission checks
   */
  async delete(currentUser: UserCore | null, id: string) {
    requireAuth(currentUser);

    const existing = await appointmentRepo.getById(id);
    if (!existing) {
      throw new ServiceError("NOT_FOUND", "Không tìm thấy lịch hẹn", 404);
    }

    // ✅ Use shared permission logic
    try {
      appointmentPermissions.validateDelete(currentUser, existing);
    } catch (error) {
      throw new ServiceError(
        "PERMISSION_DENIED",
        error instanceof Error ? error.message : "Không có quyền xóa",
        403
      );
    }

    await appointmentRepo.delete(id);
    return { success: true };
  },

  /**
   * Check dentist availability (for soft warning)
   */
  async checkDentistAvailability(currentUser: UserCore | null, query: unknown) {
    requireAuth(currentUser);

    const parsed = CheckDentistAvailabilityQuerySchema.parse(query);
    const { dentistId, datetime, duration, excludeAppointmentId } = parsed;

    const startTime = new Date(datetime);
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + duration);

    const conflicts = await appointmentRepo.findDentistConflicts({
      dentistId,
      startTime,
      endTime,
      excludeAppointmentId,
    });

    const response = {
      available: conflicts.length === 0,
      conflicts: conflicts.map((c) => ({
        id: c.id,
        appointmentDateTime: c.appointmentDateTime.toISOString(),
        duration: c.duration,
        customerName: c.customer.fullName,
      })),
    };

    return DentistAvailabilityResponseSchema.parse(response);
  },
};
