// src/shared/permissions/employee.permissions.ts

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
 *   import { employeePermissions } from '@/shared/permissions/employee.permissions'
 *   const canEdit = employeePermissions.canEdit(currentUser, employee)
 *   <Button disabled={!canEdit.allowed} title={canEdit.reason}>Edit</Button>
 *
 * Backend:
 *   import { employeePermissions } from '@/shared/permissions/employee.permissions'
 *   employeePermissions.validateEdit(user, employee)
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
 * Employee data needed for permission checks
 */
export type EmployeeForPermission = {
  id: string;
  role?: string | null;
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

export const employeePermissions = {
  /**
   * Check if user can create an employee
   *
   * Rules:
   * - Only Admin can create employees
   *
   * @returns { allowed, reason }
   */
  canCreate(user: PermissionUser | null | undefined): PermissionResult {
    if (!user) {
      return { allowed: false, reason: "Bạn chưa đăng nhập" };
    }

    if (!isAdmin(user)) {
      return {
        allowed: false,
        reason: "Chỉ quản trị viên mới có thể tạo nhân viên",
      };
    }

    return { allowed: true };
  },

  /**
   * Check if user can edit an employee
   *
   * Rules:
   * - Admin: Can edit all employees (including other admins)
   * - Employee: Can only edit their own profile (limited fields)
   *
   * @returns { allowed, reason }
   */
  canEdit(
    user: PermissionUser | null | undefined,
    employee: EmployeeForPermission
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

    // Admin can edit all employees
    if (isAdmin(user)) {
      return { allowed: true };
    }

    // Employee can only edit their own profile
    if (user.employeeId === employee.id) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: "Bạn chỉ có thể chỉnh sửa hồ sơ của chính mình",
    };
  },

  /**
   * Check if user can delete an employee
   *
   * Rules:
   * - Only Admin can delete employees
   *
   * @returns { allowed, reason }
   */
  canDelete(user: PermissionUser | null | undefined): PermissionResult {
    if (!user) {
      return { allowed: false, reason: "Bạn chưa đăng nhập" };
    }

    if (!isAdmin(user)) {
      return {
        allowed: false,
        reason: "Chỉ quản trị viên mới có thể xóa nhân viên",
      };
    }

    return { allowed: true };
  },

  /**
   * Check if user can change employee status (active/inactive/terminated)
   *
   * Rules:
   * - Only Admin can change employee status
   *
   * @returns { allowed, reason }
   */
  canChangeStatus(user: PermissionUser | null | undefined): PermissionResult {
    if (!user) {
      return { allowed: false, reason: "Bạn chưa đăng nhập" };
    }

    if (!isAdmin(user)) {
      return {
        allowed: false,
        reason: "Chỉ quản trị viên mới có thể thay đổi trạng thái nhân viên",
      };
    }

    return { allowed: true };
  },

  /**
   * Check if user can view employee list
   *
   * Rules:
   * - Admin: Can view all employees
   * - Employee: Can view all employees (read-only)
   *
   * @returns { allowed, reason }
   */
  canViewList(user: PermissionUser | null | undefined): PermissionResult {
    if (!user) {
      return { allowed: false, reason: "Bạn chưa đăng nhập" };
    }

    if (!user.employeeId) {
      return {
        allowed: false,
        reason: "Tài khoản chưa được liên kết với nhân viên",
      };
    }

    return { allowed: true };
  },

  /**
   * Check if user can resend invite email
   *
   * Rules:
   * - Only Admin can resend invites
   *
   * @returns { allowed, reason }
   */
  canResendInvite(user: PermissionUser | null | undefined): PermissionResult {
    if (!user) {
      return { allowed: false, reason: "Bạn chưa đăng nhập" };
    }

    if (!isAdmin(user)) {
      return {
        allowed: false,
        reason: "Chỉ quản trị viên mới có thể gửi lại lời mời",
      };
    }

    return { allowed: true };
  },

  /**
   * Get field-level edit permissions
   *
   * Rules:
   * - Admin: Can edit all fields
   * - Employee (self): Can only edit limited fields (avatarUrl, phone, address, etc.)
   *
   * @returns Object with field permission flags
   */
  getFieldPermissions(
    user: PermissionUser | null | undefined,
    employee: EmployeeForPermission
  ) {
    const editCheck = this.canEdit(user, employee);

    if (!editCheck.allowed) {
      return {
        canEditRole: false,
        canEditClinic: false,
        canEditDepartment: false,
        canEditJobTitle: false,
        canEditStatus: false,
        canEditPersonalInfo: false, // phone, address, dob, etc.
        canEditAvatar: false,
      };
    }

    // Admin can edit everything
    if (isAdmin(user)) {
      return {
        canEditRole: true,
        canEditClinic: true,
        canEditDepartment: true,
        canEditJobTitle: true,
        canEditStatus: true,
        canEditPersonalInfo: true,
        canEditAvatar: true,
      };
    }

    // Employee can only edit personal info (not role, clinic, department, status)
    return {
      canEditRole: false,
      canEditClinic: false,
      canEditDepartment: false,
      canEditJobTitle: false,
      canEditStatus: false,
      canEditPersonalInfo: true, // phone, address, dob, avatar, etc.
      canEditAvatar: true,
    };
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
      throw new Error(check.reason || "Không có quyền tạo nhân viên");
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
    employee: EmployeeForPermission
  ): void {
    const check = this.canEdit(user, employee);

    if (!check.allowed) {
      throw new Error(check.reason || "Không có quyền chỉnh sửa nhân viên");
    }
  },

  /**
   * Validate delete operation (for backend service layer)
   * Throws error if delete is not allowed
   *
   * @throws Error with user-friendly message
   */
  validateDelete(user: PermissionUser | null | undefined): void {
    const check = this.canDelete(user);

    if (!check.allowed) {
      throw new Error(check.reason || "Không có quyền xóa nhân viên");
    }
  },

  /**
   * Validate status change operation (for backend service layer)
   * Throws error if status change is not allowed
   *
   * @throws Error with user-friendly message
   */
  validateChangeStatus(user: PermissionUser | null | undefined): void {
    const check = this.canChangeStatus(user);

    if (!check.allowed) {
      throw new Error(check.reason || "Không có quyền thay đổi trạng thái");
    }
  },

  /**
   * Validate resend invite operation (for backend service layer)
   * Throws error if resend invite is not allowed
   *
   * @throws Error with user-friendly message
   */
  validateResendInvite(user: PermissionUser | null | undefined): void {
    const check = this.canResendInvite(user);

    if (!check.allowed) {
      throw new Error(check.reason || "Không có quyền gửi lại lời mời");
    }
  },
};
