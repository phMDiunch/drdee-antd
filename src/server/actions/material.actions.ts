"use server";

import { getSessionUser } from "@/server/utils/sessionCache";
import { materialService } from "@/server/services/material.service";
import type {
  CreateMaterialRequest,
  UpdateMaterialRequest,
} from "@/shared/validation/material.schema";

/**
 * Server Action: Create new material
 * Usage: const result = await createMaterialAction(data);
 */
export async function createMaterialAction(data: CreateMaterialRequest) {
  const user = await getSessionUser();
  return await materialService.create(user, data);
}

/**
 * Server Action: Update existing material
 * Usage: const result = await updateMaterialAction(id, data);
 */
export async function updateMaterialAction(
  materialId: string,
  data: UpdateMaterialRequest
) {
  const user = await getSessionUser();
  return await materialService.update(user, { ...data, id: materialId });
}

/**
 * Server Action: Delete material (hard delete - permanently remove)
 * Usage: await deleteMaterialAction(id);
 */
export async function deleteMaterialAction(materialId: string) {
  const user = await getSessionUser();
  return await materialService.remove(user, materialId);
}

/**
 * Server Action: Archive material (soft delete)
 * Usage: await archiveMaterialAction(id);
 */
export async function archiveMaterialAction(materialId: string) {
  const user = await getSessionUser();
  return await materialService.archive(user, materialId);
}

/**
 * Server Action: Unarchive material (restore)
 * Usage: await unarchiveMaterialAction(id);
 */
export async function unarchiveMaterialAction(materialId: string) {
  const user = await getSessionUser();
  return await materialService.unarchive(user, materialId);
}
