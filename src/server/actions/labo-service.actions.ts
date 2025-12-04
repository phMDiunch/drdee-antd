"use server";

import { getSessionUser } from "@/server/utils/sessionCache";
import { laboServiceService } from "@/server/services/labo-service.service";
import type {
  CreateLaboServiceRequest,
  UpdateLaboServiceRequest,
} from "@/shared/validation/labo-service.schema";

/**
 * Server Action: Create new labo service
 * Usage: const result = await createLaboServiceAction(data);
 */
export async function createLaboServiceAction(data: CreateLaboServiceRequest) {
  const user = await getSessionUser();
  return await laboServiceService.create(user, data);
}

/**
 * Server Action: Update existing labo service
 * Usage: const result = await updateLaboServiceAction(id, data);
 */
export async function updateLaboServiceAction(
  priceId: string,
  data: UpdateLaboServiceRequest
) {
  const user = await getSessionUser();
  return await laboServiceService.update(user, { ...data, id: priceId });
}

/**
 * Server Action: Delete labo service (hard delete - permanently remove)
 * Usage: await deleteLaboServiceAction(id);
 */
export async function deleteLaboServiceAction(priceId: string) {
  const user = await getSessionUser();
  return await laboServiceService.remove(user, priceId);
}
