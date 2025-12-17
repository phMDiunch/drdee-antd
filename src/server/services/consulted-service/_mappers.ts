// src/server/services/consulted-service/_mappers.ts
import type {
  ConsultedService,
  Customer,
  DentalService,
  Employee,
} from "@prisma/client";

// ConsultedService với all relations từ Prisma
type ConsultedServiceWithRelations = ConsultedService & {
  customer: Pick<
    Customer,
    "id" | "fullName" | "customerCode" | "dob" | "phone" | "clinicId"
  >;
  dentalService: Pick<
    DentalService,
    "id" | "name" | "unit" | "price" | "minPrice"
  >;
  consultingDoctor: Pick<Employee, "id" | "fullName"> | null;
  consultingSale: Pick<Employee, "id" | "fullName"> | null;
  treatingDoctor: Pick<Employee, "id" | "fullName"> | null;
  createdBy: Pick<Employee, "id" | "fullName">;
  updatedBy: Pick<Employee, "id" | "fullName">;
  clinic: {
    id: string;
    name: string;
  };
};

/**
 * Map Prisma ConsultedService to API Response
 * Transform only - no validation
 */
export function mapConsultedServiceToResponse(
  row: ConsultedServiceWithRelations
) {
  return {
    id: row.id,
    customerId: row.customerId,
    appointmentId: row.appointmentId,
    dentalServiceId: row.dentalServiceId,
    clinicId: row.clinicId,
    customerClinicId: row.customer.clinicId, // Customer's current clinic for permission checks

    // Denormalized data
    consultedServiceName: row.consultedServiceName,
    consultedServiceUnit: row.consultedServiceUnit,
    price: row.price,

    // Treatment details
    toothPositions: row.toothPositions,
    specificStatus: row.specificStatus,

    // Classification
    source: row.source,
    sourceNote: row.sourceNote,

    // Financial
    quantity: row.quantity,
    preferentialPrice: row.preferentialPrice,
    finalPrice: row.finalPrice,
    amountPaid: row.amountPaid,
    debt: row.debt,

    // Status & dates
    consultationDate: row.consultationDate.toISOString(),
    serviceConfirmDate: row.serviceConfirmDate?.toISOString() ?? null,
    serviceStatus: row.serviceStatus,
    treatmentStatus: row.treatmentStatus,

    // Assignment
    consultingDoctorId: row.consultingDoctorId,
    consultingSaleId: row.consultingSaleId,
    treatingDoctorId: row.treatingDoctorId,

    // Metadata
    createdById: row.createdById,
    updatedById: row.updatedById,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),

    // Relations
    customer: {
      id: row.customer.id,
      fullName: row.customer.fullName,
      customerCode: row.customer.customerCode,
      dob: row.customer.dob?.toISOString() ?? null,
      phone: row.customer.phone,
    },

    dentalService: {
      id: row.dentalService.id,
      name: row.dentalService.name,
      unit: row.dentalService.unit,
      price: row.dentalService.price,
      minPrice: row.dentalService.minPrice,
    },

    consultingDoctor: row.consultingDoctor
      ? {
          id: row.consultingDoctor.id,
          fullName: row.consultingDoctor.fullName,
        }
      : null,

    consultingSale: row.consultingSale
      ? {
          id: row.consultingSale.id,
          fullName: row.consultingSale.fullName,
        }
      : null,

    treatingDoctor: row.treatingDoctor
      ? {
          id: row.treatingDoctor.id,
          fullName: row.treatingDoctor.fullName,
        }
      : null,

    createdBy: {
      id: row.createdBy.id,
      fullName: row.createdBy.fullName,
    },

    updatedBy: {
      id: row.updatedBy.id,
      fullName: row.updatedBy.fullName,
    },

    clinic: {
      id: row.clinic.id,
      name: row.clinic.name,
    },
  };
}
