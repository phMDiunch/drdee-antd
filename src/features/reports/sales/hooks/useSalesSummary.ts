import { useQuery } from "@tanstack/react-query";
import { getSalesSummaryApi } from "../api";
import { calculateStaleTime } from "../utils/caching";
import type { GetSalesSummaryQuery } from "@/shared/validation/sales-report.schema";

/**
 * Hook to fetch sales summary (KPI + tabs data)
 * Implements client-side filtering for admin (no refetch on clinic change)
 */
export function useSalesSummary(filters: GetSalesSummaryQuery) {
  const { month, clinicId } = filters;

  // For admin: query without clinicId to get all data
  // For employee: backend enforces clinicId automatically
  const queryParams: GetSalesSummaryQuery = {
    month,
    // Always pass clinicId for now - backend will handle admin vs employee logic
    clinicId,
  };

  const query = useQuery({
    queryKey: ["sales-dashboard", "summary", month, clinicId],
    queryFn: () => getSalesSummaryApi(queryParams),
    staleTime: calculateStaleTime(month),
    gcTime: 5 * 60 * 60 * 1000, // 5 hours
    refetchOnWindowFocus: true,
    enabled: !!month, // Only fetch if month is provided
  });

  return query;
}
