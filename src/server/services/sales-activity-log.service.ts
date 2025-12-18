// src/server/services/sales-activity-log.service.ts
import { ServiceError } from "./errors";
import {
  CreateActivityLogRequestSchema,
  UpdateActivityLogRequestSchema,
  ActivityLogResponseSchema,
  ActivityLogsListResponseSchema,
} from "@/shared/validation/sales-activity-log.schema";
import type { UserCore } from "@/shared/types/user";
import { salesActivityLogRepo } from "@/server/repos/sales-activity-log.repo";
import { consultedServiceRepo } from "@/server/repos/consulted-service.repo";

/**
 * Require authenticated user
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
 * Map activity log to response
 */
function mapActivityLogToResponse(log: {
  id: string;
  consultedServiceId: string;
  contactType: string;
  contactDate: Date;
  content: string | null;
  nextContactDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  employee?: { id: string; fullName: string; avatarUrl: string | null } | null;
}) {
  return {
    id: log.id,
    consultedServiceId: log.consultedServiceId,
    contactType: log.contactType,
    contactDate: log.contactDate.toISOString(),
    content: log.content,
    nextContactDate: log.nextContactDate
      ? log.nextContactDate.toISOString().split("T")[0]
      : null,
    employee: log.employee
      ? {
          id: log.employee.id,
          fullName: log.employee.fullName,
          avatarUrl: log.employee.avatarUrl ?? null,
        }
      : null,
    createdAt: log.createdAt.toISOString(),
    updatedAt: log.updatedAt.toISOString(),
  };
}

export const salesActivityLogService = {
  /**
   * Create a new activity log
   */
  async create(currentUser: UserCore | null, body: unknown) {
    requireAuth(currentUser);

    const parsed = CreateActivityLogRequestSchema.parse(body);

    // 1. Verify consulted service exists and user has access
    const service = await consultedServiceRepo.findById(
      parsed.consultedServiceId
    );
    if (!service) {
      throw new ServiceError("NOT_FOUND", "Không tìm thấy dịch vụ tư vấn", 404);
    }

    // 2. Permission check - can only create logs for own clinic services
    if (currentUser!.role !== "admin") {
      if (service.clinicId !== currentUser!.clinicId) {
        throw new ServiceError(
          "PERMISSION_DENIED",
          "Bạn chỉ có thể tạo activity log cho dịch vụ trong chi nhánh của mình",
          403
        );
      }
    }

    // 3. Create activity log
    const created = await salesActivityLogRepo.create({
      ...parsed,
      employeeId: currentUser!.employeeId!,
    });

    const mapped = mapActivityLogToResponse(created);
    return ActivityLogResponseSchema.parse(mapped);
  },

  /**
   * Update an existing activity log
   */
  async update(id: string, currentUser: UserCore | null, body: unknown) {
    requireAuth(currentUser);

    const parsed = UpdateActivityLogRequestSchema.parse(body);

    // 1. Fetch existing log
    const existing = await salesActivityLogRepo.findById(id);
    if (!existing) {
      throw new ServiceError("NOT_FOUND", "Không tìm thấy activity log", 404);
    }

    // 2. Permission check - can only edit own logs or admin can edit all
    if (currentUser!.role !== "admin") {
      if (existing.employeeId !== currentUser!.employeeId) {
        throw new ServiceError(
          "PERMISSION_DENIED",
          "Bạn chỉ có thể sửa activity log của chính mình",
          403
        );
      }
      if (existing.consultedService.clinicId !== currentUser!.clinicId) {
        throw new ServiceError(
          "PERMISSION_DENIED",
          "Bạn chỉ có thể sửa activity log trong chi nhánh của mình",
          403
        );
      }
    }

    // 3. Update
    const updated = await salesActivityLogRepo.update(id, parsed);

    const mapped = mapActivityLogToResponse(updated);
    return ActivityLogResponseSchema.parse(mapped);
  },

  /**
   * Delete an activity log
   */
  async delete(id: string, currentUser: UserCore | null) {
    requireAuth(currentUser);

    // 1. Fetch existing log
    const existing = await salesActivityLogRepo.findById(id);
    if (!existing) {
      throw new ServiceError("NOT_FOUND", "Không tìm thấy activity log", 404);
    }

    // 2. Permission check - can only delete own logs or admin can delete all
    if (currentUser!.role !== "admin") {
      if (existing.employeeId !== currentUser!.employeeId) {
        throw new ServiceError(
          "PERMISSION_DENIED",
          "Bạn chỉ có thể xóa activity log của chính mình",
          403
        );
      }
      if (existing.consultedService.clinicId !== currentUser!.clinicId) {
        throw new ServiceError(
          "PERMISSION_DENIED",
          "Bạn chỉ có thể xóa activity log trong chi nhánh của mình",
          403
        );
      }
    }

    // 3. Delete
    await salesActivityLogRepo.delete(id);

    return { success: true, message: "Đã xóa activity log" };
  },

  /**
   * Get activity logs for a consulted service
   */
  async listByConsultedServiceId(
    consultedServiceId: string,
    currentUser: UserCore | null
  ) {
    requireAuth(currentUser);

    // 1. Verify consulted service exists and user has access
    const service = await consultedServiceRepo.findById(consultedServiceId);
    if (!service) {
      throw new ServiceError("NOT_FOUND", "Không tìm thấy dịch vụ tư vấn", 404);
    }

    // 2. Permission check
    if (currentUser!.role !== "admin") {
      if (service.clinicId !== currentUser!.clinicId) {
        throw new ServiceError(
          "PERMISSION_DENIED",
          "Bạn chỉ có thể xem activity log trong chi nhánh của mình",
          403
        );
      }
    }

    // 3. Get logs
    const { items, count } =
      await salesActivityLogRepo.listByConsultedServiceId(consultedServiceId);

    const mappedItems = items.map(mapActivityLogToResponse);

    const response = { items: mappedItems, count };
    return ActivityLogsListResponseSchema.parse(response);
  },

  /**
   * Get activity logs for current employee
   */
  async listMyActivities(currentUser: UserCore | null, limit = 50) {
    requireAuth(currentUser);

    const { items, count } = await salesActivityLogRepo.listByEmployeeId(
      currentUser!.employeeId!,
      limit
    );

    const mappedItems = items.map((log) => ({
      ...mapActivityLogToResponse(log),
      consultedService: log.consultedService
        ? {
            id: log.consultedService.id,
            consultedServiceName: log.consultedService.consultedServiceName,
            customer: log.consultedService.customer
              ? {
                  id: log.consultedService.customer.id,
                  fullName: log.consultedService.customer.fullName,
                  phone: log.consultedService.customer.phone,
                }
              : null,
          }
        : null,
    }));

    return { items: mappedItems, count };
  },
};
