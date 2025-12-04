// src/features/labo-services/components/LaboPriceFormModal.tsx
"use client";

import React, { useEffect, useMemo } from "react";
import { Modal, Form, Row, Col, InputNumber, Select } from "antd";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import type {
  LaboServiceResponse,
  CreateLaboServiceRequest,
  UpdateLaboServiceRequest,
} from "@/shared/validation/labo-service.schema";
import {
  CreateLaboServiceRequestSchema,
  UpdateLaboServiceRequestSchema,
} from "@/shared/validation/labo-service.schema";
import { LABO_WARRANTY_OPTIONS, LABO_WARRANTY_LABELS } from "../constants";
import { useSuppliers } from "@/features/suppliers/hooks/useSuppliers";
import { useLaboItems } from "@/features/labo-items/hooks/useLaboItems";

type Props = {
  open: boolean;
  mode: "create" | "edit";
  initial?: LaboServiceResponse | null;
  confirmLoading?: boolean;
  onCancel: () => void;
  onSubmit: (
    payload: CreateLaboServiceRequest | UpdateLaboServiceRequest
  ) => void;
};

const defaultValues: CreateLaboServiceRequest & { id?: string } = {
  supplierId: "",
  laboItemId: "",
  price: 0,
  warranty: "1-nam",
};

export default function LaboPriceFormModal({
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
        ? CreateLaboServiceRequestSchema
        : UpdateLaboServiceRequestSchema,
    [mode]
  );

  // Fetch suppliers and labo items for dropdowns
  const { data: suppliers = [], isLoading: loadingSuppliers } =
    useSuppliers(false);
  const { data: laboItems = [], isLoading: loadingLaboItems } =
    useLaboItems(false);

  // Filter suppliers: only type = 'labo-xuong-rang-gia'
  const laboSuppliers = useMemo(() => {
    return suppliers.filter((s) => s.supplierGroup === "labo-xuong-rang-gia");
  }, [suppliers]);

  // Memoize defaultValues to prevent infinite loop
  const formDefaultValues = useMemo(() => {
    if (mode === "edit" && initial) {
      return {
        id: initial.id,
        supplierId: initial.supplierId,
        laboItemId: initial.laboItemId,
        price: initial.price,
        warranty: initial.warranty,
      };
    }
    return defaultValues;
  }, [mode, initial]);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting },
  } = useForm<
    (CreateLaboServiceRequest | UpdateLaboServiceRequest) & {
      id?: string;
    }
  >({
    resolver: zodResolver(schema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: formDefaultValues,
  });

  useEffect(() => {
    if (!open) return;
    reset(formDefaultValues);
  }, [open, formDefaultValues, reset]);

  const selectedLaboItemId = watch("laboItemId");
  const selectedLaboItem = useMemo(() => {
    return laboItems.find((item) => item.id === selectedLaboItemId);
  }, [laboItems, selectedLaboItemId]);

  const onValid = (
    values: (CreateLaboServiceRequest | UpdateLaboServiceRequest) & {
      id?: string;
    }
  ) => {
    if (mode === "edit") {
      const payload: UpdateLaboServiceRequest = {
        id: values.id || (initial?.id as string),
        price: values.price,
        warranty: values.warranty,
      };
      onSubmit(payload);
    } else {
      const payload: CreateLaboServiceRequest = {
        supplierId: (values as CreateLaboServiceRequest).supplierId,
        laboItemId: (values as CreateLaboServiceRequest).laboItemId,
        price: values.price,
        warranty: values.warranty,
      };
      onSubmit(payload);
    }
  };

  return (
    <Modal
      open={open}
      title={mode === "create" ? "Thêm Dịch Vụ Labo" : "Cập Nhật Giá Dịch Vụ"}
      okText={mode === "create" ? "Tạo" : "Cập nhật"}
      onCancel={onCancel}
      onOk={handleSubmit(onValid)}
      confirmLoading={!!confirmLoading || isSubmitting}
      width={{ xs: "85%", lg: "50%" }}
      styles={{
        content: { maxHeight: "85vh" },
        body: { maxHeight: "60vh", overflowY: "auto", paddingInline: 16 },
      }}
      destroyOnHidden
      maskClosable={false}
    >
      <Form layout="vertical" requiredMark>
        <Row gutter={12}>
          {mode === "create" && (
            <>
              <Col xs={24}>
                <Controller
                  name="supplierId"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Form.Item
                      label="Xưởng labo"
                      required
                      validateStatus={fieldState.error ? "error" : ""}
                      help={fieldState.error?.message}
                    >
                      <Select
                        {...field}
                        placeholder="Chọn xưởng labo"
                        loading={loadingSuppliers}
                        showSearch
                        optionFilterProp="label"
                        options={laboSuppliers.map((s) => ({
                          label: s.name,
                          value: s.id,
                        }))}
                      />
                    </Form.Item>
                  )}
                />
              </Col>
              <Col xs={24}>
                <Controller
                  name="laboItemId"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Form.Item
                      label="Loại răng giả"
                      required
                      validateStatus={fieldState.error ? "error" : ""}
                      help={
                        fieldState.error?.message ||
                        (selectedLaboItem
                          ? `Nhóm: ${selectedLaboItem.serviceGroup} | Đơn vị: ${selectedLaboItem.unit}`
                          : undefined)
                      }
                    >
                      <Select
                        {...field}
                        placeholder="Chọn loại răng giả"
                        loading={loadingLaboItems}
                        showSearch
                        optionFilterProp="label"
                        options={laboItems.map((item) => ({
                          label: item.name,
                          value: item.id,
                        }))}
                      />
                    </Form.Item>
                  )}
                />
              </Col>
            </>
          )}

          {mode === "edit" && (
            <>
              <Col xs={24}>
                <Form.Item label="Xưởng">
                  <div style={{ padding: "4px 0" }}>
                    <strong>{initial?.supplier?.name}</strong>
                  </div>
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item label="Dịch vụ">
                  <div style={{ padding: "4px 0" }}>
                    <strong>{initial?.laboItem?.name}</strong>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      Nhóm: {initial?.laboItem?.serviceGroup} | Đơn vị:{" "}
                      {initial?.laboItem?.unit}
                    </div>
                  </div>
                </Form.Item>
              </Col>
            </>
          )}

          <Col xs={24} lg={12}>
            <Controller
              name="price"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Giá (VND)"
                  required
                  validateStatus={fieldState.error ? "error" : ""}
                  help={
                    fieldState.error?.message ||
                    (mode === "edit" && initial?.price
                      ? `Giá cũ: ${initial.price.toLocaleString("vi-VN")} ₫`
                      : undefined)
                  }
                >
                  <InputNumber
                    {...field}
                    min={0}
                    style={{ width: "100%" }}
                    controls={false}
                    formatter={(v) =>
                      `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                    parser={(v) => Number((v || "0").replace(/[^\d]/g, ""))}
                  />
                </Form.Item>
              )}
            />
          </Col>

          <Col xs={24} lg={12}>
            <Controller
              name="warranty"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Bảo hành"
                  required
                  validateStatus={fieldState.error ? "error" : ""}
                  help={
                    fieldState.error?.message ||
                    (mode === "edit" && initial?.warranty
                      ? `Hiện tại: ${
                          LABO_WARRANTY_LABELS[initial.warranty] ||
                          initial.warranty
                        }`
                      : undefined)
                  }
                >
                  <Select
                    {...field}
                    placeholder="Chọn thời gian bảo hành"
                    options={LABO_WARRANTY_OPTIONS.map((key) => ({
                      label: LABO_WARRANTY_LABELS[key],
                      value: key,
                    }))}
                  />
                </Form.Item>
              )}
            />
          </Col>

          {mode === "edit" && (
            <Col xs={24}>
              <div
                style={{
                  background: "#fff7e6",
                  border: "1px solid #ffd591",
                  padding: "12px",
                  borderRadius: "4px",
                  fontSize: "13px",
                }}
              >
                ⚠️ <strong>Lưu ý:</strong> Giá cũ trong các đơn hàng trước đó sẽ
                không thay đổi (snapshot pricing).
              </div>
            </Col>
          )}
        </Row>
      </Form>
    </Modal>
  );
}
