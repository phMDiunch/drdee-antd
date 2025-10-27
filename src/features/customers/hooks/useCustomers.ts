"use client";

import { useQuery } from "@tanstack/react-query";
import { getCustomersApi } from "../api";
import { CUSTOMER_QUERY_KEYS } from "../constants";
import type { GetCustomersQuery } from "@/shared/validation/customer.schema";

export function useCustomers(params?: GetCustomersQuery) {
  return useQuery({
    queryKey: CUSTOMER_QUERY_KEYS.list(params),
    queryFn: () => getCustomersApi(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
