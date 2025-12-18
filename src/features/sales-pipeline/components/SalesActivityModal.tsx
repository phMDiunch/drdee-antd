// src/features/sales-pipeline/components/SalesActivityModal.tsx
"use client";

import React, { useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Radio,
  DatePicker,
  Typography,
  Divider,
} from "antd";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";

import {
  CreateSalesActivityFormSchema,
  type CreateSalesActivityFormData,
} from "@/shared/validation/sales-activity.schema";
import {
  CONTACT_TYPE_OPTIONS,
  CONTACT_CONTENT_PLACEHOLDERS,
} from "../constants";
import ActivityTimeline from "./ActivityTimeline";
import { useSalesActivities } from "../hooks/useSalesActivities";

const { TextArea } = Input;
const { Text } = Typography;

type Props = {
  open: boolean;
  consultedServiceId: string;
  customerName?: string;
  customerPhone?: string;
  serviceName?: string;
  confirmLoading?: boolean;
  onCancel: () => void;
  onSubmit: (payload: CreateSalesActivityFormData) => void;
};

const defaultValues = {
  contactType: "call" as const,
  content: "",
  nextContactDate: "" as string | undefined,
};

export default function SalesActivityModal({
  open,
  consultedServiceId,
  customerName,
  customerPhone,
  serviceName,
  confirmLoading,
  onCancel,
  onSubmit,
}: Props) {
  const { data: activities = [], isLoading: isLoadingActivities } =
    useSalesActivities(consultedServiceId);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting },
  } = useForm<CreateSalesActivityFormData>({
    resolver: zodResolver(CreateSalesActivityFormSchema),
    mode: "onBlur",
    defaultValues,
  });

  const contactType = watch("contactType");
  const placeholder =
    CONTACT_CONTENT_PLACEHOLDERS[
      contactType as keyof typeof CONTACT_CONTENT_PLACEHOLDERS
    ] || "";

  useEffect(() => {
    if (!open) return;
    reset(defaultValues);
  }, [open, reset]);

  const onValid = (values: CreateSalesActivityFormData) => {
    onSubmit(values);
  };

  return (
    <Modal
      open={open}
      title="Ghi nhận tiếp xúc khách hàng"
      okText="Lưu"
      onCancel={onCancel}
      onOk={handleSubmit(onValid)}
      confirmLoading={!!confirmLoading || isSubmitting}
      width={{ xs: "90%", md: "70%", lg: 800 }}
      styles={{
        content: { maxHeight: "90vh" },
        body: { maxHeight: "70vh", overflowY: "auto", paddingInline: 16 },
      }}
      destroyOnHidden
      maskClosable={false}
    >
      {/* Customer & Service Info */}
      {(customerName || serviceName) && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            background: "#f5f5f5",
            borderRadius: 4,
          }}
        >
          {customerName && (
            <Text strong>
              Khách hàng: {customerName}
              {customerPhone && ` - ${customerPhone}`}
            </Text>
          )}
          {serviceName && (
            <div>
              <Text type="secondary">Dịch vụ: {serviceName}</Text>
            </div>
          )}
        </div>
      )}

      <Form layout="vertical" requiredMark>
        {/* Contact Type */}
        <Controller
          name="contactType"
          control={control}
          render={({ field, fieldState }) => (
            <Form.Item
              label="Loại tiếp xúc"
              required
              validateStatus={fieldState.error ? "error" : ""}
              help={fieldState.error?.message}
            >
              <Radio.Group {...field} options={CONTACT_TYPE_OPTIONS} />
            </Form.Item>
          )}
        />

        {/* Content */}
        <Controller
          name="content"
          control={control}
          render={({ field, fieldState }) => (
            <Form.Item
              label="Nội dung"
              required
              validateStatus={fieldState.error ? "error" : ""}
              help={fieldState.error?.message}
            >
              <TextArea
                {...field}
                rows={4}
                placeholder={placeholder}
                maxLength={5000}
                showCount
              />
            </Form.Item>
          )}
        />

        {/* Next Contact Date */}
        <Controller
          name="nextContactDate"
          control={control}
          render={({ field, fieldState }) => (
            <Form.Item
              label="Ngày hẹn liên hệ tiếp"
              validateStatus={fieldState.error ? "error" : ""}
              help={fieldState.error?.message}
            >
              <DatePicker
                {...field}
                value={field.value ? dayjs(field.value) : null}
                onChange={(date) => {
                  field.onChange(date ? date.format("YYYY-MM-DD") : undefined);
                }}
                style={{ width: "100%" }}
                placeholder="Chọn ngày hẹn (tùy chọn)"
                format="DD/MM/YYYY"
                disabledDate={(current) =>
                  current && current < dayjs().startOf("day")
                }
              />
            </Form.Item>
          )}
        />
      </Form>

      <Divider />

      {/* Activity History */}
      <div>
        <Text strong>Lịch sử tiếp xúc khách hàng</Text>
        <div style={{ marginTop: 12 }}>
          <ActivityTimeline
            activities={activities}
            loading={isLoadingActivities}
          />
        </div>
      </div>
    </Modal>
  );
}
