import { EMPLOYEE_ENDPOINTS } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import { WorkingEmployeeResponseSchema } from "@/shared/validation/employee.schema";

export async function getWorkingEmployeesApi() {
  const res = await fetch(EMPLOYEE_ENDPOINTS.WORKING, { cache: "no-store" });
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);
  }

  const parsed = WorkingEmployeeResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Danh sách nhân viên đang làm việc không hợp lệ.");
  }

  return parsed.data;
}
