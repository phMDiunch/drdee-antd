// src/features/auth/hooks/usePasswordResetSession.ts
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/services/supabase/client";

type Status = "loading" | "ready" | "error";

export function usePasswordResetSession() {
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const supabase = createClient();

      try {
        // Check if user already has a valid session (from URL hash after redirect)
        // Implicit flow: Supabase automatically extracts access_token from URL hash
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (cancelled) return;

        if (session) {
          // User is authenticated, allow password reset
          setStatus("ready");
          setErrorMessage(null);
          return;
        }

        // No session found
        if (sessionError) throw sessionError;

        setStatus("error");
        setErrorMessage(
          "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu liên kết mới."
        );
      } catch (e: unknown) {
        if (cancelled) return;
        setStatus("error");
        const errorMessage =
          typeof e === "object" &&
          e !== null &&
          "message" in e &&
          typeof e.message === "string"
            ? e.message
            : "Không thể xác thực yêu cầu đặt lại mật khẩu. Vui lòng thử lại.";
        setErrorMessage(errorMessage);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []); // No dependencies needed

  const isLoading = status === "loading";
  const isReady = status === "ready";
  const isError = status === "error";

  return { status, isLoading, isReady, isError, errorMessage } as const;
}
