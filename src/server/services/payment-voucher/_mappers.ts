// src/server/services/payment-voucher/_mappers.ts
import type { PaymentVoucher, PaymentVoucherDetail } from "@prisma/client";
import type { PaymentVoucherResponse } from "@/shared/validation/payment-voucher.schema";

/**
 * Type for payment voucher with relations
 */
type PaymentVoucherWithRelations = PaymentVoucher & {
  customer: {
    id: string;
    fullName: string;
    customerCode: string | null;
    phone: string | null;
    clinicId: string | null;
  };
  cashier: {
    id: string;
    fullName: string;
  };
  clinic: {
    id: string;
    name: string;
    shortName: string | null;
  };
  details: (PaymentVoucherDetail & {
    consultedService: {
      id: string;
      consultedServiceName: string;
      finalPrice: number;
    };
  })[];
  createdBy: {
    id: string;
    fullName: string;
  };
  updatedBy: {
    id: string;
    fullName: string;
  };
};

/**
 * Map payment voucher from Prisma to API response
 */
export function mapPaymentVoucherToResponse(
  voucher: PaymentVoucherWithRelations
): PaymentVoucherResponse {
  return {
    id: voucher.id,
    paymentNumber: voucher.paymentNumber,
    customer: {
      id: voucher.customerId,
      fullName: voucher.customer.fullName,
      code: voucher.customer.customerCode || "",
    },
    paymentDate: voucher.paymentDate.toISOString(),
    totalAmount: voucher.totalAmount,
    notes: voucher.notes,
    cashier: {
      id: voucher.cashierId,
      fullName: voucher.cashier.fullName,
    },
    clinic: {
      id: voucher.clinic.id,
      name: voucher.clinic.name,
      shortName: voucher.clinic.shortName ?? voucher.customer.clinicId ?? "", // Fallback
    },
    customerClinicId: voucher.customer.clinicId, // Customer's current clinic for permission checks
    details: voucher.details.map((detail) => ({
      id: detail.id,
      consultedServiceId: detail.consultedServiceId,
      consultedServiceName: detail.consultedService.consultedServiceName,
      consultedServiceFinalPrice: detail.consultedService.finalPrice,
      amount: detail.amount,
      paymentMethod: detail.paymentMethod,
      createdAt: detail.createdAt.toISOString(),
    })),
    createdBy: {
      id: voucher.createdById,
      fullName: voucher.createdBy.fullName,
    },
    updatedBy: {
      id: voucher.updatedById,
      fullName: voucher.updatedBy.fullName,
    },
    createdAt: voucher.createdAt.toISOString(),
    updatedAt: voucher.updatedAt.toISOString(),
  };
}
