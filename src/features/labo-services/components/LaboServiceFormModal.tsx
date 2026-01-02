// src/features/labo-services/components/LaboServiceFormModal.tsx
"use client";

import React, { useEffect, useMemo } from "react";
import { Modal, Form, Row, Col, InputNumber, Select, Input } from "antd";
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
import { useSuppliers } from "@/features/suppliers/hooks/queries";
import { useLaboItems } from "@/features/labo-items/hooks/queries";

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

const defaultValues: CreateLaboServiceRequest = {
  supplierId: "",
  laboItemId: "",
  price: 0,
  warranty: "1-nam",
};

export default function LaboServiceFormModal({
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
        supplierId: initial.supplierId, // Keep for form type compatibility
        laboItemId: initial.laboItemId, // Keep for form type compatibility
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
  } = useForm<CreateLaboServiceRequest & { id?: string }>({
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

  const selectedLaboItemId = watch("laboItemId");
  const selectedLaboItem = useMemo(() => {
    return laboItems.find((item) => item.id === selectedLaboItemId);
  }, [laboItems, selectedLaboItemId]);

  const onValid = (values: CreateLaboServiceRequest & { id?: string }) => {
    if (mode === "edit") {
      const payload: UpdateLaboServiceRequest = {
        id: values.id || (initial?.id as string),
        price: values.price,
        warranty: values.warranty,
      };
      onSubmit(payload);
    } else {
      const payload: CreateLaboServiceRequest = {
        supplierId: values.supplierId,
        laboItemId: values.laboItemId,
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
        {/* Row 1: Supplier, LaboItem */}
        <Row gutter={12}>
          <Col xs={24}>
            {mode === "create" ? (
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
                        label: s.shortName || s.name,
                        value: s.id,
                      }))}
                    />
                  </Form.Item>
                )}
              />
            ) : (
              <Form.Item label="Xưởng labo" required>
                <Input
                  disabled
                  value={
                    initial?.supplier?.shortName || initial?.supplier?.name
                  }
                />
              </Form.Item>
            )}
          </Col>
          <Col xs={24}>
            {mode === "create" ? (
              <Controller
                name="laboItemId"
                control={control}
                render={({ field, fieldState }) => (
                  <Form.Item
                    label="Loại răng giả"
                    required
                    validateStatus={fieldState.error ? "error" : ""}
                    help={fieldState.error?.message}
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
            ) : (
              <Form.Item label="Loại răng giả" required>
                <Input disabled value={initial?.laboItem?.name} />
              </Form.Item>
            )}
          </Col>
        </Row>

        {/* Row 2: Service Group, Unit */}
        <Row gutter={12}>
          <Col xs={24} lg={12}>
            <Form.Item label="Nhóm dịch vụ" required>
              <Input
                disabled
                value={
                  mode === "create"
                    ? selectedLaboItem?.serviceGroup || ""
                    : initial?.laboItem?.serviceGroup || ""
                }
              />
            </Form.Item>
          </Col>
          <Col xs={24} lg={12}>
            <Form.Item label="Đơn vị" required>
              <Input
                disabled
                value={
                  mode === "create"
                    ? selectedLaboItem?.unit || ""
                    : initial?.laboItem?.unit || ""
                }
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Row 3: Price, Warranty */}
        <Row gutter={12}>
          <Col xs={24} lg={12}>
            <Controller
              name="price"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Giá (VND)"
                  required
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
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
                  help={fieldState.error?.message}
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
        </Row>
      </Form>
    </Modal>
  );
}
