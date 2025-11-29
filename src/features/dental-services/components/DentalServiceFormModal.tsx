// src/features/dental-services/components/DentalServiceFormModal.tsx
"use client";

import React, { useEffect, useMemo } from "react";
import { Modal, Form, Input, Row, Col, InputNumber, Select } from "antd";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import type {
  DentalServiceResponse,
  CreateDentalServiceRequest,
  UpdateDentalServiceRequest,
} from "@/shared/validation/dental-service.schema";
import {
  CreateDentalServiceRequestSchema,
  UpdateDentalServiceRequestSchema,
} from "@/shared/validation/dental-service.schema";
import {
  DENTAL_DEPARTMENTS,
  DENTAL_SERVICE_GROUPS,
  DENTAL_UNITS,
} from "../constants";
import dayjs from "dayjs";

type Props = {
  open: boolean;
  mode: "create" | "edit";
  isAdmin?: boolean;
  initial?: DentalServiceResponse | null;
  confirmLoading?: boolean;
  onCancel: () => void;
  onSubmit: (
    payload: CreateDentalServiceRequest | UpdateDentalServiceRequest
  ) => void;
};

const defaultValues: CreateDentalServiceRequest & { id?: string } = {
  name: "",
  description: undefined,
  serviceGroup: undefined,
  department: undefined,
  tags: [],
  unit: DENTAL_UNITS[0] as string,
  price: 0,
  minPrice: undefined,
  officialWarranty: undefined,
  clinicWarranty: undefined,
  origin: undefined,
  avgTreatmentMinutes: undefined,
  avgTreatmentSessions: undefined,
};

export default function DentalServiceFormModal({
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
      mode === "create"
        ? CreateDentalServiceRequestSchema
        : UpdateDentalServiceRequestSchema,
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
        department: initial.department ?? undefined,
        tags: initial.tags ?? [],
        unit: initial.unit,
        price: initial.price,
        minPrice: initial.minPrice ?? undefined,
        officialWarranty: initial.officialWarranty ?? undefined,
        clinicWarranty: initial.clinicWarranty ?? undefined,
        origin: initial.origin ?? undefined,
        avgTreatmentMinutes: initial.avgTreatmentMinutes ?? undefined,
        avgTreatmentSessions: initial.avgTreatmentSessions ?? undefined,
      };
    }
    return defaultValues;
  }, [mode, initial]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<CreateDentalServiceRequest & { id?: string }>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: formDefaultValues,
  });

  useEffect(() => {
    if (!open) return;
    reset(formDefaultValues);
  }, [open, formDefaultValues, reset]);

  const onValid = (values: CreateDentalServiceRequest & { id?: string }) => {
    if (mode === "edit") {
      const payload: UpdateDentalServiceRequest = {
        id: values.id || (initial?.id as string),
        name: values.name,
        description: values.description,
        serviceGroup: values.serviceGroup,
        department: values.department,
        tags: values.tags,
        unit: values.unit,
        price: values.price,
        minPrice: values.minPrice,
        officialWarranty: values.officialWarranty,
        clinicWarranty: values.clinicWarranty,
        origin: values.origin,
        avgTreatmentMinutes: values.avgTreatmentMinutes,
        avgTreatmentSessions: values.avgTreatmentSessions,
      };
      onSubmit(payload);
    } else {
      const payload: CreateDentalServiceRequest = {
        name: values.name,
        description: values.description,
        serviceGroup: values.serviceGroup,
        department: values.department,
        tags: values.tags,
        unit: values.unit,
        price: values.price,
        minPrice: values.minPrice,
        officialWarranty: values.officialWarranty,
        clinicWarranty: values.clinicWarranty,
        origin: values.origin,
        avgTreatmentMinutes: values.avgTreatmentMinutes,
        avgTreatmentSessions: values.avgTreatmentSessions,
      };
      onSubmit(payload);
    }
  };

  return (
    <Modal
      open={open}
      title={
        mode === "create" ? "Tạo dịch vụ nha khoa" : "Cập nhật dịch vụ nha khoa"
      }
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
          <Col xs={24} lg={12}>
            <Controller
              name="name"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Tên dịch vụ"
                  required
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Input
                    {...field}
                    placeholder="VD: Cạo vôi răng"
                    maxLength={200}
                  />
                </Form.Item>
              )}
            />
          </Col>
          <Col xs={24} lg={6}>
            <Controller
              name="price"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Giá niêm yết (VND)"
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
          <Col xs={24} lg={6}>
            <Controller
              name="unit"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Đơn vị"
                  required
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Select
                    {...field}
                    options={DENTAL_UNITS.map((u) => ({ label: u, value: u }))}
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>

        <Row gutter={12}>
          <Col xs={24} lg={8}>
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
                    showSearch
                    placeholder="Chọn nhóm"
                    options={(DENTAL_SERVICE_GROUPS as string[]).map((g) => ({
                      label: g,
                      value: g,
                    }))}
                  />
                </Form.Item>
              )}
            />
          </Col>
          <Col xs={24} lg={8}>
            <Controller
              name="department"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Bộ môn"
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Select
                    {...field}
                    allowClear
                    showSearch
                    placeholder="Chọn bộ môn"
                    options={(DENTAL_DEPARTMENTS as string[]).map((d) => ({
                      label: d,
                      value: d,
                    }))}
                  />
                </Form.Item>
              )}
            />
          </Col>
          <Col xs={24} lg={8}>
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
                    mode="tags"
                    tokenSeparators={[","]}
                    placeholder="Thêm tối đa 10 tag"
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>

        <Row gutter={12}>
          <Col xs={24} lg={8}>
            <Controller
              name="origin"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Xuất xứ"
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="VD: Việt Nam"
                  />
                </Form.Item>
              )}
            />
          </Col>
          <Col xs={24} lg={16}>
            <Controller
              name="description"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Mô tả"
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="Mô tả chi tiết"
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>

        <Row gutter={12}>
          <Col xs={24} lg={12}>
            <Controller
              name="officialWarranty"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Bảo hành chính hãng"
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Input {...field} value={field.value ?? ""} />
                </Form.Item>
              )}
            />
          </Col>
          <Col xs={24} lg={12}>
            <Controller
              name="clinicWarranty"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Bảo hành tại clinic"
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Input {...field} value={field.value ?? ""} />
                </Form.Item>
              )}
            />
          </Col>
        </Row>

        <Row gutter={12}>
          <Col xs={24} lg={8}>
            <Controller
              name="avgTreatmentMinutes"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Phút điều trị TB"
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <InputNumber
                    {...field}
                    min={0}
                    style={{ width: "100%" }}
                    controls={false}
                  />
                </Form.Item>
              )}
            />
          </Col>
          <Col xs={24} lg={8}>
            <Controller
              name="avgTreatmentSessions"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Số buổi điều trị TB"
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <InputNumber
                    {...field}
                    min={0}
                    style={{ width: "100%" }}
                    controls={false}
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
