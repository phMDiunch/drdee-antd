// src/server/repos/profile.repo.ts
import { prisma } from "@/services/prisma/prisma";
import type { UpdateProfileRequest } from "@/shared/validation/profile.schema";

// Import employee repo để reuse duplicate check methods
import { employeeRepo } from "./employee.repo";

/**
 * Profile update input type
 * Extends UpdateProfileRequest with server metadata
 */
export type ProfileUpdateInput = Partial<UpdateProfileRequest> & {
  updatedById: string; // Server metadata for audit trail
};

export const profileRepo = {
  /**
   * Get profile by Supabase UID (user's own profile)
   * @param uid - Supabase Auth user ID
   * @returns Employee with clinic relation
   */
  async findByUid(uid: string) {
    return prisma.employee.findUnique({
      where: { uid },
      include: {
        clinic: {
          select: {
            id: true,
            clinicCode: true,
            name: true,
            colorCode: true,
          },
        },
      },
    });
  },

  /**
   * Update profile by UID (user can only update own profile)
   * @param uid - Supabase Auth user ID
   * @param data - Profile update data
   * @returns Updated employee
   */
  async updateByUid(uid: string, data: ProfileUpdateInput) {
    return prisma.employee.update({
      where: { uid },
      data: {
        // Thông tin cơ bản
        fullName: data.fullName,
        dob: data.dob,
        gender: data.gender,
        avatarUrl: data.avatarUrl,
        favoriteColor: data.favoriteColor,

        // Thông tin liên hệ
        phone: data.phone,
        currentAddress: data.currentAddress,
        hometown: data.hometown,

        // Thông tin pháp lý
        nationalId: data.nationalId,
        nationalIdIssueDate: data.nationalIdIssueDate,
        nationalIdIssuePlace: data.nationalIdIssuePlace,
        taxId: data.taxId,
        insuranceNumber: data.insuranceNumber,

        // Thông tin ngân hàng
        bankAccountNumber: data.bankAccountNumber,
        bankName: data.bankName,

        // Metadata
        updatedById: data.updatedById,
        updatedAt: new Date(),
      },
      include: {
        clinic: {
          select: {
            id: true,
            clinicCode: true,
            name: true,
            colorCode: true,
          },
        },
      },
    });
  },

  /**
   * Check if phone exists for another user (excluding current user)
   * Reuses employee repo method
   * @param phone - Phone number to check
   * @param excludeUid - Current user's UID to exclude from check
   * @returns Employee if duplicate found, null otherwise
   */
  async findByPhoneExcludingUid(phone: string, excludeUid: string) {
    const existing = await employeeRepo.findByPhone(phone);
    if (existing && existing.uid !== excludeUid) {
      return existing;
    }
    return null;
  },

  /**
   * Check if nationalId exists for another user (excluding current user)
   * @param nationalId - National ID to check
   * @param excludeUid - Current user's UID to exclude from check
   * @returns Employee if duplicate found, null otherwise
   */
  async findByNationalIdExcludingUid(nationalId: string, excludeUid: string) {
    const existing = await employeeRepo.findByNationalId(nationalId);
    if (existing && existing.uid !== excludeUid) {
      return existing;
    }
    return null;
  },

  /**
   * Check if taxId exists for another user (excluding current user)
   * @param taxId - Tax ID to check
   * @param excludeUid - Current user's UID to exclude from check
   * @returns Employee if duplicate found, null otherwise
   */
  async findByTaxIdExcludingUid(taxId: string, excludeUid: string) {
    const existing = await employeeRepo.findByTaxId(taxId);
    if (existing && existing.uid !== excludeUid) {
      return existing;
    }
    return null;
  },

  /**
   * Check if insurance number exists for another user (excluding current user)
   * @param insuranceNumber - Insurance number to check
   * @param excludeUid - Current user's UID to exclude from check
   * @returns Employee if duplicate found, null otherwise
   */
  async findByInsuranceNumberExcludingUid(
    insuranceNumber: string,
    excludeUid: string
  ) {
    const existing = await employeeRepo.findByInsuranceNumber(insuranceNumber);
    if (existing && existing.uid !== excludeUid) {
      return existing;
    }
    return null;
  },
};
