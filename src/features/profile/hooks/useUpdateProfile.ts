// src/features/profile/hooks/useUpdateProfile.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { updateProfileAction } from "@/server/actions/profile.actions";
import { PROFILE_MESSAGES, PROFILE_QUERY_KEYS } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import type { UpdateProfileRequest } from "@/shared/validation/profile.schema";

export function useUpdateProfile() {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (data: Partial<UpdateProfileRequest>) =>
      updateProfileAction(data),
    onSuccess: () => {
      notify.success(PROFILE_MESSAGES.UPDATE_SUCCESS);
      qc.invalidateQueries({ queryKey: PROFILE_QUERY_KEYS.current });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
