import { useQuery } from "@tanstack/react-query";
import type { GetLaboReportSummaryQuery } from "@/shared/validation/labo-report.schema";
import { getLaboReportSummaryApi } from "../api";
import { LABO_REPORT_QUERY_KEYS } from "../constants";
import { calculateStaleTime } from "../utils/caching";

/**
 * Hook để fetch labo report summary (KPI + 4 dimension tabs)
 * Cache strategy: Transactional data (staleTime dynamic)
 */
export function useLaboReportSummary(filters: GetLaboReportSummaryQuery) {
  return useQuery({
    queryKey: LABO_REPORT_QUERY_KEYS.summary(filters.month, filters.clinicId),
    queryFn: () => getLaboReportSummaryApi(filters),
    staleTime: calculateStaleTime(filters.month),
    gcTime: 5 * 60 * 1000, // 5 hours
    enabled: !!filters.month,
  });
}
