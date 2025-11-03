import { EmployeeResponseSchema } from "@/shared/validation/employee.schema";
import { ERR } from "@/server/services/errors";
import type { Employee, Clinic } from "@prisma/client";

// Employee với all relations từ Prisma
type EmployeeWithRelations = Employee & {
  clinic?: Clinic | null;
  createdBy?: Employee | null;
  updatedBy?: Employee | null;
};

// Chuyển hàm mapEmployeeToResponse sang đây
export function mapEmployeeToResponse(row: EmployeeWithRelations) {
  const sanitized = {
    ...row,
    department: row.department,
    jobTitle: row.jobTitle,
    team: row.team,
    positionTitle: row.positionTitle,
    employeeStatus: row.employeeStatus ?? "PENDING",
    dob: row.dob ? row.dob.toISOString() : null,
    nationalIdIssueDate: row.nationalIdIssueDate
      ? row.nationalIdIssueDate.toISOString()
      : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    // Nested objects - giữ nguyên cấu trúc quan hệ, bao gồm id
    clinic: row.clinic
      ? {
          id: row.clinic.id,
          clinicCode: row.clinic.clinicCode,
          name: row.clinic.name,
          colorCode: row.clinic.colorCode,
        }
      : null,
    createdBy: row.createdBy
      ? {
          id: row.createdBy.id,
          fullName: row.createdBy.fullName,
        }
      : null,
    updatedBy: row.updatedBy
      ? {
          id: row.updatedBy.id,
          fullName: row.updatedBy.fullName,
        }
      : null,
  };
  const parsed = EmployeeResponseSchema.safeParse(sanitized);
  if (!parsed.success) {
    throw ERR.INVALID(
      "Dữ liệu nhân viên ở database trả về không hợp lệ. Kiểm tra database trong supabase"
    );
  }
  return parsed.data;
}
