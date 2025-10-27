// src/features/customers/api/updateCustomer.ts
import {
  CustomerDetailResponseSchema,
  UpdateCustomerRequestSchema,
} from "@/shared/validation/customer.schema";
import type {
  CustomerDetailResponse,
  UpdateCustomerRequest,
} from "@/shared/validation/customer.schema";

/**
 * Update customer by ID
 * PATCH /api/v1/customers/[id]
 * Returns updated customer with full relations
 */
export async function updateCustomerApi(
  id: string,
  data: UpdateCustomerRequest
): Promise<CustomerDetailResponse> {
  // Validate request before sending
  const parsed = UpdateCustomerRequestSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ");
  }

  const response = await fetch(`/api/v1/customers/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parsed.data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Không thể cập nhật khách hàng");
  }

  const result = await response.json();

  // Validate response with Zod
  const responseParsed = CustomerDetailResponseSchema.safeParse(result);
  if (!responseParsed.success) {
    console.error(
      "CustomerDetailResponse validation failed:",
      responseParsed.error
    );
    throw new Error("Dữ liệu trả về không hợp lệ");
  }

  return responseParsed.data;
}
