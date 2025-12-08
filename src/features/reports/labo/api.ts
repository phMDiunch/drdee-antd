import type {
  GetLaboReportSummaryQuery,
  GetLaboReportDetailQuery,
  LaboReportSummaryResponse,
  LaboReportDetailResponse,
} from "@/shared/validation/labo-report.schema";

/**
 * Get labo report summary (KPI + 4 dimension tabs)
 */
export async function getLaboReportSummaryApi(
  params: GetLaboReportSummaryQuery
): Promise<LaboReportSummaryResponse> {
  const queryParams: Record<string, string> = { month: params.month };
  if (params.clinicId) {
    queryParams.clinicId = params.clinicId;
  }
  const query = new URLSearchParams(queryParams);
  const res = await fetch(`/api/v1/reports/labo/summary?${query}`);
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error);
  }
  return res.json();
}

/**
 * Get labo report detail records (drill-down)
 */
export async function getLaboReportDetailApi(
  params: GetLaboReportDetailQuery
): Promise<LaboReportDetailResponse> {
  const queryParams: Record<string, string> = {
    month: params.month,
    tab: params.tab,
    key: params.key,
    page: params.page.toString(),
    pageSize: params.pageSize.toString(),
  };
  if (params.clinicId) {
    queryParams.clinicId = params.clinicId;
  }
  const query = new URLSearchParams(queryParams);
  const res = await fetch(`/api/v1/reports/labo/detail?${query}`);
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error);
  }
  return res.json();
}
