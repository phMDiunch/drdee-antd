// src/shared/validation/auth.schema.ts
import { z } from "zod";

export const LoginRequestSchema = z.object({
  email: z.string().trim().min(1, "Email là bắt buộc").email("Email không hợp lệ"),
  password: z.string().min(1, "Mật khẩu là bắt buộc"),
});

export const LoginResponseSchema = z.object({
  user: z
    .object({
      id: z.string().min(1),
      email: z.string().email().nullable(),
    })
    .nullable(),
});

export const LogoutResponseSchema = z.object({
  ok: z.literal(true),
});

export const ApiErrorSchema = z.object({
  error: z.string().min(1),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type LogoutResponse = z.infer<typeof LogoutResponseSchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;
