"use client";

import { useMutation } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { resendEmployeeInviteApi } from "../api/resendInvite";
import { EMPLOYEE_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

export function useResendEmployeeInvite() {
  const notify = useNotify();

  return useMutation({
    mutationFn: (id: string) => resendEmployeeInviteApi(id),
    onSuccess: () => {
      notify.success(EMPLOYEE_MESSAGES.INVITE_SUCCESS);
    },
    onError: (error: unknown) => {
      notify.error(error, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR });
    },
  });
}
