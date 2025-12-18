// src/features/consulted-services/hooks/useUpdateStage.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateStageAction } from "@/server/actions/consulted-service.actions";
import { useNotify } from "@/shared/hooks/useNotify";
import { CONSULTED_SERVICE_QUERY_KEYS } from "../constants";
import type { UpdateStageRequest } from "@/shared/validation/consulted-service.schema";

/**
 * Hook to update stage of a consulted service (Sales Pipeline)
 */
export function useUpdateStage(id: string) {
  const notify = useNotify();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateStageRequest) => updateStageAction(id, data),
    onSuccess: () => {
      notify.success("Đã cập nhật stage");
      // Invalidate detail query
      queryClient.invalidateQueries({
        queryKey: CONSULTED_SERVICE_QUERY_KEYS.byId(id),
      });
      // Invalidate list queries
      queryClient.invalidateQueries({
        queryKey: ["consulted-services"],
      });
      queryClient.invalidateQueries({
        queryKey: ["consulted-services-daily"],
      });
      // Invalidate stage history
      queryClient.invalidateQueries({
        queryKey: ["stage-history", id],
      });
    },
    onError: (error: Error) => {
      notify.error(error, { fallback: "Không thể cập nhật stage" });
    },
  });
}
