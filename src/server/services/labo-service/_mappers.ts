import type { LaboService, Supplier, LaboItem, Employee } from "@prisma/client";

// LaboService với relations từ Prisma
type LaboServiceWithRelations = LaboService & {
  supplier?: Pick<Supplier, "id" | "name" | "shortName"> | null;
  laboItem?: Pick<LaboItem, "id" | "name" | "serviceGroup" | "unit"> | null;
  createdBy?: Pick<Employee, "id" | "fullName"> | null;
  updatedBy?: Pick<Employee, "id" | "fullName"> | null;
};

/**
 * Map Prisma LaboService entity to API response format
 * Transform: Date → ISO string, Decimal → number
 */
export function mapLaboServiceToResponse(row: LaboServiceWithRelations) {
  return {
    id: row.id,
    supplierId: row.supplierId,
    laboItemId: row.laboItemId,
    price: row.price,
    warranty: row.warranty,
    createdById: row.createdById,
    updatedById: row.updatedById,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    archivedAt: row.archivedAt?.toISOString() ?? null,

    // Nested objects - giữ nguyên cấu trúc quan hệ
    supplier: row.supplier
      ? {
          id: row.supplier.id,
          name: row.supplier.name,
          shortName: row.supplier.shortName,
        }
      : null,

    laboItem: row.laboItem
      ? {
          id: row.laboItem.id,
          name: row.laboItem.name,
          serviceGroup: row.laboItem.serviceGroup,
          unit: row.laboItem.unit,
        }
      : null,

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
