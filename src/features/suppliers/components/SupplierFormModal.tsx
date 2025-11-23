// src/features/suppliers/components/SupplierFormModal.tsx
"use client";

import React, { useEffect, useMemo } from "react";
import { Modal, Form, Input, Row, Col, Select } from "antd";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import type {
  SupplierResponse,
  CreateSupplierRequest,
  UpdateSupplierRequest,
} from "@/shared/validation/supplier.schema";
import {
  CreateSupplierRequestSchema,
  UpdateSupplierRequestSchema,
} from "@/shared/validation/supplier.schema";
import dayjs from "dayjs";

const { TextArea } = Input;

type Props = {
  open: boolean;
  mode: "create" | "edit";
  isAdmin?: boolean;
  initial?: SupplierResponse | null;
  supplierGroupOptions?: { value: string; label: string }[]; // From MasterData
  confirmLoading?: boolean;
  onCancel: () => void;
  onSubmit: (payload: CreateSupplierRequest | UpdateSupplierRequest) => void;
};

const defaultValues: CreateSupplierRequest & { id?: string } = {
  name: "",
  shortName: undefined,
  supplierGroup: undefined,
  phone: undefined,
  email: undefined,
  address: undefined,
  taxCode: undefined,
  note: undefined,
};

export default function SupplierFormModal({
  open,
  mode,
  isAdmin,
  initial,
  supplierGroupOptions = [],
  confirmLoading,
  onCancel,
  onSubmit,
}: Props) {
  const schema = useMemo(
    () =>
      mode === "create"
        ? CreateSupplierRequestSchema
        : UpdateSupplierRequestSchema,
    [mode]
  );

  // Memoize defaultValues to prevent infinite loop
  const formDefaultValues = useMemo(() => {
    if (mode === "edit" && initial) {
      return {
        id: initial.id,
        name: initial.name,
        shortName: initial.shortName ?? undefined,
        supplierGroup: initial.supplierGroup ?? undefined,
        phone: initial.phone ?? undefined,
        email: initial.email ?? undefined,
        address: initial.address ?? undefined,
        taxCode: initial.taxCode ?? undefined,
        note: initial.note ?? undefined,
      };
    }
    return defaultValues;
  }, [mode, initial]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<CreateSupplierRequest & { id?: string }>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: formDefaultValues,
  });

  useEffect(() => {
    if (!open) return;
    reset(formDefaultValues);
  }, [open, formDefaultValues, reset]);

  const onValid = (values: CreateSupplierRequest & { id?: string }) => {
    if (mode === "edit") {
      const payload: UpdateSupplierRequest = {
        id: values.id || (initial?.id as string),
        name: values.name,
        shortName: values.shortName,
        supplierGroup: values.supplierGroup,
        phone: values.phone,
        email: values.email,
        address: values.address,
        taxCode: values.taxCode,
        note: values.note,
      };
      onSubmit(payload);
    } else {
      const payload: CreateSupplierRequest = {
        name: values.name,
        shortName: values.shortName,
        supplierGroup: values.supplierGroup,
        phone: values.phone,
        email: values.email,
        address: values.address,
        taxCode: values.taxCode,
        note: values.note,
      };
      onSubmit(payload);
    }
  };

  return (
    <Modal
      open={open}
      title={mode === "create" ? "Tạo nhà cung cấp" : "Cập nhật nhà cung cấp"}
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
        {/* Row 1: supplierGroup */}
        <Row gutter={12}>
          <Col xs={24}>
            <Controller
              name="supplierGroup"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Nhóm NCC"
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Select
                    {...field}
                    placeholder="Chọn nhóm nhà cung cấp"
                    allowClear
                    options={supplierGroupOptions}
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>

        {/* Row 2: name, shortName */}
        <Row gutter={12}>
          <Col xs={24} lg={12}>
            <Controller
              name="name"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Tên NCC"
                  required
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Input
                    {...field}
                    placeholder="VD: Công ty TNHH Vật Tư Y Tế ABC"
                    maxLength={200}
                  />
                </Form.Item>
              )}
            />
          </Col>
          <Col xs={24} lg={12}>
            <Controller
              name="shortName"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Tên viết tắt"
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="VD: ABC Medical"
                    maxLength={50}
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>

        {/* Row 3: phone, email */}
        <Row gutter={12}>
          <Col xs={24} lg={12}>
            <Controller
              name="phone"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="SĐT"
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="VD: 0901234567"
                    maxLength={20}
                  />
                </Form.Item>
              )}
            />
          </Col>
          <Col xs={24} lg={12}>
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
                    placeholder="VD: contact@abc-medical.com"
                    maxLength={100}
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>

        {/* Row 4: address, taxCode */}
        <Row gutter={12}>
          <Col xs={24} lg={12}>
            <Controller
              name="address"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Địa chỉ"
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="VD: 123 Nguyễn Văn A, Q1, HCM"
                    maxLength={500}
                  />
                </Form.Item>
              )}
            />
          </Col>
          <Col xs={24} lg={12}>
            <Controller
              name="taxCode"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Mã số thuế"
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="VD: 0123456789"
                    maxLength={20}
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>

        {/* Row 5: note */}
        <Row gutter={12}>
          <Col xs={24}>
            <Controller
              name="note"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Ghi chú"
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <TextArea
                    {...field}
                    value={field.value ?? ""}
                    placeholder="Ghi chú thêm về nhà cung cấp"
                    rows={3}
                    maxLength={1000}
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>

        {/* Admin metadata (only in edit mode) */}
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
