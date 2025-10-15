// src/features/auth/hooks/useForgotPassword.ts
"use client";

import { useMutation } from "@tanstack/react-query";
import { forgotPasswordApi } from "@/features/auth/api";
import type { ForgotPasswordRequest, ForgotPasswordResponse } from "@/shared/validation/auth.schema";
import { useNotify } from "@/shared/hooks/useNotify";
import { AUTH_MESSAGES } from "@/features/auth/constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

export function useForgotPassword() {
  const notify = useNotify();

  return useMutation<ForgotPasswordResponse, Error, ForgotPasswordRequest>({
    mutationFn: (payload) => forgotPasswordApi(payload),
    onSuccess: () => {
      notify.success(AUTH_MESSAGES.FORGOT_PASSWORD_SUCCESS);
    },
    onError: (err) => {
      notify.error(err, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR });
    },
  });
}
