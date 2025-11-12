// src/features/customers/utils/financialSummary.ts

import type { ConsultedServiceResponse } from "@/shared/validation/consulted-service.schema";

export interface FinancialSummary {
  totalAmount: number;
  amountPaid: number;
  debt: number;
}

/**
 * Format currency to Vietnamese format
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
}

/**
 * Calculate financial summary from confirmed consulted services
 * Data source: consultedServices where serviceStatus === "Đã chốt"
 *
 * @param consultedServices Array of consulted services
 * @returns Financial summary object
 */
export function calculateFinancialSummary(
  consultedServices?: ConsultedServiceResponse[]
): FinancialSummary {
  if (!consultedServices || consultedServices.length === 0) {
    return {
      totalAmount: 0,
      amountPaid: 0,
      debt: 0,
    };
  }

  // Filter only confirmed services
  const confirmedServices = consultedServices.filter(
    (service) => service.serviceStatus === "Đã chốt"
  );

  // Calculate totals
  const totalAmount = confirmedServices.reduce(
    (sum, service) => sum + service.finalPrice,
    0
  );

  const amountPaid = confirmedServices.reduce(
    (sum, service) => sum + service.amountPaid,
    0
  );

  const debt = totalAmount - amountPaid;

  return {
    totalAmount,
    amountPaid,
    debt,
  };
}

/**
 * Format financial summary for display
 *
 * @param summary Financial summary object
 * @returns Formatted display data
 */
export function formatFinancialSummary(summary: FinancialSummary) {
  return {
    totalAmount: {
      label: "💰 Tổng tiền",
      value: formatCurrency(summary.totalAmount),
      color: "#1890ff",
    },
    amountPaid: {
      label: "✅ Đã trả",
      value: formatCurrency(summary.amountPaid),
      color: "#52c41a",
    },
    debt: {
      label: "⚠️ Còn nợ",
      value: formatCurrency(summary.debt),
      color: summary.debt > 0 ? "#ff4d4f" : "#52c41a",
    },
  };
}

/**
 * Check if customer has any confirmed services
 * Used for empty state display
 *
 * @param consultedServices Array of consulted services
 * @returns true if has confirmed services, false otherwise
 */
export function hasConfirmedServices(
  consultedServices?: ConsultedServiceResponse[]
): boolean {
  if (!consultedServices || consultedServices.length === 0) return false;

  return consultedServices.some(
    (service) => service.serviceStatus === "Đã chốt"
  );
}
