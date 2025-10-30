// src/features/clinics/components/ClinicFormModal.tsx
"use client";

import React, { useEffect, useMemo } from "react";
import { Modal, Form, Input, Row, Col, ColorPicker } from "antd";
import dayjs from "dayjs";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  ClinicResponse,
  CreateClinicRequest,
  UpdateClinicRequest,
} from "@/shared/validation/clinic.schema";
import {
  CreateClinicRequestSchema,
  UpdateClinicRequestSchema,
} from "@/shared/validation/clinic.schema";

type Props = {
  open: boolean;
  mode: "create" | "edit";
  isAdmin?: boolean;
  initial?: ClinicResponse | null;
  confirmLoading?: boolean;
  onCancel: () => void;
  onSubmit: (payload: CreateClinicRequest | UpdateClinicRequest) => void;
};

const defaultClinicFormValues: CreateClinicRequest = {
  clinicCode: "",
  name: "",
  address: "",
  phone: undefined,
  email: undefined,
  colorCode: "#28B463",
};

export default function ClinicFormModal({
  open,
  mode,
  isAdmin,
  initial,
  confirmLoading,
  onCancel,
  onSubmit,
}: Props) {
  const schema = useMemo(
    () =>
      mode === "create" ? CreateClinicRequestSchema : UpdateClinicRequestSchema,
    [mode]
  );

  // Memoize defaultValues to prevent infinite loop
  const defaultValues = useMemo(() => {
    if (mode === "edit" && initial) {
      return {
        id: initial.id,
        clinicCode: initial.clinicCode,
        name: initial.name,
        address: initial.address,
        phone: initial.phone ?? undefined,
        email: initial.email ?? undefined,
        colorCode: initial.colorCode,
      };
    }
    return defaultClinicFormValues;
  }, [mode, initial]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<CreateClinicRequest & { id?: string }>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues,
  });

  useEffect(() => {
    if (!open) return;
    reset(defaultValues);
  }, [open, defaultValues, reset]);

  const onValid = (values: CreateClinicRequest & { id?: string }) => {
    if (mode === "edit") {
      const payload: UpdateClinicRequest = {
        id: values.id || (initial?.id as string),
        clinicCode: values.clinicCode,
        name: values.name,
        address: values.address,
        phone: values.phone,
        email: values.email,
        colorCode: values.colorCode,
      };
      onSubmit(payload);
    } else {
      const payload: CreateClinicRequest = {
        clinicCode: values.clinicCode,
        name: values.name,
        address: values.address,
        phone: values.phone,
        email: values.email,
        colorCode: values.colorCode,
      };
      onSubmit(payload);
    }
  };

  return (
    <Modal
      open={open}
      title={mode === "create" ? "Tạo phòng khám" : "Cập nhật phòng khám"}
      okText={mode === "create" ? "Tạo" : "Lưu"}
      onCancel={onCancel}
      onOk={handleSubmit(onValid)}
      confirmLoading={!!confirmLoading || isSubmitting}
      width={{ xs: "85%", lg: "65%" }}
      styles={{
        content: { maxHeight: "85vh" },
        body: { maxHeight: "60vh", overflowY: "auto", paddingInline: 16 },
      }}
      destroyOnHidden
      maskClosable={false}
    >
      <Form layout="vertical" requiredMark>
        <Row gutter={12}>
          <Col xs={24} lg={8}>
            <Controller
              name="clinicCode"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Mã phòng khám"
                  required
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Input {...field} placeholder="VD: HN-01" maxLength={20} />
                </Form.Item>
              )}
            />
          </Col>

          <Col xs={24} lg={16}>
            <Controller
              name="name"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Tên phòng khám"
                  required
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Input {...field} placeholder="Phòng khám Hà Nội 01" />
                </Form.Item>
              )}
            />
          </Col>
        </Row>

        <Row gutter={12}>
          <Col xs={24} lg={8}>
            <Controller
              name="colorCode"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Màu hiển thị"
                  required
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <ColorPicker
                    disabledAlpha
                    format="hex"
                    showText
                    value={field.value || undefined}
                    onChange={(c) =>
                      field.onChange(c.toHexString().toLowerCase())
                    }
                  />
                </Form.Item>
              )}
            />
          </Col>

          <Col xs={24} lg={16}>
            <Controller
              name="address"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Địa chỉ"
                  required
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Input {...field} placeholder="Số 1, Đường A, Quận B..." />
                </Form.Item>
              )}
            />
          </Col>
        </Row>

        <Row gutter={12}>
          <Col xs={24} lg={8}>
            <Controller
              name="phone"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Điện thoại"
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="0987654321"
                  />
                </Form.Item>
              )}
            />
          </Col>

          <Col xs={24} lg={16}>
            <Controller
              name="email"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Email"
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="clinic@example.com"
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>

        {mode === "edit" && isAdmin && initial && (
          <Row gutter={12}>
            <Col xs={24} md={12}>
              <Form.Item label="Ngày tạo">
                <Input
                  disabled
                  value={dayjs(initial.createdAt).format("DD/MM/YYYY HH:mm")}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Cập nhật">
                <Input
                  disabled
                  value={dayjs(initial.updatedAt).format("DD/MM/YYYY HH:mm")}
                />
              </Form.Item>
            </Col>
          </Row>
        )}
      </Form>
    </Modal>
  );
}
