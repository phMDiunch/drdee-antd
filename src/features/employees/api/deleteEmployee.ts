import { EmployeeResponseSchema } from "@/shared/validation/employee.schema";
import { EMPLOYEE_ENDPOINTS } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

export async function deleteEmployeeApi(id: string) {
  const res = await fetch(EMPLOYEE_ENDPOINTS.BY_ID(id), {
    method: "DELETE",
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);

  const parsed = EmployeeResponseSchema.safeParse(json);
  if (!parsed.success) throw new Error("Phản hồi xoá nhân viên không hợp lệ.");
  return parsed.data;
}
