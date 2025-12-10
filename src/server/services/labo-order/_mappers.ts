// src/server/services/labo-order/_mappers.ts
import type {
  LaboOrder,
  Customer,
  Employee,
  Supplier,
  LaboItem,
  Clinic,
} from "@prisma/client";

// LaboOrder với relations từ Prisma
type LaboOrderWithRelations = LaboOrder & {
  customer?: Pick<Customer, "id" | "fullName" | "customerCode"> | null;
  doctor?: Pick<Employee, "id" | "fullName"> | null;
  sentBy?: Pick<Employee, "id" | "fullName"> | null;
  supplier?: Pick<Supplier, "id" | "name" | "shortName"> | null;
  laboItem?: Pick<LaboItem, "id" | "name" | "serviceGroup" | "unit"> | null;
  clinic?: Pick<Clinic, "id" | "clinicCode" | "name"> | null;
  receivedBy?: Pick<Employee, "id" | "fullName"> | null;
  createdBy?: Pick<Employee, "id" | "fullName"> | null;
  updatedBy?: Pick<Employee, "id" | "fullName"> | null;
};

/**
 * Map Prisma LaboOrder entity to API response format
 * Transform: Date → ISO string, convert dates to YYYY-MM-DD
 */
export function mapLaboOrderToResponse(row: LaboOrderWithRelations) {
  return {
    id: row.id,
    customerId: row.customerId,
    doctorId: row.doctorId,
    treatmentDate: row.treatmentDate.toISOString().split("T")[0],
    orderType: row.orderType,
    sentById: row.sentById,
    laboServiceId: row.laboServiceId,
    supplierId: row.supplierId,
    laboItemId: row.laboItemId,
    clinicId: row.clinicId,

    // Pricing snapshot
    unitPrice: row.unitPrice,
    quantity: row.quantity,
    totalCost: row.totalCost,
    warranty: row.warranty,

    // Dates (convert to ISO datetime string for sentDate/returnDate, date string for expectedFitDate)
    sentDate: row.sentDate.toISOString(),
    returnDate: row.returnDate ? row.returnDate.toISOString() : null,
    expectedFitDate: row.expectedFitDate
      ? row.expectedFitDate.toISOString().split("T")[0]
      : null,

    // Details
    detailRequirement: row.detailRequirement,

    // Tracking
    receivedById: row.receivedById,

    // Metadata
    createdById: row.createdById,
    updatedById: row.updatedById,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),

    // Nested objects - giữ nguyên cấu trúc quan hệ
    customer: row.customer
      ? {
          id: row.customer.id,
          fullName: row.customer.fullName,
          customerCode: row.customer.customerCode,
        }
      : {
          id: row.customerId,
          fullName: "Unknown",
          customerCode: null,
        },

    doctor: row.doctor
      ? {
          id: row.doctor.id,
          fullName: row.doctor.fullName,
        }
      : {
          id: row.doctorId,
          fullName: "Unknown",
        },

    sentBy: row.sentBy
      ? {
          id: row.sentBy.id,
          fullName: row.sentBy.fullName,
        }
      : {
          id: row.sentById,
          fullName: "Unknown",
        },

    supplier: row.supplier
      ? {
          id: row.supplier.id,
          name: row.supplier.name,
          shortName: row.supplier.shortName,
        }
      : {
          id: row.supplierId,
          name: "Unknown",
          shortName: null,
        },

    laboItem: row.laboItem
      ? {
          id: row.laboItem.id,
          name: row.laboItem.name,
          serviceGroup: row.laboItem.serviceGroup,
          unit: row.laboItem.unit,
        }
      : {
          id: row.laboItemId,
          name: "Unknown",
          serviceGroup: "unknown",
          unit: "unknown",
        },

    clinic: row.clinic
      ? {
          id: row.clinic.id,
          clinicCode: row.clinic.clinicCode,
          name: row.clinic.name,
        }
      : undefined,

    receivedBy: row.receivedBy
      ? {
          id: row.receivedBy.id,
          fullName: row.receivedBy.fullName,
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
