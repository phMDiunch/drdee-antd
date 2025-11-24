// src/shared/constants/payment.ts

/**
 * Bank Account Configuration for QR Code Payment
 * Used for generating dynamic VietQR codes on payment receipts
 */
export const BANK_CONFIG = {
  BANK_NAME: "BIDV",
  ACCOUNT_NUMBER: "2610143271",
  ACCOUNT_NAME: "PHAM MINH DUC",
  TEMPLATE: "qronly",
} as const;

/**
 * Generate SePay QR URL for dynamic QR code with pre-filled amount and description
 * @param amount - Payment amount in VND
 * @param description - Payment description (e.g., voucher code)
 * @returns SePay QR image URL
 */
export function generateVietQRUrl(amount: number, description: string): string {
  const { BANK_NAME, ACCOUNT_NUMBER, TEMPLATE } = BANK_CONFIG;
  const baseUrl = "https://qr.sepay.vn/img";
  const params = new URLSearchParams({
    bank: BANK_NAME,
    acc: ACCOUNT_NUMBER,
    template: TEMPLATE,
    amount: amount.toString(),
    des: description,
  });
  return `${baseUrl}?${params.toString()}`;
}
