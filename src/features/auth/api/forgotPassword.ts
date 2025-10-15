// src/features/auth/api/forgotPassword.ts
import { ForgotPasswordRequestSchema, ForgotPasswordResponseSchema } from "@/shared/validation/auth.schema";
import type { ForgotPasswordResponse } from "@/shared/validation/auth.schema";
import { createClient } from "@/services/supabase/client";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

export async function forgotPasswordApi(payload: { email: string }): Promise<ForgotPasswordResponse> {
  ForgotPasswordRequestSchema.parse(payload);

  const supabase = createClient();
  const origin = typeof window !== "undefined" && window.location?.origin
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(payload.email, {
    redirectTo: `${origin}/reset-password`,
  });

  if (error) {
    throw new Error(error.message || COMMON_MESSAGES.UNKNOWN_ERROR);
  }

  const ok = ForgotPasswordResponseSchema.parse({ ok: true });
  return ok;
}

