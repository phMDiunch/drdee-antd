// src/features/profile/api.ts
/**
 * Profile API Client
 * API functions for profile queries (GET only)
 */

import { ProfileResponseSchema } from "@/shared/validation/profile.schema";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import { PROFILE_ENDPOINTS } from "./constants";

/**
 * Get current user's profile
 * GET /api/v1/profile
 * @returns User's profile data
 */
export async function getProfileApi() {
  const res = await fetch(PROFILE_ENDPOINTS.ROOT, { cache: "no-store" });
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);
  }

  const parsed = ProfileResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Thông tin hồ sơ không hợp lệ.");
  }

  return parsed.data;
}
