// src/features/dental-services/hooks/useArchiveDentalService.ts

"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { archiveDentalServiceApi } from "../api/archiveDentalService";
import { DENTAL_SERVICE_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

export function useArchiveDentalService() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation({
    mutationFn: (id: string) => archiveDentalServiceApi(id),
    onSuccess: () => {
      notify.success(DENTAL_SERVICE_MESSAGES.ARCHIVE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["dental-services"] });
    },
    onError: (e: unknown) => notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
