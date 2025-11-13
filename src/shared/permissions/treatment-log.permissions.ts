// src/shared/permissions/treatment-log.permissions.ts

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
 *   import { treatmentLogPermissions } from '@/shared/permissions/treatment-log.permissions'
 *   const canEdit = treatmentLogPermissions.canEdit(currentUser, log)
 *   <Button disabled={!canEdit.allowed} title={canEdit.reason}>Edit</Button>
 *
 * Backend:
 *   import { treatmentLogPermissions } from '@/shared/permissions/treatment-log.permissions'
 *   const check = treatmentLogPermissions.canEdit(user, log)
 *   if (!check.allowed) throw new ServiceError("PERMISSION_DENIED", check.reason, 403)
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
 * Treatment log data needed for permission checks
 */
export type TreatmentLogForPermission = {
  id: string;
  createdById: string;
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

/**
 * Check if user is the creator of the treatment log
 */
function isCreator(
  user: PermissionUser | null | undefined,
  log: TreatmentLogForPermission
): boolean {
  if (!user?.employeeId) return false;
  return log.createdById === user.employeeId;
}

// ============================================================================
// PUBLIC API
// ============================================================================

export const treatmentLogPermissions = {
  /**
   * Can user edit this treatment log?
   *
   * Rules:
   * - Admin: ✅ Can edit all
   * - Employee: ✅ Can only edit own records (created by self)
   * - Employee: ❌ Cannot edit others' records
   */
  canEdit(
    user: PermissionUser | null | undefined,
    log: TreatmentLogForPermission
  ): PermissionResult {
    // Admin has full access
    if (isAdmin(user)) {
      return { allowed: true };
    }

    // Employee can only edit own records
    if (isCreator(user, log)) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: "Bạn chỉ có thể chỉnh sửa lịch sử điều trị do chính mình tạo",
    };
  },

  /**
   * Can user delete this treatment log?
   *
   * Rules:
   * - Admin: ✅ Can delete all
   * - Employee: ✅ Can only delete own records (created by self)
   * - Employee: ❌ Cannot delete others' records
   */
  canDelete(
    user: PermissionUser | null | undefined,
    log: TreatmentLogForPermission
  ): PermissionResult {
    // Admin has full access
    if (isAdmin(user)) {
      return { allowed: true };
    }

    // Employee can only delete own records
    if (isCreator(user, log)) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: "Bạn chỉ có thể xóa lịch sử điều trị do chính mình tạo",
    };
  },

  /**
   * Can user create treatment log?
   *
   * Rules:
   * - Admin: ✅ Can create
   * - Employee: ✅ Can create
   * - Guest: ❌ Cannot create (must be authenticated)
   */
  canCreate(user: PermissionUser | null | undefined): PermissionResult {
    if (!user?.employeeId) {
      return {
        allowed: false,
        reason: "Bạn phải đăng nhập để tạo lịch sử điều trị",
      };
    }

    return { allowed: true };
  },
};
