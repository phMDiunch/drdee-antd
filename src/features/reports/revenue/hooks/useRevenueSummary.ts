import { useQuery } from "@tanstack/react-query";
import { getRevenueSummaryApi } from "../api";
import { calculateStaleTime } from "../utils/caching";
import { REVENUE_REPORT_QUERY_KEYS } from "../constants";
import type { GetRevenueSummaryQuery } from "@/shared/validation/revenue-report.schema";

/**
 * Hook to fetch revenue summary (KPI + tabs data)
 */
export function useRevenueSummary(filters: GetRevenueSummaryQuery) {
  return useQuery({
    queryKey: REVENUE_REPORT_QUERY_KEYS.summary(
      filters.month,
      filters.clinicId
    ),
    queryFn: () => getRevenueSummaryApi(filters),
    staleTime: calculateStaleTime(filters.month),
    gcTime: 5 * 60 * 60 * 1000, // 5 hours
    refetchOnWindowFocus: true,
    enabled: !!filters.month, // Only fetch if month is provided
  });
}
