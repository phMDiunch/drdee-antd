// src/server/services/appointment/_mappers.ts
import type { Appointment, Customer, Employee, Clinic } from "@prisma/client";

// Appointment với all relations từ Prisma
type AppointmentWithRelations = Appointment & {
  customer: Pick<
    Customer,
    "id" | "customerCode" | "fullName" | "phone" | "dob"
  >;
  primaryDentist: Pick<Employee, "id" | "fullName" | "employeeCode" | "favoriteColor">;
  secondaryDentist: Pick<Employee, "id" | "fullName" | "employeeCode" | "favoriteColor"> | null;
  clinic: Pick<Clinic, "id" | "clinicCode" | "name" | "colorCode">;
  createdBy: Pick<Employee, "id" | "fullName">;
  updatedBy: Pick<Employee, "id" | "fullName">;
};

/**
 * Map Prisma Appointment to API Response
 * Transform only - no validation
 */
export function mapAppointmentToResponse(row: AppointmentWithRelations) {
  return {
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
      favoriteColor: row.primaryDentist.favoriteColor,
    },

    secondaryDentist: row.secondaryDentist
      ? {
          id: row.secondaryDentist.id,
          fullName: row.secondaryDentist.fullName,
          employeeCode: row.secondaryDentist.employeeCode,
          favoriteColor: row.secondaryDentist.favoriteColor,
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
}
