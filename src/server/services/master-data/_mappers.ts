// src/server/services/master-data/_mappers.ts
import type { MasterData } from "@prisma/client";
import type { MasterDataResponse } from "@/shared/validation/master-data.schema";

export function mapMasterDataToResponse(row: MasterData): MasterDataResponse {
  return {
    id: row.id,
    category: row.category,
    key: row.key,
    value: row.value,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
