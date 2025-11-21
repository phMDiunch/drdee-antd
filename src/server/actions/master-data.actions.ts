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
  const currentUser = await getSessionUser();
  return masterDataService.create(currentUser, body);
}

/**
 * Server Action: Update Master Data (Admin only)
 */
export async function updateMasterDataAction(body: UpdateMasterDataRequest) {
  const currentUser = await getSessionUser();
  return masterDataService.update(currentUser, body);
}

/**
 * Server Action: Delete Master Data (Admin only)
 */
export async function deleteMasterDataAction(id: string) {
  const currentUser = await getSessionUser();
  return masterDataService.remove(currentUser, id);
}
