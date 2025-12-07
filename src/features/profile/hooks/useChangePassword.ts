// src/features/profile/hooks/useChangePassword.ts
"use client";

import { useMutation } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { changePasswordAction } from "@/server/actions/profile.actions";
import { PROFILE_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import type { ChangePasswordRequest } from "@/shared/validation/profile.schema";

export function useChangePassword() {
  const notify = useNotify();

  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => changePasswordAction(data),
    onSuccess: () => {
      notify.success(PROFILE_MESSAGES.PASSWORD_CHANGE_SUCCESS);
      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
