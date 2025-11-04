"use client";

import { useQuery } from "@tanstack/react-query";
import { getCustomersApi } from "../api/getCustomers";
import { CUSTOMER_QUERY_KEYS } from "../constants";
import type { GetCustomersQuery } from "@/shared/validation/customer.schema";

export function useCustomers(params?: GetCustomersQuery) {
  return useQuery({
    queryKey: CUSTOMER_QUERY_KEYS.list(params),
    queryFn: () => getCustomersApi(params),
    staleTime: 60 * 1000, // 1 phút - Transaction data thay đổi thường xuyên hơn
    gcTime: 5 * 60 * 1000, // 5 phút - Giữ trong memory
    refetchOnWindowFocus: true, // Refetch khi user quay lại tab (nhưng vẫn show cache trước)
  });
}
