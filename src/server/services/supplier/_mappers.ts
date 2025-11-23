// src/server/services/supplier/_mappers.ts
import type { Supplier, Employee } from "@prisma/client";

// Supplier với relations từ Prisma
type SupplierWithRelations = Supplier & {
  createdBy?: Pick<Employee, "id" | "fullName"> | null;
  updatedBy?: Pick<Employee, "id" | "fullName"> | null;
};

/**
 * Map Prisma Supplier entity to API response format
 * Transform: Date → ISO string
 */
export function mapSupplierToResponse(row: SupplierWithRelations) {
  return {
    id: row.id,
    name: row.name,
    shortName: row.shortName ?? null,
    supplierGroup: row.supplierGroup ?? null,
    phone: row.phone ?? null,
    email: row.email ?? null,
    address: row.address ?? null,
    taxCode: row.taxCode ?? null,
    note: row.note ?? null,
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
