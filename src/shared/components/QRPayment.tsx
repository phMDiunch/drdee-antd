// src/shared/components/QRPayment.tsx
"use client";

import React from "react";
import { generateVietQRUrl, BANK_CONFIG } from "@/shared/constants/payment";

interface QRPaymentProps {
  amount: number;
  voucherCode: string;
  size?: number;
  showLabel?: boolean;
}

/**
 * QR Payment Component
 * Generates dynamic VietQR code with pre-filled payment information
 * When customer scans: auto-fills account, amount, and description
 */
export default function QRPayment({
  amount,
  voucherCode,
  size = 100,
  showLabel = false,
}: QRPaymentProps) {
  const qrUrl = generateVietQRUrl(amount, voucherCode);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "4px",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
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
      {showLabel && (
        <div
          style={{
            fontSize: "10px",
            color: "#666",
            textAlign: "center",
            lineHeight: "1.2",
          }}
        >
          <div style={{ fontWeight: 500 }}>Quét mã thanh toán</div>
          <div>{BANK_CONFIG.ACCOUNT_NAME}</div>
        </div>
      )}
    </div>
  );
}
