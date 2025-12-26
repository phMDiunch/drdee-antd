import type { Clinic } from "@prisma/client";

/**
 * Map Prisma Clinic entity to API response format
 * Transform: Date → ISO string
 */
export function mapClinicToResponse(row: Clinic) {
  return {
    id: row.id,
    clinicCode: row.clinicCode,
    name: row.name,
    shortName: row.shortName,
    address: row.address,
    phone: row.phone ?? null,
    email: row.email ?? null,
    colorCode: row.colorCode,
    archivedAt: row.archivedAt ? row.archivedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
