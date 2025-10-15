import { EMPLOYEE_ENDPOINTS } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import {
  CompleteProfileRequestSchema,
  EmployeeResponseSchema,
  type CompleteProfileRequest,
} from "@/shared/validation/employee.schema";

export async function completeProfilePublicApi(
  payload: CompleteProfileRequest
) {
  const body = CompleteProfileRequestSchema.parse(payload);

  const res = await fetch(EMPLOYEE_ENDPOINTS.PUBLIC_COMPLETE_PROFILE(body.id), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify(body),
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);
  }

  const parsed = EmployeeResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Phản hồi hoàn thiện hồ sơ không hợp lệ");
  }

  return parsed.data;
}
