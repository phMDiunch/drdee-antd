// src/features/employees/hooks/useEmployees.ts

import { useQuery } from "@tanstack/react-query";
import { getEmployeesApi, type GetEmployeesParams } from "../api";
import { EMPLOYEE_QUERY_KEYS } from "../constants";
import type { EmployeeResponse } from "@/shared/validation/employee.schema";

export function useEmployees(filters: GetEmployeesParams) {
  const { search } = filters;

  return useQuery<EmployeeResponse[], Error>({
    queryKey: EMPLOYEE_QUERY_KEYS.list(search),
    queryFn: () => getEmployeesApi({ search }),
    staleTime: 60_000,
  });
}
