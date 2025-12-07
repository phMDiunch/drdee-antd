// src/app/api/v1/profile/route.ts
import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/utils/sessionCache";
import { profileService } from "@/server/services/profile.service";
import { ServiceError } from "@/server/services/errors";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

/**
 * GET /api/v1/profile - Get current user's profile
 * Query params: none
 * Used by: useProfile() hook
 * Validation: Handled by service layer
 * Cache: No cache (user-specific data)
 */
export async function GET() {
  try {
    const user = await getSessionUser();

    const data = await profileService.getProfile(user);

    return NextResponse.json(data, { status: 200 });
  } catch (e: unknown) {
    if (e instanceof ServiceError) {
      return NextResponse.json(
        { error: e.message, code: e.code },
        { status: e.httpStatus }
      );
    }
    return NextResponse.json(
      { error: COMMON_MESSAGES.SERVER_ERROR },
      { status: 500 }
    );
  }
}

// PATCH removed - Use updateProfileAction() Server Action instead
// POST removed - Use changePasswordAction() Server Action instead
