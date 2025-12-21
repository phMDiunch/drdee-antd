// src/features/sales-activities/hooks/useSalesActivities.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getSalesActivitiesApi } from "../api";
import { SALES_ACTIVITY_QUERY_KEYS } from "../constants";
import type { GetSalesActivitiesQuery } from "@/shared/validation/sales-activity.schema";

export function useSalesActivities(params?: GetSalesActivitiesQuery) {
  return useQuery({
    queryKey: SALES_ACTIVITY_QUERY_KEYS.list(params),
    queryFn: () => getSalesActivitiesApi(params),
    staleTime: 60 * 1000, // 1 phút - Transaction data thay đổi thường xuyên
    gcTime: 5 * 60 * 1000, // 5 phút - Giữ trong memory
    refetchOnWindowFocus: true, // Refetch khi user quay lại tab (nhưng vẫn show cache trước)
  });
}
