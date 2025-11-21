// src/server/services/master-data/_mappers.ts
import type { MasterData } from "@prisma/client";
import type { MasterDataResponse } from "@/shared/validation/master-data.schema";

export function mapMasterDataToResponse(row: MasterData): MasterDataResponse {
  return {
    id: row.id,
    type: row.type,
    key: row.key,
    value: row.value,
    description: row.description ?? undefined,
    isActive: row.isActive,
    parentId: row.parentId ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
