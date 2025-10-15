// src/shared/validation/auth.schema.ts
import { z } from "zod";

export const LoginRequestSchema = z.object({
  email: z.string().trim().min(1, "Vui lòng nhập email").email("Email không hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export const ForgotPasswordRequestSchema = z.object({
  email: z.string().trim().min(1, "Vui lòng nhập email").email("Email không hợp lệ"),
});

export const ResetPasswordRequestSchema = z
  .object({
    password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
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

export const ForgotPasswordResponseSchema = z.object({
  ok: z.literal(true),
});

export const ResetPasswordResponseSchema = z.object({
  ok: z.literal(true),
});

export const ApiErrorSchema = z.object({
  error: z.string().min(1),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type LogoutResponse = z.infer<typeof LogoutResponseSchema>;
export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequestSchema>;
export type ForgotPasswordResponse = z.infer<typeof ForgotPasswordResponseSchema>;
export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;
export type ResetPasswordResponse = z.infer<typeof ResetPasswordResponseSchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;

