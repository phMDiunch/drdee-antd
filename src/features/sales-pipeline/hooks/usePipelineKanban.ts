// src/features/sales-pipeline/hooks/usePipelineKanban.ts
"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { message } from "antd";
import type { SalesStage } from "@/shared/validation/consulted-service.schema";

interface ConsultedServiceData {
  id: string;
  consultedServiceName: string;
  consultationDate: string | null;
  quantity: number;
  preferentialPrice: number;
  finalPrice: number;
  serviceConfirmDate: string | null;
  stage: string | null;
  customer: {
    id: string;
    fullName: string;
    phone: string | null;
  };
  dentalService: {
    id: string;
    name: string;
    requiresFollowUp: boolean;
  };
  consultingSale: {
    id: string;
    fullName: string;
  } | null;
}

interface KanbanResponse {
  data: Record<string, ConsultedServiceData[]>;
  metadata: Record<string, { hasMore: boolean; totalCount: number }>;
}

/**
 * Hook for fetching paginated Kanban data
 * Supports Load More per column with independent page tracking
 */
export function usePipelineKanban(clinicId?: string) {
  const queryClient = useQueryClient();

  // Track page number per stage
  const [pages, setPages] = useState<Record<string, number>>({});

  // Fetch initial data (page 1 for all stages)
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["sales-pipeline-kanban", clinicId],
    queryFn: async (): Promise<KanbanResponse> => {
      const params = new URLSearchParams({
        page: "1",
        pageSize: "20",
      });

      if (clinicId) {
        params.set("clinicId", clinicId);
      }

      const res = await fetch(`/api/v1/sales-pipeline/kanban?${params}`);

      if (!res.ok) {
        throw new Error("Failed to fetch Kanban data");
      }

      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
  });

  // Load more items for specific stage
  const loadMore = useCallback(
    async (stage: SalesStage) => {
      const currentPage = pages[stage] || 1;
      const nextPage = currentPage + 1;

      // Set loading state
      queryClient.setQueryData<KanbanResponse>(
        ["sales-pipeline-kanban", clinicId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            metadata: {
              ...old.metadata,
              [stage]: {
                ...old.metadata[stage],
                isLoadingMore: true,
              },
            },
          };
        }
      );

      try {
        const params = new URLSearchParams({
          stages: stage,
          page: nextPage.toString(),
          pageSize: "20",
        });

        if (clinicId) {
          params.set("clinicId", clinicId);
        }

        const res = await fetch(`/api/v1/sales-pipeline/kanban?${params}`);

        if (!res.ok) {
          throw new Error("Failed to load more items");
        }

        const response: KanbanResponse = await res.json();

        // Append new items to existing data
        queryClient.setQueryData<KanbanResponse>(
          ["sales-pipeline-kanban", clinicId],
          (old) => {
            if (!old) return response;

            return {
              data: {
                ...old.data,
                [stage]: [...old.data[stage], ...response.data[stage]],
              },
              metadata: {
                ...old.metadata,
                [stage]: {
                  ...response.metadata[stage],
                  isLoadingMore: false,
                },
              },
            };
          }
        );

        // Update page tracker
        setPages((prev) => ({ ...prev, [stage]: nextPage }));
      } catch (error) {
        message.error("Không thể tải thêm dữ liệu");
        console.error("Load more error:", error);

        // Reset loading state
        queryClient.setQueryData<KanbanResponse>(
          ["sales-pipeline-kanban", clinicId],
          (old) => {
            if (!old) return old;
            return {
              ...old,
              metadata: {
                ...old.metadata,
                [stage]: {
                  ...old.metadata[stage],
                  isLoadingMore: false,
                },
              },
            };
          }
        );
      }
    },
    [clinicId, pages, queryClient]
  );

  // Reset pages when refetching
  const handleRefetch = useCallback(() => {
    setPages({});
    refetch();
  }, [refetch]);

  return {
    data: data?.data || {},
    metadata: data?.metadata || {},
    isLoading,
    error,
    loadMore,
    refetch: handleRefetch,
  };
}
