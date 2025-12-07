// src/features/profile/index.ts

// Export views
export { default as ProfileView } from "./views/ProfileView";

// Export hooks
export * from "./hooks/useProfile";
export * from "./hooks/useUpdateProfile";
export * from "./hooks/useChangePassword";

// Export constants
export * from "./constants";

// Export types
export type {
  UpdateProfileFormData,
  ChangePasswordFormData,
  UpdateProfileRequest,
  ChangePasswordRequest,
  ProfileResponse,
} from "@/shared/validation/profile.schema";
