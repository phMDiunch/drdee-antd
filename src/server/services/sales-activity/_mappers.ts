// src/server/services/sales-activity/_mappers.ts
import type {
  SalesActivityLog,
  ConsultedService,
  Customer,
  Employee,
} from "@prisma/client";
import type { SalesActivityResponse } from "@/shared/validation/sales-activity.schema";

/**
 * Type for sales activity log with relations (from repo)
 * Matches salesActivityInclude from sales-activity.repo.ts
 */
type SalesActivityWithRelations = SalesActivityLog & {
  consultedService: Pick<
    ConsultedService,
    "id" | "consultedServiceName" | "stage"
  > & {
    customer: Pick<Customer, "id" | "fullName" | "phone" | "customerCode" | "dob">;
  };
  sale: Pick<Employee, "id" | "fullName">;
};

/**
 * Map Prisma SalesActivityLog to Response DTO
 *
 * Transform only - no validation (validation handled at API boundary)
 *
 * Transformations:
 * - Convert Date objects to ISO strings
 * - Extract firstName from fullName
 * - Convert nextContactDate to date-only format (YYYY-MM-DD)
 * - Type cast contactType to enum
 *
 * @param activity - Sales activity with relations from repository
 * @returns Mapped sales activity response matching schema
 */
export function mapSalesActivityToResponse(
  activity: SalesActivityWithRelations
): SalesActivityResponse {
  return {
    id: activity.id,
    consultedServiceId: activity.consultedServiceId,
    saleId: activity.saleId,
    contactType: activity.contactType as "call" | "message" | "meet",
    contactDate: activity.contactDate.toISOString(),
    content: activity.content,
    nextContactDate:
      activity.nextContactDate?.toISOString().split("T")[0] || null, // Date only (YYYY-MM-DD)
    createdAt: activity.createdAt.toISOString(),
    updatedAt: activity.updatedAt.toISOString(),
    consultedService: {
      id: activity.consultedService.id,
      consultedServiceName: activity.consultedService.consultedServiceName,
      stage: activity.consultedService.stage,
      customer: {
        id: activity.consultedService.customer.id,
        fullName: activity.consultedService.customer.fullName,
        phone: activity.consultedService.customer.phone,
        customerCode: activity.consultedService.customer.customerCode,
        dob: activity.consultedService.customer.dob?.toISOString() || null,
      },
    },
    sale: {
      id: activity.sale.id,
      fullName: activity.sale.fullName,
    },
  };
}
