// src/server/services/profile/_mappers.ts
import type { Employee } from "@prisma/client";
import type { ProfileResponse } from "@/shared/validation/profile.schema";

type EmployeeWithClinic = Employee & {
  clinic: {
    id: string;
    clinicCode: string;
    name: string;
    shortName: string | null;
    colorCode: string | null;
  } | null;
};

/**
 * Map Employee to Profile Response
 * Includes all fields including sensitive banking/legal info
 * (Only for self-profile view, not for admin viewing others)
 */
export function mapEmployeeToProfileResponse(
  employee: EmployeeWithClinic
): ProfileResponse {
  return {
    // Account info (read-only)
    id: employee.id,
    uid: employee.uid ?? "",
    email: employee.email,
    role: employee.role,

    // Basic info (editable)
    fullName: employee.fullName,
    dob: employee.dob?.toISOString() ?? null,
    gender: employee.gender,
    avatarUrl: employee.avatarUrl,
    favoriteColor: employee.favoriteColor,

    // Contact info (editable)
    phone: employee.phone,
    currentAddress: employee.currentAddress,
    hometown: employee.hometown,

    // Legal info (editable - sensitive, only for self)
    nationalId: employee.nationalId,
    nationalIdIssueDate: employee.nationalIdIssueDate?.toISOString() ?? null,
    nationalIdIssuePlace: employee.nationalIdIssuePlace,
    taxId: employee.taxId,
    insuranceNumber: employee.insuranceNumber,

    // Banking info (editable - sensitive, only for self)
    bankAccountNumber: employee.bankAccountNumber,
    bankName: employee.bankName,

    // Work info (read-only)
    employeeCode: employee.employeeCode,
    employeeStatus: employee.employeeStatus,
    clinicId: employee.clinicId,
    clinic: employee.clinic
      ? {
          id: employee.clinic.id,
          clinicCode: employee.clinic.clinicCode,
          name: employee.clinic.name,
          shortName: employee.clinic.shortName || "",
          colorCode: employee.clinic.colorCode,
        }
      : null,
    department: employee.department,
    team: employee.team,
    jobTitle: employee.jobTitle,
    positionTitle: employee.positionTitle,

    // Audit
    createdAt: employee.createdAt.toISOString(),
    updatedAt: employee.updatedAt.toISOString(),
  };
}
