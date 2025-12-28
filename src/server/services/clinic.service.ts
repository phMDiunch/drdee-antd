// src/server/services/clinic.service.ts
import { clinicRepo } from "@/server/repos/clinic.repo";
import { ERR, ServiceError } from "./errors";
import { requireAdmin } from "./auth.service";
import {
  CreateClinicRequestSchema,
  UpdateClinicRequestSchema,
  type CreateClinicRequest,
} from "@/shared/validation/clinic.schema";
import type { UserCore } from "@/shared/types/user";
import { mapClinicToResponse } from "./clinic/_mappers";

function normalizeClinicCode(code: string) {
  return code.trim().toUpperCase();
}

function normalizeName(name: string) {
  return name.trim();
}

function normalizeShortName(shortName: string) {
  return shortName.trim();
}

export const clinicService = {
  /**
   * GET /clinics
   */
  async list(currentUser: UserCore | null, includeArchived: boolean) {
    // (Nếu cần phân quyền xem ở đây; hiện tại ai đã login cũng xem được)
    const rows = await clinicRepo.list(includeArchived);
    return rows.map(mapClinicToResponse);
  },

  /**
   * GET /clinics/:id
   */
  async getById(currentUser: UserCore | null, id: string) {
    const row = await clinicRepo.getById(id);
    if (!row) throw ERR.NOT_FOUND("Phòng khám không tồn tại.");
    return mapClinicToResponse(row);
  },

  /**
   * POST /clinics (admin only)
   */
  async create(currentUser: UserCore | null, body: unknown) {
    requireAdmin(currentUser);

    const parsed = CreateClinicRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw ERR.INVALID(
        parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ."
      );
    }

    const data: CreateClinicRequest = {
      clinicCode: normalizeClinicCode(parsed.data.clinicCode),
      name: normalizeName(parsed.data.name),
      shortName: normalizeShortName(parsed.data.shortName),
      address: parsed.data.address.trim(),
      phone: parsed.data.phone ?? null,
      email: parsed.data.email ?? null,
      colorCode: parsed.data.colorCode.trim(),

      // Bank account fields
      companyBankName: parsed.data.companyBankName,
      companyBankAccountNo: parsed.data.companyBankAccountNo,
      companyBankAccountName: parsed.data.companyBankAccountName,
      personalBankName: parsed.data.personalBankName,
      personalBankAccountNo: parsed.data.personalBankAccountNo,
      personalBankAccountName: parsed.data.personalBankAccountName,
    };

    // Unique validate (clinicCode, name, shortName)
    const [byCode, byName, byShortName] = await Promise.all([
      clinicRepo.getByClinicCode(data.clinicCode),
      clinicRepo.getByName(data.name),
      clinicRepo.getByShortName(data.shortName),
    ]);
    if (byCode) throw ERR.CONFLICT("Mã phòng khám đã tồn tại.");
    if (byName) throw ERR.CONFLICT("Tên phòng khám đã tồn tại.");
    if (byShortName) throw ERR.CONFLICT("Tên viết tắt đã tồn tại.");

    const created = await clinicRepo.create(data);
    return mapClinicToResponse(created);
  },

  /**
   *  PUT /clinics/:id (admin only)
   */
  async update(currentUser: UserCore | null, body: unknown) {
    requireAdmin(currentUser);

    const parsed = UpdateClinicRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw ERR.INVALID(
        parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ."
      );
    }

    const { id } = parsed.data;

    const existing = await clinicRepo.getById(id);
    if (!existing) throw ERR.NOT_FOUND("Phòng khám không tồn tại.");

    const data = {
      clinicCode: normalizeClinicCode(parsed.data.clinicCode),
      name: normalizeName(parsed.data.name),
      shortName: normalizeShortName(parsed.data.shortName),
      address: parsed.data.address.trim(),
      phone: parsed.data.phone ?? null,
      email: parsed.data.email ?? null,
      colorCode: parsed.data.colorCode.trim(),
      archivedAt: parsed.data.archivedAt ?? existing.archivedAt,

      // Bank account fields
      companyBankName: parsed.data.companyBankName,
      companyBankAccountNo: parsed.data.companyBankAccountNo,
      companyBankAccountName: parsed.data.companyBankAccountName,
      personalBankName: parsed.data.personalBankName,
      personalBankAccountNo: parsed.data.personalBankAccountNo,
      personalBankAccountName: parsed.data.personalBankAccountName,
    };

    // Unique validate (exclude self)
    if (data.clinicCode && data.clinicCode !== existing.clinicCode) {
      const dup = await clinicRepo.getByClinicCode(data.clinicCode);
      if (dup && dup.id !== id) throw ERR.CONFLICT("Mã phòng khám đã tồn tại.");
    }

    if (data.name && data.name !== existing.name) {
      const dup = await clinicRepo.getByName(data.name);
      if (dup && dup.id !== id)
        throw ERR.CONFLICT("Tên phòng khám đã tồn tại.");
    }

    if (data.shortName && data.shortName !== existing.shortName) {
      const dup = await clinicRepo.getByShortName(data.shortName);
      if (dup && dup.id !== id) throw ERR.CONFLICT("Tên viết tắt đã tồn tại.");
    }

    const updated = await clinicRepo.update(id, data);
    return mapClinicToResponse(updated);
  },

  /**
   * DELETE /clinics/:id (admin only)
   */
  async remove(currentUser: UserCore | null, id: string) {
    requireAdmin(currentUser);

    const existing = await clinicRepo.getById(id);
    if (!existing) throw ERR.NOT_FOUND("Phòng khám không tồn tại.");

    const linked = await clinicRepo.countLinked(id);
    if (linked.total > 0) {
      // Gợi ý chuyển sang Archive
      throw new ServiceError(
        "HAS_LINKED_DATA",
        "Phòng khám còn dữ liệu liên kết, chỉ có thể lưu trữ (Archive).",
        409
      );
    }

    const deleted = await clinicRepo.delete(id);
    return mapClinicToResponse(deleted);
  },

  /**
   * POST /clinics/:id/archive (admin only)
   */
  async archive(currentUser: UserCore | null, id: string) {
    requireAdmin(currentUser);

    const existing = await clinicRepo.getById(id);
    if (!existing) throw ERR.NOT_FOUND("Phòng khám không tồn tại.");

    const updated = await clinicRepo.archive(id);
    return mapClinicToResponse(updated);
  },

  /**
   * POST /clinics/:id/unarchive (admin only)
   */
  async unarchive(currentUser: UserCore | null, id: string) {
    requireAdmin(currentUser);

    const existing = await clinicRepo.getById(id);
    if (!existing) throw ERR.NOT_FOUND("Phòng khám không tồn tại.");

    const updated = await clinicRepo.unarchive(id);
    return mapClinicToResponse(updated);
  },
};
