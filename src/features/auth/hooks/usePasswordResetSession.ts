// src/features/auth/hooks/usePasswordResetSession.ts
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/services/supabase/client";

type Status = "loading" | "ready" | "error";

export function usePasswordResetSession() {
  const searchParams = useSearchParams();
  const code = useMemo(() => searchParams.get("code"), [searchParams]);

  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const supabase = createClient();

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          if (cancelled) return;
          setStatus("ready");
          setErrorMessage(null);
          return;
        }

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) throw error;
        if (cancelled) return;
        if (session) {
          setStatus("ready");
          setErrorMessage(null);
        } else {
          setStatus("error");
          setErrorMessage("Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu liên kết mới.");
        }
      } catch (e: unknown) {
        if (cancelled) return;
        setStatus("error");
        // Type-safe extraction of error message from unknown error (could be Supabase AuthError, network error, etc.)
        // Check if error is object with message property before accessing it
        const errorMessage =
          typeof e === "object" && e !== null && "message" in e && typeof e.message === "string"
            ? e.message
            : "Không thể xác thực yêu cầu đặt lại mật khẩu. Vui lòng thử lại.";
        setErrorMessage(errorMessage);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [code]);

  const isLoading = status === "loading";
  const isReady = status === "ready";
  const isError = status === "error";

  return { status, isLoading, isReady, isError, errorMessage } as const;
}
