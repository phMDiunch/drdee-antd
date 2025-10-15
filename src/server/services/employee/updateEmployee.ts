import { employeeRepo } from "@/server/repos/employee.repo";
import { ERR } from "@/server/services/errors";
import {
  SetEmployeeStatusRequestSchema,
  UpdateEmployeeRequestSchema,
} from "@/shared/validation/employee.schema";
import type { UserCore } from "@/shared/types/user";
import { mapEmployeeToResponse } from "./_mappers";
import { ensureSelfOrAdmin, isAdmin } from "./_guards";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "../auth.service";
import { getSupabaseAdminClient } from "@/services/supabase/admin";

/**
 * Cập nhật thông tin nhân viên
 * PUT /employees/:id
 */
export async function updateEmployee(
  currentUser: UserCore | null,
  id: string,
  body: unknown
) {
  if (!currentUser) throw ERR.UNAUTHORIZED();

  const parsed = UpdateEmployeeRequestSchema.safeParse({
    ...(body as object),
    id,
  });
  if (!parsed.success) {
    throw ERR.INVALID(
      parsed.error.issues[0]?.message ?? "Payload is not valid."
    );
  }

  const { clinicId, ...restData } = parsed.data;

  // TODO: enforce field-level permissions (admin/backOffice vs self)

  const existing = await employeeRepo.findById(id);
  if (!existing) throw ERR.NOT_FOUND("Employee not found.");

  ensureSelfOrAdmin(currentUser, existing.id);
  if (!isAdmin(currentUser) && currentUser?.employeeId === existing.id) {
    throw ERR.FORBIDDEN("Employees must use the complete profile flow.");
  }

  if (restData.email && restData.email !== existing.email) {
    if (await employeeRepo.findByEmail(restData.email)) {
      throw ERR.CONFLICT("Email already exists.");
    }
  }
  if (restData.phone && restData.phone !== existing.phone) {
    if (await employeeRepo.findByPhone(restData.phone)) {
      throw ERR.CONFLICT("Phone already exists.");
    }
  }
  if (
    restData.employeeCode &&
    restData.employeeCode !== existing.employeeCode
  ) {
    if (await employeeRepo.findByEmployeeCode(restData.employeeCode)) {
      throw ERR.CONFLICT("Employee code already exists.");
    }
  }

  const dataToUpdate: Prisma.EmployeeUpdateInput = {
    ...restData,
    updatedBy: currentUser.employeeId
      ? { connect: { id: currentUser.employeeId } }
      : undefined,
  };

  if (clinicId) {
    dataToUpdate.clinic = {
      connect: { id: clinicId },
    };
  }

  const updated = await employeeRepo.update(id, dataToUpdate);
  return mapEmployeeToResponse(updated);
}

/**
 * Cập nhật trạng thái nhân viên
 * POST /employees/:id/status (admin only)
 */
export async function setEmployeeStatus(
  currentUser: UserCore | null,
  id: string,
  body: unknown
) {
  requireAdmin(currentUser);

  const existing = await employeeRepo.findById(id);
  if (!existing) throw ERR.NOT_FOUND("Employee not found.");

  const parsed = SetEmployeeStatusRequestSchema.safeParse(body);
  if (!parsed.success) {
    throw ERR.INVALID("Status is not valid.");
  }
  const nextStatus = parsed.data.status;

  // Sync with Supabase Auth if user is linked
  if (existing.uid) {
    try {
      const admin = getSupabaseAdminClient();

      // Get current user metadata safely
      const existingMetadata =
        (existing as Record<string, unknown>).user_metadata || {};
      const safeMetadata =
        typeof existingMetadata === "object" && existingMetadata !== null
          ? existingMetadata
          : {};

      if (nextStatus === "RESIGNED") {
        const { error } = await admin.auth.admin.updateUserById(existing.uid, {
          user_metadata: {
            ...safeMetadata,
            disabled: true,
          },
          ban_duration: "876000h", // ~100 years in hours
        });
        if (error) {
          throw new Error(`Failed to disable user: ${error.message}`);
        }
      } else if (nextStatus === "WORKING") {
        const { error } = await admin.auth.admin.updateUserById(existing.uid, {
          user_metadata: {
            ...safeMetadata,
            disabled: false,
          },
          ban_duration: "none",
        });
        if (error) {
          throw new Error(`Failed to enable user: ${error.message}`);
        }
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown Supabase error occurred";
      throw ERR.INVALID(`Supabase sync failed: ${errorMessage}`);
    }
  }

  const updated = await employeeRepo.update(id, {
    employeeStatus: nextStatus,
    updatedBy: { connect: { id: currentUser!.employeeId! } },
  });

  return mapEmployeeToResponse(updated);
}
