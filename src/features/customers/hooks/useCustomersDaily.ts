"use client";

import { useQuery } from "@tanstack/react-query";
import { getCustomersDailyApi, type GetCustomersDailyParams } from "../api/getCustomersDaily";
import { CUSTOMER_QUERY_KEYS } from "../constants";

export function useCustomersDaily(params?: GetCustomersDailyParams) {
  return useQuery({
    queryKey: CUSTOMER_QUERY_KEYS.daily(params?.date, params?.clinicId),
    queryFn: () => getCustomersDailyApi(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
