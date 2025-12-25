// src/features/consulted-services/api.ts
import { CONSULTED_SERVICE_ENDPOINTS } from "./constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import {
  ConsultedServicesListResponseSchema,
  ConsultedServicesDailyResponseSchema,
  ConsultedServiceResponseSchema,
  type GetConsultedServicesQuery,
  type GetConsultedServicesDailyQuery,
  type GetConsultedServicesPendingQuery,
  type ConsultedServicesListResponse,
  type ConsultedServicesDailyResponse,
  type ConsultedServiceResponse,
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
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);
  }

  const parsed = ConsultedServicesListResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Danh sách dịch vụ tư vấn không hợp lệ.");
  }

  return parsed.data;
}

/**
 * Get daily consulted services
 */
export async function getConsultedServicesDailyApi(
  params: GetConsultedServicesDailyQuery
): Promise<ConsultedServicesDailyResponse> {
  const query = new URLSearchParams(params as Record<string, string>);
  const res = await fetch(`${CONSULTED_SERVICE_ENDPOINTS.DAILY}?${query}`);
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);
  }

  const parsed = ConsultedServicesDailyResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Dữ liệu dịch vụ theo ngày không hợp lệ.");
  }

  return parsed.data;
}

/**
 * Get pending consulted services (status = "Chưa chốt")
 */
export async function getConsultedServicesPendingApi(
  params: GetConsultedServicesPendingQuery
): Promise<ConsultedServicesDailyResponse> {
  const query = new URLSearchParams(params as Record<string, string>);
  const res = await fetch(`${CONSULTED_SERVICE_ENDPOINTS.PENDING}?${query}`);
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);
  }

  const parsed = ConsultedServicesDailyResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Dữ liệu dịch vụ chưa chốt không hợp lệ.");
  }

  return parsed.data;
}

/**
 * Get consulted service by ID
 */
export async function getConsultedServiceByIdApi(
  id: string
): Promise<ConsultedServiceResponse> {
  const res = await fetch(CONSULTED_SERVICE_ENDPOINTS.BY_ID(id));
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);
  }

  const parsed = ConsultedServiceResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Dữ liệu dịch vụ tư vấn không hợp lệ.");
  }

  return parsed.data;
}
