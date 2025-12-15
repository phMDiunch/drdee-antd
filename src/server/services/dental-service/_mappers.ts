import type { DentalService, Employee } from "@prisma/client";

// DentalService với relations từ Prisma
type DentalServiceWithRelations = DentalService & {
  createdBy?: Pick<Employee, "id" | "fullName"> | null;
  updatedBy?: Pick<Employee, "id" | "fullName"> | null;
};

/**
 * Map Prisma DentalService entity to API response format
 * Transform: Date → ISO string
 */
export function mapDentalServiceToResponse(row: DentalServiceWithRelations) {
  return {
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
    requiresFollowUp: row.requiresFollowUp,
    paymentAccountType: row.paymentAccountType as "COMPANY" | "PERSONAL",
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
}
