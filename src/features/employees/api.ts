// src/features/employees/api.ts
/**
 * Employee API Client
 * Consolidated API functions for employee operations
 */

import {
  EmployeesResponseSchema,
  EmployeeResponseSchema,
  WorkingEmployeeResponseSchema,
  CompleteProfileRequestSchema,
} from "@/shared/validation/employee.schema";
import type { CompleteProfileRequest } from "@/shared/validation/employee.schema";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import { EMPLOYEE_ENDPOINTS } from "./constants";

export type GetEmployeesParams = { search?: string };

/**
 * Get working employees list (simplified data for dropdowns)
 * GET /api/v1/employees/working
 * @returns Array of working employees with basic info
 */
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

/**
 * Get employees list
 * GET /api/v1/employees
 * @param params - Query parameters (search)
 * @returns Array of employees
 */
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

/**
 * Get employee detail by ID
 * GET /api/v1/employees/[id]
 * @param id - Employee ID
 * @returns Full employee detail
 */
export async function getEmployeeByIdApi(id: string) {
  const res = await fetch(EMPLOYEE_ENDPOINTS.BY_ID(id), {
    cache: "no-store",
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);
  }

  const parsed = EmployeeResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Thông tin nhân viên không hợp lệ.");
  }

  return parsed.data;
}

/**
 * Get employee detail by ID for profile completion (public endpoint)
 * GET /api/public/employees/[id]
 * @param id - Employee ID
 * @returns Employee detail for profile completion
 */
export async function getEmployeeByIdForProfileCompletionApi(id: string) {
  const res = await fetch(EMPLOYEE_ENDPOINTS.PUBLIC_BY_ID(id), {
    cache: "no-store",
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);
  }

  const parsed = EmployeeResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Thông tin nhân viên không hợp lệ.");
  }

  return parsed.data;
}

/**
 * Complete employee profile (public endpoint)
 * PUT /api/public/employees/[id]/complete-profile
 * @param payload - Profile completion data
 * @returns Updated employee data
 */
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
