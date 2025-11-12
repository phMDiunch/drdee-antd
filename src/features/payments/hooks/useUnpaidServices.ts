// src/features/payments/hooks/useUnpaidServices.ts
import { useQuery } from "@tanstack/react-query";
import { getUnpaidServicesApi } from "../api";

export function useUnpaidServices(customerId: string | null | undefined) {
  return useQuery({
    queryKey: ["unpaid-services", customerId],
    queryFn: () => getUnpaidServicesApi(customerId!),
    enabled: !!customerId,
  });
}
