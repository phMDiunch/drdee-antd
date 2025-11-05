"use client";

import { useQuery } from "@tanstack/react-query";
import { getCustomersDailyApi, type GetCustomersDailyParams } from "../api";

export function useCustomersDaily(params?: GetCustomersDailyParams) {
  return useQuery({
    queryKey: [
      "customers",
      "daily",
      {
        date: params?.date,
        clinicId: params?.clinicId,
        includeAppointments: params?.includeAppointments,
      },
    ],
    queryFn: () => getCustomersDailyApi(params),
    staleTime: 30_000, // 30 seconds (shorter due to check-in updates)
  });
}
