// src/features/consulted-services/hooks/useCreateActivityLog.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createActivityLogAction } from "@/server/actions/sales-activity-log.actions";
import { useNotify } from "@/shared/hooks/useNotify";
import type { CreateActivityLogRequest } from "@/shared/validation/sales-activity-log.schema";

/**
 * Hook to create a new sales activity log
 */
export function useCreateActivityLog() {
  const notify = useNotify();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateActivityLogRequest) =>
      createActivityLogAction(data),
    onSuccess: (_, variables) => {
      notify.success("Đã thêm activity log");
      // Invalidate activity logs for this consulted service
      queryClient.invalidateQueries({
        queryKey: ["activity-logs", variables.consultedServiceId],
      });
    },
    onError: (error: Error) => {
      notify.error(error, { fallback: "Không thể thêm activity log" });
    },
  });
}
