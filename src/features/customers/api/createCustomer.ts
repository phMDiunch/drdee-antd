import { CustomerResponseSchema } from "@/shared/validation/customer.schema";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

export async function createCustomerApi(body: unknown) {
  const res = await fetch("/api/v1/customers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);
  const parsed = CustomerResponseSchema.safeParse(json);
  if (!parsed.success)
    throw new Error("Dữ liệu khách hàng trả về không hợp lệ.");
  return parsed.data;
}
