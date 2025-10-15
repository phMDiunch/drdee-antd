import { employeeRepo } from "@/server/repos/employee.repo";
import { ERR, ServiceError } from "@/server/services/errors";
import {
  CompleteProfileRequestSchema,
  CreateEmployeeRequestSchema,
} from "@/shared/validation/employee.schema";
import type { UserCore } from "@/shared/types/user";
import { mapEmployeeToResponse } from "./_mappers";
import { requireAdmin } from "@/server/services/auth.service";
import { getSupabaseAdminClient } from "@/services/supabase/admin";
import { Prisma } from "@prisma/client";

function buildInviteRedirectUrl(employeeId: string) {
  const baseUrl =
    process.env.SUPABASE_INVITE_REDIRECT_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    url = new URL("http://localhost:3000");
  }

  if (!url.pathname || url.pathname === "/") {
    url.pathname = "/complete-profile";
  }

  if (!url.pathname.endsWith("/complete-profile")) {
    url.pathname = "/complete-profile";
  }

  url.searchParams.set("employeeId", employeeId);
  return url.toString();
}

async function inviteEmployeeToSupabase(args: {
  email: string;
  employeeId: string;
  role: string;
}) {
  let client;
  try {
    client = getSupabaseAdminClient();
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    throw new ServiceError(
      "SUPABASE_ADMIN_NOT_CONFIGURED",
      `Supabase admin client is not configured: ${errorMessage}`,
      500
    );
  }
  const redirectTo = buildInviteRedirectUrl(args.employeeId);

  const { data, error } = await client.auth.admin.inviteUserByEmail(
    args.email,
    {
      redirectTo,
      data: {
        employeeId: args.employeeId,
        role: args.role,
      },
    }
  );

  if (error) {
    const message = error.message || "Unable to send Supabase invitation.";
    if (
      typeof error.message === "string" &&
      error.message.toLowerCase().includes("already registered")
    ) {
      throw ERR.CONFLICT("Email already has an active Supabase account.");
    }

    throw new ServiceError("SUPABASE_INVITE_FAILED", message, 500);
  }

  return data?.user?.id ?? null;
}

/**
 * POST /employees
 */
export async function createEmployee(
  currentUser: UserCore | null,
  body: unknown
) {
  // TODO: allow back office role once role helpers are updated
  requireAdmin(currentUser);

  const parsed = CreateEmployeeRequestSchema.safeParse(body);
  if (!parsed.success) {
    throw ERR.INVALID(
      parsed.error.issues[0]?.message ?? "Payload is not valid."
    );
  }

  const { clinicId, ...restData } = parsed.data;

  const employeeStatus = "PENDING"; // Force PENDING on creation

  if (restData.email) {
    const existing = await employeeRepo.findByEmail(restData.email);
    if (existing) throw ERR.CONFLICT("Email already exists.");
  }
  if (restData.phone) {
    const existing = await employeeRepo.findByPhone(restData.phone);
    if (existing) throw ERR.CONFLICT("Phone already exists.");
  }
  if (restData.employeeCode) {
    const existing = await employeeRepo.findByEmployeeCode(
      restData.employeeCode
    );
    if (existing) throw ERR.CONFLICT("Employee code already exists.");
  }

  let newEmployee = await employeeRepo.create({
    ...restData,
    employeeStatus,
    clinic: { connect: { id: clinicId } },
    createdBy: { connect: { id: currentUser!.employeeId! } },
  });

  try {
    if (restData.email) {
      const uid = await inviteEmployeeToSupabase({
        email: restData.email,
        employeeId: newEmployee.id,
        role: restData.role,
      });

      if (uid && !newEmployee.uid) {
        await employeeRepo.update(newEmployee.id, {
          uid,
          updatedBy: currentUser?.employeeId
            ? { connect: { id: currentUser.employeeId } }
            : undefined,
        });
        newEmployee = (await employeeRepo.findById(newEmployee.id)) ?? {
          ...newEmployee,
          uid,
        };
      }
    }

    return mapEmployeeToResponse(newEmployee);
  } catch (err) {
    await employeeRepo.delete(newEmployee.id).catch(() => undefined);
    throw err;
  }
}

/**
 * Public version of completeEmployeeProfile for profile completion without authentication
 * PUT /public/employees/:id/complete-profile
 */
export async function completeEmployeeProfilePublic(body: unknown) {
  const parsed = CompleteProfileRequestSchema.safeParse(body);
  if (!parsed.success) {
    throw ERR.INVALID(
      parsed.error.issues[0]?.message ?? "Payload is not valid."
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, password, confirmPassword, ...profile } = parsed.data;
  // confirmPassword is validated by schema but not used in backend logic

  const employee = await employeeRepo.findById(id);
  if (!employee) throw ERR.NOT_FOUND("Employee not found.");

  // Only allow profile completion if employee status is PENDING
  if (employee.employeeStatus && employee.employeeStatus !== "PENDING") {
    throw ERR.CONFLICT("Employee profile has already been completed.");
  }

  if (profile.nationalId) {
    const existed = await employeeRepo.findByNationalId(profile.nationalId);
    if (existed && existed.id !== id) {
      throw ERR.CONFLICT("National ID already exists.");
    }
  }
  if (profile.taxId) {
    const existed = await employeeRepo.findByTaxId(profile.taxId);
    if (existed && existed.id !== id) {
      throw ERR.CONFLICT("Tax ID already exists.");
    }
  }
  if (profile.insuranceNumber) {
    const existed = await employeeRepo.findByInsuranceNumber(
      profile.insuranceNumber
    );
    if (existed && existed.id !== id) {
      throw ERR.CONFLICT("Insurance number already exists.");
    }
  }

  // Handle password setting via Supabase
  if (!employee.uid) {
    throw new ServiceError(
      "SUPABASE_UID_MISSING",
      "Employee is not associated with a Supabase user.",
      400
    );
  }

  try {
    const client = getSupabaseAdminClient();
    await client.auth.admin.updateUserById(employee.uid, {
      password: password,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    throw new ServiceError(
      "SUPABASE_PASSWORD_UPDATE_FAILED",
      `Failed to set user password: ${errorMessage}`,
      500
    );
  }

  const payload: Prisma.EmployeeUpdateInput = {
    fullName: profile.fullName,
    dob: profile.dob,
    gender: profile.gender,
    favoriteColor: profile.favoriteColor,
    currentAddress: profile.currentAddress,
    hometown: profile.hometown,
    nationalId: profile.nationalId,
    nationalIdIssueDate: profile.nationalIdIssueDate,
    nationalIdIssuePlace: profile.nationalIdIssuePlace,
    taxId: profile.taxId,
    insuranceNumber: profile.insuranceNumber,
    bankAccountNumber: profile.bankAccountNumber,
    bankName: profile.bankName,
    employeeStatus: "WORKING",
    // Note: No updatedBy since this is public access
  };

  // Ensure Supabase user is enabled for working employees
  try {
    const client = getSupabaseAdminClient();
    if (employee.uid) {
      // Get current user metadata safely
      const existingMetadata =
        (employee as Record<string, unknown>).user_metadata || {};

      await client.auth.admin.updateUserById(employee.uid, {
        user_metadata: {
          ...(typeof existingMetadata === "object" && existingMetadata !== null
            ? existingMetadata
            : {}),
          disabled: false,
        },
        ban_duration: "none",
      });
    }
  } catch (error: unknown) {
    // Best-effort enable; do not block profile completion if this fails
    console.warn(
      "Failed to enable Supabase user:",
      error instanceof Error ? error.message : "Unknown error"
    );
  }

  const updated = await employeeRepo.update(id, payload);
  return mapEmployeeToResponse(updated);
}

/**
 * POST /employees/:id/resend-invite
 */
export async function resendEmployeeInvite(
  currentUser: UserCore | null,
  id: string
) {
  requireAdmin(currentUser);

  const employee = await employeeRepo.findById(id);
  if (!employee) throw ERR.NOT_FOUND("Employee not found.");
  if (!employee.email) {
    throw ERR.INVALID("Employee does not have an email to send invitation.");
  }

  const uid = await inviteEmployeeToSupabase({
    email: employee.email,
    employeeId: employee.id,
    role: employee.role,
  });

  let snapshot = employee;
  if (uid && employee.uid !== uid) {
    await employeeRepo.update(employee.id, {
      uid,
      updatedBy: currentUser?.employeeId
        ? { connect: { id: currentUser.employeeId } }
        : undefined,
    });
    snapshot = (await employeeRepo.findById(employee.id)) ?? {
      ...employee,
      uid,
    };
  }

  return mapEmployeeToResponse(snapshot);
}
