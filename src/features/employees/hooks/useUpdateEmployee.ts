"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { updateEmployeeApi } from "../api/updateEmployee";
import { type UpdateEmployeeRequest } from "@/shared/validation/employee.schema";
import { EMPLOYEE_MESSAGES, EMPLOYEE_QUERY_KEYS } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

export function useUpdateEmployee() {
  const notify = useNotify();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateEmployeeRequest) => updateEmployeeApi(payload),
    onSuccess: (_data, variables) => {
      notify.success(EMPLOYEE_MESSAGES.UPDATE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["employees"] });
      qc.invalidateQueries({
        queryKey: EMPLOYEE_QUERY_KEYS.byId(variables.id),
      });
    },
    onError: (error: unknown) => {
      notify.error(error, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR });
    },
  });
}
