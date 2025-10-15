// src/features/auth/api/resetPassword.ts
import { ResetPasswordRequestSchema, ResetPasswordResponseSchema } from "@/shared/validation/auth.schema";
import type { ResetPasswordResponse } from "@/shared/validation/auth.schema";
import { createClient } from "@/services/supabase/client";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

export async function resetPasswordApi(payload: { password: string; confirmPassword: string }): Promise<ResetPasswordResponse> {
  ResetPasswordRequestSchema.parse(payload);

  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password: payload.password });

  if (error) {
    const msg = error.message?.toLowerCase().includes("session")
      ? "Phiên đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu liên kết mới."
      : error.message || COMMON_MESSAGES.UNKNOWN_ERROR;
    throw new Error(msg);
  }

  return ResetPasswordResponseSchema.parse({ ok: true });
}

