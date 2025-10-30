// src/features/customers/hooks/useCustomerDetail.ts
import { useQuery } from "@tanstack/react-query";
import { getCustomerDetailApi } from "../api/getCustomerDetail";

/**
 * React Query hook to fetch customer detail by ID
 * Returns full customer detail with relations
 */
export function useCustomerDetail(id: string) {
  return useQuery({
    queryKey: ["customers", "detail", id],
    queryFn: () => getCustomerDetailApi(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
