// src/features/employees/hooks/useWorkingEmployees.ts
"use client";
import { useQuery } from "@tanstack/react-query";
import { getWorkingEmployeesApi } from "../api/getWorkingEmployees";
import { EMPLOYEE_QUERY_KEYS } from "../constants";
import type { WorkingEmployeeResponse } from "@/shared/validation/employee.schema";

export function useWorkingEmployees() {
  return useQuery<WorkingEmployeeResponse, Error>({
    queryKey: EMPLOYEE_QUERY_KEYS.working(),
    queryFn: () => getWorkingEmployeesApi(),
    staleTime: 30 * 60_000,
  });
}
