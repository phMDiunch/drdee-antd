"use server";

import { getSessionUser } from "@/server/services/auth.service";
import { customerService } from "@/server/services/customer.service";
import type {
  CreateCustomerRequest,
  UpdateCustomerRequest,
} from "@/shared/validation/customer.schema";

/**
 * Server Action: Create new customer
 * Usage: const result = await createCustomerAction(data);
 */
export async function createCustomerAction(data: CreateCustomerRequest) {
  const user = await getSessionUser();
  return await customerService.create(user, data);
}

/**
 * Server Action: Update existing customer
 * Usage: const result = await updateCustomerAction(id, data);
 */
export async function updateCustomerAction(
  customerId: string,
  data: UpdateCustomerRequest
) {
  const user = await getSessionUser();
  return await customerService.update(user, customerId, data);
}
