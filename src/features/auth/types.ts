// src/features/auth/types.ts

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  user: {
    id: string;
    email: string | null;
  } | null;
};

export type LogoutResponse = {
  ok: boolean;
};

export type ApiError = {
  error: string;
};
