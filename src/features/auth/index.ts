// src/features/auth/index.ts
// Barrel export - Public API for auth feature

// ===== VIEWS (for app router) =====
export { default as LoginView } from "./views/LoginView";
export { default as ForgotPasswordView } from "./views/ForgotPasswordView";
export { default as ResetPasswordView } from "./views/ResetPasswordView";

// ===== COMPONENTS (for external use) =====
export { default as LoginForm } from "./components/LoginForm";
export { default as ForgotPasswordForm } from "./components/ForgotPasswordForm";
export { default as ResetPasswordForm } from "./components/ResetPasswordForm";

// ===== HOOKS (for auth operations) =====
export * from "./hooks/useLogin";
export * from "./hooks/useLogout";
export * from "./hooks/useForgotPassword";
export * from "./hooks/useResetPassword";
export * from "./hooks/usePasswordResetSession";
export * from "./hooks/useInviteVerification";

// ===== CONSTANTS =====
export * from "./constants";

// NOTE: API layer không export (internal use only - hooks wrap them)
