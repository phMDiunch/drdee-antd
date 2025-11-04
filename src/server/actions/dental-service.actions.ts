"use server";

import { getSessionUser } from "@/server/services/auth.service";
import { dentalServiceService } from "@/server/services/dental-service.service";
import type {
  CreateDentalServiceRequest,
  UpdateDentalServiceRequest,
} from "@/shared/validation/dental-service.schema";

/**
 * Server Action: Create new dental service
 * Usage: const result = await createDentalServiceAction(data);
 */
export async function createDentalServiceAction(
  data: CreateDentalServiceRequest
) {
  const user = await getSessionUser();
  return await dentalServiceService.create(user, data);
}

/**
 * Server Action: Update existing dental service
 * Usage: const result = await updateDentalServiceAction(id, data);
 */
export async function updateDentalServiceAction(
  serviceId: string,
  data: UpdateDentalServiceRequest
) {
  const user = await getSessionUser();
  return await dentalServiceService.update(user, { ...data, id: serviceId });
}

/**
 * Server Action: Archive dental service (soft delete)
 * Usage: await archiveDentalServiceAction(id);
 */
export async function archiveDentalServiceAction(serviceId: string) {
  const user = await getSessionUser();
  return await dentalServiceService.archive(user, serviceId);
}

/**
 * Server Action: Unarchive dental service (restore)
 * Usage: await unarchiveDentalServiceAction(id);
 */
export async function unarchiveDentalServiceAction(serviceId: string) {
  const user = await getSessionUser();
  return await dentalServiceService.unarchive(user, serviceId);
}
