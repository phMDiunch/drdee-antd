"use server";

import { getSessionUser } from "@/server/utils/sessionCache";
import { paymentVoucherService } from "@/server/services/payment-voucher.service";
import type {
  CreatePaymentVoucherRequest,
  UpdatePaymentVoucherRequest,
} from "@/shared/validation/payment-voucher.schema";

/**
 * Server Action: Create new payment voucher
 * Usage: const result = await createPaymentVoucherAction(data);
 */
export async function createPaymentVoucherAction(
  data: CreatePaymentVoucherRequest
) {
  const user = await getSessionUser();
  return await paymentVoucherService.create(user, data);
}

/**
 * Server Action: Update existing payment voucher
 * Usage: const result = await updatePaymentVoucherAction(id, data);
 */
export async function updatePaymentVoucherAction(
  voucherId: string,
  data: UpdatePaymentVoucherRequest
) {
  const user = await getSessionUser();
  return await paymentVoucherService.update(voucherId, user, data);
}

/**
 * Server Action: Delete payment voucher
 * Usage: const result = await deletePaymentVoucherAction(id);
 */
export async function deletePaymentVoucherAction(voucherId: string) {
  const user = await getSessionUser();
  return await paymentVoucherService.delete(voucherId, user);
}
