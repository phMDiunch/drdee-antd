// src/features/sales-pipeline/hooks/useSalesAnalytics.ts
import { useQuery } from "@tanstack/react-query";

interface AnalyticsParams {
  clinicId?: string;
  dateStart: string; // ISO datetime
  dateEnd: string; // ISO datetime
}

/**
 * Conversion Funnel Hook
 */
export function useConversionFunnel(params: AnalyticsParams) {
  return useQuery({
    queryKey: ["sales-analytics", "funnel", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        ...(params.clinicId && { clinicId: params.clinicId }),
        dateStart: params.dateStart,
        dateEnd: params.dateEnd,
      });

      const res = await fetch(`/api/v1/sales-analytics/funnel?${searchParams}`);
      if (!res.ok) throw new Error("Failed to fetch funnel data");
      return res.json() as Promise<{
        funnel: Array<{
          stage: string;
          count: number;
          conversionRate: number;
        }>;
      }>;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Sale Performance Hook
 */
export function useSalePerformance(params: AnalyticsParams) {
  return useQuery({
    queryKey: ["sales-analytics", "performance", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        ...(params.clinicId && { clinicId: params.clinicId }),
        dateStart: params.dateStart,
        dateEnd: params.dateEnd,
      });

      const res = await fetch(
        `/api/v1/sales-analytics/performance?${searchParams}`
      );
      if (!res.ok) throw new Error("Failed to fetch performance data");
      return res.json() as Promise<{
        performance: Array<{
          saleId: string;
          saleName: string;
          employeeCode: string;
          totalDeals: number;
          wonCount: number;
          lostCount: number;
          winRate: number;
        }>;
      }>;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Lost Analysis Hook
 */
export function useLostAnalysis(params: AnalyticsParams) {
  return useQuery({
    queryKey: ["sales-analytics", "lost", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        ...(params.clinicId && { clinicId: params.clinicId }),
        dateStart: params.dateStart,
        dateEnd: params.dateEnd,
      });

      const res = await fetch(`/api/v1/sales-analytics/lost?${searchParams}`);
      if (!res.ok) throw new Error("Failed to fetch lost analysis");
      return res.json() as Promise<{
        byStage: Array<{
          stage: string;
          count: number;
          reasons: Record<string, number>;
        }>;
        details: Array<{
          id: string;
          fromStage: string | null;
          reason: string | null;
          changedAt: Date;
          serviceName: string;
          customerName: string;
        }>;
      }>;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Average Time Per Stage Hook
 */
export function useAvgTimePerStage(params: AnalyticsParams) {
  return useQuery({
    queryKey: ["sales-analytics", "time-per-stage", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        ...(params.clinicId && { clinicId: params.clinicId }),
        dateStart: params.dateStart,
        dateEnd: params.dateEnd,
      });

      const res = await fetch(
        `/api/v1/sales-analytics/time-per-stage?${searchParams}`
      );
      if (!res.ok) throw new Error("Failed to fetch time per stage data");
      return res.json() as Promise<{
        avgTime: Array<{
          stage: string;
          avgDays: number;
          count: number;
        }>;
      }>;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Service Win Rate Hook
 */
export function useServiceWinRate(params: AnalyticsParams) {
  return useQuery({
    queryKey: ["sales-analytics", "service-win-rate", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        ...(params.clinicId && { clinicId: params.clinicId }),
        dateStart: params.dateStart,
        dateEnd: params.dateEnd,
      });

      const res = await fetch(
        `/api/v1/sales-analytics/service-win-rate?${searchParams}`
      );
      if (!res.ok) throw new Error("Failed to fetch service win rate");
      return res.json() as Promise<{
        winRate: Array<{
          serviceId: string;
          serviceName: string;
          totalCount: number;
          wonCount: number;
          winRate: number;
        }>;
      }>;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
