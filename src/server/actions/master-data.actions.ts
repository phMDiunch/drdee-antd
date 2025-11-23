// src/server/actions/master-data.actions.ts
"use server";

import { masterDataService } from "@/server/services/master-data.service";
import { getSessionUser } from "@/server/services/auth.service";
import type {
  CreateMasterDataRequest,
  UpdateMasterDataRequest,
} from "@/shared/validation/master-data.schema";

/**
 * Server Action: Create Master Data (Admin only)
 */
export async function createMasterDataAction(body: CreateMasterDataRequest) {
  const user = await getSessionUser();
  return masterDataService.create(user, body);
}

/**
 * Server Action: Update Master Data (Admin only)
 */
export async function updateMasterDataAction(body: UpdateMasterDataRequest) {
  const user = await getSessionUser();
  return masterDataService.update(user, body);
}

/**
 * Server Action: Delete Master Data (Hard delete - permanent) - Admin only
 */
export async function deleteMasterDataAction(id: string) {
  const user = await getSessionUser();
  return masterDataService.remove(user, id);
}
