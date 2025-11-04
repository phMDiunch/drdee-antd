"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { setEmployeeStatusAction } from "@/server/actions/employee.actions";
import { EMPLOYEE_MESSAGES, EMPLOYEE_QUERY_KEYS } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

export function useSetEmployeeStatus() {
  const notify = useNotify();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "WORKING" | "RESIGNED";
    }) => setEmployeeStatusAction(id, status),
    onSuccess: (_data, variables) => {
      notify.success(EMPLOYEE_MESSAGES.SET_STATUS_SUCCESS);
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
