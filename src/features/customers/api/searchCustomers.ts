import { SearchResponseSchema } from "@/shared/validation/customer.schema";
import type { SearchQuery } from "@/shared/validation/customer.schema";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

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
