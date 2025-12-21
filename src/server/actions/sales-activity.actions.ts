// src/server/actions/sales-activity.actions.ts
"use server";

import { getSessionUser } from "@/server/utils/sessionCache";
import { salesActivityService } from "@/server/services/sales-activity.service";

/**
 * Create sales activity log
 * Permission: Employee (service owner) or Admin
 */
export async function createSalesActivityAction(data: unknown) {
  const user = await getSessionUser();
  return salesActivityService.create(user, data);
}

/**
 * Update sales activity log
 * Permission: Employee (record owner, within 7 days) or Admin
 */
export async function updateSalesActivityAction(id: string, data: unknown) {
  const user = await getSessionUser();
  return salesActivityService.update(user, id, data);
}

/**
 * Delete sales activity log
 * Permission: Employee (record owner, within 24h) or Admin
 */
export async function deleteSalesActivityAction(id: string) {
  const user = await getSessionUser();
  return salesActivityService.delete(user, id);
}
