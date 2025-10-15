import { EMPLOYEE_ENDPOINTS } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import { EmployeeResponseSchema } from "@/shared/validation/employee.schema";

export async function setEmployeeStatusApi(
  id: string,
  status: "WORKING" | "RESIGNED"
) {
  const res = await fetch(EMPLOYEE_ENDPOINTS.SET_STATUS(id), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ status }),
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);
  }

  const parsed = EmployeeResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Phản hồi cập nhật trạng thái nhân viên không hợp lệ.");
  }

  return parsed.data;
}
