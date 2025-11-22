// src/server/services/master-data/_mappers.ts
import type { MasterData } from "@prisma/client";
import type { MasterDataResponse } from "@/shared/validation/master-data.schema";

export function mapMasterDataToResponse(row: MasterData): MasterDataResponse {
  return {
    id: row.id,
    key: row.key,
    value: row.value,
    description: row.description ?? undefined,
    allowHierarchy: row.allowHierarchy,
    isActive: row.isActive,
    parentId: row.parentId ?? undefined,
    rootId: row.rootId ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
