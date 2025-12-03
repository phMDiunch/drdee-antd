// src/features/labo-items/components/LaboItemFormModal.tsx
"use client";

import React, { useEffect, useMemo } from "react";
import { Modal, Form, Input, Row, Col, Select } from "antd";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import type {
  LaboItemResponse,
  CreateLaboItemRequest,
  UpdateLaboItemRequest,
} from "@/shared/validation/labo-item.schema";
import {
  CreateLaboItemRequestSchema,
  UpdateLaboItemRequestSchema,
} from "@/shared/validation/labo-item.schema";
import { LABO_SERVICE_GROUPS, LABO_UNITS } from "../constants";

type Props = {
  open: boolean;
  mode: "create" | "edit";
  initial?: LaboItemResponse | null;
  confirmLoading?: boolean;
  onCancel: () => void;
  onSubmit: (payload: CreateLaboItemRequest | UpdateLaboItemRequest) => void;
};

const defaultValues: CreateLaboItemRequest & { id?: string } = {
  name: "",
  description: "",
  serviceGroup: "",
  unit: LABO_UNITS[0] as string,
};

export default function LaboItemFormModal({
  open,
  mode,
  initial,
  confirmLoading,
  onCancel,
  onSubmit,
}: Props) {
  const schema = useMemo(
    () =>
      mode === "create"
        ? CreateLaboItemRequestSchema
        : UpdateLaboItemRequestSchema,
    [mode]
  );

  // Memoize defaultValues to prevent infinite loop
  const formDefaultValues = useMemo(() => {
    if (mode === "edit" && initial) {
      return {
        id: initial.id,
        name: initial.name,
        description: initial.description ?? undefined,
        serviceGroup: initial.serviceGroup ?? undefined,
        unit: initial.unit,
      };
    }
    return defaultValues;
  }, [mode, initial]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<CreateLaboItemRequest & { id?: string }>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: formDefaultValues,
  });

  useEffect(() => {
    if (!open) return;
    reset(formDefaultValues);
  }, [open, formDefaultValues, reset]);

  const onValid = (values: CreateLaboItemRequest & { id?: string }) => {
    if (mode === "edit") {
      const payload: UpdateLaboItemRequest = {
        id: values.id || (initial?.id as string),
        name: values.name,
        description: values.description,
        serviceGroup: values.serviceGroup,
        unit: values.unit,
      };
      onSubmit(payload);
    } else {
      const payload: CreateLaboItemRequest = {
        name: values.name,
        description: values.description,
        serviceGroup: values.serviceGroup,
        unit: values.unit,
      };
      onSubmit(payload);
    }
  };

  return (
    <Modal
      open={open}
      title={mode === "create" ? "Tạo hàng labo" : "Cập nhật hàng labo"}
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
          <Col xs={24} lg={16}>
            <Controller
              name="name"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Tên hàng labo"
                  required
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Input
                    {...field}
                    placeholder="VD: Răng sứ Cercon"
                    maxLength={200}
                  />
                </Form.Item>
              )}
            />
          </Col>
          <Col xs={24} lg={8}>
            <Controller
              name="unit"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Đơn vị tính"
                  required
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Select
                    {...field}
                    options={LABO_UNITS.map((u) => ({ label: u, value: u }))}
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>

        <Row gutter={12}>
          <Col xs={24}>
            <Controller
              name="serviceGroup"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Nhóm dịch vụ"
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Select
                    {...field}
                    allowClear
                    placeholder="Chọn nhóm dịch vụ"
                    options={LABO_SERVICE_GROUPS.map((g) => ({
                      label: g,
                      value: g,
                    }))}
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>

        <Row gutter={12}>
          <Col xs={24}>
            <Controller
              name="description"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Mô tả"
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Input.TextArea
                    {...field}
                    value={field.value ?? ""}
                    rows={4}
                    maxLength={1000}
                    placeholder="Mô tả chi tiết về hàng labo..."
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
