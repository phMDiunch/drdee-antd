// src/server/services/sales-activity.service.ts
import { ServiceError } from "./errors";
import {
  CreateSalesActivityRequestSchema,
  UpdateSalesActivityRequestSchema,
  GetSalesActivitiesQuerySchema,
  SalesActivityResponseSchema,
  SalesActivitiesListResponseSchema,
} from "@/shared/validation/sales-activity.schema";
import type { UserCore } from "@/shared/types/user";
import { salesActivityRepo } from "@/server/repos/sales-activity.repo";
import type {
  SalesActivityCreateInput,
  SalesActivityUpdateInput,
} from "@/server/repos/sales-activity.repo";
import { mapSalesActivityToResponse } from "./sales-activity/_mappers";
import { consultedServiceRepo } from "@/server/repos/consulted-service.repo";
import type { Prisma } from "@prisma/client";

/**
 * Require authenticated user (not just admin)
 */
function requireAuth(user: UserCore | null | undefined) {
  if (!user) {
    throw new ServiceError("UNAUTHORIZED", "Bạn chưa đăng nhập", 401);
  }
  if (!user.employeeId) {
    throw new ServiceError(
      "MISSING_EMPLOYEE_ID",
      "Tài khoản chưa được liên kết với nhân viên",
      403
    );
  }
}

/**
 * Check if user can access consulted service (service ownership)
 * Validates that the current user has permission to create activities for this service
 *
 * Permission Rules:
 * - Admin: Can access all services
 * - Employee: Can only access services where they are consultingSale or saleOnline
 *
 * @throws ServiceError if service not found or permission denied
 */
async function checkServiceOwnership(
  user: UserCore,
  consultedServiceId: string
): Promise<void> {
  const service = await consultedServiceRepo.findById(consultedServiceId);

  if (!service) {
    throw new ServiceError(
      "SERVICE_NOT_FOUND",
      "Không tìm thấy dịch vụ tư vấn",
      404
    );
  }

  // Admin can access all
  if (user.role === "admin") {
    return;
  }

  // Employee: Check service ownership
  const isOwner =
    service.consultingSaleId === user.employeeId ||
    service.saleOnlineId === user.employeeId;

  if (!isOwner) {
    throw new ServiceError(
      "PERMISSION_DENIED",
      "Bạn không có quyền tạo hoạt động cho dịch vụ này",
      403
    );
  }
}

/**
 * Check if user can edit/delete this activity
 * Validates record ownership and time window constraints
 *
 * Permission Rules:
 * - Admin: Can edit/delete any activity at any time
 * - Employee: Can only edit/delete their own activities within time window
 *
 * Time Windows:
 * - Edit: 7 days from creation
 * - Delete: 24 hours (1 day) from creation
 *
 * @param user - Current user
 * @param activity - Activity to check
 * @param maxDaysEdit - Maximum days since creation allowed for edit/delete
 * @throws ServiceError if permission denied or time window expired
 */
function checkRecordOwnership(
  user: UserCore,
  activity: { saleId: string; createdAt: Date },
  maxDaysEdit: number
): void {
  // Admin can do anything
  if (user.role === "admin") {
    return;
  }

  // Employee: Check record ownership
  if (activity.saleId !== user.employeeId) {
    throw new ServiceError(
      "PERMISSION_DENIED",
      "Bạn chỉ có thể chỉnh sửa hoạt động của mình",
      403
    );
  }

  // Check timeframe
  const now = new Date();
  const daysSinceCreation =
    (now.getTime() - activity.createdAt.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceCreation > maxDaysEdit) {
    throw new ServiceError(
      "EDIT_WINDOW_EXPIRED",
      `Bạn chỉ có thể chỉnh sửa trong vòng ${maxDaysEdit} ngày kể từ khi tạo`,
      403
    );
  }
}

/**
 * Build permission filter for list queries
 * Constructs Prisma where clause based on user role and permissions
 *
 * Filter Logic:
 * - Admin: No filter (returns undefined to see all activities)
 * - Employee: Filter by service ownership (consultingSaleId OR saleOnlineId)
 *
 * @param user - Current user
 * @returns Prisma where input or undefined for admin
 */
function buildPermissionFilter(
  user: UserCore
): Prisma.SalesActivityLogWhereInput | undefined {
  if (user.role === "admin") {
    return undefined; // No filter for admin
  }

  // Employee: Filter by service ownership
  return {
    consultedService: {
      OR: [
        { consultingSaleId: user.employeeId },
        { saleOnlineId: user.employeeId },
      ],
    },
  };
}

export const salesActivityService = {
  /**
   * Create new sales activity log
   *
   * Process:
   * 1. Validate request body
   * 2. Check service ownership permission
   * 3. Auto-fill saleId from current user
   * 4. Create activity record
   * 5. Return validated response
   */
  async create(currentUser: UserCore | null, body: unknown) {
    requireAuth(currentUser);

    const parsed = CreateSalesActivityRequestSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      throw new ServiceError(
        "VALIDATION_ERROR",
        firstError?.message || "Dữ liệu không hợp lệ",
        400
      );
    }

    const data = parsed.data;

    // Check service ownership (permission)
    await checkServiceOwnership(currentUser!, data.consultedServiceId);

    // Prepare create input
    const createInput: SalesActivityCreateInput = {
      ...data,
      saleId: currentUser!.employeeId!, // Auto-fill from current user
    };

    // Create activity
    const created = await salesActivityRepo.create(createInput);

    // Map and validate response
    const mapped = mapSalesActivityToResponse(created);
    return SalesActivityResponseSchema.parse(mapped);
  },

  /**
   * Update sales activity log
   *
   * Process:
   * 1. Validate request body
   * 2. Fetch existing record
   * 3. Check record ownership and time window (7 days)
   * 4. Update activity
   * 5. Return validated response
   */
  async update(currentUser: UserCore | null, id: string, body: unknown) {
    requireAuth(currentUser);

    const parsed = UpdateSalesActivityRequestSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      throw new ServiceError(
        "VALIDATION_ERROR",
        firstError?.message || "Dữ liệu không hợp lệ",
        400
      );
    }

    const data = parsed.data;

    // Fetch existing record
    const existing = await salesActivityRepo.findById(id);
    if (!existing) {
      throw new ServiceError(
        "NOT_FOUND",
        "Không tìm thấy hoạt động liên hệ",
        404
      );
    }

    // Check record ownership (7 days edit window)
    checkRecordOwnership(currentUser!, existing, 7);

    // Prepare update input
    const updateInput: SalesActivityUpdateInput = data;

    // Update activity
    const updated = await salesActivityRepo.update(id, updateInput);

    // Map and validate response
    const mapped = mapSalesActivityToResponse(updated);
    return SalesActivityResponseSchema.parse(mapped);
  },

  /**
   * Delete sales activity log
   *
   * Process:
   * 1. Fetch existing record
   * 2. Check record ownership and time window (24 hours)
   * 3. Hard delete activity
   *
   * Note: Only allows deletion within 24 hours of creation
   */
  async delete(currentUser: UserCore | null, id: string) {
    requireAuth(currentUser);

    // Fetch existing record
    const existing = await salesActivityRepo.findById(id);
    if (!existing) {
      throw new ServiceError(
        "NOT_FOUND",
        "Không tìm thấy hoạt động liên hệ",
        404
      );
    }

    // Check record ownership (24 hours = 1 day delete window)
    checkRecordOwnership(currentUser!, existing, 1);

    // Delete activity
    await salesActivityRepo.delete(id);
  },

  /**
   * List sales activities with filters and pagination
   *
   * Process:
   * 1. Validate query parameters
   * 2. Build permission filter based on user role
   * 3. Fetch activities with filters
   * 4. Map and validate response
   *
   * Filters:
   * - customerId: Filter by customer
   * - consultedServiceId: Filter by consulted service
   * - saleId: Filter by sale employee
   * - pageSize: Limit results (default: 200)
   * - sortField: Sort field (default: contactDate)
   * - sortDirection: Sort direction (default: desc)
   */
  async list(currentUser: UserCore | null, query: unknown) {
    requireAuth(currentUser);

    const parsed = GetSalesActivitiesQuerySchema.parse(query);

    // Build permission filter
    const permissionFilter = buildPermissionFilter(currentUser!);

    // Fetch activities
    const { items, total } = await salesActivityRepo.list({
      customerId: parsed.customerId,
      consultedServiceId: parsed.consultedServiceId,
      saleId: parsed.saleId,
      pageSize: parsed.pageSize,
      sortField: parsed.sortField,
      sortDirection: parsed.sortDirection,
      permissionFilter,
    });

    // Map to response
    const mappedItems = items.map(mapSalesActivityToResponse);

    // Validate and return response
    const response = {
      items: mappedItems,
      total,
    };

    return SalesActivitiesListResponseSchema.parse(response);
  },

  /**
   * Get sales activities by consulted service (for Customer Detail tab)
   *
   * Process:
   * 1. Check service ownership permission
   * 2. Fetch all activities for the service
   * 3. Return mapped results (no validation needed - internal use)
   *
   * Used in: Customer Detail page - Sales Activities tab
   * Returns: All activities ordered by contactDate DESC, limit 200
   */
  async getByConsultedService(
    currentUser: UserCore | null,
    consultedServiceId: string
  ) {
    requireAuth(currentUser);

    // Check service ownership (permission)
    await checkServiceOwnership(currentUser!, consultedServiceId);

    // Fetch activities
    const items = await salesActivityRepo.findByConsultedService(
      consultedServiceId
    );

    // Map to response (no schema validation - internal use only)
    return items.map(mapSalesActivityToResponse);
  },
};
