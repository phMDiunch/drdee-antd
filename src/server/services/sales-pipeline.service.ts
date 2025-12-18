// src/server/services/sales-pipeline.service.ts
import { ServiceError } from "./errors";
import {
  CreateSalesActivityRequestSchema,
  GetSalesPipelineQuerySchema,
  ClaimPipelineRequestSchema,
  ReassignSaleRequestSchema,
} from "@/shared/validation/sales-activity.schema";
import type { UserCore } from "@/shared/types/user";
import {
  salesPipelineRepo,
  salesActivityRepo,
} from "@/server/repos/sales-pipeline.repo";
import type { SalesActivityCreateInput } from "@/server/repos/sales-pipeline.repo";
import {
  mapSalesActivityToResponse,
  mapSalesActivitiesToListResponse,
  mapPipelineServiceToResponse,
} from "./sales-pipeline/_mappers";
import { prisma } from "@/services/prisma/prisma";

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
 * Require admin role
 */
function requireAdmin(user: UserCore | null | undefined) {
  requireAuth(user);
  if (user!.role !== "admin") {
    throw new ServiceError(
      "FORBIDDEN",
      "Bạn không có quyền thực hiện thao tác này",
      403
    );
  }
}

export const salesPipelineService = {
  /**
   * Get pipeline services for dashboard (month view)
   */
  async listPipelineServices(currentUser: UserCore | null, query: unknown) {
    requireAuth(currentUser);

    const parsed = GetSalesPipelineQuerySchema.parse(query);

    // Calculate date range from month string (YYYY-MM)
    const [year, month] = parsed.month.split("-").map(Number);
    const dateStart = new Date(year, month - 1, 1);
    dateStart.setHours(0, 0, 0, 0);

    const dateEnd = new Date(year, month, 0); // Last day of month
    dateEnd.setHours(23, 59, 59, 999);

    // Determine filters based on role
    const isAdmin = currentUser!.role === "admin";
    const clinicId = isAdmin
      ? parsed.clinicId ?? undefined
      : currentUser!.clinicId ?? undefined;
    const saleId = isAdmin ? undefined : currentUser!.employeeId ?? undefined;

    const { items, count } = await salesPipelineRepo.listPipelineServices({
      clinicId,
      dateStart,
      dateEnd,
      saleId,
    });

    // Fetch latest activities for all services (batch to avoid N+1)
    const serviceIds = items.map((item) => item.id);
    const latestActivities =
      await salesPipelineRepo.getLatestActivitiesForServices(serviceIds);

    // Calculate statistics
    const stats = {
      totalCustomers: new Set(items.map((item) => item.customerId)).size,
      totalServices: count,
      unconfirmedServices: items.filter(
        (item) => item.serviceStatus === "Chưa chốt"
      ).length,
      confirmedServices: items.filter(
        (item) => item.serviceStatus === "Đã chốt"
      ).length,
    };

    return {
      items: items.map((item) => {
        const latestActivity = latestActivities[item.id];
        return {
          ...mapPipelineServiceToResponse(item),
          latestActivity: latestActivity
            ? mapSalesActivityToResponse(latestActivity)
            : null,
        };
      }),
      stats,
    };
  },

  /**
   * Claim a pipeline service (assign sale to self)
   */
  async claimService(currentUser: UserCore | null, body: unknown) {
    requireAuth(currentUser);

    const parsed = ClaimPipelineRequestSchema.parse(body);

    // 1. Validate consulted service exists
    const service = await salesPipelineRepo.findById(parsed.consultedServiceId);
    if (!service) {
      throw new ServiceError(
        "SERVICE_NOT_FOUND",
        "Dịch vụ tư vấn không tồn tại",
        404
      );
    }

    // 2. Check if service requires follow-up
    if (!service.dentalService.requiresFollowUp) {
      throw new ServiceError(
        "NOT_PIPELINE_SERVICE",
        "Dịch vụ này không cần quản lý trong pipeline",
        422
      );
    }

    // 3. Check if already claimed
    if (service.consultingSaleId !== null) {
      throw new ServiceError(
        "ALREADY_CLAIMED",
        "Dịch vụ đã được nhận bởi sale khác",
        409
      );
    }

    // 4. Claim the service
    const updated = await salesPipelineRepo.claimService(
      parsed.consultedServiceId,
      currentUser!.employeeId!
    );

    return mapPipelineServiceToResponse(updated);
  },

  /**
   * Reassign a pipeline service to a new sale (admin only)
   */
  async reassignService(currentUser: UserCore | null, body: unknown) {
    requireAdmin(currentUser);

    const parsed = ReassignSaleRequestSchema.parse(body);

    // 1. Validate consulted service exists
    const service = await salesPipelineRepo.findById(parsed.consultedServiceId);
    if (!service) {
      throw new ServiceError(
        "SERVICE_NOT_FOUND",
        "Dịch vụ tư vấn không tồn tại",
        404
      );
    }

    // 2. Validate new sale exists and is active
    const newSale = await prisma.employee.findUnique({
      where: { id: parsed.newSaleId },
      select: { id: true, employeeStatus: true },
    });

    if (!newSale) {
      throw new ServiceError(
        "EMPLOYEE_NOT_FOUND",
        "Nhân viên không tồn tại",
        404
      );
    }

    if (newSale.employeeStatus !== "Đang làm việc") {
      throw new ServiceError(
        "EMPLOYEE_INACTIVE",
        "Nhân viên này hiện không làm việc",
        422
      );
    }

    // 3. Check if already assigned to this sale
    if (service.consultingSaleId === parsed.newSaleId) {
      throw new ServiceError(
        "ALREADY_ASSIGNED",
        "Dịch vụ đã được phân công cho sale này",
        422
      );
    }

    // 4. Reassign the service
    const updated = await salesPipelineRepo.reassignService(
      parsed.consultedServiceId,
      parsed.newSaleId,
      currentUser!.employeeId!
    );

    return mapPipelineServiceToResponse(updated);
  },

  /**
   * Create a sales activity log
   */
  async createActivity(
    currentUser: UserCore | null,
    consultedServiceId: string,
    body: unknown
  ) {
    requireAuth(currentUser);

    const parsed = CreateSalesActivityRequestSchema.parse({
      ...(body as object),
      consultedServiceId,
    });

    // 1. Validate consulted service exists
    const service = await salesPipelineRepo.findById(consultedServiceId);
    if (!service) {
      throw new ServiceError(
        "SERVICE_NOT_FOUND",
        "Dịch vụ tư vấn không tồn tại",
        404
      );
    }

    // 2. Check permissions
    const isAdmin = currentUser!.role === "admin";
    const isAssignedSale = service.consultingSaleId === currentUser!.employeeId;

    if (!isAdmin && !isAssignedSale) {
      throw new ServiceError(
        "FORBIDDEN",
        "Bạn không có quyền ghi nhận hoạt động cho dịch vụ này",
        403
      );
    }

    // 3. Create activity
    const data: SalesActivityCreateInput = {
      consultedServiceId: parsed.consultedServiceId,
      employeeId: currentUser!.employeeId!,
      contactType: parsed.contactType,
      content: parsed.content,
      nextContactDate: parsed.nextContactDate ?? undefined,
    };

    const created = await salesActivityRepo.create(data);

    return mapSalesActivityToResponse(created);
  },

  /**
   * Get activities for a consulted service
   */
  async getActivitiesByService(
    currentUser: UserCore | null,
    consultedServiceId: string
  ) {
    requireAuth(currentUser);

    // 1. Validate consulted service exists
    const service = await salesPipelineRepo.findById(consultedServiceId);
    if (!service) {
      throw new ServiceError(
        "SERVICE_NOT_FOUND",
        "Dịch vụ tư vấn không tồn tại",
        404
      );
    }

    // 2. Check permissions (admin or assigned sale)
    const isAdmin = currentUser!.role === "admin";
    const isAssignedSale = service.consultingSaleId === currentUser!.employeeId;

    if (!isAdmin && !isAssignedSale) {
      throw new ServiceError(
        "FORBIDDEN",
        "Bạn không có quyền xem hoạt động của dịch vụ này",
        403
      );
    }

    // 3. Get activities
    const activities = await salesActivityRepo.listByConsultedService(
      consultedServiceId
    );

    return mapSalesActivitiesToListResponse(activities);
  },
};
