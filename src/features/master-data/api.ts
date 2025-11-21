// src/features/master-data/api.ts
import type {
  MasterDataResponse,
  GetMasterDataQuerySchema,
} from "@/shared/validation/master-data.schema";
import { z } from "zod";

type GetMasterDataQuery = z.infer<typeof GetMasterDataQuerySchema>;

/**
 * Fetch master data list
 */
export async function getMasterDataList(
  query?: GetMasterDataQuery
): Promise<MasterDataResponse[]> {
  const searchParams = new URLSearchParams();
  if (query?.type) searchParams.set("type", query.type);
  if (query?.includeInactive) searchParams.set("includeInactive", "true");

  const response = await fetch(
    `/api/v1/master-data?${searchParams.toString()}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message ?? "Failed to fetch master data");
  }

  const result = await response.json();
  return result.data;
}

/**
 * Fetch master data by ID
 */
export async function getMasterDataById(
  id: string
): Promise<MasterDataResponse> {
  const response = await fetch(`/api/v1/master-data/${id}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message ?? "Failed to fetch master data");
  }

  const result = await response.json();
  return result.data;
}
