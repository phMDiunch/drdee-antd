// src/shared/permissions/labo-order.permissions.ts

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
 *   import { laboOrderPermissions } from '@/shared/permissions/labo-order.permissions'
 *   const canEdit = laboOrderPermissions.canEdit(currentUser, order)
 *   <Button disabled={!canEdit.allowed} title={canEdit.reason}>Edit</Button>
 *
 * Backend:
 *   import { laboOrderPermissions } from '@/shared/permissions/labo-order.permissions'
 *   try {
 *     laboOrderPermissions.validateUpdate(user, existing, updates)
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
 * Labo order data needed for permission checks
 */
export type LaboOrderForPermission = {
  returnDate: Date | string | null;
  clinicId?: string | null;
  clinic?: { id: string } | null; // Support nested clinic object
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if user is admin
 */
function isAdmin(user: PermissionUser | null | undefined): boolean {
  if (!user) return false;
  return user.role?.toLowerCase() === "admin";
}

/**
 * Check if user belongs to same clinic as order
 */
function isSameClinic(
  user: PermissionUser | null | undefined,
  order: LaboOrderForPermission
): boolean {
  if (!user) return false;
  if (isAdmin(user)) return true; // Admin can access all clinics

  // Support both clinicId (string) and clinic.id (nested object)
  const orderClinicId = order.clinicId || order.clinic?.id;

  if (!orderClinicId) return false;
  return user.clinicId === orderClinicId;
}

/**
 * Check if order is still pending (not yet returned from lab)
 */
function isPending(order: LaboOrderForPermission): boolean {
  return order.returnDate === null;
}

// ============================================================================
// PUBLIC API
// ============================================================================

export const laboOrderPermissions = {
  /**
   * Can create labo order
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
   * Can view labo order
   */
  canView(
    user: PermissionUser | null | undefined,
    order: LaboOrderForPermission
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
    if (!isSameClinic(user, order)) {
      return {
        allowed: false,
        reason: "Bạn chỉ có thể xem đơn hàng labo của chi nhánh mình",
      };
    }

    return {
      allowed: true,
    };
  },

  /**
   * Can edit labo order
   * Returns permission level and restrictions
   *
   * Rules:
   * - Admin: Full access (can edit all fields including treatmentDate, orderType, sentById, sentDate)
   * - Employee: Limited access (only if returnDate === null, can only edit quantity, expectedFitDate, detailRequirement)
   */
  canEdit(
    user: PermissionUser | null | undefined,
    order: LaboOrderForPermission
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

    // Admin: Full access always
    if (isAdmin(user)) {
      return {
        allowed: true,
        fullAccess: true,
      };
    }

    // Employee: Can only edit pending orders (not yet returned from lab)
    if (!isPending(order)) {
      return {
        allowed: false,
        reason: "Không thể sửa đơn hàng đã nhận về từ xưởng",
      };
    }

    // Employee: Only same clinic
    if (!isSameClinic(user, order)) {
      return {
        allowed: false,
        reason: "Bạn chỉ có thể sửa đơn hàng labo của chi nhánh mình",
      };
    }

    return {
      allowed: true,
      limitedAccess: true,
    };
  },

  /**
   * Can delete labo order
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
        reason: "Chỉ admin mới có quyền xóa đơn hàng labo",
      };
    }

    return {
      allowed: true,
    };
  },

  /**
   * Validate update fields based on permission level
   * Throws error if not allowed
   *
   * Admin can edit all fields:
   * - quantity, expectedFitDate, detailRequirement (basic fields)
   * - treatmentDate, orderType, sentById, sentDate (admin-only fields)
   * - returnDate (admin-only field)
   *
   * Employee can only edit:
   * - quantity, expectedFitDate, detailRequirement
   */
  validateUpdate(
    user: PermissionUser | null | undefined,
    existing: LaboOrderForPermission,
    updates: {
      quantity?: number;
      expectedFitDate?: string | null;
      detailRequirement?: string | null;
      treatmentDate?: string; // Admin only
      orderType?: string; // Admin only
      sentById?: string; // Admin only
      sentDate?: string; // Admin only
      returnDate?: string | null; // Admin only
      receivedById?: string | null; // Admin only
    }
  ): void {
    const permission = this.canEdit(user, existing);

    if (!permission.allowed) {
      throw new Error(permission.reason || "Không có quyền sửa đơn hàng labo");
    }

    // Admin: Full access - no validation needed
    if (permission.fullAccess) {
      return;
    }

    // Employee: Limited access - only basic fields
    if (permission.limitedAccess) {
      const allowedFields = [
        "quantity",
        "expectedFitDate",
        "detailRequirement",
      ];
      const updatedFields = Object.keys(updates);

      const invalidFields = updatedFields.filter(
        (field) => !allowedFields.includes(field)
      );

      if (invalidFields.length > 0) {
        throw new Error(
          `Bạn chỉ có thể sửa số lượng, ngày dự kiến lắp và ghi chú yêu cầu`
        );
      }

      return;
    }

    throw new Error("Không có quyền sửa đơn hàng labo");
  },

  /**
   * Can print labo order
   */
  canPrint(
    user: PermissionUser | null | undefined,
    order: LaboOrderForPermission
  ): PermissionResult {
    // Same as view permission
    return this.canView(user, order);
  },
};
