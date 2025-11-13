"use server";

import { getSessionUser } from "@/server/utils/sessionCache";
import { treatmentLogService } from "@/server/services/treatment-log.service";
import type {
  CreateTreatmentLogRequest,
  UpdateTreatmentLogRequest,
} from "@/shared/validation/treatment-log.schema";

/**
 * Server Action: Create new treatment log
 * Usage: const result = await createTreatmentLogAction(data);
 */
export async function createTreatmentLogAction(
  data: CreateTreatmentLogRequest
) {
  const user = await getSessionUser();
  return await treatmentLogService.create(user, data);
}

/**
 * Server Action: Update existing treatment log
 * Usage: const result = await updateTreatmentLogAction(id, data);
 */
export async function updateTreatmentLogAction(
  id: string,
  data: UpdateTreatmentLogRequest
) {
  const user = await getSessionUser();
  return await treatmentLogService.update(user, id, data);
}

/**
 * Server Action: Delete treatment log
 * Usage: await deleteTreatmentLogAction(id);
 */
export async function deleteTreatmentLogAction(id: string) {
  const user = await getSessionUser();
  return await treatmentLogService.delete(user, id);
}
