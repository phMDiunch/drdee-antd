"use server";

import { getSessionUser } from "@/server/services/auth.service";
import { clinicService } from "@/server/services/clinic.service";
import type {
  CreateClinicRequest,
  UpdateClinicRequest,
} from "@/shared/validation/clinic.schema";

/**
 * Server Action: Create new clinic
 * Usage: const result = await createClinicAction(data);
 */
export async function createClinicAction(data: CreateClinicRequest) {
  const user = await getSessionUser();
  return await clinicService.create(user, data);
}

/**
 * Server Action: Update existing clinic
 * Usage: const result = await updateClinicAction(id, data);
 */
export async function updateClinicAction(
  clinicId: string,
  data: UpdateClinicRequest
) {
  const user = await getSessionUser();
  return await clinicService.update(user, { ...data, id: clinicId });
}

/**
 * Server Action: Archive clinic (soft delete)
 * Usage: await archiveClinicAction(id);
 */
export async function archiveClinicAction(clinicId: string) {
  const user = await getSessionUser();
  return await clinicService.archive(user, clinicId);
}

/**
 * Server Action: Unarchive clinic (restore)
 * Usage: await unarchiveClinicAction(id);
 */
export async function unarchiveClinicAction(clinicId: string) {
  const user = await getSessionUser();
  return await clinicService.unarchive(user, clinicId);
}
