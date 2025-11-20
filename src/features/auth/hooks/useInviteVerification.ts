// src/features/auth/hooks/useInviteVerification.ts
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/services/supabase/client";

type Status = "loading" | "verified" | "error";

export function useInviteVerification() {
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const supabase = createClient();

      try {
        // First, check if there's a token_hash in URL that needs verification
        const hashParams = new URLSearchParams(window.location.search);
        const tokenHash = hashParams.get("token_hash");
        const type = hashParams.get("type");

        // If we have token_hash, verify it with Supabase
        if (tokenHash && type === "invite") {
          const { data, error: verifyError } =
            await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: "invite",
            });

          if (cancelled) return;

          if (verifyError || !data.session) {
            setStatus("error");
            setErrorMessage(
              "Liên kết mời không hợp lệ hoặc đã hết hạn. Vui lòng liên hệ quản trị viên để được gửi lại lời mời."
            );
            return;
          }

          // Successfully verified, extract employeeId from metadata
          const empId = data.session.user.user_metadata
            ?.employeeId as string | undefined;

          if (!empId) {
            setStatus("error");
            setErrorMessage(
              "Liên kết mời không hợp lệ. Thiếu thông tin nhân viên."
            );
            return;
          }

          setEmployeeId(empId);
          setStatus("verified");
          setErrorMessage(null);
          return;
        }

        // If no token_hash in URL, check existing session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (cancelled) return;

        if (session) {
          // Extract employeeId from user metadata set during invite
          const metadata = session.user.user_metadata;
          const empId = metadata?.employeeId as string | undefined;

          if (!empId) {
            setStatus("error");
            setErrorMessage(
              "Liên kết mời không hợp lệ. Thiếu thông tin nhân viên."
            );
            return;
          }

          // User is authenticated with valid invite session
          setEmployeeId(empId);
          setStatus("verified");
          setErrorMessage(null);
          return;
        }

        // No session found
        if (sessionError) throw sessionError;

        setStatus("error");
        setErrorMessage(
          "Liên kết mời không hợp lệ hoặc đã hết hạn. Vui lòng liên hệ quản trị viên để được gửi lại lời mời."
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
            : "Đã xảy ra lỗi khi xác thực liên kết mời.";
        setErrorMessage(errorMessage);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    isLoading: status === "loading",
    isVerified: status === "verified",
    isError: status === "error",
    errorMessage,
    employeeId,
  };
}
