import { useQuery } from "@tanstack/react-query";
import type { GetLaboReportDetailQuery } from "@/shared/validation/labo-report.schema";
import { getLaboReportDetailApi } from "../api";
import { LABO_REPORT_QUERY_KEYS } from "../constants";
import { calculateStaleTime } from "../utils/caching";

/**
 * Hook để fetch labo report detail records (drill-down panel)
 * Lazy load - chỉ fetch khi có tab và key
 */
export function useLaboReportDetail(filters: GetLaboReportDetailQuery) {
  return useQuery({
    queryKey: LABO_REPORT_QUERY_KEYS.detail(
      filters.tab,
      filters.key,
      filters.month,
      filters.clinicId
    ),
    queryFn: () => getLaboReportDetailApi(filters),
    staleTime: calculateStaleTime(filters.month),
    gcTime: 5 * 60 * 1000,
    enabled: !!filters.tab && !!filters.key && !!filters.month,
  });
}
