// src/features/treatment-logs/hooks/useDailyTreatmentLogs.ts

import { useQuery } from "@tanstack/react-query";
import { getDailyTreatmentLogsApi } from "../api";

export function useDailyTreatmentLogs(params: {
  date: string; // YYYY-MM-DD format
  clinicId: string;
}) {
  return useQuery({
    queryKey: ["treatment-logs", "daily", params.date, params.clinicId],
    queryFn: () => getDailyTreatmentLogsApi(params),
    staleTime: 60 * 1000, // 60 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
}
