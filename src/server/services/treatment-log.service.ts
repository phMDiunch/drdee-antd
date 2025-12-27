// src/server/services/treatment-log.service.ts
import { ServiceError } from "./errors";
import {
  CreateTreatmentLogRequestSchema,
  UpdateTreatmentLogRequestSchema,
  GetTreatmentLogsQuerySchema,
  GetCheckedInAppointmentsQuerySchema,
  TreatmentLogResponseSchema,
  CheckedInAppointmentsListResponseSchema,
} from "@/shared/validation/treatment-log.schema";
import type { UserCore } from "@/shared/types/user";
import { treatmentLogRepo } from "@/server/repos/treatment-log.repo";
import type {
  TreatmentLogCreateInput,
  TreatmentLogUpdateInput,
} from "@/server/repos/treatment-log.repo";
import {
  mapTreatmentLogToResponse,
  mapAppointmentForTreatmentToResponse,
} from "./treatment-log/_mappers";
import { prisma } from "@/services/prisma/prisma";
import { treatmentLogPermissions } from "@/shared/permissions/treatment-log.permissions";
import { consultedServiceRepo } from "@/server/repos/consulted-service.repo";
import type { TreatmentStatus } from "@/shared/validation/treatment-log.schema";

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
 * Auto-update ConsultedService.treatmentStatus based on TreatmentLogs
 *
 * Logic (Phương án B Option 1):
 * - No logs → "Chưa điều trị"
 * - Has logs → Status of the LATEST treatment log (by treatmentDate DESC)
 */
async function updateConsultedServiceTreatmentStatus(
  consultedServiceId: string
): Promise<void> {
  // 1. Get all treatment logs for this consulted service (ordered by treatmentDate DESC)
  const logs = await treatmentLogRepo.findByConsultedService(
    consultedServiceId
  );

  // 2. Calculate status based on latest log
  let status: TreatmentStatus;
  if (logs.length === 0) {
    status = "Chưa điều trị";
  } else {
    // Take status from the latest log (first item since ordered DESC)
    status = logs[0].treatmentStatus as TreatmentStatus;
  }

  // 3. Update consulted service
  await consultedServiceRepo.update(consultedServiceId, {
    treatmentStatus: status,
  });
}

export const treatmentLogService = {
  /**
   * Create new treatment log
   */
  async create(currentUser: UserCore | null, body: unknown) {
    requireAuth(currentUser);

    const parsed = CreateTreatmentLogRequestSchema.parse(body);

    // 1. Validate appointment exists and is checked-in
    const appointment = await prisma.appointment.findUnique({
      where: { id: parsed.appointmentId },
      select: {
        id: true,
        customerId: true,
        clinicId: true,
        appointmentDateTime: true,
        checkInTime: true,
        status: true,
      },
    });

    if (!appointment) {
      throw new ServiceError(
        "APPOINTMENT_NOT_FOUND",
        "Buổi hẹn không tồn tại",
        422
      );
    }

    if (
      !appointment.checkInTime ||
      (appointment.status !== "Đã đến" && appointment.status !== "Đến đột xuất")
    ) {
      throw new ServiceError(
        "APPOINTMENT_NOT_CHECKED_IN",
        "Buổi hẹn chưa check-in, không thể tạo lịch sử điều trị",
        422
      );
    }

    // 2. Validate consulted service exists and is confirmed
    const consultedService = await prisma.consultedService.findUnique({
      where: { id: parsed.consultedServiceId },
      select: {
        id: true,
        customerId: true,
        serviceStatus: true,
      },
    });

    if (!consultedService) {
      throw new ServiceError("SERVICE_NOT_FOUND", "Dịch vụ không tồn tại", 422);
    }

    if (consultedService.serviceStatus !== "Đã chốt") {
      throw new ServiceError(
        "SERVICE_NOT_CONFIRMED",
        "Dịch vụ chưa được chốt, không thể tạo lịch sử điều trị",
        422
      );
    }

    // 3. Validate appointment belongs to same customer
    if (appointment.customerId !== consultedService.customerId) {
      throw new ServiceError(
        "APPOINTMENT_CUSTOMER_MISMATCH",
        "Buổi hẹn và dịch vụ không cùng khách hàng",
        422
      );
    }

    // 4. Prepare data with server-controlled fields
    const data: TreatmentLogCreateInput = {
      ...parsed,
      customerId: consultedService.customerId,
      treatmentDate: appointment.appointmentDateTime,
      clinicId: appointment.clinicId, // Clinic where customer actually visited
      imageUrls: [],
      xrayUrls: [],
      createdById: currentUser!.employeeId!,
      updatedById: currentUser!.employeeId!,
    };

    // 5. Create treatment log
    const created = await treatmentLogRepo.create(data);

    // 6. Auto-update ConsultedService.treatmentStatus
    await updateConsultedServiceTreatmentStatus(parsed.consultedServiceId);

    // 7. Map and validate response
    const mapped = mapTreatmentLogToResponse(created);
    return TreatmentLogResponseSchema.parse(mapped);
  },

  /**
   * Get treatment log by ID
   */
  async getById(currentUser: UserCore | null, id: string) {
    requireAuth(currentUser);

    const log = await treatmentLogRepo.findById(id);

    if (!log) {
      throw new ServiceError(
        "TREATMENT_LOG_NOT_FOUND",
        "Lịch sử điều trị không tồn tại",
        404
      );
    }

    const mapped = mapTreatmentLogToResponse(log);
    return TreatmentLogResponseSchema.parse(mapped);
  },

  /**
   * List treatment logs with filters
   */
  async list(currentUser: UserCore | null, query: unknown) {
    requireAuth(currentUser);

    const parsed = GetTreatmentLogsQuerySchema.parse(query);

    const logs = await treatmentLogRepo.list({
      customerId: parsed.customerId,
      appointmentId: parsed.appointmentId,
    });

    const mappedLogs = logs.map((log) => mapTreatmentLogToResponse(log));

    return {
      items: mappedLogs,
    };
  },

  /**
   * Update treatment log
   */
  async update(currentUser: UserCore | null, id: string, body: unknown) {
    requireAuth(currentUser);

    const parsed = UpdateTreatmentLogRequestSchema.parse(body);

    // 1. Find existing treatment log
    const existing = await treatmentLogRepo.findById(id);

    if (!existing) {
      throw new ServiceError(
        "TREATMENT_LOG_NOT_FOUND",
        "Lịch sử điều trị không tồn tại",
        404
      );
    }

    // 2. Permission check: Employee can only edit own records
    const canEdit = treatmentLogPermissions.canEdit(currentUser, {
      id: existing.id,
      createdById: existing.createdById,
      clinicId: existing.clinicId,
    });

    if (!canEdit.allowed) {
      throw new ServiceError("PERMISSION_DENIED", canEdit.reason!, 403);
    }

    // 3. Prepare update data
    const data: TreatmentLogUpdateInput = {
      ...parsed,
      updatedById: currentUser!.employeeId!,
    };

    // 4. Update
    const updated = await treatmentLogRepo.update(id, data);

    // 5. Auto-update ConsultedService.treatmentStatus (use consultedServiceId from existing record)
    await updateConsultedServiceTreatmentStatus(existing.consultedServiceId);

    // 6. Map and validate response
    const mapped = mapTreatmentLogToResponse(updated);
    return TreatmentLogResponseSchema.parse(mapped);
  },

  /**
   * Delete treatment log
   */
  async delete(currentUser: UserCore | null, id: string) {
    requireAuth(currentUser);

    // 1. Find existing treatment log
    const existing = await treatmentLogRepo.findById(id);

    if (!existing) {
      throw new ServiceError(
        "TREATMENT_LOG_NOT_FOUND",
        "Lịch sử điều trị không tồn tại",
        404
      );
    }

    // 2. Permission check: Employee can only delete own records
    const canDelete = treatmentLogPermissions.canDelete(currentUser, {
      id: existing.id,
      createdById: existing.createdById,
      clinicId: existing.clinicId,
    });

    if (!canDelete.allowed) {
      throw new ServiceError("PERMISSION_DENIED", canDelete.reason!, 403);
    }

    // 3. Delete (hard delete)
    await treatmentLogRepo.delete(id);

    // 4. Auto-update ConsultedService.treatmentStatus (use consultedServiceId from existing record)
    await updateConsultedServiceTreatmentStatus(existing.consultedServiceId);

    return { success: true };
  },

  /**
   * Get checked-in appointments with consulted services and treatment logs
   * Used for Customer Detail Treatment Log Tab
   */
  async getCheckedInAppointmentsForTreatment(
    currentUser: UserCore | null,
    query: unknown
  ) {
    requireAuth(currentUser);

    const parsed = GetCheckedInAppointmentsQuerySchema.parse(query);

    const appointments =
      await treatmentLogRepo.findCheckedInAppointmentsForTreatment(
        parsed.customerId
      );

    // Map all appointments with their treatment logs
    const mapped = appointments.map((appointment) => {
      // Map treatment logs for this appointment
      const mappedLogs = appointment.treatmentLogs.map((log) =>
        mapTreatmentLogToResponse(log)
      );

      return mapAppointmentForTreatmentToResponse(appointment, mappedLogs);
    });

    const response = {
      items: mapped,
    };

    return CheckedInAppointmentsListResponseSchema.parse(response);
  },

  /**
   * List treatment logs for daily view with statistics
   * Used for Daily View page
   * Returns: { items, statistics: { totalCheckedInCustomers, totalTreatedCustomers, totalTreatmentLogs, treatmentRate } }
   */
  async listDaily(currentUser: UserCore | null, query: unknown) {
    requireAuth(currentUser);

    // Import schema at method level to avoid circular dependency
    const {
      GetDailyTreatmentLogsQuerySchema,
      DailyTreatmentLogsResponseSchema,
    } = await import("@/shared/validation/treatment-log.schema");

    const parsed = GetDailyTreatmentLogsQuerySchema.parse(query);

    // Permission check: Employee auto-filter by clinicId
    let clinicId = parsed.clinicId;
    if (currentUser!.role === "EMPLOYEE") {
      if (!currentUser!.clinicId) {
        throw new ServiceError(
          "MISSING_CLINIC",
          "Nhân viên chưa được gắn chi nhánh",
          403
        );
      }
      clinicId = currentUser!.clinicId; // Override with employee's clinic
    }

    // Fetch data from repository
    const { items, totalCheckedInCustomers, totalTreatedCustomers } =
      await treatmentLogRepo.listDaily({
        date: parsed.date,
        clinicId,
      });

    // Calculate statistics
    const totalTreatmentLogs = items.length;
    // Treatment rate: treatedCustomers / checkedInCustomers * 100
    // Should not exceed 100% if all data is consistent
    const treatmentRate =
      totalCheckedInCustomers > 0
        ? Math.round(
            (totalTreatedCustomers / totalCheckedInCustomers) * 100 * 100
          ) / 100
        : 0;

    // Map treatment logs to response format
    const mappedItems = items.map((log) => mapTreatmentLogToResponse(log));

    const response = {
      items: mappedItems,
      statistics: {
        totalCheckedInCustomers,
        totalTreatedCustomers,
        totalTreatmentLogs,
        treatmentRate,
      },
    };

    return DailyTreatmentLogsResponseSchema.parse(response);
  },
};
