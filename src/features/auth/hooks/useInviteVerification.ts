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
        // Check if user has a valid session from invite link
        // Invite flow: Supabase creates session after user clicks invite link
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
