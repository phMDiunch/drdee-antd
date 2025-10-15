// src/features/auth/hooks/useLogin.ts
"use client";

import { useMutation } from "@tanstack/react-query";
import { loginApi } from "@/features/auth";
import type { LoginRequest, LoginResponse } from "@/features/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useNotify } from "@/shared/hooks/useNotify";
import { AUTH_MESSAGES } from "@/features/auth/constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import { sanitizeNext } from "@/shared/constants/route";

export function useLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = sanitizeNext(searchParams?.get("next"));
  const notify = useNotify();

  return useMutation<LoginResponse, Error, LoginRequest>({
    mutationFn: (payload) => loginApi(payload),
    onSuccess: () => {
      notify.success(AUTH_MESSAGES.LOGIN_SUCCESS);
      router.replace(next);
    },
    onError: (err) => {
      notify.error(err, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR });
    },
  });
}
