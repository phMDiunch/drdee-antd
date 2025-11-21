// src/features/master-data/components/MasterDataFormModal.tsx
"use client";

import React, { useEffect, useMemo } from "react";
import { Modal, Form, Input, Row, Col, Select, Switch, TreeSelect } from "antd";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMasterDataList } from "../hooks/useMasterDataList";
import type {
  MasterDataResponse,
  CreateMasterDataRequest,
  UpdateMasterDataRequest,
} from "@/shared/validation/master-data.schema";
import {
  CreateMasterDataRequestSchema,
  UpdateMasterDataRequestSchema,
} from "@/shared/validation/master-data.schema";
import { MASTER_DATA_TYPE_OPTIONS } from "../constants";

type Props = {
  open: boolean;
  mode: "create" | "edit";
  isAdmin?: boolean;
  initial?: MasterDataResponse | null;
  confirmLoading?: boolean;
  onCancel: () => void;
  onSubmit: (
    payload: CreateMasterDataRequest | UpdateMasterDataRequest
  ) => void;
};

const defaultFormValues: CreateMasterDataRequest = {
  type: "",
  key: "",
  value: "",
  description: undefined,
  isActive: true,
  parentId: undefined,
};

export default function MasterDataFormModal({
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
        ? CreateMasterDataRequestSchema
        : UpdateMasterDataRequestSchema,
    [mode]
  );

  const defaultValues = useMemo(() => {
    if (mode === "edit" && initial) {
      return {
        id: initial.id,
        type: initial.type,
        key: initial.key,
        value: initial.value,
        description: initial.description ?? undefined,
        isActive: initial.isActive,
        parentId: initial.parentId ?? undefined,
      };
    }
    return defaultFormValues;
  }, [mode, initial]);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting },
  } = useForm({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    mode: "onBlur" as const,
    reValidateMode: "onChange" as const,
    defaultValues,
  });

  const selectedType = watch("type");

  // Fetch master data for parent selection (same type only)
  const { data: parentOptions = [] } = useMasterDataList(selectedType, false);

  useEffect(() => {
    if (!open) return;
    reset(defaultValues);
  }, [open, defaultValues, reset]);

  const onValid = (values: CreateMasterDataRequest & { id?: string }) => {
    if (mode === "edit") {
      const payload: UpdateMasterDataRequest = {
        id: values.id || (initial?.id as string),
        type: values.type,
        key: values.key,
        value: values.value,
        description: values.description,
        isActive: values.isActive,
        parentId: values.parentId,
      };
      onSubmit(payload);
    } else {
      const payload: CreateMasterDataRequest = {
        type: values.type,
        key: values.key,
        value: values.value,
        description: values.description,
        isActive: values.isActive,
        parentId: values.parentId,
      };
      onSubmit(payload);
    }
  };

  const treeData = parentOptions
    .filter((item) => item.id !== initial?.id) // Exclude self
    .map((item) => ({
      title: `${item.key} - ${item.value}`,
      value: item.id,
      key: item.id,
    }));

  return (
    <Modal
      open={open}
      title={mode === "create" ? "Thêm dữ liệu chủ" : "Cập nhật dữ liệu chủ"}
      okText={mode === "create" ? "Tạo" : "Lưu"}
      onCancel={onCancel}
      onOk={handleSubmit(onValid as never)}
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
          <Col xs={24} lg={12}>
            <Controller
              name="type"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Loại danh mục"
                  required
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Select
                    {...field}
                    options={MASTER_DATA_TYPE_OPTIONS}
                    placeholder="Chọn loại"
                    disabled={mode === "edit"}
                  />
                </Form.Item>
              )}
            />
          </Col>

          <Col xs={24} lg={12}>
            <Controller
              name="key"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Mã"
                  required
                  validateStatus={fieldState.error ? "error" : ""}
                  help={
                    fieldState.error?.message ||
                    "Chữ in hoa/thường, số, gạch dưới, gạch ngang. Không dấu, không khoảng trắng."
                  }
                >
                  <Input {...field} placeholder="VD: SUPPLIER_A" />
                </Form.Item>
              )}
            />
          </Col>
        </Row>

        <Row gutter={12}>
          <Col xs={24}>
            <Controller
              name="value"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Giá trị"
                  required
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Input {...field} placeholder="VD: Nhà cung cấp A" />
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
                    rows={3}
                    placeholder="Mô tả chi tiết (tùy chọn)"
                    maxLength={500}
                    showCount
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>

        <Row gutter={12}>
          <Col xs={24} lg={16}>
            <Controller
              name="parentId"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Parent (Phân cấp)"
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <TreeSelect
                    {...field}
                    value={field.value ?? undefined}
                    treeData={treeData}
                    placeholder="Chọn parent (tùy chọn)"
                    allowClear
                    showSearch
                    treeNodeFilterProp="title"
                    disabled={!selectedType}
                  />
                </Form.Item>
              )}
            />
          </Col>

          <Col xs={24} lg={8}>
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <Form.Item label="Kích hoạt">
                  <Switch checked={field.value} onChange={field.onChange} />
                </Form.Item>
              )}
            />
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
