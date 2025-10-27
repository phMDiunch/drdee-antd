// src/features/customers/api/getCustomerDetail.ts
import { CustomerDetailResponseSchema } from "@/shared/validation/customer.schema";
import type { CustomerDetailResponse } from "@/shared/validation/customer.schema";

/**
 * Get customer detail by ID
 * GET /api/v1/customers/[id]
 * Returns full customer detail with relations (primaryContact, sourceEmployee, sourceCustomer)
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
    console.error("CustomerDetailResponse validation failed:", parsed.error);
    throw new Error("Dữ liệu trả về không hợp lệ");
  }

  return parsed.data;
}
