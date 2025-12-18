// src/server/services/sales-pipeline/_mappers.ts
import type { SalesActivityLog, ConsultedService } from "@prisma/client";
import type {
  SalesActivityResponse,
  SalesActivitiesListResponse,
} from "@/shared/validation/sales-activity.schema";
import type { ConsultedServiceResponse } from "@/shared/validation/consulted-service.schema";

/**
 * Type for sales activity with relations (from repo)
 */
type SalesActivityWithRelations = SalesActivityLog & {
  employee: {
    id: string;
    fullName: string;
  };
};

/**
 * Type for consulted service with pipeline relations (from repo)
 */
type ConsultedServiceWithPipelineRelations = ConsultedService & {
  customer: {
    id: string;
    fullName: string;
    phone: string | null;
  };
  dentalService: {
    id: string;
    name: string;
    requiresFollowUp: boolean;
  };
  consultingSale: {
    id: string;
    fullName: string;
  } | null;
};

/**
 * Map SalesActivityLog to Response
 */
export function mapSalesActivityToResponse(
  activity: SalesActivityWithRelations
): SalesActivityResponse {
  return {
    id: activity.id,
    consultedServiceId: activity.consultedServiceId,
    employeeId: activity.employeeId,
    contactType: activity.contactType as "call" | "message" | "meet",
    contactDate: activity.contactDate.toISOString(),
    content: activity.content,
    nextContactDate:
      activity.nextContactDate?.toISOString().split("T")[0] || null,
    createdAt: activity.createdAt.toISOString(),
    updatedAt: activity.updatedAt.toISOString(),
    employee: {
      id: activity.employee.id,
      fullName: activity.employee.fullName,
    },
  };
}

/**
 * Map array of SalesActivityLogs to List Response
 */
export function mapSalesActivitiesToListResponse(
  activities: SalesActivityWithRelations[]
): SalesActivitiesListResponse {
  return activities.map(mapSalesActivityToResponse);
}

/**
 * Map ConsultedService to Response (simplified for pipeline)
 * This is a lightweight version focusing on pipeline needs
 */
export function mapPipelineServiceToResponse(
  service: ConsultedServiceWithPipelineRelations
): Pick<
  ConsultedServiceResponse,
  | "id"
  | "consultedServiceName"
  | "consultationDate"
  | "serviceStatus"
  | "serviceConfirmDate"
  | "specificStatus"
  | "consultingSaleId"
  | "stage"
> & {
  customer: {
    id: string;
    fullName: string;
    phone: string | null;
  };
  dentalService: {
    id: string;
    name: string;
    requiresFollowUp: boolean;
  };
  consultingSale: {
    id: string;
    fullName: string;
  } | null;
} {
  return {
    id: service.id,
    consultedServiceName: service.consultedServiceName,
    consultationDate: service.consultationDate.toISOString(),
    serviceStatus: service.serviceStatus as "Đã chốt" | "Chưa chốt",
    serviceConfirmDate: service.serviceConfirmDate?.toISOString() || null,
    specificStatus: service.specificStatus,
    consultingSaleId: service.consultingSaleId,
    stage: service.stage,
    customer: {
      id: service.customer.id,
      fullName: service.customer.fullName,
      phone: service.customer.phone,
    },
    dentalService: {
      id: service.dentalService.id,
      name: service.dentalService.name,
      requiresFollowUp: service.dentalService.requiresFollowUp,
    },
    consultingSale: service.consultingSale
      ? {
          id: service.consultingSale.id,
          fullName: service.consultingSale.fullName,
        }
      : null,
  };
}
