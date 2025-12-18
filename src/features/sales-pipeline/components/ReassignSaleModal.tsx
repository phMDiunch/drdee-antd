// src/features/sales-pipeline/components/ReassignSaleModal.tsx
"use client";

import React, { useEffect, useMemo } from "react";
import { Modal, Form, Input, Typography, Select } from "antd";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  ReassignSaleRequestSchema,
  type ReassignSaleRequest,
} from "@/shared/validation/sales-activity.schema";
import { useEmployees } from "@/features/employees/hooks/useEmployees";

const { TextArea } = Input;
const { Text } = Typography;

type Props = {
  open: boolean;
  consultedServiceId: string;
  currentSaleName?: string;
  customerName?: string;
  serviceName?: string;
  confirmLoading?: boolean;
  onCancel: () => void;
  onSubmit: (payload: ReassignSaleRequest) => void;
};

export default function ReassignSaleModal({
  open,
  consultedServiceId,
  currentSaleName,
  customerName,
  serviceName,
  confirmLoading,
  onCancel,
  onSubmit,
}: Props) {
  const { data: employees = [], isLoading: isLoadingEmployees } = useEmployees({
    search: undefined,
  });

  const employeeOptions = useMemo(
    () =>
      employees.map((emp: { id: string; fullName: string }) => ({
        value: emp.id,
        label: emp.fullName,
      })),
    [employees]
  );

  const defaultValues: ReassignSaleRequest = useMemo(
    () => ({
      consultedServiceId,
      newSaleId: "",
      reason: undefined,
    }),
    [consultedServiceId]
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<ReassignSaleRequest>({
    resolver: zodResolver(ReassignSaleRequestSchema),
    mode: "onBlur",
    defaultValues,
  });

  useEffect(() => {
    if (!open) return;
    reset({ ...defaultValues, consultedServiceId });
  }, [open, consultedServiceId, reset, defaultValues]);

  const onValid = (values: ReassignSaleRequest) => {
    onSubmit(values);
  };

  return (
    <Modal
      open={open}
      title="Chuyển sale phụ trách"
      okText="Chuyển"
      onCancel={onCancel}
      onOk={handleSubmit(onValid)}
      confirmLoading={!!confirmLoading || isSubmitting}
      width={{ xs: "90%", sm: 500 }}
      destroyOnHidden
      maskClosable={false}
    >
      {/* Service Info */}
      <div
        style={{
          marginBottom: 16,
          padding: 12,
          background: "#f5f5f5",
          borderRadius: 4,
        }}
      >
        {serviceName && (
          <div>
            <Text strong>Dịch vụ: {serviceName}</Text>
          </div>
        )}
        {customerName && (
          <div>
            <Text type="secondary">Khách hàng: {customerName}</Text>
          </div>
        )}
        {currentSaleName && (
          <div style={{ marginTop: 8 }}>
            <Text>
              Sale hiện tại: <Text strong>{currentSaleName}</Text>
            </Text>
          </div>
        )}
      </div>

      <Form layout="vertical" requiredMark>
        {/* New Sale */}
        <Controller
          name="newSaleId"
          control={control}
          render={({ field, fieldState }) => (
            <Form.Item
              label="Chuyển cho"
              required
              validateStatus={fieldState.error ? "error" : ""}
              help={fieldState.error?.message}
            >
              <Select
                {...field}
                showSearch
                placeholder="Chọn nhân viên"
                loading={isLoadingEmployees}
                options={employeeOptions}
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
            </Form.Item>
          )}
        />

        {/* Reason (Optional) */}
        <Controller
          name="reason"
          control={control}
          render={({ field, fieldState }) => (
            <Form.Item
              label="Lý do"
              validateStatus={fieldState.error ? "error" : ""}
              help={fieldState.error?.message}
            >
              <TextArea
                {...field}
                value={field.value || ""}
                rows={3}
                placeholder="Ví dụ: Sale nghỉ phép, tái phân công..."
                maxLength={500}
              />
            </Form.Item>
          )}
        />
      </Form>
    </Modal>
  );
}
