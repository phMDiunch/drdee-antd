// src/shared/constants/payment.ts

/**
 * Bank Account Configuration Type
 */
export type BankConfig = {
  bankName: string;
  accountNumber: string;
  accountName: string;
};

/**
 * Determine payment account type based on services
 * Logic: If ANY service is PERSONAL → use personal account, else → company account
 */
export function determinePaymentAccountType(
  services: Array<{
    dentalService: { paymentAccountType: "COMPANY" | "PERSONAL" };
  }>
): "COMPANY" | "PERSONAL" {
  const hasPersonal = services.some(
    (s) => s.dentalService.paymentAccountType === "PERSONAL"
  );
  return hasPersonal ? "PERSONAL" : "COMPANY";
}

/**
 * Convert Clinic model to BankConfig
 * Validates that clinic has required account configured
 */
export function clinicToBankConfig(
  clinic: {
    companyBankName?: string | null;
    companyBankAccountNo?: string | null;
    companyBankAccountName?: string | null;
    personalBankName?: string | null;
    personalBankAccountNo?: string | null;
    personalBankAccountName?: string | null;
  },
  accountType: "COMPANY" | "PERSONAL"
): BankConfig | undefined {
  if (accountType === "COMPANY") {
    if (
      !clinic.companyBankName ||
      !clinic.companyBankAccountNo ||
      !clinic.companyBankAccountName
    )
      return undefined;
    return {
      bankName: clinic.companyBankName,
      accountNumber: clinic.companyBankAccountNo,
      accountName: clinic.companyBankAccountName,
    };
  } else {
    if (
      !clinic.personalBankName ||
      !clinic.personalBankAccountNo ||
      !clinic.personalBankAccountName
    )
      return undefined;
    return {
      bankName: clinic.personalBankName,
      accountNumber: clinic.personalBankAccountNo,
      accountName: clinic.personalBankAccountName,
    };
  }
}

/**
 * Generate SePay QR URL for dynamic QR code with pre-filled amount and description
 * @param amount - Payment amount in VND
 * @param description - Payment description (e.g., voucher code)
 * @param bankConfig - Bank account configuration
 * @returns SePay QR image URL
 */
export function generateVietQRUrl(
  amount: number,
  description: string,
  bankConfig: BankConfig
): string {
  const baseUrl = "https://qr.sepay.vn/img";
  const params = new URLSearchParams({
    bank: bankConfig.bankName,
    acc: bankConfig.accountNumber,
    template: "qronly",
    amount: amount.toString(),
    des: description,
  });
  return `${baseUrl}?${params.toString()}`;
}
