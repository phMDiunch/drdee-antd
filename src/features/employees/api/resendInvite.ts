import { EMPLOYEE_ENDPOINTS } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import { EmployeeResponseSchema } from "@/shared/validation/employee.schema";

export async function resendEmployeeInviteApi(id: string) {
  const res = await fetch(EMPLOYEE_ENDPOINTS.INVITE(id), {
    method: "POST",
    cache: "no-store",
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);
  }

  const parsed = EmployeeResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Phản hồi resend invite không hợp lệ.");
  }

  return parsed.data;
}
