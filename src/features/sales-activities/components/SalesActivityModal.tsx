// src/features/sales-activities/components/SalesActivityModal.tsx
"use client";

import React, { useEffect, useMemo } from "react";
import { Modal, Form, Input, Radio, DatePicker, Select } from "antd";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import {
  CreateSalesActivityFormSchema,
  UpdateSalesActivityFormSchema,
  type CreateSalesActivityFormData,
  type UpdateSalesActivityFormData,
  type SalesActivityResponse,
} from "@/shared/validation/sales-activity.schema";
import { CONTACT_TYPE_LABELS } from "../constants";

/**
 * Helper to format tooth positions for display
 */
function formatToothPositions(positions: string[]): string {
  if (!positions || positions.length === 0) return "";
  return ` (Răng: ${positions.join(", ")})`;
}

type Props = {
  open: boolean;
  mode: "add" | "edit";
  consultedServices?: Array<{
    id: string;
    consultedServiceName: string;
    consultationDate: string | null;
    toothPositions: string[];
    serviceStatus: string;
    stage: string | null;
  }>;
  customerName?: string;
  initialData?: SalesActivityResponse;
  loading?: boolean;
  onSubmit: (
    data: CreateSalesActivityFormData | UpdateSalesActivityFormData
  ) => void;
  onCancel: () => void;
};

export default function SalesActivityModal({
  open,
  mode,
  consultedServices = [],
  customerName,
  initialData,
  loading = false,
  onSubmit,
  onCancel,
}: Props) {
  const schema = useMemo(
    () =>
      mode === "add"
        ? CreateSalesActivityFormSchema
        : UpdateSalesActivityFormSchema,
    [mode]
  );

  const defaultValues = useMemo(() => {
    if (mode === "add") {
      return {
        consultedServiceId: "",
        contactType: "call" as const,
        contactDate: dayjs().format("YYYY-MM-DDTHH:mm"),
        content: "",
        nextContactDate: null,
      };
    } else if (initialData) {
      return {
        contactType: initialData.contactType,
        contactDate: dayjs(initialData.contactDate).format("YYYY-MM-DDTHH:mm"),
        content: initialData.content,
        nextContactDate: initialData.nextContactDate || null,
      };
    }
    return {
      contactType: "call" as const,
      contactDate: dayjs().format("YYYY-MM-DDTHH:mm"),
      content: "",
      nextContactDate: null,
    };
  }, [mode, initialData]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateSalesActivityFormData | UpdateSalesActivityFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues,
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      reset(defaultValues);
    }
  }, [open, reset, defaultValues]);

  const handleFormSubmit = (
    formData: CreateSalesActivityFormData | UpdateSalesActivityFormData
  ) => {
    onSubmit(formData);
  };

  return (
    <Modal
      title={mode === "add" ? "Ghi nhật ký liên hệ" : "Sửa nhật ký liên hệ"}
      open={open}
      onOk={handleSubmit(handleFormSubmit)}
      onCancel={onCancel}
      okText={mode === "add" ? "Lưu nhật ký" : "Cập nhật"}
      cancelText="Hủy"
      confirmLoading={loading}
      width={600}
      destroyOnHidden
    >
      <Form layout="vertical">
        {mode === "add" && (
          <>
            <Form.Item label="Khách hàng">
              <Input value={customerName} disabled />
            </Form.Item>
            <Form.Item
              label="Dịch vụ cần follow-up"
              validateStatus={
                "consultedServiceId" in errors && errors.consultedServiceId
                  ? "error"
                  : ""
              }
              help={
                "consultedServiceId" in errors
                  ? errors.consultedServiceId?.message
                  : undefined
              }
              required
            >
              <Controller
                name="consultedServiceId"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="Chọn dịch vụ cần follow-up"
                    options={consultedServices.map((cs) => ({
                      value: cs.id,
                      label: `${dayjs(cs.consultationDate).format(
                        "DD/MM/YYYY"
                      )} - ${cs.consultedServiceName}${formatToothPositions(
                        cs.toothPositions
                      )}${cs.stage ? ` - ${cs.stage}` : ""}`,
                    }))}
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label ?? "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                  />
                )}
              />
            </Form.Item>
          </>
        )}

        <Form.Item
          label="Loại liên hệ"
          validateStatus={errors.contactType ? "error" : ""}
          help={errors.contactType?.message}
          required
        >
          <Controller
            name="contactType"
            control={control}
            render={({ field }) => (
              <Radio.Group {...field}>
                <Radio value="call">{CONTACT_TYPE_LABELS.call}</Radio>
                <Radio value="message">{CONTACT_TYPE_LABELS.message}</Radio>
                <Radio value="meet">{CONTACT_TYPE_LABELS.meet}</Radio>
              </Radio.Group>
            )}
          />
        </Form.Item>

        <Form.Item
          label="Ngày giờ liên hệ"
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
                  field.onChange(date?.format("YYYY-MM-DDTHH:mm") || "")
                }
                showTime
                format="DD/MM/YYYY HH:mm"
                style={{ width: "100%" }}
                placeholder="Chọn giờ"
                disabledDate={() => true}
                inputReadOnly
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label="Nội dung trao đổi"
          validateStatus={errors.content ? "error" : ""}
          help={errors.content?.message}
          required
        >
          <Controller
            name="content"
            control={control}
            render={({ field }) => (
              <Input.TextArea
                {...field}
                rows={4}
                placeholder="Nhập nội dung trao đổi với khách hàng..."
                maxLength={5000}
                showCount
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label="Ngày follow-up (tùy chọn)"
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
                placeholder="Chọn ngày (nếu cần đặt lịch follow-up)"
                allowClear
              />
            )}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
