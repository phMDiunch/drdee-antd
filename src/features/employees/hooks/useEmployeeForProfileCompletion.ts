// src/features/employees/hooks/useEmployeeForProfileCompletion.ts
"use client";
import { useQuery } from "@tanstack/react-query";
import { getEmployeeByIdForProfileCompletionApi } from "../api/getEmployeeByIdForProfileCompletion";
import { EMPLOYEE_QUERY_KEYS } from "../constants";
import type { EmployeeResponse } from "@/shared/validation/employee.schema";

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
