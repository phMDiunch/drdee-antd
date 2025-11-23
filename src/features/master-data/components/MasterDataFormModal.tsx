// src/features/master-data/components/MasterDataFormModal.tsx
"use client";

import React, { useEffect, useMemo } from "react";
import { Modal, Form, Input, Row, Col, Switch } from "antd";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMasterData } from "../hooks/useMasterDataList";
import type {
  MasterDataResponse,
  CreateMasterDataRequest,
  UpdateMasterDataRequest,
} from "@/shared/validation/master-data.schema";
import {
  CreateMasterDataRequestSchema,
  UpdateMasterDataRequestSchema,
} from "@/shared/validation/master-data.schema";
import slugify from "slugify";

type Props = {
  open: boolean;
  mode: "create" | "edit";
  isAdmin?: boolean;
  initial?: MasterDataResponse | null;
  parentId?: string; // For creating child items
  confirmLoading?: boolean;
  onCancel: () => void;
  onSubmit: (
    payload: CreateMasterDataRequest | UpdateMasterDataRequest
  ) => void;
};

const defaultFormValues: CreateMasterDataRequest = {
  key: "",
  value: "",
  description: undefined,
  allowHierarchy: false,
  isActive: true,
  parentId: undefined,
  rootId: undefined,
};

export default function MasterDataFormModal({
  open,
  mode,
  initial,
  parentId: propParentId, // Rename to avoid confusion with form field
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
        key: initial.key,
        value: initial.value,
        description: initial.description ?? undefined,
        allowHierarchy: initial.allowHierarchy,
        isActive: initial.isActive,
        parentId: initial.parentId ?? undefined,
        rootId: initial.rootId ?? undefined,
      };
    }
    return defaultFormValues;
  }, [mode, initial]);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    mode: "onBlur" as const,
    reValidateMode: "onChange" as const,
    defaultValues,
  });

  const valueField = watch("value");

  // Determine if creating root or child item
  const isCreatingRoot = mode === "create" && !propParentId;
  const isCreatingChild = mode === "create" && !!propParentId;

  // Auto-generate key from value (only in create mode)
  useEffect(() => {
    if (mode === "create" && valueField) {
      const generatedKey = slugify(valueField, {
        lower: true,
        locale: "vi",
        strict: true,
      });
      setValue("key", generatedKey, { shouldValidate: false });
    }
  }, [mode, valueField, setValue]);

  // Fetch ALL master data items (for finding parent when creating child)
  const { data: allItems = [] } = useMasterData(undefined, false);

  // Reset form when modal opens or when propParentId changes
  useEffect(() => {
    if (!open) return;

    // If creating a child item, set parentId from prop and auto-set rootId
    if (mode === "create" && propParentId) {
      // Find parent to get its rootId
      const parent = allItems.find((item) => item.id === propParentId);

      if (parent) {
        const childRootId = parent.rootId ?? parent.id; // Parent's rootId or parent itself is root

        reset({
          key: "",
          value: "",
          description: undefined,
          allowHierarchy: false,
          isActive: true,
          parentId: propParentId,
          rootId: childRootId,
        });
      }
    } else {
      reset(defaultValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, propParentId, reset]);

  const onValid = (values: CreateMasterDataRequest & { id?: string }) => {
    if (mode === "edit") {
      const payload: UpdateMasterDataRequest = {
        id: values.id || (initial?.id as string),
        key: values.key,
        value: values.value,
        description: values.description,
        allowHierarchy: values.allowHierarchy,
        isActive: values.isActive,
        parentId: values.parentId,
        rootId: values.rootId,
      };
      onSubmit(payload);
    } else {
      const payload: CreateMasterDataRequest = {
        key: values.key,
        value: values.value,
        description: values.description,
        allowHierarchy: values.allowHierarchy,
        isActive: values.isActive,
        parentId: values.parentId,
        rootId: values.rootId,
      };
      onSubmit(payload);
    }
  };

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
        {/* Conditional: Root Item or Child Item */}
        {isCreatingRoot && (
          // Creating Root Category
          <>
            {/* Row 1: Tên danh mục, Mã */}
            <Row gutter={12}>
              <Col xs={24} lg={12}>
                <Controller
                  name="value"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Form.Item
                      label="Tên danh mục"
                      required
                      validateStatus={fieldState.error ? "error" : ""}
                      help={fieldState.error?.message}
                    >
                      <Input {...field} placeholder="VD: Nhóm Nhà Cung Cấp" />
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
                        "Tự động tạo từ tên. Có thể sửa."
                      }
                    >
                      <Input {...field} placeholder="VD: nhom-ncc" />
                    </Form.Item>
                  )}
                />
              </Col>
            </Row>

            {/* Row 2: Cho phép phân cấp, Kích hoạt */}
            <Row gutter={12}>
              <Col xs={12}>
                <Controller
                  name="allowHierarchy"
                  control={control}
                  render={({ field }) => (
                    <Form.Item label="Cho phép phân cấp">
                      <Switch checked={field.value} onChange={field.onChange} />
                    </Form.Item>
                  )}
                />
              </Col>

              <Col xs={12}>
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

            {/* Row 3: Mô tả */}
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
                        rows={2}
                        placeholder="Mô tả chi tiết (tùy chọn)"
                        maxLength={500}
                        showCount
                      />
                    </Form.Item>
                  )}
                />
              </Col>
            </Row>
          </>
        )}

        {isCreatingChild && (
          // Creating Child Item
          <>
            {/* Row 1: Parent (locked - from "Add Child" button) */}
            <Row gutter={12}>
              <Col xs={24}>
                <Controller
                  name="parentId"
                  control={control}
                  render={({ field, fieldState }) => {
                    // Find parent item to display label
                    const parentItem = allItems.find(
                      (item) => item.id === field.value
                    );
                    const parentLabel = parentItem
                      ? `${parentItem.value} (${parentItem.key})`
                      : field.value ?? "";

                    return (
                      <Form.Item
                        label="Parent"
                        required
                        validateStatus={fieldState.error ? "error" : ""}
                        help={
                          fieldState.error?.message ||
                          "Đã chọn từ nút 'Add Child'. Dùng Edit để đổi parent."
                        }
                      >
                        <Input
                          value={parentLabel}
                          disabled
                          placeholder="Loading..."
                        />
                      </Form.Item>
                    );
                  }}
                />
              </Col>
            </Row>

            {/* Row 2: Value, Key */}
            <Row gutter={12}>
              <Col xs={24} lg={12}>
                <Controller
                  name="value"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Form.Item
                      label="Tên danh mục"
                      required
                      validateStatus={fieldState.error ? "error" : ""}
                      help={fieldState.error?.message}
                    >
                      <Input {...field} placeholder="VD: Răng Cửa" />
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
                        "Tự động tạo từ Giá trị. Có thể sửa."
                      }
                    >
                      <Input {...field} placeholder="VD: rang-cua" />
                    </Form.Item>
                  )}
                />
              </Col>
            </Row>

            {/* Row 3: Cho phép phân cấp, Kích hoạt */}
            <Row gutter={12}>
              <Col xs={12}>
                <Controller
                  name="allowHierarchy"
                  control={control}
                  render={({ field }) => (
                    <Form.Item label="Cho phép phân cấp">
                      <Switch checked={field.value} onChange={field.onChange} />
                    </Form.Item>
                  )}
                />
              </Col>

              <Col xs={12}>
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

            {/* Row 4: Mô tả */}
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
                        rows={2}
                        placeholder="Mô tả chi tiết (tùy chọn)"
                        maxLength={500}
                        showCount
                      />
                    </Form.Item>
                  )}
                />
              </Col>
            </Row>
          </>
        )}

        {mode === "edit" && (
          // Editing Existing Item
          <>
            {/* Row 1: Tên danh mục, Mã */}
            <Row gutter={12}>
              <Col xs={24} lg={12}>
                <Controller
                  name="value"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Form.Item
                      label="Tên danh mục"
                      required
                      validateStatus={fieldState.error ? "error" : ""}
                      help={fieldState.error?.message}
                    >
                      <Input {...field} placeholder="VD: Nhà cung cấp A" />
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
                        fieldState.error?.message || "Không thể sửa sau khi tạo"
                      }
                    >
                      <Input {...field} placeholder="VD: ncc-a" disabled />
                    </Form.Item>
                  )}
                />
              </Col>
            </Row>

            {/* Row 2: Cho phép phân cấp, Kích hoạt */}
            <Row gutter={12}>
              <Col xs={12}>
                <Controller
                  name="allowHierarchy"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Form.Item
                      label="Cho phép phân cấp"
                      validateStatus={fieldState.error ? "error" : ""}
                      help={
                        fieldState.error?.message ||
                        "Không thể tắt nếu đã có mục con"
                      }
                    >
                      <Switch checked={field.value} onChange={field.onChange} />
                    </Form.Item>
                  )}
                />
              </Col>

              <Col xs={12}>
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

            {/* Row 3: Mô tả */}
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
                        rows={2}
                        placeholder="Mô tả chi tiết (tùy chọn)"
                        maxLength={500}
                        showCount
                      />
                    </Form.Item>
                  )}
                />
              </Col>
            </Row>
          </>
        )}
      </Form>
    </Modal>
  );
}
