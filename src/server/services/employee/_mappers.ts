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
export function mapEmployeeToResponse(employee: EmployeeWithRelations) {
  const sanitized = {
    ...employee,
    department: employee.department,
    jobTitle: employee.jobTitle,
    team: employee.team,
    positionTitle: employee.positionTitle,
    employeeStatus: employee.employeeStatus ?? "PENDING",
    clinicCode: employee.clinic?.clinicCode ?? null,
    clinicName: employee.clinic?.name ?? null,
    colorCode: employee.clinic?.colorCode ?? null,
    dob: employee.dob ? employee.dob.toISOString() : null,
    nationalIdIssueDate: employee.nationalIdIssueDate ? employee.nationalIdIssueDate.toISOString() : null,
    createdBy: employee.createdBy?.fullName ?? null,
    updatedBy: employee.updatedBy?.fullName ?? null,
    createdAt: employee.createdAt.toISOString(),
    updatedAt: employee.updatedAt.toISOString(),
  };
  const parsed = EmployeeResponseSchema.safeParse(sanitized);
  if (!parsed.success) {
    console.error("Failed to map employee response", parsed.error, sanitized);
    throw ERR.INVALID("Dữ liệu nhân viên ở database trả về không hợp lệ. Kiểm tra database trong supabase");
  }
  return parsed.data;
}
