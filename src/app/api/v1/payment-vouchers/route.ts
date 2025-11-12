// src/app/api/v1/payment-vouchers/route.ts
import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/utils/sessionCache";
import { paymentVoucherService } from "@/server/services/payment-voucher.service";
import { ServiceError } from "@/server/services/errors";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

/**
 * GET /api/v1/payment-vouchers - List payment vouchers with filters
 * Query params: customerId, clinicId, search, page, pageSize, sortField, sortDirection
 * Used by: usePaymentVouchers() hook
 * Validation: Handled by service layer
 * Cache: No cache (financial data)
 */
export async function GET(req: Request) {
  try {
    const user = await getSessionUser();

    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams);

    const data = await paymentVoucherService.list(user, query);

    return NextResponse.json(data, { status: 200 });
  } catch (e: unknown) {
    if (e instanceof ServiceError) {
      return NextResponse.json(
        { error: e.message, code: e.code },
        { status: e.httpStatus }
      );
    }
    return NextResponse.json(
      { error: COMMON_MESSAGES.SERVER_ERROR },
      { status: 500 }
    );
  }
}

// POST removed - Use createPaymentVoucherAction() Server Action instead
