// src/features/master-data/components/MasterDataFormModal.tsx
"use client";

import React, { useEffect, useMemo } from "react";
import { Modal, Input, Row, Col, AutoComplete } from "antd";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMasterDataCategories } from "../hooks/useMasterDataCategories";
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
  initial?: MasterDataResponse | null;
  categoryPrefill?: string; // Pre-fill category when adding to existing category
  confirmLoading?: boolean;
  onCancel: () => void;
  onSubmit: (
    payload: CreateMasterDataRequest | UpdateMasterDataRequest
  ) => void;
};

const defaultFormValues: CreateMasterDataRequest = {
  category: "",
  key: "",
  value: "",
};

export default function MasterDataFormModal({
  open,
  mode,
  initial,
  categoryPrefill,
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
        category: initial.category,
        key: initial.key,
        value: initial.value,
      };
    }
    if (mode === "create" && categoryPrefill) {
      return {
        ...defaultFormValues,
        category: categoryPrefill,
      };
    }
    return defaultFormValues;
  }, [mode, initial, categoryPrefill]);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    mode: "onBlur" as const,
    reValidateMode: "onChange" as const,
    defaultValues,
  });

  const valueField = watch("value");

  // Fetch existing categories for autocomplete
  const { data: categories = [] } = useMasterDataCategories();

  // Generate slug helper
  const generateSlug = (text: string) => {
    return slugify(text, {
      lower: true,
      locale: "vi",
      strict: true,
    });
  };

  // Handle category blur: convert to slug
  const handleCategoryBlur = (value: string) => {
    if (mode === "create" && value && !categoryPrefill) {
      const slug = generateSlug(value);
      setValue("category", slug, { shouldValidate: true });
    }
  };

  // Auto-generate key from value (only in create mode)
  useEffect(() => {
    if (mode === "create" && valueField) {
      const generatedKey = generateSlug(valueField);
      setValue("key", generatedKey, { shouldValidate: false });
    }
  }, [mode, valueField, setValue]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      reset(defaultValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onValid = (values: CreateMasterDataRequest & { id?: string }) => {
    if (mode === "edit") {
      const payload: UpdateMasterDataRequest = {
        id: values.id || (initial?.id as string),
        category: values.category,
        key: values.key,
        value: values.value,
      };
      onSubmit(payload);
    } else {
      const payload: CreateMasterDataRequest = {
        category: values.category,
        key: values.key,
        value: values.value,
      };
      onSubmit(payload);
    }
  };

  return (
    <Modal
      title={mode === "create" ? "Thêm Master Data" : "Sửa Master Data"}
      open={open}
      onOk={handleSubmit(onValid)}
      onCancel={onCancel}
      confirmLoading={confirmLoading || isSubmitting}
      okText={mode === "create" ? "Tạo" : "Cập nhật"}
      cancelText="Hủy"
      width="85%"
      style={{ maxWidth: "800px" }}
      destroyOnHidden
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(onValid)(e);
        }}
      >
        {/* Row 1: Category (full width) */}
        <Row gutter={16}>
          <Col span={24}>
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 4,
                  fontWeight: 500,
                }}
              >
                Category <span style={{ color: "red" }}>*</span>
              </label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <>
                    {mode === "create" && !categoryPrefill ? (
                      <AutoComplete
                        {...field}
                        options={categories.map((cat) => ({ value: cat }))}
                        placeholder="Nhập category (VD: Bảo Hành Chính Hãng)"
                        status={errors.category ? "error" : ""}
                        disabled={isSubmitting}
                        style={{ width: "100%" }}
                        onBlur={() => handleCategoryBlur(field.value)}
                      />
                    ) : (
                      <Input
                        {...field}
                        placeholder="Category"
                        disabled
                        style={{
                          backgroundColor: "#f5f5f5",
                          cursor: "not-allowed",
                        }}
                      />
                    )}
                  </>
                )}
              />
              {errors.category && (
                <span style={{ color: "red", fontSize: 12 }}>
                  {errors.category.message as string}
                </span>
              )}
              {mode === "create" && !categoryPrefill && (
                <span style={{ color: "#8c8c8c", fontSize: 12 }}>
                  Category sẽ tự động chuyển sang dạng slug (chữ thường, không
                  dấu)
                </span>
              )}
            </div>
          </Col>
        </Row>

        {/* Row 2: Value (50%) + Key (50%) */}
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 4,
                  fontWeight: 500,
                }}
              >
                Tên hiển thị <span style={{ color: "red" }}>*</span>
              </label>
              <Controller
                name="value"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="VD: 1 năm, Cái, Răng"
                    status={errors.value ? "error" : ""}
                    disabled={isSubmitting}
                  />
                )}
              />
              {errors.value && (
                <span style={{ color: "red", fontSize: 12 }}>
                  {errors.value.message as string}
                </span>
              )}
            </div>
          </Col>

          <Col xs={24} md={12}>
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 4,
                  fontWeight: 500,
                }}
              >
                Key <span style={{ color: "red" }}>*</span>
              </label>
              <Controller
                name="key"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Auto-generated (có thể sửa)"
                    status={errors.key ? "error" : ""}
                    disabled={mode === "edit" || isSubmitting}
                    style={
                      mode === "edit"
                        ? {
                            backgroundColor: "#f5f5f5",
                            cursor: "not-allowed",
                          }
                        : {}
                    }
                  />
                )}
              />
              {errors.key && (
                <span style={{ color: "red", fontSize: 12 }}>
                  {errors.key.message as string}
                </span>
              )}
            </div>
          </Col>
        </Row>
      </form>
    </Modal>
  );
}
