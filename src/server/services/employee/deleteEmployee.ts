import { employeeRepo } from "@/server/repos/employee.repo";
import { ERR, ServiceError } from "@/server/services/errors";
import type { UserCore } from "@/shared/types/user";
import { mapEmployeeToResponse } from "./_mappers";
import { getSupabaseAdminClient } from "@/services/supabase/admin";
import { employeePermissions } from "@/shared/permissions/employee.permissions";

/**
 * DELETE /employees/:id
 */
export async function removeEmployee(currentUser: UserCore | null, id: string) {
  // ✅ Validate delete permission
  try {
    employeePermissions.validateDelete(currentUser);
  } catch (error) {
    throw new ServiceError(
      "PERMISSION_DENIED",
      error instanceof Error ? error.message : "Không có quyền xóa nhân viên",
      403
    );
  }

  const existing = await employeeRepo.findById(id);
  if (!existing) throw ERR.NOT_FOUND("Employee not found.");

  const linked = await employeeRepo.countLinked(id);
  if (linked.total > 0) {
    throw new ServiceError(
      "HAS_LINKED_DATA",
      "Employee has linked data, please switch status to 'RESIGNED'.",
      409
    );
  }

  // Remove Supabase Auth user if linked
  if (existing.uid) {
    const admin = getSupabaseAdminClient();
    const { error: delErr } = await admin.auth.admin.deleteUser(existing.uid);
    if (delErr) {
      throw new ServiceError(
        "SUPABASE_DELETE_FAILED",
        `Failed to delete auth user: ${delErr.message}`,
        502
      );
    }
  }

  const deleted = await employeeRepo.delete(id);
  return mapEmployeeToResponse(deleted);
}
