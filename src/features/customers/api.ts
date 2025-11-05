// src/features/customers/api.ts
/**
 * Customer API Client
 * Consolidated API functions for customer operations
 */

import { z } from "zod";
import {
  CustomersListResponseSchema,
  CustomerDetailResponseSchema,
  CustomerResponseSchema,
  CustomerDailyResponseSchema,
  SearchResponseSchema,
} from "@/shared/validation/customer.schema";
import type {
  GetCustomersQuery,
  CustomerDetailResponse,
  SearchQuery,
} from "@/shared/validation/customer.schema";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

// Local schemas
const CustomersListSimpleResponseSchema = z.object({
  items: z.array(CustomerResponseSchema),
  count: z.number(),
});

const CustomersDailyResponseSchema = z.object({
  items: z.array(CustomerDailyResponseSchema),
  count: z.number(),
});

export type GetCustomersDailyParams = {
  date?: string;
  clinicId?: string;
  includeAppointments?: boolean;
};

/**
 * Get customers list
 * GET /api/v1/customers
 * @param params - Query parameters (search, page, pageSize, clinicId, source, serviceOfInterest, sort)
 * @returns Paginated list of customers
 */
export async function getCustomersApi(params?: GetCustomersQuery) {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.page) query.set("page", params.page.toString());
  if (params?.pageSize) query.set("pageSize", params.pageSize.toString());
  if (params?.clinicId) query.set("clinicId", params.clinicId);
  if (params?.source) query.set("source", params.source);
  if (params?.serviceOfInterest)
    query.set("serviceOfInterest", params.serviceOfInterest);
  if (params?.sort) query.set("sort", params.sort);

  const qs = query.toString();
  const url = qs ? `/api/v1/customers?${qs}` : "/api/v1/customers";

  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);
  const parsed = CustomersListResponseSchema.safeParse(json);
  if (!parsed.success) throw new Error("Danh sách khách hàng không hợp lệ.");
  return parsed.data;
}

/**
 * Get customer detail by ID
 * GET /api/v1/customers/[id]
 * @param id - Customer ID
 * @returns Full customer detail with relations (primaryContact, sourceEmployee, sourceCustomer)
 */
export async function getCustomerDetailApi(
  id: string
): Promise<CustomerDetailResponse> {
  const response = await fetch(`/api/v1/customers/${id}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Không thể tải thông tin khách hàng");
  }

  const data = await response.json();

  // Validate response with Zod
  const parsed = CustomerDetailResponseSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("Dữ liệu trả về không hợp lệ");
  }

  return parsed.data;
}

/**
 * Get customers created on specific date
 * GET /api/v1/customers/daily
 * @param params - Query parameters (date, clinicId, includeAppointments)
 * @returns List of customers created on the specified date
 */
export async function getCustomersDailyApi(params?: GetCustomersDailyParams) {
  const query = new URLSearchParams();
  if (params?.date) query.set("date", params.date);
  if (params?.clinicId) query.set("clinicId", params.clinicId);
  if (params?.includeAppointments) query.set("includeAppointments", "true");
  const qs = query.toString();
  const url = qs ? `/api/v1/customers/daily?${qs}` : "/api/v1/customers/daily";

  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);

  // Use appropriate schema based on includeAppointments
  const schema = params?.includeAppointments
    ? CustomersDailyResponseSchema
    : CustomersListSimpleResponseSchema;

  const parsed = schema.safeParse(json);
  if (!parsed.success) throw new Error("Danh sách khách hàng không hợp lệ.");
  return parsed.data;
}

/**
 * Search customers (type-ahead)
 * GET /api/v1/customers/search
 * @param params - Search parameters (q, limit, requirePhone)
 * @returns Array of matching customers
 */
export async function searchCustomersApi(params: SearchQuery) {
  const query = new URLSearchParams();
  query.set("q", params.q);
  if (params.limit) query.set("limit", params.limit.toString());
  if (params.requirePhone !== undefined)
    query.set("requirePhone", params.requirePhone.toString());

  const url = `/api/v1/customers/search?${query.toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);
  const parsed = SearchResponseSchema.safeParse(json);
  if (!parsed.success)
    throw new Error("Phản hồi tìm kiếm khách hàng không hợp lệ.");
  return parsed.data.items;
}
