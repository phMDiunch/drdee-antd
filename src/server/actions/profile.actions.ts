"use server";

import { getSessionUser } from "@/server/utils/sessionCache";
import { profileService } from "@/server/services/profile.service";
import type {
  UpdateProfileRequest,
  ChangePasswordRequest,
} from "@/shared/validation/profile.schema";

/**
 * Server Action: Update current user's profile
 * Accepts partial data (only modified fields)
 * Usage: await updateProfileAction({ phone: "0912345678" })
 */
export async function updateProfileAction(data: Partial<UpdateProfileRequest>) {
  const user = await getSessionUser();
  return await profileService.updateProfile(user, data);
}

/**
 * Server Action: Change current user's password
 * Usage: const result = await changePasswordAction(data);
 */
export async function changePasswordAction(data: ChangePasswordRequest) {
  const user = await getSessionUser();
  return await profileService.changePassword(user, data);
}
