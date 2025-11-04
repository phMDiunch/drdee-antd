"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { deleteEmployeeAction } from "@/server/actions/employee.actions";
import { EMPLOYEE_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

export function useDeleteEmployee() {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (id: string) => deleteEmployeeAction(id),
    onSuccess: () => {
      notify.success(EMPLOYEE_MESSAGES.DELETE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
