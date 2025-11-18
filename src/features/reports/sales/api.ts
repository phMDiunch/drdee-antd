import type {
  GetSalesSummaryQuery,
  GetSalesDetailQuery,
  SalesSummaryResponse,
  SalesDetailResponse,
} from "@/shared/validation/sales-report.schema";

/**
 * Get sales summary (KPI + tabs data)
 */
export async function getSalesSummaryApi(
  params: GetSalesSummaryQuery
): Promise<SalesSummaryResponse> {
  const query = new URLSearchParams();
  query.set("month", params.month);
  if (params.clinicId) {
    query.set("clinicId", params.clinicId);
  }

  const res = await fetch(`/api/v1/reports/sales/summary?${query}`);
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Failed to fetch sales summary");
  }
  return res.json();
}

/**
 * Get sales detail records for a specific tab/key
 */
export async function getSalesDetailApi(
  params: GetSalesDetailQuery
): Promise<SalesDetailResponse> {
  const query = new URLSearchParams();
  query.set("month", params.month);
  if (params.clinicId) {
    query.set("clinicId", params.clinicId);
  }
  query.set("tab", params.tab);
  query.set("key", params.key);

  const res = await fetch(`/api/v1/reports/sales/detail?${query}`);
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Failed to fetch sales detail");
  }
  return res.json();
}
