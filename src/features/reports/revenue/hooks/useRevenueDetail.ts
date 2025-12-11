import { useQuery } from "@tanstack/react-query";
import { getRevenueDetailApi } from "../api";
import { calculateStaleTime } from "../utils/caching";
import { REVENUE_REPORT_QUERY_KEYS } from "../constants";
import type { GetRevenueDetailQuery } from "@/shared/validation/revenue-report.schema";

export type TabType =
  | "daily"
  | "source"
  | "department"
  | "serviceGroup"
  | "service"
  | "doctor";

/**
 * Hook to fetch revenue detail records (lazy loading when row selected)
 */
export function useRevenueDetail(
  tab: TabType | null,
  key: string | null,
  filters: { month: string; clinicId?: string }
) {
  return useQuery({
    queryKey: REVENUE_REPORT_QUERY_KEYS.detail(
      tab,
      key,
      filters.month,
      filters.clinicId
    ),
    queryFn: () => {
      if (!tab || !key) throw new Error("Tab and key are required");

      const params: GetRevenueDetailQuery = {
        month: filters.month,
        clinicId: filters.clinicId,
        tab,
        key,
      };

      return getRevenueDetailApi(params);
    },
    staleTime: calculateStaleTime(filters.month),
    gcTime: 5 * 60 * 60 * 1000, // 5 hours
    refetchOnWindowFocus: true,
    enabled: !!tab && !!key && !!filters.month, // Only fetch when row is selected
  });
}
