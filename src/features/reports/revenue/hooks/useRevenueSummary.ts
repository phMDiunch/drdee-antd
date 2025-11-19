import { useQuery } from "@tanstack/react-query";
import { getRevenueSummaryApi } from "../api";
import { calculateStaleTime } from "../utils/caching";
import type { GetRevenueSummaryQuery } from "@/shared/validation/revenue-report.schema";

/**
 * Hook to fetch revenue summary (KPI + tabs data)
 */
export function useRevenueSummary(filters: GetRevenueSummaryQuery) {
  const { month, clinicId } = filters;

  const queryParams: GetRevenueSummaryQuery = {
    month,
    clinicId,
  };

  const query = useQuery({
    queryKey: ["revenue-report", "summary", month, clinicId],
    queryFn: () => getRevenueSummaryApi(queryParams),
    staleTime: calculateStaleTime(month),
    gcTime: 5 * 60 * 60 * 1000, // 5 hours
    refetchOnWindowFocus: true,
    enabled: !!month, // Only fetch if month is provided
  });

  return query;
}
