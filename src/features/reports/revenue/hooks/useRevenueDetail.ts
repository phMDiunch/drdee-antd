import { useQuery } from "@tanstack/react-query";
import { getRevenueDetailApi } from "../api";
import { calculateStaleTime } from "../utils/caching";
import type { GetRevenueDetailQuery } from "@/shared/validation/revenue-report.schema";

export type TabType = "daily" | "source" | "department" | "service" | "doctor";

/**
 * Hook to fetch revenue detail records (lazy loading when row selected)
 */
export function useRevenueDetail(
  tab: TabType | null,
  key: string | null,
  filters: { month: string; clinicId?: string }
) {
  const { month, clinicId } = filters;

  const query = useQuery({
    queryKey: ["revenue-report", "detail", tab, key, month, clinicId],
    queryFn: () => {
      if (!tab || !key) throw new Error("Tab and key are required");

      const params: GetRevenueDetailQuery = {
        month,
        clinicId,
        tab,
        key,
      };

      return getRevenueDetailApi(params);
    },
    staleTime: calculateStaleTime(month),
    gcTime: 5 * 60 * 60 * 1000, // 5 hours
    refetchOnWindowFocus: true,
    enabled: !!tab && !!key && !!month, // Only fetch when row is selected
  });

  return query;
}
