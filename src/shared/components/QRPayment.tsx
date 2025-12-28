// src/shared/components/QRPayment.tsx
"use client";

import React from "react";
import { generateVietQRUrl, type BankConfig } from "@/shared/constants/payment";

interface QRPaymentProps {
  amount: number;
  voucherCode: string;
  bankConfig: BankConfig; // Required - no fallback
  accountType: "COMPANY" | "PERSONAL";
  size?: number;
}

/**
 * QR Payment Component
 * Generates dynamic VietQR code with pre-filled payment information
 * Supports dual bank accounts (company & personal)
 * When customer scans: auto-fills account, amount, and description
 */
export default function QRPayment({
  amount,
  voucherCode,
  bankConfig,
  size = 100,
}: QRPaymentProps) {
  const qrUrl = generateVietQRUrl(amount, voucherCode, bankConfig);

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={qrUrl}
      alt={`QR thanh toán ${voucherCode}`}
      style={{
        width: size,
        height: size,
        border: "1px solid #d9d9d9",
        borderRadius: "4px",
      }}
    />
  );
}
