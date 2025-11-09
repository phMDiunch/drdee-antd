// src/app/api/v1/customers/[id]/route.ts
import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/utils/sessionCache";
import { customerService } from "@/server/services/customer.service";
import { ServiceError } from "@/server/services/errors";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/v1/customers/[id]
 * Get customer detail with full relations (primaryContact, sourceEmployee, sourceCustomer)
 * Permissions: Employee can view their clinic's customers, Admin can view all
 */
export async function GET(_req: Request, props: Params) {
  try {
    const params = await props.params;

    const currentUser = await getSessionUser();
    const data = await customerService.getById(currentUser, params.id);

    return NextResponse.json(data, { status: 200 });
  } catch (e) {
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

// PATCH removed - Use updateCustomerAction() Server Action instead
