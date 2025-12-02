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
        // Supabase automatically handles the token from URL hash when page loads
        // and creates a session. Just need to check if session exists.
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (cancelled) return;

        if (sessionError) {
          throw sessionError;
        }

        if (session) {
          // User is authenticated via recovery token, allow password reset
          setStatus("ready");
          setErrorMessage(null);
          return;
        }

        // No session found - could be expired token or invalid link
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
