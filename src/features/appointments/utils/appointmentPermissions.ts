import dayjs from "dayjs";
import type { AppointmentResponse } from "@/shared/validation/appointment.schema";
import type { UserCore } from "@/shared/types/user";

/**
 * Permission helper for appointment operations
 * Based on Timeline & Status (not clinic ownership)
 */

type Timeline = "past" | "today" | "future";

/**
 * Determine appointment timeline relative to today
 */
function getAppointmentTimeline(appointmentDateTime: string): Timeline {
  const appointmentDate = dayjs(appointmentDateTime);
  const today = dayjs().startOf("day");

  if (appointmentDate.isBefore(today)) return "past";
  if (appointmentDate.isSame(today, "day")) return "today";
  return "future";
}

/**
 * Check if user can edit an appointment
 * Returns { canEdit: boolean, reason?: string }
 */
export function canEditAppointment(
  appointment: AppointmentResponse,
  currentUser: UserCore | null
): { canEdit: boolean; reason?: string } {
  if (!currentUser) {
    return { canEdit: false, reason: "Bạn chưa đăng nhập" };
  }

  const isAdmin = currentUser.role === "admin";
  if (isAdmin) {
    return { canEdit: true };
  }

  const timeline = getAppointmentTimeline(appointment.appointmentDateTime);
  const status = appointment.status;

  // Employee - PAST: Cannot edit
  if (timeline === "past") {
    return {
      canEdit: false,
      reason: "Không thể sửa lịch hẹn trong quá khứ",
    };
  }

  // Employee - TODAY: Depends on status
  // Note: "Đến đột xuất" treated same as "Đã đến" (both have checkInTime)
  if (timeline === "today") {
    const lockedStatuses = ["Đã đến", "Đến đột xuất", "Không đến", "Đã hủy"];
    if (lockedStatuses.includes(status)) {
      return {
        canEdit: false,
        reason: "Không thể sửa lịch hẹn đã check-in, đã hủy hoặc không đến",
      };
    }
    // Can edit only pending/confirmed status
  }

  // Employee - FUTURE: Can edit (except checkIn/Out)
  return { canEdit: true };
}

/**
 * Check if user can delete an appointment
 */
export function canDeleteAppointment(
  appointment: AppointmentResponse,
  currentUser: UserCore | null
): { canDelete: boolean; reason?: string } {
  if (!currentUser) {
    return { canDelete: false, reason: "Bạn chưa đăng nhập" };
  }

  const isAdmin = currentUser.role === "admin";
  if (isAdmin) {
    return { canDelete: true };
  }

  const timeline = getAppointmentTimeline(appointment.appointmentDateTime);
  const status = appointment.status;

  // Employee - PAST: Cannot delete
  if (timeline === "past") {
    return {
      canDelete: false,
      reason: "Không thể xóa lịch hẹn trong quá khứ",
    };
  }

  // Employee - TODAY: Cannot delete if already checked in, cancelled, or no-show
  // Note: "Đến đột xuất" treated same as "Đã đến" (both have checkInTime)
  if (timeline === "today") {
    const activeOrCompletedStatuses = [
      "Đã đến",
      "Đến đột xuất",
      "Không đến",
      "Đã hủy",
    ];
    if (activeOrCompletedStatuses.includes(status)) {
      return {
        canDelete: false,
        reason: "Không thể xóa lịch hẹn đã có khách đến, đã hủy hoặc không đến",
      };
    }
    // Can delete if pending/confirmed
  }

  // Employee - FUTURE: Can delete
  return { canDelete: true };
}

/**
 * Get field-level edit permissions for UpdateAppointmentModal
 * Returns which fields employee can edit based on timeline and status
 */
export function getFieldPermissions(
  appointment: AppointmentResponse,
  currentUser: UserCore | null
) {
  const isAdmin = currentUser?.role === "admin";

  // Admin can edit everything
  if (isAdmin) {
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

  const timeline = getAppointmentTimeline(appointment.appointmentDateTime);
  const status = appointment.status;

  // Employee - PAST: Cannot edit anything
  if (timeline === "past") {
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

  // Employee - TODAY: Depends on status
  // Note: "Đến đột xuất" treated same as "Đã đến" (both have checkInTime)
  if (timeline === "today") {
    const lockedStatuses = ["Đã đến", "Đến đột xuất", "Không đến", "Đã hủy"];
    if (lockedStatuses.includes(status)) {
      // Cannot edit checked-in, cancelled, or no-show appointments
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

    // Pending/Confirmed: Most fields except customer and dateTime
    return {
      canEditCustomer: false,
      canEditDateTime: false,
      canEditDuration: true,
      canEditPrimaryDentist: true,
      canEditSecondaryDentist: true,
      canEditClinic: true,
      canEditStatus: false, // Employee: Status changes via quick actions only
      canEditNotes: true,
      canEditCheckInTime: false,
      canEditCheckOutTime: false,
    };
  }

  // Employee - FUTURE: All fields except checkIn/Out and Status
  return {
    canEditCustomer: true,
    canEditDateTime: true,
    canEditDuration: true,
    canEditPrimaryDentist: true,
    canEditSecondaryDentist: true,
    canEditClinic: true,
    canEditStatus: false, // Employee: Status changes via quick actions only
    canEditNotes: true,
    canEditCheckInTime: false,
    canEditCheckOutTime: false,
  };
}

/**
 * Check if user can edit status field
 * Employee: Cannot edit status (changes via quick actions only)
 * Admin: Can edit status
 */
export function canEditStatusField(currentUser: UserCore | null): boolean {
  if (!currentUser) return false;
  return currentUser.role === "admin";
}

/**
 * Check if user can perform quick actions (check-in, check-out, confirm, no-show)
 * Employee: Only for their own clinic
 * Admin: All clinics
 */
export function canPerformQuickAction(
  appointment: AppointmentResponse,
  currentUser: UserCore | null
): { canPerform: boolean; reason?: string } {
  if (!currentUser) {
    return { canPerform: false, reason: "Bạn chưa đăng nhập" };
  }

  const isAdmin = currentUser.role === "admin";
  if (isAdmin) {
    return { canPerform: true };
  }

  // Employee: Only their own clinic
  if (appointment.clinicId !== currentUser.clinicId) {
    return {
      canPerform: false,
      reason: "Chỉ thực hiện được tại clinic của bạn",
    };
  }

  return { canPerform: true };
}
