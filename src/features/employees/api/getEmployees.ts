import { EMPLOYEE_ENDPOINTS } from "../constants";
import { EmployeesResponseSchema } from "@/shared/validation/employee.schema";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

export type GetEmployeesParams = { search?: string };

export async function getEmployeesApi(params?: GetEmployeesParams) {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);

  const qs = query.toString();
  const url = qs ? `${EMPLOYEE_ENDPOINTS.ROOT}?${qs}` : EMPLOYEE_ENDPOINTS.ROOT;

  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);
  }

  const parsed = EmployeesResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Danh sách nhân viên trả về không hợp lệ.");
  }

  return parsed.data;
}
