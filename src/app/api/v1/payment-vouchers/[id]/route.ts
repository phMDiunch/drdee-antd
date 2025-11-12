// src/app/api/v1/payment-vouchers/[id]/route.ts
import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/utils/sessionCache";
import { paymentVoucherService } from "@/server/services/payment-voucher.service";
import { ServiceError } from "@/server/services/errors";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

/**
 * GET /api/v1/payment-vouchers/[id] - Get payment voucher by ID
 * Used by: usePaymentVoucher() hook
 * Validation: Handled by service layer
 * Cache: No cache (financial data)
 */

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, props: Params) {
  try {
    const params = await props.params;

    const user = await getSessionUser();
    const data = await paymentVoucherService.getById(user, params.id);

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

// PUT removed - Use updatePaymentVoucherAction() Server Action instead
// DELETE removed - Use deletePaymentVoucherAction() Server Action instead
