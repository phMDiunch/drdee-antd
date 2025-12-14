"use server";

import { getSessionUser } from "@/server/utils/sessionCache";
import { leadService } from "@/server/services/lead.service";
import type {
  CreateLeadRequest,
  UpdateLeadRequest,
  ConvertLeadRequest,
} from "@/shared/validation/lead.schema";

/**
 * Server Action: Create new lead (telesale workflow)
 * Usage: const result = await createLeadAction(data);
 */
export async function createLeadAction(data: CreateLeadRequest) {
  const user = await getSessionUser();
  return await leadService.create(user, data);
}

/**
 * Server Action: Get lead by ID
 * Usage: const result = await getLeadAction(id);
 */
export async function getLeadAction(id: string) {
  const user = await getSessionUser();
  return await leadService.getById(user, id);
}

/**
 * Server Action: Update existing lead
 * Usage: const result = await updateLeadAction(id, data);
 */
export async function updateLeadAction(id: string, data: UpdateLeadRequest) {
  const user = await getSessionUser();
  return await leadService.update(user, id, data);
}

/**
 * Server Action: Convert lead to customer (check-in workflow)
 * Usage: const result = await convertLeadToCustomerAction(leadId, data);
 */
export async function convertLeadToCustomerAction(
  leadId: string,
  data: ConvertLeadRequest
) {
  const user = await getSessionUser();
  return await leadService.convertToCustomer(user, leadId, data);
}

/**
 * Server Action: Delete lead (only if not converted)
 * Usage: const result = await deleteLeadAction(id);
 */
export async function deleteLeadAction(id: string) {
  const user = await getSessionUser();
  return await leadService.delete(user, id);
}
