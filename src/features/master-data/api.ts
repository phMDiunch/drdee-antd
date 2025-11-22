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
  if (query?.rootId !== undefined) {
    searchParams.set("rootId", query.rootId === null ? "null" : query.rootId);
  }
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
 * Fetch root categories only
 */
export async function getMasterDataRoots(
  includeInactive?: boolean
): Promise<MasterDataResponse[]> {
  const searchParams = new URLSearchParams();
  if (includeInactive) searchParams.set("includeInactive", "true");

  const response = await fetch(
    `/api/v1/master-data/roots?${searchParams.toString()}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message ?? "Failed to fetch root categories");
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
