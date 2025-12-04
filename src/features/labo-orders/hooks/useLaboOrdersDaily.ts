// src/features/labo-orders/hooks/useLaboOrdersDaily.ts
"use client";
import { useQuery } from "@tanstack/react-query";
import { getDailyLaboOrdersApi } from "../api";
import { LABO_ORDER_QUERY_KEYS } from "../constants";

export function useLaboOrdersDaily(params: {
  date: string;
  type: "sent" | "returned";
  clinicId?: string;
}) {
  return useQuery({
    queryKey: LABO_ORDER_QUERY_KEYS.daily(params),
    queryFn: () => getDailyLaboOrdersApi(params),
    staleTime: 1000 * 60 * 1, // 1 minute (transactional data)
    gcTime: 1000 * 60 * 5, // Giữ trong bộ nhớ 5 phút
  });
}
