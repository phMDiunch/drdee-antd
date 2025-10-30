// src/features/auth/hooks/useResetPassword.ts
"use client";

import { useMutation } from "@tanstack/react-query";
import { resetPasswordApi } from "@/features/auth/api/resetPassword";
import type { ResetPasswordRequest, ResetPasswordResponse } from "@/shared/validation/auth.schema";
import { useRouter } from "next/navigation";
import { useNotify } from "@/shared/hooks/useNotify";
import { AUTH_MESSAGES } from "@/features/auth/constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

export function useResetPassword() {
  const router = useRouter();
  const notify = useNotify();

  return useMutation<ResetPasswordResponse, Error, ResetPasswordRequest>({
    mutationFn: (payload) => resetPasswordApi(payload),
    onSuccess: () => {
      notify.success(AUTH_MESSAGES.RESET_PASSWORD_SUCCESS);
      router.replace("/login");
    },
    onError: (err) => {
      notify.error(err, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR });
    },
  });
}
