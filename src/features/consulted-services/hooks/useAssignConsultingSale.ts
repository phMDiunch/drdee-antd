// src/features/consulted-services/hooks/useAssignConsultingSale.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { assignConsultingSaleAction } from "@/server/actions/consulted-service.actions";

export function useAssignConsultingSale() {
  const queryClient = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: async (consultedServiceId: string) => {
      const result = await assignConsultingSaleAction(consultedServiceId);
      return result;
    },
    onSuccess: () => {
      notify.success("Đã gán sale tư vấn thành công");
      // Invalidate related queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["consulted-services"] });
    },
    onError: (error: Error) => {
      notify.error(error.message || "Không thể gán sale tư vấn");
    },
  });
}
