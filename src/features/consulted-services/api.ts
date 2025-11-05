// src/features/consulted-services/api.ts
import { CONSULTED_SERVICE_ENDPOINTS } from "./constants";
import type {
  GetConsultedServicesQuery,
  GetConsultedServicesDailyQuery,
  ConsultedServicesListResponse,
  ConsultedServicesDailyResponse,
  ConsultedServiceResponse,
} from "@/shared/validation/consulted-service.schema";

/**
 * Get consulted services (list with pagination)
 */
export async function getConsultedServicesApi(
  params?: GetConsultedServicesQuery
): Promise<ConsultedServicesListResponse> {
  const query = new URLSearchParams(
    params as unknown as Record<string, string>
  );
  const res = await fetch(`${CONSULTED_SERVICE_ENDPOINTS.BASE}?${query}`);
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error);
  }
  return res.json();
}

/**
 * Get daily consulted services
 */
export async function getConsultedServicesDailyApi(
  params: GetConsultedServicesDailyQuery
): Promise<ConsultedServicesDailyResponse> {
  const query = new URLSearchParams(params as Record<string, string>);
  const res = await fetch(`${CONSULTED_SERVICE_ENDPOINTS.DAILY}?${query}`);
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error);
  }
  return res.json();
}

/**
 * Get consulted service by ID
 */
export async function getConsultedServiceByIdApi(
  id: string
): Promise<ConsultedServiceResponse> {
  const res = await fetch(CONSULTED_SERVICE_ENDPOINTS.BY_ID(id));
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error);
  }
  return res.json();
}
