// src/shared/permissions/customer.permissions.ts

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
 *   import { customerPermissions } from '@/shared/permissions/customer.permissions'
 *   const canEdit = customerPermissions.canEdit(currentUser, customer)
 *   <Button disabled={!canEdit.allowed} title={canEdit.reason}>Edit</Button>
 *
 * Backend:
 *   import { customerPermissions } from '@/shared/permissions/customer.permissions'
 *   customerPermissions.validateEdit(user, customer)
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
 * Customer data needed for permission checks
 */
export type CustomerForPermission = {
  clinicId?: string | null;
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

// ============================================================================
// PUBLIC API
// ============================================================================

export const customerPermissions = {
  /**
   * Check if user can create a customer
   *
   * Rules:
   * - Must be authenticated
   * - Must have employeeId and clinicId
   *
   * @returns { allowed, reason }
   */
  canCreate(user: PermissionUser | null | undefined): PermissionResult {
    if (!user) {
      return { allowed: false, reason: "Bạn chưa đăng nhập" };
    }

    if (!user.employeeId) {
      return {
        allowed: false,
        reason: "Tài khoản chưa được liên kết với nhân viên",
      };
    }

    if (!user.clinicId) {
      return {
        allowed: false,
        reason: "Nhân viên phải thuộc về một chi nhánh",
      };
    }

    return { allowed: true };
  },

  /**
   * Check if user can edit a customer
   *
   * Rules:
   * - Admin: Can edit all customers
   * - Employee: Can only edit customers from their clinic
   *
   * @returns { allowed, reason }
   */
  canEdit(
    user: PermissionUser | null | undefined,
    customer: CustomerForPermission
  ): PermissionResult {
    if (!user) {
      return { allowed: false, reason: "Bạn chưa đăng nhập" };
    }

    if (!user.employeeId) {
      return {
        allowed: false,
        reason: "Tài khoản chưa được liên kết với nhân viên",
      };
    }

    // Admin can edit all customers
    if (isAdmin(user)) {
      return { allowed: true };
    }

    // Employee can only edit customers from their clinic
    if (user.clinicId !== customer.clinicId) {
      return {
        allowed: false,
        reason: "Bạn chỉ có thể chỉnh sửa khách hàng thuộc chi nhánh của mình",
      };
    }

    return { allowed: true };
  },

  /**
   * Check if user can delete a customer
   *
   * Rules:
   * - Admin: Can delete all customers
   * - Employee: Can only delete customers from their clinic
   *
   * @returns { allowed, reason }
   */
  canDelete(
    user: PermissionUser | null | undefined,
    customer: CustomerForPermission
  ): PermissionResult {
    if (!user) {
      return { allowed: false, reason: "Bạn chưa đăng nhập" };
    }

    if (!user.employeeId) {
      return {
        allowed: false,
        reason: "Tài khoản chưa được liên kết với nhân viên",
      };
    }

    // Admin can delete all customers
    if (isAdmin(user)) {
      return { allowed: true };
    }

    // Employee can only delete customers from their clinic
    if (user.clinicId !== customer.clinicId) {
      return {
        allowed: false,
        reason: "Bạn chỉ có thể xóa khách hàng thuộc chi nhánh của mình",
      };
    }

    return { allowed: true };
  },

  /**
   * Check if user can view a customer
   *
   * Rules:
   * - Admin: Can view all customers
   * - Employee: Can view all customers (cross-clinic)
   *
   * @returns { allowed, reason }
   */
  canView(
    user: PermissionUser | null | undefined,
    customer: CustomerForPermission
  ): PermissionResult {
    if (!user) {
      return { allowed: false, reason: "Bạn chưa đăng nhập" };
    }

    if (!user.employeeId) {
      return {
        allowed: false,
        reason: "Tài khoản chưa được liên kết với nhân viên",
      };
    }

    // Both admin and employee can view all customers (cross-clinic)
    return { allowed: true };
  },

  /**
   * Validate create operation (for backend service layer)
   * Throws error if create is not allowed
   *
   * @throws Error with user-friendly message
   */
  validateCreate(user: PermissionUser | null | undefined): void {
    const check = this.canCreate(user);

    if (!check.allowed) {
      throw new Error(check.reason || "Không có quyền tạo khách hàng");
    }
  },

  /**
   * Validate edit operation (for backend service layer)
   * Throws error if edit is not allowed
   *
   * @throws Error with user-friendly message
   */
  validateEdit(
    user: PermissionUser | null | undefined,
    customer: CustomerForPermission
  ): void {
    const check = this.canEdit(user, customer);

    if (!check.allowed) {
      throw new Error(check.reason || "Không có quyền chỉnh sửa khách hàng");
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
    customer: CustomerForPermission
  ): void {
    const check = this.canDelete(user, customer);

    if (!check.allowed) {
      throw new Error(check.reason || "Không có quyền xóa khách hàng");
    }
  },

  /**
   * Validate view operation (for backend service layer)
   * Throws error if view is not allowed
   *
   * @throws Error with user-friendly message
   */
  validateView(
    user: PermissionUser | null | undefined,
    customer: CustomerForPermission
  ): void {
    const check = this.canView(user, customer);

    if (!check.allowed) {
      throw new Error(check.reason || "Không có quyền xem khách hàng");
    }
  },
};
