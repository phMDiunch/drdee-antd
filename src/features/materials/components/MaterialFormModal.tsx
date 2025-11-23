// src/features/materials/components/MaterialFormModal.tsx
"use client";

import React, { useEffect, useMemo } from "react";
import { Modal, Form, Input, Row, Col, Select, InputNumber } from "antd";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import type {
  MaterialResponse,
  CreateMaterialRequest,
  UpdateMaterialRequest,
} from "@/shared/validation/material.schema";
import {
  CreateMaterialRequestSchema,
  UpdateMaterialRequestSchema,
} from "@/shared/validation/material.schema";
import dayjs from "dayjs";

const { TextArea } = Input;

type Props = {
  open: boolean;
  mode: "create" | "edit";
  isAdmin?: boolean;
  initial?: MaterialResponse | null;
  unitOptions?: { value: string; label: string }[]; // From MasterData (don-vi-tinh)
  materialTypeOptions?: { value: string; label: string }[]; // From MasterData (loai-vat-tu)
  departmentOptions?: { value: string; label: string }[]; // From MasterData (bo-mon)
  categoryOptions?: { value: string; label: string }[]; // From MasterData (nhom-vat-tu)
  subCategoryOptions?: { value: string; label: string }[]; // From MasterData (phan-nhom-vat-tu)
  tagsOptions?: { value: string; label: string }[]; // From MasterData (tag-vat-tu)
  confirmLoading?: boolean;
  onCancel: () => void;
  onSubmit: (payload: CreateMaterialRequest | UpdateMaterialRequest) => void;
};

const defaultValues: CreateMaterialRequest & { id?: string } = {
  name: "",
  description: undefined,
  unit: "",
  materialType: "",
  department: "",
  category: undefined,
  subCategory: undefined,
  minStockLevel: undefined,
  imageUrl: undefined,
  tags: [],
};

export default function MaterialFormModal({
  open,
  mode,
  isAdmin,
  initial,
  unitOptions = [],
  materialTypeOptions = [],
  departmentOptions = [],
  categoryOptions = [],
  subCategoryOptions = [],
  tagsOptions = [],
  confirmLoading,
  onCancel,
  onSubmit,
}: Props) {
  const schema = useMemo(
    () =>
      mode === "create"
        ? CreateMaterialRequestSchema
        : UpdateMaterialRequestSchema,
    [mode]
  );

  // Memoize defaultValues to prevent infinite loop
  const formDefaultValues = useMemo(() => {
    if (mode === "edit" && initial) {
      return {
        id: initial.id,
        name: initial.name,
        description: initial.description ?? undefined,
        unit: initial.unit,
        materialType: initial.materialType,
        department: initial.department,
        category: initial.category ?? undefined,
        subCategory: initial.subCategory ?? undefined,
        minStockLevel: initial.minStockLevel ?? undefined,
        imageUrl: initial.imageUrl ?? undefined,
        tags: initial.tags ?? [],
      };
    }
    return defaultValues;
  }, [mode, initial]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<CreateMaterialRequest & { id?: string }>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: formDefaultValues,
  });

  useEffect(() => {
    if (!open) return;
    reset(formDefaultValues);
  }, [open, formDefaultValues, reset]);

  const onValid = (values: CreateMaterialRequest & { id?: string }) => {
    if (mode === "edit") {
      const payload: UpdateMaterialRequest = {
        id: values.id || (initial?.id as string),
        name: values.name,
        description: values.description,
        unit: values.unit,
        materialType: values.materialType,
        department: values.department,
        category: values.category,
        subCategory: values.subCategory,
        minStockLevel: values.minStockLevel,
        imageUrl: values.imageUrl,
        tags: values.tags,
      };
      onSubmit(payload);
    } else {
      const payload: CreateMaterialRequest = {
        name: values.name,
        description: values.description,
        unit: values.unit,
        materialType: values.materialType,
        department: values.department,
        category: values.category,
        subCategory: values.subCategory,
        minStockLevel: values.minStockLevel,
        imageUrl: values.imageUrl,
        tags: values.tags,
      };
      onSubmit(payload);
    }
  };

  return (
    <Modal
      open={open}
      title={mode === "create" ? "Tạo vật tư" : "Cập nhật vật tư"}
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
        {/* Row 1: name (50%), unit (25%), code (25%, read-only in edit) */}
        <Row gutter={12}>
          <Col xs={24} lg={12}>
            <Controller
              name="name"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Tên vật tư"
                  required
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Input
                    {...field}
                    placeholder="VD: Implant Nobel Biocare Active 4.3x10mm"
                    maxLength={200}
                  />
                </Form.Item>
              )}
            />
          </Col>
          <Col xs={24} lg={6}>
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
                    placeholder="Chọn ĐVT"
                    showSearch
                    allowClear
                    options={unitOptions}
                  />
                </Form.Item>
              )}
            />
          </Col>
          <Col xs={24} lg={6}>
            {mode === "edit" && initial && (
              <Form.Item label="Mã VT">
                <Input disabled value={initial.code} />
              </Form.Item>
            )}
            {mode === "create" && (
              <Form.Item label="Mã VT">
                <Input disabled placeholder="Tự động sinh" />
              </Form.Item>
            )}
          </Col>
        </Row>

        {/* Row 2: materialType (50%), department (50%) */}
        <Row gutter={12}>
          <Col xs={24} lg={12}>
            <Controller
              name="materialType"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Loại vật tư"
                  required
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Select
                    {...field}
                    placeholder="Chọn loại vật tư"
                    showSearch
                    allowClear
                    options={materialTypeOptions}
                  />
                </Form.Item>
              )}
            />
          </Col>
          <Col xs={24} lg={12}>
            <Controller
              name="department"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Bộ môn"
                  required
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Select
                    {...field}
                    placeholder="Chọn bộ môn"
                    showSearch
                    allowClear
                    options={departmentOptions}
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>

        {/* Row 3: category (50%), subCategory (50%) */}
        <Row gutter={12}>
          <Col xs={24} lg={12}>
            <Controller
              name="category"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Nhóm vật tư"
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Select
                    {...field}
                    placeholder="Chọn nhóm vật tư"
                    showSearch
                    allowClear
                    options={categoryOptions}
                  />
                </Form.Item>
              )}
            />
          </Col>
          <Col xs={24} lg={12}>
            <Controller
              name="subCategory"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Phân nhóm"
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Select
                    {...field}
                    placeholder="Chọn phân nhóm"
                    showSearch
                    allowClear
                    options={subCategoryOptions}
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>

        {/* Row 4: minStockLevel (25%), imageUrl (25%), tags (50%) */}
        <Row gutter={12}>
          <Col xs={24} lg={6}>
            <Controller
              name="minStockLevel"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Tồn tối thiểu"
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <InputNumber
                    {...field}
                    placeholder="0"
                    min={0}
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              )}
            />
          </Col>
          <Col xs={24} lg={6}>
            <Controller
              name="imageUrl"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="URL hình ảnh"
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="https://..."
                    maxLength={500}
                  />
                </Form.Item>
              )}
            />
          </Col>
          <Col xs={24} lg={12}>
            <Controller
              name="tags"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Tags"
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Select
                    {...field}
                    mode="multiple"
                    placeholder="Chọn tags"
                    showSearch
                    allowClear
                    maxCount={20}
                    options={tagsOptions}
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>

        {/* Row 5: description (100%, 2 rows) */}
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
                  <TextArea
                    {...field}
                    value={field.value ?? ""}
                    placeholder="Mô tả chi tiết, quy cách đóng gói..."
                    rows={2}
                    maxLength={1000}
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>

        {/* Admin metadata (only in edit mode) */}
        {mode === "edit" && isAdmin && initial && (
          <>
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
            {initial.archivedAt && (
              <Row gutter={12}>
                <Col xs={24}>
                  <Form.Item label="Đã lưu trữ">
                    <Input
                      disabled
                      value={dayjs(initial.archivedAt).format(
                        "DD/MM/YYYY HH:mm"
                      )}
                    />
                  </Form.Item>
                </Col>
              </Row>
            )}
          </>
        )}
      </Form>
    </Modal>
  );
}
