// src/features/customers/hooks/useUpdateCustomer.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateCustomerAction } from "@/server/actions/customer.actions";
import { useNotify } from "@/shared/hooks/useNotify";
import type {
  UpdateCustomerRequest,
  CustomerResponse,
} from "@/shared/validation/customer.schema";

/**
 * React Query mutation hook to update customer
 * Automatically invalidates customer queries on success
 */
export function useUpdateCustomer(id: string) {
  const queryClient = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (data: UpdateCustomerRequest) => updateCustomerAction(id, data),

    // 🎯 OPTIMISTIC UPDATE: Update customer trong cache NGAY LẬP TỨC
    onMutate: async (updatedData) => {
      // 1. Cancel các queries đang pending
      await queryClient.cancelQueries({ queryKey: ["customers"] });

      // 2. Snapshot data hiện tại (để rollback nếu lỗi)
      const previousCustomers = queryClient.getQueryData<CustomerResponse[]>([
        "customers",
      ]);

      // 3. Optimistically update cache: Merge data mới vào customer
      if (previousCustomers) {
        queryClient.setQueryData<CustomerResponse[]>(
          ["customers"],
          previousCustomers.map((customer) => {
            if (customer.id === id) {
              return {
                ...customer,
                ...updatedData,
                // Convert dob nếu là Date
                dob:
                  updatedData.dob instanceof Date
                    ? updatedData.dob.toISOString()
                    : updatedData.dob ?? customer.dob,
                updatedAt: new Date().toISOString(),
              };
            }
            return customer;
          })
        );
      }

      // 4. Return context để dùng trong onError
      return { previousCustomers };
    },

    // ✅ SUCCESS: Sync với server
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers", "detail", id] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      notify.success("Cập nhật thông tin khách hàng thành công");
    },

    // ❌ ERROR: Rollback về data cũ
    onError: (error, _variables, context) => {
      if (context?.previousCustomers) {
        queryClient.setQueryData(["customers"], context.previousCustomers);
      }
      notify.error(error, {
        fallback: "Có lỗi xảy ra khi cập nhật khách hàng",
      });
    },
  });
}
