// src/shared/permissions/appointment.permissions.ts

/**
 * ============================================================================
 * SHARED PERMISSION LOGIC - USE IN BOTH FRONTEND & BACKEND
 * ============================================================================
 *
 * ✅ Pure TypeScript - No DB, No Supabase, No React
 * ✅ Single source of truth for all permission checks
 * ✅ Frontend: Instant UI feedback (0ms)
 * ✅ Backend: Same logic for validation
 *
 * USAGE:
 *
 * Frontend:
 *   import { appointmentPermissions } from '@/shared/permissions/appointment.permissions'
 *   const canEdit = appointmentPermissions.canEdit(currentUser, appointment)
 *   <Button disabled={!canEdit.allowed} title={canEdit.reason}>Edit</Button>
 *
 * Backend:
 *   import { appointmentPermissions } from '@/shared/permissions/appointment.permissions'
 *   const check = appointmentPermissions.canEdit(user, appointment)
 *   if (!check.allowed) throw new Error(check.reason)
 *
 * ============================================================================
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Permission check result
 */
export type PermissionResult = {
  allowed: boolean;
  reason?: string;
  disabledFields?: string[];
};

/**
 * Minimal user info needed for permission checks (compatible with UserCore)
 */
export type PermissionUser = {
  role?: string | null;
  employeeId?: string | null;
  clinicId?: string | null;
};

/**
 * Timeline relative to today
 */
type Timeline = "past" | "today" | "future";

/**
 * Appointment data needed for permission checks
 */
export type AppointmentForPermission = {
  appointmentDateTime: Date | string;
  status: string;
  clinicId?: string | null;
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Determine appointment timeline relative to today
 */
function getTimeline(appointmentDateTime: Date | string): Timeline {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const aptDate = new Date(appointmentDateTime);
  aptDate.setHours(0, 0, 0, 0);

  if (aptDate < today) return "past";
  if (aptDate.getTime() === today.getTime()) return "today";
  return "future";
}

/**
 * Check if user is admin
 */
function isAdmin(user: PermissionUser | null | undefined): boolean {
  if (!user) return false;
  return user.role?.toLowerCase() === "admin";
}

/**
 * Locked statuses that cannot be edited/deleted
 */
const LOCKED_STATUSES = ["Đã đến", "Đến đột xuất", "Không đến", "Đã hủy"];

/**
 * ============================================================================
 * PUBLIC API
 * ============================================================================
 */

export const appointmentPermissions = {
  /**
   * Check if user can edit an appointment
   *
   * Rules:
   * - Admin: Can edit everything, anytime
   * - Employee (Past): Cannot edit
   * - Employee (Today, Locked): Cannot edit
   * - Employee (Today, Pending/Confirmed): Can edit except customer/dateTime
   * - Employee (Future): Can edit except checkIn/checkOut times
   *
   * @returns { allowed, reason, disabledFields }
   */
  canEdit(
    user: PermissionUser | null | undefined,
    appointment: AppointmentForPermission
  ): PermissionResult {
    if (!user) {
      return { allowed: false, reason: "Bạn chưa đăng nhập" };
    }

    if (isAdmin(user)) {
      return { allowed: true };
    }

    const timeline = getTimeline(appointment.appointmentDateTime);
    const status = appointment.status;

    // Employee - PAST: Cannot edit
    if (timeline === "past") {
      return {
        allowed: false,
        reason: "Nhân viên không thể sửa lịch hẹn trong quá khứ",
      };
    }

    // Employee - TODAY: Depends on status
    if (timeline === "today") {
      if (LOCKED_STATUSES.includes(status)) {
        return {
          allowed: false,
          reason: "Không thể sửa lịch hẹn đã check-in, đã hủy hoặc không đến",
        };
      }

      // Pending/Confirmed: Can edit most fields
      return {
        allowed: true,
        disabledFields: ["customerId", "appointmentDateTime"],
      };
    }

    // Employee - FUTURE: Can edit except checkIn/Out
    return {
      allowed: true,
      disabledFields: ["checkInTime", "checkOutTime"],
    };
  },

  /**
   * Check if user can delete an appointment
   *
   * Rules:
   * - Admin: Can delete anytime
   * - Employee (Past): Cannot delete
   * - Employee (Today, Locked): Cannot delete
   * - Employee (Today, Pending/Confirmed): Can delete
   * - Employee (Future): Can delete
   *
   * @returns { allowed, reason }
   */
  canDelete(
    user: PermissionUser | null | undefined,
    appointment: AppointmentForPermission
  ): PermissionResult {
    if (!user) {
      return { allowed: false, reason: "Bạn chưa đăng nhập" };
    }

    if (isAdmin(user)) {
      return { allowed: true };
    }

    const timeline = getTimeline(appointment.appointmentDateTime);
    const status = appointment.status;

    // Employee - PAST: Cannot delete
    if (timeline === "past") {
      return {
        allowed: false,
        reason: "Nhân viên không thể xóa lịch hẹn trong quá khứ",
      };
    }

    // Employee - TODAY: Cannot delete if locked
    if (timeline === "today") {
      if (LOCKED_STATUSES.includes(status)) {
        return {
          allowed: false,
          reason:
            "Không thể xóa lịch hẹn đã có khách đến, đã hủy hoặc không đến",
        };
      }
    }

    // Future or today pending/confirmed: Can delete
    return { allowed: true };
  },

  /**
   * Check if user can perform quick actions (check-in, confirm, cancel, no-show)
   *
   * Rules:
   * - Must be authenticated
   * - Cannot perform on past appointments
   * - Cannot perform on already completed/cancelled appointments
   *
   * @returns { allowed, reason }
   */
  canPerformQuickAction(
    user: PermissionUser | null | undefined,
    appointment: AppointmentForPermission
  ): PermissionResult {
    if (!user) {
      return { allowed: false, reason: "Bạn chưa đăng nhập" };
    }

    const timeline = getTimeline(appointment.appointmentDateTime);
    const status = appointment.status;

    // Cannot perform quick actions on past appointments
    if (timeline === "past") {
      return {
        allowed: false,
        reason: "Không thể thao tác với lịch hẹn trong quá khứ",
      };
    }

    // Cannot perform quick actions on locked appointments
    if (LOCKED_STATUSES.includes(status)) {
      return {
        allowed: false,
        reason: "Lịch hẹn đã hoàn tất hoặc đã hủy",
      };
    }

    return { allowed: true };
  },

  /**
   * Get field-level permissions for forms
   * Returns which fields can be edited based on user role and appointment state
   *
   * @returns Object with canEditXXX boolean flags
   */
  getFieldPermissions(
    user: PermissionUser | null | undefined,
    appointment: AppointmentForPermission
  ) {
    const editCheck = this.canEdit(user, appointment);

    // If cannot edit at all, disable everything
    if (!editCheck.allowed) {
      return {
        canEditCustomer: false,
        canEditDateTime: false,
        canEditDuration: false,
        canEditPrimaryDentist: false,
        canEditSecondaryDentist: false,
        canEditClinic: false,
        canEditStatus: false,
        canEditNotes: false,
        canEditCheckInTime: false,
        canEditCheckOutTime: false,
      };
    }

    // Admin can edit everything
    if (isAdmin(user)) {
      return {
        canEditCustomer: true,
        canEditDateTime: true,
        canEditDuration: true,
        canEditPrimaryDentist: true,
        canEditSecondaryDentist: true,
        canEditClinic: true,
        canEditStatus: true,
        canEditNotes: true,
        canEditCheckInTime: true,
        canEditCheckOutTime: true,
      };
    }

    // Employee: Check disabled fields
    const disabledFields = editCheck.disabledFields || [];

    return {
      canEditCustomer: !disabledFields.includes("customerId"),
      canEditDateTime: !disabledFields.includes("appointmentDateTime"),
      canEditDuration: !disabledFields.includes("duration"),
      canEditPrimaryDentist: !disabledFields.includes("primaryDentistId"),
      canEditSecondaryDentist: !disabledFields.includes("secondaryDentistId"),
      canEditClinic: !disabledFields.includes("clinicId"),
      canEditStatus: !disabledFields.includes("status"),
      canEditNotes: !disabledFields.includes("notes"),
      canEditCheckInTime: !disabledFields.includes("checkInTime"),
      canEditCheckOutTime: !disabledFields.includes("checkOutTime"),
    };
  },

  /**
   * Validate update fields (for backend service layer)
   * Throws error if any field is not allowed to be updated
   *
   * @throws Error with user-friendly message
   */
  validateUpdateFields(
    user: PermissionUser | null | undefined,
    appointment: AppointmentForPermission,
    fields: string[]
  ): void {
    const check = this.canEdit(user, appointment);

    if (!check.allowed) {
      throw new Error(check.reason || "Không có quyền chỉnh sửa");
    }

    if (check.disabledFields && check.disabledFields.length > 0) {
      const forbidden = fields.filter((field) =>
        check.disabledFields!.includes(field)
      );

      if (forbidden.length > 0) {
        throw new Error(
          `Không thể chỉnh sửa các trường: ${forbidden.join(", ")}`
        );
      }
    }
  },

  /**
   * Validate delete operation (for backend service layer)
   * Throws error if delete is not allowed
   *
   * @throws Error with user-friendly message
   */
  validateDelete(
    user: PermissionUser | null | undefined,
    appointment: AppointmentForPermission
  ): void {
    const check = this.canDelete(user, appointment);

    if (!check.allowed) {
      throw new Error(check.reason || "Không có quyền xóa");
    }
  },
};
