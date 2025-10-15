// src/features/employees/hooks/useCompleteProfilePublic.ts
"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import { completeProfilePublicApi } from "../api";
import { EMPLOYEE_MESSAGES, EMPLOYEE_QUERY_KEYS } from "../constants";
import type { CompleteProfileRequest } from "@/shared/validation/employee.schema";

export function useCompleteProfilePublic() {
  const { message } = App.useApp();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CompleteProfileRequest) =>
      completeProfilePublicApi(payload),
    onSuccess: (data) => {
      message.success(EMPLOYEE_MESSAGES.COMPLETE_PROFILE_SUCCESS);
      qc.invalidateQueries({
        queryKey: [...EMPLOYEE_QUERY_KEYS.byId(data.id), "profile-completion"],
      });
      qc.invalidateQueries({
        queryKey: EMPLOYEE_QUERY_KEYS.list(undefined),
      });
    },
    onError: (error: unknown) => {
      const msg =
        error instanceof Error
          ? error.message
          : EMPLOYEE_MESSAGES.UNKNOWN_ERROR;
      message.error(msg);
    },
  });
}
