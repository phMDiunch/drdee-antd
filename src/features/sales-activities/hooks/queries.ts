// src/features/sales-activities/hooks/queries.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getSalesActivitiesApi, getDailySalesActivitiesApi } from "../api";
import { SALES_ACTIVITY_QUERY_KEYS } from "../constants";
import type { GetSalesActivitiesQuery } from "@/shared/validation/sales-activity.schema";

/**
 * Hook: Fetch sales activities list with optional filters
 * Cache: 1 minute stale time, 5 minutes garbage collection
 * Refetch: On window focus
 * Invalidated by: useCreateSalesActivity, useUpdateSalesActivity, useDeleteSalesActivity
 */
export function useSalesActivities(params?: GetSalesActivitiesQuery) {
  return useQuery({
    queryKey: SALES_ACTIVITY_QUERY_KEYS.list(params),
    queryFn: () => getSalesActivitiesApi(params),
    staleTime: 60 * 1000, // 1 phút - Transaction data thay đổi thường xuyên
    gcTime: 5 * 60 * 1000, // 5 phút - Giữ trong memory
    refetchOnWindowFocus: true, // Refetch khi user quay lại tab (nhưng vẫn show cache trước)
  });
}

/**
 * Hook: Fetch daily sales activities with statistics by date and clinic
 * Cache: 1 minute stale time, 5 minutes garbage collection
 * Refetch: On window focus
 * Enabled: Only when both date and clinicId are provided
 * Invalidated by: useCreateSalesActivity, useUpdateSalesActivity, useDeleteSalesActivity
 */
export function useDailySalesActivities(date: string, clinicId: string) {
  return useQuery({
    queryKey: ["sales-activities", "daily", date, clinicId],
    queryFn: () => getDailySalesActivitiesApi({ date, clinicId }),
    staleTime: 60 * 1000, // 1 minute (transactional data)
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true, // Fetch lại khi chuyển tab
    enabled: !!date && !!clinicId, // Only fetch when both params are available
  });
}
