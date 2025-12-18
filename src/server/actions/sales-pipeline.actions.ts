"use server";

// src/server/actions/sales-pipeline.actions.ts
import { getSessionUser } from "@/server/utils/sessionCache";
import { salesPipelineService } from "@/server/services/sales-pipeline.service";
import type {
  ClaimPipelineRequest,
  ReassignSaleRequest,
  CreateSalesActivityRequest,
} from "@/shared/validation/sales-activity.schema";

/**
 * Claim a pipeline service (assign to self)
 * Used by: Button "Nhận quản lý" in ConsultedService table
 */
export async function claimPipelineAction(consultedServiceId: string) {
  const user = await getSessionUser();
  return salesPipelineService.claimService(user, { consultedServiceId });
}

/**
 * Reassign a pipeline service to another sale (admin only)
 * Used by: ReassignSaleModal
 */
export async function reassignSaleAction(data: ReassignSaleRequest) {
  const user = await getSessionUser();
  return salesPipelineService.reassignService(user, data);
}

/**
 * Create a sales activity log
 * Used by: SalesActivityModal
 */
export async function createSalesActivityAction(
  consultedServiceId: string,
  data: Omit<CreateSalesActivityRequest, "consultedServiceId">
) {
  const user = await getSessionUser();
  return salesPipelineService.createActivity(user, consultedServiceId, data);
}
