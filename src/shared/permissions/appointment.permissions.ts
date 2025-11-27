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
  checkInTime?: Date | string | null;
  checkOutTime?: Date | string | null;
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
   * - Employee (Today, Pending/Confirmed): Can edit except customer/dateTime/status/checkIn/checkOut
   * - Employee (Future): Can edit except checkIn/checkOut/status
   * - Employee: Status and checkIn/checkOut changes via quick actions only
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

      // Pending/Confirmed: Can edit most fields except customer/dateTime/status/checkIn/checkOut
      // Status changes via quick actions only
      // CheckIn/CheckOut: Only Admin can edit (Employee uses quick actions)
      return {
        allowed: true,
        disabledFields: [
          "customerId",
          "appointmentDateTime",
          "status",
          "checkInTime",
          "checkOutTime",
        ],
      };
    }

    // Employee - FUTURE: Can edit except checkIn/Out/status
    // Status changes via quick actions only
    return {
      allowed: true,
      disabledFields: ["checkInTime", "checkOutTime", "status"],
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
   * Check if user can check-in an appointment
   *
   * Rules:
   * - Must be authenticated
   * - Admin: Can check-in at any clinic
   * - Employee: Only at their own clinic (on-site requirement)
   * - Must be today's appointment
   * - Must not have check-in time yet
   *
   * @returns { allowed, reason }
   */
  canCheckIn(
    user: PermissionUser | null | undefined,
    appointment: AppointmentForPermission
  ): PermissionResult {
    if (!user) {
      return { allowed: false, reason: "Bạn chưa đăng nhập" };
    }

    // Check clinic ownership (Employee only)
    if (!isAdmin(user)) {
      if (appointment.clinicId !== user.clinicId) {
        return {
          allowed: false,
          reason: "Chỉ thực hiện được tại clinic của bạn",
        };
      }
    }

    // Must be today
    const timeline = getTimeline(appointment.appointmentDateTime);
    if (timeline !== "today") {
      return {
        allowed: false,
        reason: "Chỉ có thể check-in lịch hẹn trong ngày hôm nay",
      };
    }

    // Must not have check-in time yet
    if (appointment.checkInTime) {
      return {
        allowed: false,
        reason: "Lịch hẹn đã được check-in",
      };
    }

    return { allowed: true };
  },

  /**
   * Check if user can check-out an appointment
   *
   * Rules:
   * - Must be authenticated
   * - Admin: Can check-out at any clinic
   * - Employee: Only at their own clinic (on-site requirement)
   * - Must be today's appointment
   * - Must have check-in time
   * - Must not have check-out time yet
   *
   * @returns { allowed, reason }
   */
  canCheckOut(
    user: PermissionUser | null | undefined,
    appointment: AppointmentForPermission
  ): PermissionResult {
    if (!user) {
      return { allowed: false, reason: "Bạn chưa đăng nhập" };
    }

    // Check clinic ownership (Employee only)
    if (!isAdmin(user)) {
      if (appointment.clinicId !== user.clinicId) {
        return {
          allowed: false,
          reason: "Chỉ thực hiện được tại clinic của bạn",
        };
      }
    }

    // Must be today
    const timeline = getTimeline(appointment.appointmentDateTime);
    if (timeline !== "today") {
      return {
        allowed: false,
        reason: "Chỉ có thể check-out lịch hẹn trong ngày hôm nay",
      };
    }

    // Must have check-in time
    if (!appointment.checkInTime) {
      return {
        allowed: false,
        reason: "Chưa check-in, không thể check-out",
      };
    }

    // Must not have check-out time yet
    if (appointment.checkOutTime) {
      return {
        allowed: false,
        reason: "Lịch hẹn đã được check-out",
      };
    }

    return { allowed: true };
  },

  /**
   * Check if user can confirm an appointment
   *
   * Rules:
   * - Must be authenticated
   * - Admin: Can confirm at any clinic
   * - Employee: Only at their own clinic (on-site requirement)
   * - Must be future appointment (not today, not past)
   * - Must have status "Chờ xác nhận"
   *
   * @returns { allowed, reason }
   */
  canConfirm(
    user: PermissionUser | null | undefined,
    appointment: AppointmentForPermission
  ): PermissionResult {
    if (!user) {
      return { allowed: false, reason: "Bạn chưa đăng nhập" };
    }

    // Check clinic ownership (Employee only)
    if (!isAdmin(user)) {
      if (appointment.clinicId !== user.clinicId) {
        return {
          allowed: false,
          reason: "Chỉ thực hiện được tại clinic của bạn",
        };
      }
    }

    // Must be future
    const timeline = getTimeline(appointment.appointmentDateTime);
    if (timeline !== "future") {
      return {
        allowed: false,
        reason: "Chỉ có thể xác nhận lịch hẹn trong tương lai",
      };
    }

    // Must have status "Chờ xác nhận"
    if (appointment.status !== "Chờ xác nhận") {
      return {
        allowed: false,
        reason: "Chỉ có thể xác nhận lịch hẹn đang chờ xác nhận",
      };
    }

    return { allowed: true };
  },

  /**
   * Check if user can mark an appointment as no-show
   *
   * Rules:
   * - Must be authenticated
   * - Admin: Can mark no-show at any clinic
   * - Employee: Only at their own clinic (on-site requirement)
   * - Must be today or past appointment
   * - Must not have check-in time
   * - Must not already be marked as "Không đến"
   *
   * @returns { allowed, reason }
   */
  canMarkNoShow(
    user: PermissionUser | null | undefined,
    appointment: AppointmentForPermission
  ): PermissionResult {
    if (!user) {
      return { allowed: false, reason: "Bạn chưa đăng nhập" };
    }

    // Check clinic ownership (Employee only)
    if (!isAdmin(user)) {
      if (appointment.clinicId !== user.clinicId) {
        return {
          allowed: false,
          reason: "Chỉ thực hiện được tại clinic của bạn",
        };
      }
    }

    // Must be today or past
    const timeline = getTimeline(appointment.appointmentDateTime);
    if (timeline === "future") {
      return {
        allowed: false,
        reason: "Không thể đánh dấu không đến cho lịch hẹn trong tương lai",
      };
    }

    // Must not have check-in time
    if (appointment.checkInTime) {
      return {
        allowed: false,
        reason: "Không thể đánh dấu không đến khi đã check-in",
      };
    }

    // Must not already be marked as "Không đến"
    if (appointment.status === "Không đến") {
      return {
        allowed: false,
        reason: "Lịch hẹn đã được đánh dấu không đến",
      };
    }

    return { allowed: true };
  },

  /**
   * Get field-level permissions for forms
   * Returns which fields can be edited based on user role and appointment state
   *
   * Note: Employee status field is always disabled (changes via quick actions only)
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

  /**
   * Validate quick action (for backend service layer)
   * Validates clinic ownership and action-specific permissions
   *
   * @param action - Type of quick action being performed
   * @throws Error with user-friendly message
   */
  validateQuickAction(
    user: PermissionUser | null | undefined,
    appointment: AppointmentForPermission,
    action: "checkIn" | "checkOut" | "confirm" | "noShow"
  ): void {
    let check: PermissionResult;

    switch (action) {
      case "checkIn":
        check = this.canCheckIn(user, appointment);
        break;
      case "checkOut":
        check = this.canCheckOut(user, appointment);
        break;
      case "confirm":
        check = this.canConfirm(user, appointment);
        break;
      case "noShow":
        check = this.canMarkNoShow(user, appointment);
        break;
    }

    if (!check.allowed) {
      throw new Error(check.reason || `Không có quyền ${action}`);
    }
  },
};
