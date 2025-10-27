"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { createEmployeeApi } from "../api";
import { type CreateEmployeeRequest } from "@/shared/validation/employee.schema";
import { EMPLOYEE_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

export function useCreateEmployee() {
  const notify = useNotify();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateEmployeeRequest) => createEmployeeApi(payload),
    onSuccess: () => {
      notify.success(EMPLOYEE_MESSAGES.CREATE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (error: unknown) => {
      notify.error(error, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR });
    },
  });
}
