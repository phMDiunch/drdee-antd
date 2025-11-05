// src/features/employees/hooks/useCompleteProfilePublic.ts
"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { completeProfilePublicApi } from "../api";
import { EMPLOYEE_MESSAGES, EMPLOYEE_QUERY_KEYS } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import type { CompleteProfileRequest } from "@/shared/validation/employee.schema";

export function useCompleteProfilePublic() {
  const notify = useNotify();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CompleteProfileRequest) =>
      completeProfilePublicApi(payload),
    onSuccess: (data) => {
      notify.success(EMPLOYEE_MESSAGES.COMPLETE_PROFILE_SUCCESS);
      qc.invalidateQueries({
        queryKey: [...EMPLOYEE_QUERY_KEYS.byId(data.id), "profile-completion"],
      });
      qc.invalidateQueries({
        queryKey: EMPLOYEE_QUERY_KEYS.list(undefined),
      });
    },
    onError: (error: unknown) => {
      notify.error(error, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR });
    },
  });
}
