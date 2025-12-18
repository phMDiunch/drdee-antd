"use server";

import { getSessionUser } from "@/server/utils/sessionCache";
import { consultedServiceService } from "@/server/services/consulted-service.service";
import type {
  CreateConsultedServiceRequest,
  UpdateConsultedServiceRequest,
} from "@/shared/validation/consulted-service.schema";

/**
 * Server Action: Create new consulted service
 * Usage: const result = await createConsultedServiceAction(data);
 */
export async function createConsultedServiceAction(
  data: CreateConsultedServiceRequest
) {
  const user = await getSessionUser();
  return await consultedServiceService.create(user, data);
}

/**
 * Server Action: Update consulted service
 * Usage: const result = await updateConsultedServiceAction(id, data);
 */
export async function updateConsultedServiceAction(
  id: string,
  data: UpdateConsultedServiceRequest
) {
  const user = await getSessionUser();
  return await consultedServiceService.update(id, user, data);
}

/**
 * Server Action: Delete consulted service
 * Usage: await deleteConsultedServiceAction(id);
 */
export async function deleteConsultedServiceAction(id: string) {
  const user = await getSessionUser();
  return await consultedServiceService.delete(id, user);
}

/**
 * Server Action: Confirm consulted service (set status to "Đã chốt")
 * Usage: const result = await confirmConsultedServiceAction(id);
 */
export async function confirmConsultedServiceAction(id: string) {
  const user = await getSessionUser();
  return await consultedServiceService.confirm(id, user);
}

/**
 * Server Action: Update stage of consulted service (Sales Pipeline)
 * Usage: const result = await updateStageAction(id, { toStage: "QUOTED", reason: "..." });
 */
export async function updateStageAction(id: string, data: unknown) {
  const user = await getSessionUser();
  return await consultedServiceService.updateStage(id, user, data);
}
