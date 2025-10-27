// src/features/employees/hooks/useEmployeeById.ts
"use client";
import { useQuery } from "@tanstack/react-query";
import { getEmployeeByIdApi } from "../api";
import { EMPLOYEE_QUERY_KEYS } from "../constants";
import type { EmployeeResponse } from "@/shared/validation/employee.schema";

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
