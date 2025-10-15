// src/features/auth/hooks/useLogout.ts
"use client";

import { useMutation } from "@tanstack/react-query";
import { logoutApi } from "@/features/auth";
import type { LogoutResponse } from "@/features/auth";
import { useRouter } from "next/navigation";
import { useNotify } from "@/shared/hooks/useNotify";
import { AUTH_MESSAGES } from "@/features/auth/constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

export function useLogout() {
  const router = useRouter();
  const notify = useNotify();

  return useMutation<LogoutResponse, Error, void>({
    mutationFn: () => logoutApi(),
    onSuccess: () => {
      notify.success(AUTH_MESSAGES.LOGOUT_SUCCESS);
      router.replace("/login");
    },
    onError: (err) => {
      notify.error(err, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR });
    },
  });
}
