// src/features/auth/hooks/useLogout.ts
"use client";

import { useMutation } from "@tanstack/react-query";
import { logoutApi } from "@/features/auth";
import type { LogoutResponse } from "@/features/auth";
import { useRouter } from "next/navigation";
import { App } from "antd";
import { AUTH_MESSAGES } from "@/features/auth/constants";

export function useLogout() {
  const router = useRouter();
  const { message } = App.useApp();

  return useMutation<LogoutResponse, Error, void>({
    mutationFn: () => logoutApi(),
    onSuccess: () => {
      message.success(AUTH_MESSAGES.LOGOUT_SUCCESS);
      router.replace("/login");
    },
    onError: (err) => {
      message.error(err.message || AUTH_MESSAGES.UNKNOWN_ERROR);
    },
  });
}
