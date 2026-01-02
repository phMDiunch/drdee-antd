// src/features/employees/hooks/queries.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getEmployeesApi,
  getEmployeeByIdApi,
  getWorkingEmployeesApi,
  getEmployeeByIdForProfileCompletionApi,
  type GetEmployeesParams,
} from "../api";
import { EMPLOYEE_QUERY_KEYS } from "../constants";
import type {
  EmployeeResponse,
  WorkingEmployeeResponse,
} from "@/shared/validation/employee.schema";

/**
 * Fetch list of employees
 * Master data - shorter cache time (1 minute)
 */
export function useEmployees(filters: GetEmployeesParams) {
  const { search } = filters;

  return useQuery<EmployeeResponse[], Error>({
    queryKey: EMPLOYEE_QUERY_KEYS.list(search),
    queryFn: () => getEmployeesApi({ search }),
    staleTime: 60_000,
  });
}

/**
 * Fetch single employee by ID
 * Cache: 1 minute
 */
export function useEmployeeById(id?: string) {
  return useQuery<EmployeeResponse, Error>({
    queryKey: id ? EMPLOYEE_QUERY_KEYS.byId(id) : ["employee", "unknown"],
    queryFn: () => {
      if (!id) throw new Error("Missing employee id");
      return getEmployeeByIdApi(id);
    },
    enabled: !!id,
    staleTime: 60_000,
  });
}

/**
 * Fetch working employees (for dropdowns/selects)
 * Cache: 8 hours - employees rarely change during work shift
 */
export function useWorkingEmployees() {
  return useQuery<WorkingEmployeeResponse, Error>({
    queryKey: EMPLOYEE_QUERY_KEYS.working(),
    queryFn: () => getWorkingEmployeesApi(),
    staleTime: 8 * 60 * 60 * 1000, // 8 giờ - Nhân viên ít thay đổi trong ca làm
    gcTime: 24 * 60 * 60 * 1000, // 24 giờ - Giữ trong memory cả ngày
  });
}

/**
 * Fetch employee for profile completion (public route)
 * Cache: 1 minute
 */
export function useEmployeeForProfileCompletion(id?: string) {
  return useQuery<EmployeeResponse, Error>({
    queryKey: id
      ? [...EMPLOYEE_QUERY_KEYS.byId(id), "profile-completion"]
      : ["employee", "unknown", "profile-completion"],
    queryFn: () => {
      if (!id) throw new Error("Missing employee id");
      return getEmployeeByIdForProfileCompletionApi(id);
    },
    enabled: !!id,
    staleTime: 60_000,
  });
}
