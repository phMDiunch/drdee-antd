import { EMPLOYEE_ENDPOINTS } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import {
  CreateEmployeeRequest,
  EmployeeResponseSchema,
} from "@/shared/validation/employee.schema";

export async function createEmployeeApi(payload: CreateEmployeeRequest) {
  const res = await fetch(EMPLOYEE_ENDPOINTS.ROOT, {
    method: "POST",
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
    throw new Error("Phản hồi tạo nhân viên không hợp lệ.");
  }

  return parsed.data;
}
