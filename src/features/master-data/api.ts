// src/features/master-data/api.ts
import type { MasterDataResponse } from "@/shared/validation/master-data.schema";

/**
 * Fetch ALL master data (no filtering)
 * Client will filter as needed
 */
export async function getMasterDataList(): Promise<MasterDataResponse[]> {
  const response = await fetch(`/api/v1/master-data`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error ?? "Failed to fetch master data");
  }

  return response.json(); // Direct return, no .data wrapper
}
