// src/shared/permissions/consulted-service.permissions.ts

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
 *   import { consultedServicePermissions } from '@/shared/permissions/consulted-service.permissions'
 *   const permission = consultedServicePermissions.canEdit(currentUser, service)
 *   <Button disabled={!permission.allowed} title={permission.reason}>Edit</Button>
 *
 * Backend:
 *   import { consultedServicePermissions } from '@/shared/permissions/consulted-service.permissions'
 *   consultedServicePermissions.validateUpdateFields(user, existing, updates)
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
  editableFields?: string[];
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
 * Consulted Service data needed for permission checks
 */
export type ConsultedServiceForPermission = {
  serviceStatus: string;
  serviceConfirmDate?: Date | string | null;
  clinicId?: string | null;
  customerClinicId?: string | null; // Customer's current clinic (for permission check after customer transfer)
};

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Edit permission days (33 days from serviceConfirmDate)
 */
const EDIT_PERMISSION_DAYS = 33;

/**
 * Fields that Employee can edit for "Đã chốt" services within 33 days
 */
const EMPLOYEE_EDITABLE_FIELDS_CONFIRMED = [
  "consultingDoctorId",
  "consultingSaleId",
  "treatingDoctorId",
];

/**
 * Fields that Employee can edit for "Chưa chốt" services (all fields)
 */
const EMPLOYEE_EDITABLE_FIELDS_UNCONFIRMED = [
  "dentalServiceId",
  "quantity",
  "preferentialPrice",
  "toothPositions",
  "consultingDoctorId",
  "consultingSaleId",
  "treatingDoctorId",
  "specificStatus",
];

/**
 * Admin fields (only admins can edit)
 */
const ADMIN_ONLY_FIELDS = [
  "serviceStatus",
  "treatmentStatus",
  "serviceConfirmDate",
  "consultationDate",
];

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
 * Calculate days since confirmation
 */
function getDaysSinceConfirmation(
  serviceConfirmDate: Date | string | null | undefined
): number | null {
  if (!serviceConfirmDate) return null;

  const confirmDate = new Date(serviceConfirmDate);
  const today = new Date();
  confirmDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffMs = today.getTime() - confirmDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Check if user can access service
 * Priority: Check customer's current clinic (customerClinicId) if available,
 * fallback to service's clinic (clinicId) for backward compatibility
 */
function canAccessClinic(
  user: PermissionUser | null | undefined,
  service: ConsultedServiceForPermission
): boolean {
  if (!user) return false;
  if (isAdmin(user)) return true; // Admin can access all

  // Check customer's current clinic (supports customer transfer between clinics)
  const targetClinicId = service.customerClinicId ?? service.clinicId;
  return user.clinicId === targetClinicId;
}

/**
 * ============================================================================
 * PUBLIC API
 * ============================================================================
 */

export const consultedServicePermissions = {
  /**
   * Check if user can edit consulted service
   *
   * Rules:
   * - Admin: Full access (all fields, all statuses, any timeline)
   * - Employee:
   *   - "Chưa chốt": Edit all fields
   *   - "Đã chốt" <33d: Edit only personnel fields (consultingDoctorId, consultingSaleId, treatingDoctorId)
   *   - "Đã chốt" >33d: Cannot edit
   */
  canEdit(
    user: PermissionUser | null | undefined,
    service: ConsultedServiceForPermission
  ): PermissionResult {
    // Must be authenticated
    if (!user || !user.employeeId) {
      return {
        allowed: false,
        reason: "Bạn chưa đăng nhập",
      };
    }

    // Must be same clinic
    if (!canAccessClinic(user, service)) {
      return {
        allowed: false,
        reason: "Không có quyền chỉnh sửa dịch vụ của chi nhánh khác",
      };
    }

    // ADMIN: Full access
    if (isAdmin(user)) {
      return {
        allowed: true,
        editableFields: [
          ...EMPLOYEE_EDITABLE_FIELDS_UNCONFIRMED,
          ...ADMIN_ONLY_FIELDS,
        ],
      };
    }

    // EMPLOYEE: Check status & timeline
    const { serviceStatus, serviceConfirmDate } = service;

    if (serviceStatus === "Chưa chốt") {
      // Employee can edit all fields for unconfirmed services
      return {
        allowed: true,
        editableFields: EMPLOYEE_EDITABLE_FIELDS_UNCONFIRMED,
      };
    }

    if (serviceStatus === "Đã chốt") {
      const daysSince = getDaysSinceConfirmation(serviceConfirmDate);

      if (daysSince === null) {
        // No confirm date but status is "Đã chốt" (data inconsistency)
        // Allow edit for safety
        return {
          allowed: true,
          editableFields: EMPLOYEE_EDITABLE_FIELDS_CONFIRMED,
        };
      }

      if (daysSince < EDIT_PERMISSION_DAYS) {
        // Within 33 days: Can edit personnel fields only
        return {
          allowed: true,
          editableFields: EMPLOYEE_EDITABLE_FIELDS_CONFIRMED,
          reason: `Dịch vụ đã chốt - chỉ sửa nhân sự trong ${EDIT_PERMISSION_DAYS} ngày`,
        };
      } else {
        // After 33 days: Cannot edit
        return {
          allowed: false,
          reason: "Không thể chỉnh sửa dịch vụ đã chốt quá 33 ngày",
        };
      }
    }

    // Unknown status
    return {
      allowed: false,
      reason: "Trạng thái dịch vụ không hợp lệ",
    };
  },

  /**
   * Check if user can delete consulted service
   *
   * Rules:
   * - Admin: Can delete all
   * - Employee: Can only delete "Chưa chốt" services
   */
  canDelete(
    user: PermissionUser | null | undefined,
    service: ConsultedServiceForPermission
  ): PermissionResult {
    // Must be authenticated
    if (!user || !user.employeeId) {
      return {
        allowed: false,
        reason: "Bạn chưa đăng nhập",
      };
    }

    // Must be same clinic (based on customer's current clinic)
    if (!canAccessClinic(user, service)) {
      return {
        allowed: false,
        reason:
          "Không có quyền xóa dịch vụ của khách hàng thuộc chi nhánh khác",
      };
    }

    // ADMIN: Can delete all
    if (isAdmin(user)) {
      return { allowed: true };
    }

    // EMPLOYEE: Can only delete "Chưa chốt"
    if (service.serviceStatus === "Chưa chốt") {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: "Không thể xóa dịch vụ đã chốt",
    };
  },

  /**
   * Validate update fields (throw error if invalid)
   * Used in backend service layer
   *
   * @throws Error if user tries to update restricted fields
   */
  validateUpdateFields(
    user: PermissionUser | null | undefined,
    service: ConsultedServiceForPermission,
    updates: Record<string, unknown>
  ): void {
    const permission = this.canEdit(user, service);

    if (!permission.allowed) {
      throw new Error(permission.reason || "Không có quyền chỉnh sửa");
    }

    // Admin: No field restrictions
    if (isAdmin(user)) {
      return;
    }

    // Employee: Check field restrictions
    const editableFields = permission.editableFields || [];
    const updatedFields = Object.keys(updates);

    // Check if trying to update admin-only fields
    const adminFieldsInUpdate = updatedFields.filter((field) =>
      ADMIN_ONLY_FIELDS.includes(field)
    );
    if (adminFieldsInUpdate.length > 0) {
      throw new Error(
        `Chỉ admin mới có thể cập nhật: ${adminFieldsInUpdate.join(", ")}`
      );
    }

    // Check if trying to update non-editable fields
    const restrictedFields = updatedFields.filter(
      (field) =>
        !editableFields.includes(field) && !ADMIN_ONLY_FIELDS.includes(field)
    );

    if (restrictedFields.length > 0) {
      if (service.serviceStatus === "Đã chốt") {
        throw new Error(
          `Dịch vụ đã chốt - chỉ có thể sửa: ${EMPLOYEE_EDITABLE_FIELDS_CONFIRMED.join(
            ", "
          )}`
        );
      } else {
        throw new Error(
          `Không có quyền cập nhật: ${restrictedFields.join(", ")}`
        );
      }
    }
  },

  /**
   * Check if user can confirm service
   *
   * Rules:
   * - Both Employee and Admin can confirm "Chưa chốt" services
   */
  canConfirm(
    user: PermissionUser | null | undefined,
    service: ConsultedServiceForPermission
  ): PermissionResult {
    // Must be authenticated
    if (!user || !user.employeeId) {
      return {
        allowed: false,
        reason: "Bạn chưa đăng nhập",
      };
    }

    // Must be same clinic (based on customer's current clinic)
    if (!canAccessClinic(user, service)) {
      return {
        allowed: false,
        reason:
          "Không có quyền chốt dịch vụ của khách hàng thuộc chi nhánh khác",
      };
    }

    // Can only confirm "Chưa chốt" services
    if (service.serviceStatus !== "Chưa chốt") {
      return {
        allowed: false,
        reason: "Dịch vụ đã được chốt trước đó",
      };
    }

    return { allowed: true };
  },

  /**
   * Get editable fields for a user and service
   * Used in frontend to conditionally enable/disable form fields
   */
  getEditableFields(
    user: PermissionUser | null | undefined,
    service: ConsultedServiceForPermission
  ): string[] {
    const permission = this.canEdit(user, service);
    return permission.editableFields || [];
  },

  /**
   * Check if specific field is editable
   * Convenience method for form field disabling
   */
  isFieldEditable(
    user: PermissionUser | null | undefined,
    service: ConsultedServiceForPermission,
    fieldName: string
  ): boolean {
    const editableFields = this.getEditableFields(user, service);
    return editableFields.includes(fieldName);
  },
};
