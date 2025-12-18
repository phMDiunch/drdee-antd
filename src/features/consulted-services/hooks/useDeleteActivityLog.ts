// src/features/consulted-services/hooks/useDeleteActivityLog.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteActivityLogAction } from "@/server/actions/sales-activity-log.actions";
import { useNotify } from "@/shared/hooks/useNotify";

/**
 * Hook to delete a sales activity log
 */
export function useDeleteActivityLog(consultedServiceId: string) {
  const notify = useNotify();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteActivityLogAction(id),
    onSuccess: () => {
      notify.success("Đã xóa activity log");
      // Invalidate activity logs for this consulted service
      queryClient.invalidateQueries({
        queryKey: ["activity-logs", consultedServiceId],
      });
    },
    onError: (error: Error) => {
      notify.error(error, { fallback: "Không thể xóa activity log" });
    },
  });
}
