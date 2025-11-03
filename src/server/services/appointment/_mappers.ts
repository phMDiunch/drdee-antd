// src/server/services/appointment/_mappers.ts
import { AppointmentResponseSchema } from "@/shared/validation/appointment.schema";
import { ServiceError } from "@/server/services/errors";
import type { Appointment, Customer, Employee, Clinic } from "@prisma/client";

// Appointment với all relations từ Prisma
type AppointmentWithRelations = Appointment & {
  customer: Pick<
    Customer,
    "id" | "customerCode" | "fullName" | "phone" | "dob"
  >;
  primaryDentist: Pick<Employee, "id" | "fullName" | "employeeCode">;
  secondaryDentist: Pick<Employee, "id" | "fullName" | "employeeCode"> | null;
  clinic: Pick<Clinic, "id" | "clinicCode" | "name" | "colorCode">;
  createdBy: Pick<Employee, "id" | "fullName">;
  updatedBy: Pick<Employee, "id" | "fullName">;
};

/**
 * Map Prisma Appointment to API Response
 * Following customer._mappers.ts gold standard
 */
export function mapAppointmentToResponse(row: AppointmentWithRelations) {
  const appointmentId = row.id || "unknown";

  try {
    // Validate core required fields (always non-null)
    if (
      !row.id ||
      !row.customer ||
      !row.primaryDentist ||
      !row.clinic ||
      !row.createdBy ||
      !row.updatedBy ||
      !row.createdAt ||
      !row.updatedAt
    ) {
      throw new Error(
        `Missing required fields for appointment ${appointmentId}`
      );
    }

    const sanitized = {
      id: row.id,
      customerId: row.customerId,
      appointmentDateTime: row.appointmentDateTime.toISOString(),
      duration: row.duration,
      notes: row.notes,

      primaryDentistId: row.primaryDentistId,
      secondaryDentistId: row.secondaryDentistId,
      clinicId: row.clinicId,

      status: row.status,
      checkInTime: row.checkInTime?.toISOString() ?? null,
      checkOutTime: row.checkOutTime?.toISOString() ?? null,

      // Relations - nested objects with id
      customer: {
        id: row.customer.id,
        customerCode: row.customer.customerCode,
        fullName: row.customer.fullName,
        phone: row.customer.phone,
        dob: row.customer.dob?.toISOString() ?? null,
      },

      primaryDentist: {
        id: row.primaryDentist.id,
        fullName: row.primaryDentist.fullName,
        employeeCode: row.primaryDentist.employeeCode,
      },

      secondaryDentist: row.secondaryDentist
        ? {
            id: row.secondaryDentist.id,
            fullName: row.secondaryDentist.fullName,
            employeeCode: row.secondaryDentist.employeeCode,
          }
        : null,

      clinic: {
        id: row.clinic.id,
        clinicCode: row.clinic.clinicCode,
        name: row.clinic.name,
        colorCode: row.clinic.colorCode ?? null,
      },

      // Metadata
      createdById: row.createdById,
      updatedById: row.updatedById,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),

      createdBy: {
        id: row.createdBy.id,
        fullName: row.createdBy.fullName,
      },

      updatedBy: {
        id: row.updatedBy.id,
        fullName: row.updatedBy.fullName,
      },
    };

    const parsed = AppointmentResponseSchema.safeParse(sanitized);
    if (!parsed.success) {
      throw new ServiceError(
        "INVALID",
        "Dữ liệu lịch hẹn ở database trả về không hợp lệ. Kiểm tra database trong supabase",
        500
      );
    }

    return parsed.data;
  } catch (error) {
    throw new ServiceError(
      "MAPPING_ERROR",
      `Lỗi mapping dữ liệu lịch hẹn ${appointmentId}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
}
