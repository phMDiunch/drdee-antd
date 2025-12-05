import { useQuery } from "@tanstack/react-query";
import { getSalesDetailApi } from "../api";
import { calculateStaleTime } from "../utils/caching";
import type { GetSalesDetailQuery } from "@/shared/validation/sales-report.schema";

export type TabType = "daily" | "source" | "department" | "service" | "sale" | "doctor";

/**
 * Hook to fetch sales detail records (lazy loading when row selected)
 */
export function useSalesDetail(
  tab: TabType | null,
  key: string | null,
  filters: { month: string; clinicId?: string }
) {
  const { month, clinicId } = filters;

  const query = useQuery({
    queryKey: ["sales-report", "detail", tab, key, month, clinicId],
    queryFn: () => {
      if (!tab || !key) throw new Error("Tab and key are required");

      const params: GetSalesDetailQuery = {
        month,
        clinicId,
        tab,
        key,
      };

      return getSalesDetailApi(params);
    },
    staleTime: calculateStaleTime(month),
    gcTime: 5 * 60 * 60 * 1000, // 5 hours
    refetchOnWindowFocus: true,
    enabled: !!tab && !!key && !!month, // Only fetch when row is selected
  });

  return query;
}
