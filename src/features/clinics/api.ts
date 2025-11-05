// src/features/clinics/api.ts
/**
 * Clinic API Client
 * Consolidated API functions for clinic operations
 */

import {
  ClinicsResponseSchema,
  ClinicResponseSchema,
} from "@/shared/validation/clinic.schema";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import { CLINIC_ENDPOINTS } from "./constants";

/**
 * Get clinics list
 * GET /api/v1/clinics
 * @param includeArchived - Include archived clinics in the list
 * @returns Array of clinics
 */
export async function getClinicsApi(includeArchived?: boolean) {
  const qs = includeArchived ? "?includeArchived=1" : "";
  const res = await fetch(`${CLINIC_ENDPOINTS.ROOT}${qs}`, {
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);
  const parsed = ClinicsResponseSchema.safeParse(json);
  if (!parsed.success)
    throw new Error("Phản hồi danh sách phòng khám không hợp lệ.");
  return parsed.data;
}

/**
 * Get clinic detail by ID
 * GET /api/v1/clinics/[id]
 * @param id - Clinic ID
 * @returns Full clinic detail
 */
export async function getClinicByIdApi(id: string) {
  const res = await fetch(CLINIC_ENDPOINTS.BY_ID(id), { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);
  const parsed = ClinicResponseSchema.safeParse(json);
  if (!parsed.success) throw new Error("Phản hồi phòng khám không hợp lệ.");
  return parsed.data;
}
