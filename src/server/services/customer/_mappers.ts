import type { Customer, Clinic, Employee } from "@prisma/client";

// Customer với all relations từ Prisma
type CustomerWithRelations = Customer & {
  clinic?: Pick<
    Clinic,
    "id" | "clinicCode" | "name" | "shortName" | "colorCode"
  > | null;
  primaryContact?: Pick<Customer, "id" | "fullName" | "phone"> | null;
  createdBy?: Pick<Employee, "id" | "fullName"> | null;
  updatedBy?: Pick<Employee, "id" | "fullName"> | null;
};

export function mapCustomerToResponse(row: CustomerWithRelations) {
  return {
    id: row.id,
    type: row.type,
    fullName: row.fullName,
    createdById: row.createdById,
    updatedById: row.updatedById,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),

    // Nullable fields - backward compatibility with old data
    customerCode: row.customerCode,
    firstVisitDate: row.firstVisitDate
      ? row.firstVisitDate.toISOString()
      : null,
    convertedAt: row.convertedAt ? row.convertedAt.toISOString() : null,
    dob: row.dob ? row.dob.toISOString() : null, // Convert Date to ISO string or null
    gender: row.gender,
    phone: row.phone,
    email: row.email,
    address: row.address,
    city: row.city,
    district: row.district,
    primaryContactRole: row.primaryContactRole,
    primaryContactId: row.primaryContactId,
    occupation: row.occupation,
    source: row.source,
    sourceNotes: row.sourceNotes,
    serviceOfInterest: row.serviceOfInterest,
    note: row.note,
    clinicId: row.clinicId,

    // Nested objects - giữ nguyên cấu trúc quan hệ, bao gồm id
    clinic: row.clinic
      ? {
          id: row.clinic.id,
          clinicCode: row.clinic.clinicCode,
          name: row.clinic.name,
          shortName: row.clinic.shortName ?? "",
          colorCode: row.clinic.colorCode ?? "",
        }
      : null,
    primaryContact: row.primaryContact
      ? {
          id: row.primaryContact.id,
          fullName: row.primaryContact.fullName,
          phone: row.primaryContact.phone,
        }
      : null,
    createdBy: row.createdBy
      ? {
          id: row.createdBy.id,
          fullName: row.createdBy.fullName,
        }
      : null,
    updatedBy: row.updatedBy
      ? {
          id: row.updatedBy.id,
          fullName: row.updatedBy.fullName,
        }
      : null,
  };
}

/**
 * Map Customer Detail with source relations and appointments
 * Used for: GET /api/v1/customers/[id]
 * Reuses base mapping + adds sourceEmployee/sourceCustomer + appointments
 */
type CustomerDetailWithRelations = CustomerWithRelations & {
  sourceEmployee?: Pick<Employee, "id" | "fullName" | "phone"> | null;
  sourceCustomer?: Pick<
    Customer,
    "id" | "fullName" | "phone" | "customerCode"
  > | null;
  appointments?: Array<{
    id: string;
    appointmentDateTime: Date;
    checkInTime: Date | null;
    checkOutTime: Date | null;
    status: string;
  }>;
};

export function mapCustomerDetailToResponse(row: CustomerDetailWithRelations) {
  // Reuse base mapper to get sanitized base fields
  const baseData = mapCustomerToResponse(row);

  // Extend with Detail-specific fields
  return {
    ...baseData,

    // Source relations (Detail-specific)
    sourceEmployee: row.sourceEmployee
      ? {
          id: row.sourceEmployee.id,
          fullName: row.sourceEmployee.fullName,
          phone: row.sourceEmployee.phone,
        }
      : null,
    sourceCustomer: row.sourceCustomer
      ? {
          id: row.sourceCustomer.id,
          fullName: row.sourceCustomer.fullName,
          phone: row.sourceCustomer.phone,
          customerCode: row.sourceCustomer.customerCode,
        }
      : null,

    // Appointments relation (for check-in status + tab count)
    appointments: row.appointments
      ? row.appointments.map((apt) => ({
          id: apt.id,
          appointmentDateTime: apt.appointmentDateTime.toISOString(),
          checkInTime: apt.checkInTime ? apt.checkInTime.toISOString() : null,
          checkOutTime: apt.checkOutTime
            ? apt.checkOutTime.toISOString()
            : null,
          status: apt.status,
        }))
      : undefined,
  };
}
