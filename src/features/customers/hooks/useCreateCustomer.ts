// src/features/customers/hooks/useCreateCustomer.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { createCustomerAction } from "@/server/actions/customer.actions";
import { CUSTOMER_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import type {
  CreateCustomerRequest,
  CustomerResponse,
} from "@/shared/validation/customer.schema";

export function useCreateCustomer() {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (data: CreateCustomerRequest) => createCustomerAction(data),

    // 🎯 OPTIMISTIC UPDATE: Insert customer vào cache NGAY LẬP TỨC
    onMutate: async (newCustomerData) => {
      // 1. Cancel các queries đang pending để tránh conflict
      await qc.cancelQueries({ queryKey: ["customers"] });

      // 2. Snapshot data hiện tại (để rollback nếu lỗi)
      const previousCustomers = qc.getQueryData<CustomerResponse[]>([
        "customers",
      ]);

      // 3. Optimistically update cache: Insert customer mới vào đầu list
      if (previousCustomers) {
        const optimisticCustomer: CustomerResponse = {
          id: `temp-${Date.now()}`, // Temporary ID
          fullName: newCustomerData.fullName,
          customerCode: null,
          dob:
            newCustomerData.dob instanceof Date
              ? newCustomerData.dob.toISOString()
              : null,
          gender: newCustomerData.gender ?? null,
          phone: newCustomerData.phone ?? null,
          email: newCustomerData.email ?? null,
          address: newCustomerData.address ?? null,
          city: newCustomerData.city ?? null,
          district: newCustomerData.district ?? null,
          primaryContactId: newCustomerData.primaryContactId ?? null,
          primaryContactRole: newCustomerData.primaryContactRole ?? null,
          occupation: newCustomerData.occupation ?? null,
          source: newCustomerData.source ?? null,
          sourceNotes: newCustomerData.sourceNotes ?? null,
          serviceOfInterest: newCustomerData.serviceOfInterest ?? null,
          clinicId: newCustomerData.clinicId,
          createdById: "",
          updatedById: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          // Relations - sẽ được replace bởi data thật từ server
          clinic: {
            id: newCustomerData.clinicId,
            clinicCode: "",
            name: "",
            colorCode: "#000000",
          },
          createdBy: { id: "", fullName: "" },
          updatedBy: null,
          primaryContact: null,
        };

        qc.setQueryData<CustomerResponse[]>(
          ["customers"],
          [optimisticCustomer, ...previousCustomers]
        );
      }

      // 4. Return context để dùng trong onError
      return { previousCustomers };
    },

    // ✅ SUCCESS: Sync với server data thật
    onSuccess: () => {
      notify.success(CUSTOMER_MESSAGES.CREATE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["customers"] });
    },

    // ❌ ERROR: Rollback về data cũ
    onError: (e: unknown, _variables, context) => {
      // Restore previous data
      if (context?.previousCustomers) {
        qc.setQueryData(["customers"], context.previousCustomers);
      }
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR });
    },
  });
}
