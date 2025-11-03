import {
  CustomerResponseSchema,
  CustomerDetailResponseSchema,
} from "@/shared/validation/customer.schema";
import { ServiceError } from "@/server/services/errors";
import type { Customer, Clinic, Employee } from "@prisma/client";

// Customer với all relations từ Prisma
type CustomerWithRelations = Customer & {
  clinic?: Pick<Clinic, "id" | "clinicCode" | "name" | "colorCode"> | null;
  primaryContact?: Pick<Customer, "id" | "fullName" | "phone"> | null;
  createdBy?: Pick<Employee, "id" | "fullName"> | null;
  updatedBy?: Pick<Employee, "id" | "fullName"> | null;
};

export function mapCustomerToResponse(row: CustomerWithRelations) {
  const customerId = row.id || "unknown";

  try {
    // Validate core required fields (always non-null)
    if (!row.id || !row.fullName || !row.createdAt || !row.updatedAt) {
      throw new Error(`Missing required fields for customer ${customerId}`);
    }

    const sanitized = {
      id: row.id,
      fullName: row.fullName,
      createdById: row.createdById,
      updatedById: row.updatedById,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),

      // Nullable fields - backward compatibility with old data
      customerCode: row.customerCode,
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
      clinicId: row.clinicId,

      // Nested objects - giữ nguyên cấu trúc quan hệ, bao gồm id
      clinic: row.clinic
        ? {
            id: row.clinic.id,
            clinicCode: row.clinic.clinicCode,
            name: row.clinic.name,
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

    const parsed = CustomerResponseSchema.safeParse(sanitized);
    if (!parsed.success) {
      throw new ServiceError(
        "INVALID",
        "Dữ liệu khách hàng ở database trả về không hợp lệ. Kiểm tra database trong supabase",
        500
      );
    }
    return parsed.data;
  } catch (error) {
    throw new ServiceError(
      "MAPPING_ERROR",
      `Lỗi mapping dữ liệu khách hàng ${row.id || "unknown"}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
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
  const customerId = row.id || "unknown";

  try {
    // Reuse base mapper to get sanitized base fields
    const baseData = mapCustomerToResponse(row);

    // Extend with Detail-specific fields
    const sanitized = {
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

    const parsed = CustomerDetailResponseSchema.safeParse(sanitized);
    if (!parsed.success) {
      throw new ServiceError(
        "INVALID",
        "Dữ liệu chi tiết khách hàng không hợp lệ",
        500
      );
    }

    return parsed.data;
  } catch (error) {
    throw new ServiceError(
      "MAPPING_ERROR",
      `Lỗi mapping chi tiết khách hàng ${customerId}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
}
