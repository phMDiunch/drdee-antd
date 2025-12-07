// src/server/services/profile.service.ts
import { profileRepo } from "@/server/repos/profile.repo";
import { ERR } from "@/server/services/errors";
import type { UserCore } from "@/shared/types/user";
import {
  UpdateProfileRequestSchema,
  ChangePasswordRequestSchema,
} from "@/shared/validation/profile.schema";
import type { ProfileUpdateInput } from "@/server/repos/profile.repo";
import { createClient } from "@/services/supabase/server";
import { mapEmployeeToProfileResponse } from "./profile/_mappers";

export const profileService = {
  /**
   * Get current user's profile
   * GET /api/v1/profile
   */
  async getProfile(currentUser: UserCore | null) {
    if (!currentUser?.id) {
      throw ERR.UNAUTHORIZED("User không hợp lệ");
    }

    const profile = await profileRepo.findByUid(currentUser.id);
    if (!profile) {
      throw ERR.NOT_FOUND("Không tìm thấy thông tin hồ sơ");
    }

    return mapEmployeeToProfileResponse(profile);
  },

  /**
   * Update current user's profile
   * Server Action: updateProfileAction
   */
  async updateProfile(currentUser: UserCore | null, body: unknown) {
    if (!currentUser?.id || !currentUser?.employeeId) {
      throw ERR.UNAUTHORIZED("User không hợp lệ");
    }

    // Validate request body
    const parsed = UpdateProfileRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw ERR.INVALID(
        parsed.error.issues[0]?.message ?? "Thông tin không hợp lệ"
      );
    }

    const data = parsed.data;

    // Get existing profile
    const existing = await profileRepo.findByUid(currentUser.id);
    if (!existing) {
      throw ERR.NOT_FOUND("Không tìm thấy thông tin hồ sơ");
    }

    // Check duplicates (excluding current user)
    if (data.phone && data.phone !== existing.phone) {
      const duplicate = await profileRepo.findByPhoneExcludingUid(
        data.phone,
        currentUser.id
      );
      if (duplicate) {
        throw ERR.CONFLICT("Số điện thoại này đã được sử dụng");
      }
    }

    if (data.nationalId && data.nationalId !== existing.nationalId) {
      const duplicate = await profileRepo.findByNationalIdExcludingUid(
        data.nationalId,
        currentUser.id
      );
      if (duplicate) {
        throw ERR.CONFLICT("Số CCCD này đã được sử dụng");
      }
    }

    if (data.taxId && data.taxId !== existing.taxId) {
      const duplicate = await profileRepo.findByTaxIdExcludingUid(
        data.taxId,
        currentUser.id
      );
      if (duplicate) {
        throw ERR.CONFLICT("Mã số thuế này đã được sử dụng");
      }
    }

    if (
      data.insuranceNumber &&
      data.insuranceNumber !== existing.insuranceNumber
    ) {
      const duplicate = await profileRepo.findByInsuranceNumberExcludingUid(
        data.insuranceNumber,
        currentUser.id
      );
      if (duplicate) {
        throw ERR.CONFLICT("Số sổ BHXH này đã được sử dụng");
      }
    }

    // Prepare update data
    const dataToUpdate: ProfileUpdateInput = {
      ...data,
      updatedById: currentUser.employeeId,
    };

    // Update profile
    const updated = await profileRepo.updateByUid(currentUser.id, dataToUpdate);
    return mapEmployeeToProfileResponse(updated);
  },

  /**
   * Change current user's password
   * Server Action: changePasswordAction
   */
  async changePassword(currentUser: UserCore | null, body: unknown) {
    if (!currentUser?.email) {
      throw ERR.UNAUTHORIZED("User không hợp lệ");
    }

    // Validate request body
    const parsed = ChangePasswordRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw ERR.INVALID(
        parsed.error.issues[0]?.message ?? "Thông tin không hợp lệ"
      );
    }

    const { currentPassword, newPassword } = parsed.data;

    const supabase = await createClient();

    // Verify current password by attempting sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: currentUser.email,
      password: currentPassword,
    });

    if (signInError) {
      throw ERR.UNAUTHORIZED("Mật khẩu hiện tại không đúng");
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      throw ERR.INVALID("Đổi mật khẩu thất bại. Vui lòng thử lại.");
    }

    return { message: "Đổi mật khẩu thành công" };
  },
};
