// src/features/consulted-services/components/ActivityLogForm.tsx
"use client";

import React, { useEffect } from "react";
import { Form, Input, Select, DatePicker, Space } from "antd";
import {
  CONTACT_TYPES,
  CONTACT_TYPE_LABELS,
  type CreateActivityLogFormData,
  CreateActivityLogFormSchema,
} from "@/shared/validation/sales-activity-log.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import dayjs from "dayjs";

const { TextArea } = Input;

interface ActivityLogFormProps {
  initialValues?: Partial<CreateActivityLogFormData>;
  onSubmit: (data: CreateActivityLogFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

/**
 * Form for creating/editing sales activity logs
 */
export default function ActivityLogForm({
  initialValues,
  onSubmit,
  isSubmitting,
}: ActivityLogFormProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateActivityLogFormData>({
    resolver: zodResolver(CreateActivityLogFormSchema),
    defaultValues: {
      contactType: "call",
      contactDate: dayjs().format("YYYY-MM-DD"),
      content: "",
      nextContactDate: null,
      ...initialValues,
    },
  });

  useEffect(() => {
    if (initialValues) {
      reset(initialValues);
    }
  }, [initialValues, reset]);

  return (
    <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
      <Form.Item
        label="Loại tiếp xúc"
        validateStatus={errors.contactType ? "error" : ""}
        help={errors.contactType?.message}
        required
      >
        <Controller
          name="contactType"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              placeholder="Chọn loại tiếp xúc"
              options={CONTACT_TYPES.map((type) => ({
                value: type,
                label: CONTACT_TYPE_LABELS[type],
              }))}
            />
          )}
        />
      </Form.Item>

      <Form.Item
        label="Ngày tiếp xúc"
        validateStatus={errors.contactDate ? "error" : ""}
        help={errors.contactDate?.message}
        required
      >
        <Controller
          name="contactDate"
          control={control}
          render={({ field }) => (
            <DatePicker
              {...field}
              value={field.value ? dayjs(field.value) : null}
              onChange={(date) =>
                field.onChange(date?.format("YYYY-MM-DD") || "")
              }
              format="DD/MM/YYYY"
              style={{ width: "100%" }}
              placeholder="Chọn ngày"
            />
          )}
        />
      </Form.Item>

      <Form.Item
        label="Nội dung"
        validateStatus={errors.content ? "error" : ""}
        help={errors.content?.message}
        required
      >
        <Controller
          name="content"
          control={control}
          render={({ field }) => (
            <TextArea
              {...field}
              placeholder="Ghi chú cuộc gọi, tin nhắn hoặc gặp mặt..."
              rows={4}
              maxLength={1000}
              showCount
            />
          )}
        />
      </Form.Item>

      <Form.Item
        label="Ngày liên hệ tiếp theo"
        validateStatus={errors.nextContactDate ? "error" : ""}
        help={errors.nextContactDate?.message}
      >
        <Controller
          name="nextContactDate"
          control={control}
          render={({ field }) => (
            <DatePicker
              {...field}
              value={field.value ? dayjs(field.value) : null}
              onChange={(date) =>
                field.onChange(date?.format("YYYY-MM-DD") || null)
              }
              format="DD/MM/YYYY"
              style={{ width: "100%" }}
              placeholder="Chọn ngày (tùy chọn)"
              allowClear
            />
          )}
        />
      </Form.Item>
    </Form>
  );
}
