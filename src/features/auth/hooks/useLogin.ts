// src/features/auth/hooks/useLogin.ts
"use client";

import { useMutation } from "@tanstack/react-query";
import { loginApi } from "@/features/auth";
import type { LoginRequest, LoginResponse } from "@/features/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { App } from "antd";
import { AUTH_MESSAGES } from "@/features/auth/constants";

export function useLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams?.get("next") || "/dashboard";
  const { message } = App.useApp();

  return useMutation<LoginResponse, Error, LoginRequest>({
    mutationFn: (payload) => loginApi(payload),
    onSuccess: () => {
      message.success(AUTH_MESSAGES.LOGIN_SUCCESS);
      router.replace(next);
    },
    onError: (err) => {
      message.error(err.message || AUTH_MESSAGES.UNKNOWN_ERROR);
    },
  });
}
