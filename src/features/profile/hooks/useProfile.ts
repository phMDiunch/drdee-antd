// src/features/profile/hooks/useProfile.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getProfileApi } from "../api";
import { PROFILE_QUERY_KEYS } from "../constants";

/**
 * Query hook: Get current user's profile
 * Caching: 5 minutes stale time (transactional data)
 */
export function useProfile() {
  return useQuery({
    queryKey: PROFILE_QUERY_KEYS.current,
    queryFn: getProfileApi,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
