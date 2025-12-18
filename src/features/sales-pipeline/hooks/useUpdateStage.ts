// src/features/sales-pipeline/hooks/useUpdateStage.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateStageAction } from "@/server/actions/consulted-service.actions";
import type { UpdateStageRequest } from "@/shared/validation/consulted-service.schema";

/**
 * Hook to update stage (for Kanban drag & drop)
 * Unlike consulted-services useUpdateStage, this accepts consultedServiceId dynamically
 */
export function useUpdateStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      consultedServiceId,
      ...data
    }: UpdateStageRequest & { consultedServiceId: string }) =>
      updateStageAction(consultedServiceId, data),
    onSuccess: () => {
      // Invalidate Kanban data
      queryClient.invalidateQueries({
        queryKey: ["sales-pipeline-kanban"],
      });
      // Invalidate pipeline list
      queryClient.invalidateQueries({
        queryKey: ["sales-pipeline"],
      });
      // Invalidate analytics
      queryClient.invalidateQueries({
        queryKey: ["sales-analytics"],
      });
    },
  });
}
