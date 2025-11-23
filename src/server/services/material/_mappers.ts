// src/server/services/material/_mappers.ts
import type { Material, Employee } from "@prisma/client";

// Material với relations từ Prisma
type MaterialWithRelations = Material & {
  createdBy?: Pick<Employee, "id" | "fullName"> | null;
  updatedBy?: Pick<Employee, "id" | "fullName"> | null;
};

/**
 * Map Prisma Material entity to API response format
 * Transform: Date → ISO string
 */
export function mapMaterialToResponse(row: MaterialWithRelations) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description ?? null,
    unit: row.unit,
    materialType: row.materialType,
    department: row.department,
    category: row.category ?? null,
    subCategory: row.subCategory ?? null,
    minStockLevel: row.minStockLevel ?? null,
    imageUrl: row.imageUrl ?? null,
    tags: row.tags ?? [],
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
