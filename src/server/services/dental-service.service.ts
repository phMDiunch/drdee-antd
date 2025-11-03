// src/server/services/dental-service.service.ts
import {
  dentalServiceRepo,
  type DentalServiceCreateInput,
  type DentalServiceUpdateInput,
} from "@/server/repos/dental-service.repo";
import { ERR, ServiceError } from "./errors";
import { requireAdmin } from "./auth.service";
import {
  CreateDentalServiceRequestSchema,
  UpdateDentalServiceRequestSchema,
  DentalServiceResponseSchema,
  DentalServicesResponseSchema,
} from "@/shared/validation/dental-service.schema";
import type { UserCore } from "@/shared/types/user";
import type { DentalService, Employee } from "@prisma/client";

// DentalService với relations từ Prisma
type DentalServiceWithRelations = DentalService & {
  createdBy?: Pick<Employee, "id" | "fullName"> | null;
  updatedBy?: Pick<Employee, "id" | "fullName"> | null;
};

function normalizeName(name: string) {
  return name.trim();
}

/** Map Prisma entity -> API response shape (string ISO date) */
function mapDentalServiceToResponse(row: DentalServiceWithRelations) {
  const sanitized = {
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    serviceGroup: row.serviceGroup ?? null,
    department: row.department ?? null,
    tags: row.tags ?? [],
    unit: row.unit,
    price: row.price,
    minPrice: row.minPrice ?? null,
    officialWarranty: row.officialWarranty ?? null,
    clinicWarranty: row.clinicWarranty ?? null,
    origin: row.origin ?? null,
    avgTreatmentMinutes: row.avgTreatmentMinutes ?? null,
    avgTreatmentSessions: row.avgTreatmentSessions ?? null,
    archivedAt: row.archivedAt ? row.archivedAt.toISOString() : null,
    createdById: row.createdById,
    updatedById: row.updatedById,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    // Nested objects - giữ nguyên cấu trúc quan hệ, bao gồm id
    createdBy: row.createdBy
      ? {
          id: row.createdBy.id,
          fullName: row.createdBy.fullName,
        }
      : null,
    updatedBy: row.updatedBy
      ? {
          id: row.updatedBy.id,
          fullName: row.updatedBy.fullName,
        }
      : null,
  };

  const parsed = DentalServiceResponseSchema.safeParse(sanitized);
  if (!parsed.success) {
    throw ERR.INVALID(
      "Dữ liệu dịch vụ nha khoa ở database trả về không hợp lệ. Kiểm tra database trong supabase"
    );
  }
  return parsed.data;
}

export const dentalServiceService = {
  /**
   * GET /dental-services
   */
  async list(currentUser: UserCore | null, includeArchived: boolean) {
    // (Nếu cần phân quyền xem ở đây; hiện tại ai đã login cũng xem được)
    const rows = await dentalServiceRepo.list(includeArchived);
    return DentalServicesResponseSchema.parse(
      rows.map(mapDentalServiceToResponse)
    );
  },

  /**
   * GET /dental-services/:id
   */
  async getById(currentUser: UserCore | null, id: string) {
    const row = await dentalServiceRepo.getById(id);
    if (!row) throw ERR.NOT_FOUND("Dịch vụ nha khoa không tồn tại.");
    return mapDentalServiceToResponse(row);
  },

  /**
   * POST /dental-services (admin only)
   */
  async create(currentUser: UserCore | null, body: unknown) {
    requireAdmin(currentUser);

    if (!currentUser?.employeeId) {
      throw ERR.FORBIDDEN("Tài khoản admin chưa liên kết nhân viên.");
    }

    const parsed = CreateDentalServiceRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw ERR.INVALID(
        parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ."
      );
    }

    const data: DentalServiceCreateInput = {
      name: normalizeName(parsed.data.name),
      description: parsed.data.description ?? null,
      serviceGroup: parsed.data.serviceGroup ?? null,
      department: parsed.data.department ?? null,
      tags: parsed.data.tags ?? [],
      unit: parsed.data.unit.trim(),
      price: parsed.data.price,
      minPrice: parsed.data.minPrice ?? null,
      officialWarranty: parsed.data.officialWarranty ?? null,
      clinicWarranty: parsed.data.clinicWarranty ?? null,
      origin: parsed.data.origin ?? null,
      avgTreatmentMinutes: parsed.data.avgTreatmentMinutes ?? null,
      avgTreatmentSessions: parsed.data.avgTreatmentSessions ?? null,
      createdById: currentUser.employeeId,
      updatedById: currentUser.employeeId,
    };

    // Unique validate (name)
    const byName = await dentalServiceRepo.getByName(data.name);
    if (byName) throw ERR.CONFLICT("Tên dịch vụ đã tồn tại.");

    const created = await dentalServiceRepo.create(data);
    return mapDentalServiceToResponse(created);
  },

  /**
   * PUT /dental-services/:id (admin only)
   */
  async update(currentUser: UserCore | null, body: unknown) {
    requireAdmin(currentUser);

    if (!currentUser?.employeeId) {
      throw ERR.FORBIDDEN("Tài khoản admin chưa liên kết nhân viên.");
    }

    const parsed = UpdateDentalServiceRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw ERR.INVALID(
        parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ."
      );
    }

    const { id } = parsed.data;

    const existing = await dentalServiceRepo.getById(id);
    if (!existing) throw ERR.NOT_FOUND("Dịch vụ nha khoa không tồn tại.");

    const data: Partial<DentalServiceUpdateInput> = {
      name: normalizeName(parsed.data.name),
      description: parsed.data.description ?? null,
      serviceGroup: parsed.data.serviceGroup ?? null,
      department: parsed.data.department ?? null,
      tags: parsed.data.tags ?? [],
      unit: parsed.data.unit.trim(),
      price: parsed.data.price,
      minPrice: parsed.data.minPrice ?? null,
      officialWarranty: parsed.data.officialWarranty ?? null,
      clinicWarranty: parsed.data.clinicWarranty ?? null,
      origin: parsed.data.origin ?? null,
      avgTreatmentMinutes: parsed.data.avgTreatmentMinutes ?? null,
      avgTreatmentSessions: parsed.data.avgTreatmentSessions ?? null,
      updatedById: currentUser.employeeId,
      archivedAt: parsed.data.archivedAt ?? existing.archivedAt,
    };

    // Unique validate (exclude self)
    if (data.name && data.name !== existing.name) {
      const dup = await dentalServiceRepo.getByName(data.name);
      if (dup && dup.id !== id) throw ERR.CONFLICT("Tên dịch vụ đã tồn tại.");
    }

    const updated = await dentalServiceRepo.update(id, data);
    return mapDentalServiceToResponse(updated);
  },

  /**
   * DELETE /dental-services/:id (admin only)
   */
  async remove(currentUser: UserCore | null, id: string) {
    requireAdmin(currentUser);

    const existing = await dentalServiceRepo.getById(id);
    if (!existing) throw ERR.NOT_FOUND("Dịch vụ nha khoa không tồn tại.");

    const linked = await dentalServiceRepo.countLinked(id);
    if (linked.total > 0) {
      // Gợi ý chuyển sang Archive
      throw new ServiceError(
        "HAS_LINKED_DATA",
        "Dịch vụ đang có dữ liệu liên kết, chỉ có thể lưu trữ (Archive).",
        409
      );
    }

    const deleted = await dentalServiceRepo.delete(id);
    return mapDentalServiceToResponse(deleted);
  },

  /**
   * POST /dental-services/:id/archive (admin only)
   */
  async archive(currentUser: UserCore | null, id: string) {
    requireAdmin(currentUser);

    const existing = await dentalServiceRepo.getById(id);
    if (!existing) throw ERR.NOT_FOUND("Dịch vụ nha khoa không tồn tại.");

    const updated = await dentalServiceRepo.archive(id);
    return mapDentalServiceToResponse(updated);
  },
  /**
   * POST /dental-services/:id/unarchive (admin only)
   */
  async unarchive(currentUser: UserCore | null, id: string) {
    requireAdmin(currentUser);

    const existing = await dentalServiceRepo.getById(id);
    if (!existing) throw ERR.NOT_FOUND("Dịch vụ nha khoa không tồn tại.");

    const updated = await dentalServiceRepo.unarchive(id);
    return mapDentalServiceToResponse(updated);
  },
};
