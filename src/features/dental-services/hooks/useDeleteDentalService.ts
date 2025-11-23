// src/features/dental-services/hooks/useDeleteDentalService.ts

"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { deleteDentalServiceAction } from "@/server/actions/dental-service.actions";
import { DENTAL_SERVICE_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

export function useDeleteDentalService() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation({
    mutationFn: (id: string) => deleteDentalServiceAction(id),
    onSuccess: () => {
      notify.success(DENTAL_SERVICE_MESSAGES.DELETE_SUCCESS);
      qc.invalidateQueries({
        queryKey: ["dental-services"],
        refetchType: "active",
      });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
