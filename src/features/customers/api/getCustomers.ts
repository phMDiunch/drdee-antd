import { CustomersListResponseSchema } from "@/shared/validation/customer.schema";
import type { GetCustomersQuery } from "@/shared/validation/customer.schema";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

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
