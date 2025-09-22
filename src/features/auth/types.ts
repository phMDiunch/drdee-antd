// src/features/auth/types.ts
import type { z } from "zod";
import { LoginRequestSchema, LoginResponseSchema, LogoutResponseSchema } from "@/shared/validation/auth.schema";

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type LogoutResponse = z.infer<typeof LogoutResponseSchema>;

// Với lỗi API, ta chỉ cần 1 shape đơn giản
export type ApiError = { error: string };
