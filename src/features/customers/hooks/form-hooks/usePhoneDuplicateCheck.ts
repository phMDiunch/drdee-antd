import { useMemo } from "react";
import { useLookupCustomerPhone } from "../queries";
import type { CustomerDetailResponse } from "@/shared/validation/customer.schema";

type UsePhoneDuplicateCheckParams = {
  phone: string;
  mode: "create" | "edit";
  initialData?: CustomerDetailResponse;
};

/**
 * Hook to check for phone duplicates and filter out current customer in edit mode
 * Returns null if duplicate is the current customer being edited (avoids false positive)
 */
export function usePhoneDuplicateCheck({
  phone,
  mode,
  initialData,
}: UsePhoneDuplicateCheckParams) {
  // Fetch duplicate customer by phone
  const { data: phoneDup } = useLookupCustomerPhone(
    phone?.length === 10 ? phone : null
  );

  // Filter out current customer in edit mode to avoid false positive duplicate warning
  // Also separate LEAD vs CUSTOMER duplicates
  const actualPhoneDup = useMemo(() => {
    // In edit mode, ignore duplicate if it's the current customer
    if (mode === "edit" && initialData && phoneDup) {
      return phoneDup.id === initialData.id ? null : phoneDup;
    }
    return phoneDup;
  }, [phoneDup, mode, initialData]);

  // Separate duplicate into LEAD vs CUSTOMER
  const isLeadDuplicate = actualPhoneDup?.type === "LEAD";
  const isCustomerDuplicate = actualPhoneDup?.type === "CUSTOMER";

  return {
    phoneDup,
    actualPhoneDup,
    isLeadDuplicate,
    isCustomerDuplicate,
  };
}
