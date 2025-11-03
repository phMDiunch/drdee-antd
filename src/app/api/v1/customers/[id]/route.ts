// src/app/api/v1/customers/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/server/services/auth.service";
import { customerService } from "@/server/services/customer.service";
import { ServiceError } from "@/server/services/errors";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/v1/customers/[id]
 * Get customer detail with full relations (primaryContact, sourceEmployee, sourceCustomer)
 * Permissions: Employee can view their clinic's customers, Admin can view all
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const currentUser = await getSessionUser();
    const { id } = await context.params;

    const customer = await customerService.getById(currentUser, id);
    return NextResponse.json(customer);
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.httpStatus }
      );
    }

    return NextResponse.json(
      { error: COMMON_MESSAGES.SERVER_ERROR },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v1/customers/[id]
 * Update customer with validation and audit trail
 * Immutable fields (customerCode, clinicId) are rejected
 * Permissions: Employee can update their clinic's customers, Admin can update all
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const currentUser = await getSessionUser();
    const { id } = await context.params;
    const body = await request.json();

    // Check for immutable fields in request
    if ("customerCode" in body || "clinicId" in body) {
      return NextResponse.json(
        {
          error: "Không được phép thay đổi mã khách hàng hoặc chi nhánh",
          code: "IMMUTABLE_FIELD",
        },
        { status: 400 }
      );
    }

    const customer = await customerService.update(currentUser, id, body);
    return NextResponse.json(customer);
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.httpStatus }
      );
    }

    return NextResponse.json(
      { error: COMMON_MESSAGES.SERVER_ERROR },
      { status: 500 }
    );
  }
}
