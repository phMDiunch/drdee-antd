// src/app/api/v1/customers/[id]/unpaid-services/route.ts
import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/utils/sessionCache";
import { paymentVoucherService } from "@/server/services/payment-voucher.service";
import { ServiceError } from "@/server/services/errors";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

/**
 * GET /api/v1/customers/[id]/unpaid-services - Get unpaid services for customer
 * Used by: useUnpaidServices() hook
 * Validation: Handled by service layer
 * Cache: No cache (financial data - real-time debt calculation)
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    const { id } = await params;
    const data = await paymentVoucherService.getUnpaidServices(id, user);

    return NextResponse.json(data, { status: 200 });
  } catch (e: unknown) {
    if (e instanceof ServiceError) {
      return NextResponse.json(
        { error: e.message, code: e.code },
        { status: e.httpStatus }
      );
    }

    console.error("Unexpected error in GET /unpaid-services:", e);
    return NextResponse.json(
      { error: COMMON_MESSAGES.SERVER_ERROR },
      { status: 500 }
    );
  }
}
