// src/shared/permissions/payment-voucher.permissions.ts

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
 *   import { paymentVoucherPermissions } from '@/shared/permissions/payment-voucher.permissions'
 *   const canEdit = paymentVoucherPermissions.canEdit(currentUser, voucher)
 *   <Button disabled={!canEdit.allowed} title={canEdit.reason}>Edit</Button>
 *
 * Backend:
 *   import { paymentVoucherPermissions } from '@/shared/permissions/payment-voucher.permissions'
 *   try {
 *     paymentVoucherPermissions.validateUpdate(user, existing, updates)
 *   } catch (error) {
 *     throw new ServiceError('PERMISSION_DENIED', error.message, 403)
 *   }
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
  fullAccess?: boolean;
  limitedAccess?: boolean;
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
 * Payment voucher data needed for permission checks
 */
export type PaymentVoucherForPermission = {
  paymentDate: Date | string;
  clinicId?: string | null;
  clinic?: { id: string } | null; // Support nested clinic object
  customerClinicId?: string | null; // Customer's current clinic (for permission check after customer transfer)
  cashierId?: string | null;
  createdById?: string | null;
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Determine payment voucher timeline relative to today
 */
function getTimeline(paymentDate: Date | string): Timeline {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const voucherDate = new Date(paymentDate);
  voucherDate.setHours(0, 0, 0, 0);

  if (voucherDate < today) return "past";
  if (voucherDate.getTime() === today.getTime()) return "today";
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
 * Check if user belongs to same clinic as voucher
 * Priority: Check customer's current clinic (customerClinicId) if available,
 * fallback to voucher's clinic for backward compatibility
 */
function isSameClinic(
  user: PermissionUser | null | undefined,
  voucher: PaymentVoucherForPermission
): boolean {
  if (!user) return false;
  if (isAdmin(user)) return true; // Admin can access all clinics

  // Support both clinicId (string) and clinic.id (nested object)
  const voucherClinicId = voucher.clinicId || voucher.clinic?.id;

  // Check customer's current clinic (supports customer transfer between clinics)
  const targetClinicId = voucher.customerClinicId ?? voucherClinicId;

  if (!targetClinicId) return false;
  return user.clinicId === targetClinicId;
}

// ============================================================================
// PUBLIC API
// ============================================================================

export const paymentVoucherPermissions = {
  /**
   * Can create payment voucher
   */
  canCreate(user: PermissionUser | null | undefined): PermissionResult {
    if (!user) {
      return {
        allowed: false,
        reason: "Bạn chưa đăng nhập",
      };
    }

    if (!user.employeeId) {
      return {
        allowed: false,
        reason: "Tài khoản chưa được liên kết với nhân viên",
      };
    }

    if (!user.clinicId && !isAdmin(user)) {
      return {
        allowed: false,
        reason: "Nhân viên phải thuộc về một chi nhánh",
      };
    }

    return {
      allowed: true,
    };
  },

  /**
   * Can view payment voucher
   */
  canView(
    user: PermissionUser | null | undefined,
    voucher: PaymentVoucherForPermission
  ): PermissionResult {
    if (!user) {
      return {
        allowed: false,
        reason: "Bạn chưa đăng nhập",
      };
    }

    // Admin: View all
    if (isAdmin(user)) {
      return {
        allowed: true,
      };
    }

    // Employee: Only same clinic
    if (!isSameClinic(user, voucher)) {
      return {
        allowed: false,
        reason: "Bạn chỉ có thể xem phiếu thu của chi nhánh mình",
      };
    }

    return {
      allowed: true,
    };
  },

  /**
   * Can edit payment voucher
   * Returns permission level and restrictions
   */
  canEdit(
    user: PermissionUser | null | undefined,
    voucher: PaymentVoucherForPermission
  ): PermissionResult {
    if (!user) {
      return {
        allowed: false,
        reason: "Bạn chưa đăng nhập",
      };
    }

    if (!user.employeeId) {
      return {
        allowed: false,
        reason: "Tài khoản chưa được liên kết với nhân viên",
      };
    }

    const timeline = getTimeline(voucher.paymentDate);

    // Admin: Full access always
    if (isAdmin(user)) {
      return {
        allowed: true,
        fullAccess: true,
      };
    }

    // Non-admin past: No edit
    if (timeline === "past") {
      return {
        allowed: false,
        reason: "Không thể sửa phiếu thu của ngày trước",
      };
    }

    // Non-admin future: No edit (payment vouchers are for today only)
    if (timeline === "future") {
      return {
        allowed: false,
        reason: "Không thể sửa phiếu thu của ngày sau",
      };
    }

    // Non-admin today: Limited access (only same clinic)
    if (!isSameClinic(user, voucher)) {
      return {
        allowed: false,
        reason: "Bạn chỉ có thể sửa phiếu thu của chi nhánh mình",
      };
    }

    return {
      allowed: true,
      limitedAccess: true,
    };
  },

  /**
   * Can delete payment voucher
   */
  canDelete(user: PermissionUser | null | undefined): PermissionResult {
    if (!user) {
      return {
        allowed: false,
        reason: "Bạn chưa đăng nhập",
      };
    }

    // Only admin can delete
    if (!isAdmin(user)) {
      return {
        allowed: false,
        reason: "Chỉ admin mới có quyền xóa phiếu thu",
      };
    }

    return {
      allowed: true,
    };
  },

  /**
   * Validate update fields based on permission level
   * Throws error if not allowed
   */
  validateUpdate(
    user: PermissionUser | null | undefined,
    existing: PaymentVoucherForPermission,
    updates: {
      notes?: string | null;
      details?: unknown[];
    }
  ): void {
    const permission = this.canEdit(user, existing);

    if (!permission.allowed) {
      throw new Error(permission.reason || "Không có quyền sửa phiếu thu");
    }

    // Admin: Full access - no validation needed
    if (permission.fullAccess) {
      return;
    }

    // Non-admin today: Limited access - only notes and payment methods
    if (permission.limitedAccess) {
      // Only allow notes and details (for payment method updates only)
      const allowedFields = ["notes", "details"];
      const updatedFields = Object.keys(updates);

      const invalidFields = updatedFields.filter(
        (field) => !allowedFields.includes(field)
      );

      if (invalidFields.length > 0) {
        throw new Error(`Bạn chỉ có thể sửa ghi chú và phương thức thanh toán`);
      }

      return;
    }

    throw new Error("Không có quyền sửa phiếu thu");
  },

  /**
   * Can print payment voucher
   */
  canPrint(
    user: PermissionUser | null | undefined,
    voucher: PaymentVoucherForPermission
  ): PermissionResult {
    // Same as view permission
    return this.canView(user, voucher);
  },
};
