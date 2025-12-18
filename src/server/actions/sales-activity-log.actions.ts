"use server";

import { getSessionUser } from "@/server/utils/sessionCache";
import { salesActivityLogService } from "@/server/services/sales-activity-log.service";

/**
 * Server Action: Create new sales activity log
 * Usage: const result = await createActivityLogAction(data);
 */
export async function createActivityLogAction(data: unknown) {
  const user = await getSessionUser();
  return await salesActivityLogService.create(user, data);
}

/**
 * Server Action: Update sales activity log
 * Usage: const result = await updateActivityLogAction(id, data);
 */
export async function updateActivityLogAction(id: string, data: unknown) {
  const user = await getSessionUser();
  return await salesActivityLogService.update(id, user, data);
}

/**
 * Server Action: Delete sales activity log
 * Usage: await deleteActivityLogAction(id);
 */
export async function deleteActivityLogAction(id: string) {
  const user = await getSessionUser();
  return await salesActivityLogService.delete(id, user);
}
