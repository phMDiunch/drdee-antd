// src/features/consulted-services/hooks/useUpdateActivityLog.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateActivityLogAction } from "@/server/actions/sales-activity-log.actions";
import { useNotify } from "@/shared/hooks/useNotify";
import type { UpdateActivityLogRequest } from "@/shared/validation/sales-activity-log.schema";

/**
 * Hook to update an existing sales activity log
 */
export function useUpdateActivityLog(id: string, consultedServiceId: string) {
  const notify = useNotify();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateActivityLogRequest) =>
      updateActivityLogAction(id, data),
    onSuccess: () => {
      notify.success("Đã cập nhật activity log");
      // Invalidate activity logs for this consulted service
      queryClient.invalidateQueries({
        queryKey: ["activity-logs", consultedServiceId],
      });
    },
    onError: (error: Error) => {
      notify.error(error, { fallback: "Không thể cập nhật activity log" });
    },
  });
}
