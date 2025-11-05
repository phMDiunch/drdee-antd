// src/features/customers/hooks/useUpdateCustomer.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateCustomerAction } from "@/server/actions/customer.actions";
import { useNotify } from "@/shared/hooks/useNotify";
import type { UpdateCustomerRequest } from "@/shared/validation/customer.schema";

/**
 * React Query mutation hook to update customer
 * Automatically invalidates customer queries on success
 */
export function useUpdateCustomer(id: string) {
  const queryClient = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (data: UpdateCustomerRequest) => updateCustomerAction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers", "detail", id] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      notify.success("Cập nhật thông tin khách hàng thành công");
    },
    onError: (error) => {
      notify.error(error, {
        fallback: "Có lỗi xảy ra khi cập nhật khách hàng",
      });
    },
  });
}
