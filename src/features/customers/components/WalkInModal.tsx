// src/features/customers/components/WalkInModal.tsx
"use client";

import { Modal, Form, Select, Input } from "antd";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateAppointment } from "@/features/appointments";
import { useWorkingEmployees } from "@/features/employees";
import { useCurrentUser } from "@/shared/providers/user-provider";
import type { CustomerDailyResponse } from "@/shared/validation/customer.schema";

const WalkInFormSchema = z.object({
  primaryDentistId: z.string().min(1, "Vui lòng chọn bác sĩ"),
  notes: z.string().optional(),
});

type WalkInForm = z.infer<typeof WalkInFormSchema>;

type Props = {
  open: boolean;
  customer: CustomerDailyResponse;
  date: string;
  onClose: () => void;
};

export default function WalkInModal({ open, customer, onClose }: Props) {
  const { control, handleSubmit, reset } = useForm<WalkInForm>({
    resolver: zodResolver(WalkInFormSchema),
  });

  const { user: currentUser } = useCurrentUser();
  const createMutation = useCreateAppointment();
  const { data: employees } = useWorkingEmployees();

  const onSubmit = async (formData: WalkInForm) => {
    await createMutation.mutateAsync({
      customerId: customer.id,
      clinicId: customer.clinicId || currentUser?.clinicId || "",
      primaryDentistId: formData.primaryDentistId,
      appointmentDateTime: new Date(), // Now
      duration: 30,
      status: "Đến đột xuất",
      notes: formData.notes,
      // Auto check-in by setting checkInTime
      checkInTime: new Date(),
    });

    reset();
    onClose();
  };

  const handleCancel = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      title={`Walk-in: ${customer.fullName}`}
      open={open}
      onOk={handleSubmit(onSubmit)}
      onCancel={handleCancel}
      confirmLoading={createMutation.isPending}
      okText="Xác nhận Check-in"
      destroyOnHidden
    >
      <Form layout="vertical">
        <Form.Item label="Chọn bác sĩ chính" required>
          <Controller
            name="primaryDentistId"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <Select
                  {...field}
                  showSearch
                  placeholder="Chọn hoặc gõ tên bác sĩ"
                  options={employees?.map((e) => ({
                    label: e.fullName,
                    value: e.id,
                  }))}
                  filterOption={(input, option) =>
                    (option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  status={fieldState.error ? "error" : undefined}
                />
                {fieldState.error && (
                  <div style={{ color: "red", fontSize: 12, marginTop: 4 }}>
                    {fieldState.error.message}
                  </div>
                )}
              </>
            )}
          />
        </Form.Item>

        <Form.Item label="Ghi chú">
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <Input.TextArea
                {...field}
                rows={3}
                placeholder="Ghi chú (nếu có)"
              />
            )}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
