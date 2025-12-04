"use server";

import { getSessionUser } from "@/server/utils/sessionCache";
import { laboOrderService } from "@/server/services/labo-order.service";
import type {
  CreateLaboOrderRequest,
  UpdateLaboOrderRequest,
} from "@/shared/validation/labo-order.schema";

/**
 * Server Action: Create new labo order
 * Usage: const result = await createLaboOrderAction(data);
 */
export async function createLaboOrderAction(data: CreateLaboOrderRequest) {
  const user = await getSessionUser();
  return await laboOrderService.create(user, data);
}

/**
 * Server Action: Update existing labo order
 * Usage: const result = await updateLaboOrderAction(id, data);
 */
export async function updateLaboOrderAction(
  orderId: string,
  data: Omit<UpdateLaboOrderRequest, "id">
) {
  const user = await getSessionUser();
  return await laboOrderService.update(user, { ...data, id: orderId });
}

/**
 * Server Action: Delete labo order (hard delete - permanently remove)
 * Usage: await deleteLaboOrderAction(id);
 */
export async function deleteLaboOrderAction(orderId: string) {
  const user = await getSessionUser();
  return await laboOrderService.remove(user, orderId);
}

/**
 * Server Action: Receive labo order (quick action - xác nhận nhận mẫu)
 * Usage: await receiveLaboOrderAction(orderId);
 */
export async function receiveLaboOrderAction(orderId: string) {
  const user = await getSessionUser();
  return await laboOrderService.receiveLaboOrder(user, { orderId });
}
