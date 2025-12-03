import type { LaboItem, Employee } from "@prisma/client";

// LaboItem với relations từ Prisma
type LaboItemWithRelations = LaboItem & {
  createdBy?: Pick<Employee, "id" | "fullName"> | null;
  updatedBy?: Pick<Employee, "id" | "fullName"> | null;
};

/**
 * Map Prisma LaboItem entity to API response format
 * Transform: Date → ISO string
 */
export function mapLaboItemToResponse(row: LaboItemWithRelations) {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    serviceGroup: row.serviceGroup,
    unit: row.unit,
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
