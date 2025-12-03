"use server";

import { getSessionUser } from "@/server/utils/sessionCache";
import { laboItemService } from "@/server/services/labo-item.service";
import type {
  CreateLaboItemRequest,
  UpdateLaboItemRequest,
} from "@/shared/validation/labo-item.schema";

/**
 * Server Action: Create new labo item
 * Usage: const result = await createLaboItemAction(data);
 */
export async function createLaboItemAction(data: CreateLaboItemRequest) {
  const user = await getSessionUser();
  return await laboItemService.create(user, data);
}

/**
 * Server Action: Update existing labo item
 * Usage: const result = await updateLaboItemAction(id, data);
 */
export async function updateLaboItemAction(
  itemId: string,
  data: UpdateLaboItemRequest
) {
  const user = await getSessionUser();
  return await laboItemService.update(user, { ...data, id: itemId });
}

/**
 * Server Action: Delete labo item (hard delete - permanently remove)
 * Usage: await deleteLaboItemAction(id);
 */
export async function deleteLaboItemAction(itemId: string) {
  const user = await getSessionUser();
  return await laboItemService.remove(user, itemId);
}

/**
 * Server Action: Archive labo item (soft delete)
 * Usage: await archiveLaboItemAction(id);
 */
export async function archiveLaboItemAction(itemId: string) {
  const user = await getSessionUser();
  return await laboItemService.archive(user, itemId);
}

/**
 * Server Action: Unarchive labo item (restore)
 * Usage: await unarchiveLaboItemAction(id);
 */
export async function unarchiveLaboItemAction(itemId: string) {
  const user = await getSessionUser();
  return await laboItemService.unarchive(user, itemId);
}
