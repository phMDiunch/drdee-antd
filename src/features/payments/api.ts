// src/features/payments/api.ts

import type {
  GetPaymentVouchersQuery,
  GetPaymentVouchersDailyQuery,
  PaymentVouchersListResponse,
  PaymentVouchersDailyResponse,
  PaymentVoucherResponse,
  UnpaidServicesResponse,
} from "@/shared/validation/payment-voucher.schema";
import { PAYMENT_API_ENDPOINTS } from "./constants";

/**
 * Get payment vouchers with filters (paginated)
 */
export async function getPaymentVouchersApi(
  params?: GetPaymentVouchersQuery
): Promise<PaymentVouchersListResponse> {
  const query = new URLSearchParams(
    params as unknown as Record<string, string>
  );
  const res = await fetch(`${PAYMENT_API_ENDPOINTS.LIST}?${query}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/**
 * Get payment vouchers for daily view
 */
export async function getPaymentVouchersDailyApi(
  params: GetPaymentVouchersDailyQuery
): Promise<PaymentVouchersDailyResponse> {
  const query = new URLSearchParams(
    params as unknown as Record<string, string>
  );
  const res = await fetch(`${PAYMENT_API_ENDPOINTS.DAILY}?${query}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/**
 * Get payment voucher by ID
 */
export async function getPaymentVoucherApi(
  id: string
): Promise<PaymentVoucherResponse> {
  const res = await fetch(PAYMENT_API_ENDPOINTS.DETAIL(id));
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/**
 * Get unpaid services for customer
 */
export async function getUnpaidServicesApi(
  customerId: string
): Promise<UnpaidServicesResponse> {
  const res = await fetch(PAYMENT_API_ENDPOINTS.UNPAID(customerId));
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
