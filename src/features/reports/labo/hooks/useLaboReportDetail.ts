import { useQuery } from "@tanstack/react-query";
import type { GetLaboReportDetailQuery } from "@/shared/validation/labo-report.schema";
import { getLaboReportDetailApi } from "../api";
import { LABO_REPORT_QUERY_KEYS } from "../constants";
import { calculateStaleTime } from "../utils/caching";

export type TabType = "daily" | "supplier" | "doctor" | "service";

/**
 * Hook để fetch labo report detail records (drill-down panel)
 * Lazy load - chỉ fetch khi có tab và key
 */
export function useLaboReportDetail(
  tab: TabType | null,
  key: string | null,
  filters: { month: string; clinicId?: string }
) {
  return useQuery({
    queryKey: LABO_REPORT_QUERY_KEYS.detail(
      tab,
      key,
      filters.month,
      filters.clinicId
    ),
    queryFn: () => {
      if (!tab || !key) throw new Error("Tab and key are required");

      const params: GetLaboReportDetailQuery = {
        month: filters.month,
        clinicId: filters.clinicId,
        tab,
        key,
      };

      return getLaboReportDetailApi(params);
    },
    staleTime: calculateStaleTime(filters.month),
    gcTime: 5 * 60 * 60 * 1000, // 5 hours
    refetchOnWindowFocus: true,
    enabled: !!tab && !!key && !!filters.month,
  });
}
