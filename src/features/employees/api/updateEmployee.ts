import { EMPLOYEE_ENDPOINTS } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import {
  UpdateEmployeeRequest,
  EmployeeResponseSchema,
} from "@/shared/validation/employee.schema";

export async function updateEmployeeApi(payload: UpdateEmployeeRequest) {
  const res = await fetch(EMPLOYEE_ENDPOINTS.BY_ID(payload.id), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify(payload),
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);
  }

  const parsed = EmployeeResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Phản hồi cập nhật nhân viên không hợp lệ.");
  }

  return parsed.data;
}
