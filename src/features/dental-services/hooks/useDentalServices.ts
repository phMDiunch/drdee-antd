// src/features/dental-services/hooks/useDentalServices.ts

"use client";
import { useQuery } from "@tanstack/react-query";
import { getDentalServicesApi } from "../api";
import { DENTAL_SERVICE_QUERY_KEYS } from "../constants";

export function useDentalServices(includeArchived: boolean) {
  return useQuery({
    queryKey: DENTAL_SERVICE_QUERY_KEYS.list(includeArchived),
    queryFn: () => getDentalServicesApi(includeArchived),
    staleTime: 60_000,
  });
}
