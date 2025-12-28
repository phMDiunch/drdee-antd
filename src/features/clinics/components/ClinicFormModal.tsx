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
  shortName: "",
  address: "",
  phone: undefined,
  email: undefined,
  colorCode: "#28B463",

  // Bank fields
  companyBankName: "",
  companyBankAccountNo: "",
  companyBankAccountName: "",
  personalBankName: "",
  personalBankAccountNo: "",
  personalBankAccountName: "",
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
        shortName: initial.shortName,
        address: initial.address,
        phone: initial.phone ?? undefined,
        email: initial.email ?? undefined,
        colorCode: initial.colorCode,

        // Bank fields
        companyBankName: initial.companyBankName ?? "",
        companyBankAccountNo: initial.companyBankAccountNo ?? "",
        companyBankAccountName: initial.companyBankAccountName ?? "",
        personalBankName: initial.personalBankName ?? "",
        personalBankAccountNo: initial.personalBankAccountNo ?? "",
        personalBankAccountName: initial.personalBankAccountName ?? "",
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
        shortName: values.shortName,
        address: values.address,
        phone: values.phone,
        email: values.email,
        colorCode: values.colorCode,

        // Bank fields
        companyBankName: values.companyBankName,
        companyBankAccountNo: values.companyBankAccountNo,
        companyBankAccountName: values.companyBankAccountName,
        personalBankName: values.personalBankName,
        personalBankAccountNo: values.personalBankAccountNo,
        personalBankAccountName: values.personalBankAccountName,
      };
      onSubmit(payload);
    } else {
      const payload: CreateClinicRequest = {
        clinicCode: values.clinicCode,
        name: values.name,
        shortName: values.shortName,
        address: values.address,
        phone: values.phone,
        email: values.email,
        colorCode: values.colorCode,

        // Bank fields
        companyBankName: values.companyBankName,
        companyBankAccountNo: values.companyBankAccountNo,
        companyBankAccountName: values.companyBankAccountName,
        personalBankName: values.personalBankName,
        personalBankAccountNo: values.personalBankAccountNo,
        personalBankAccountName: values.personalBankAccountName,
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

          <Col xs={24} lg={12}>
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

          <Col xs={24} lg={4}>
            <Controller
              name="shortName"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Tên viết tắt"
                  required
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Input {...field} placeholder="HN-01" maxLength={20} />
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

        {/* Company Bank Account */}
        <Row gutter={12}>
          <Col xs={24} lg={8}>
            <Controller
              name="companyBankName"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Tên ngân hàng (Công ty)"
                  required
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Input
                    {...field}
                    placeholder="VD: BIDV, VCB..."
                    maxLength={50}
                  />
                </Form.Item>
              )}
            />
          </Col>

          <Col xs={24} lg={8}>
            <Controller
              name="companyBankAccountNo"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Số tài khoản (Công ty)"
                  required
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Input
                    {...field}
                    placeholder="VD: 2610143271"
                    maxLength={30}
                  />
                </Form.Item>
              )}
            />
          </Col>

          <Col xs={24} lg={8}>
            <Controller
              name="companyBankAccountName"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Tên chủ TK (Công ty)"
                  required
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Input
                    {...field}
                    placeholder="VD: CONG TY ABC"
                    maxLength={100}
                    style={{ textTransform: "uppercase" }}
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>

        {/* Personal Bank Account */}
        <Row gutter={12}>
          <Col xs={24} lg={8}>
            <Controller
              name="personalBankName"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Tên ngân hàng (Cá nhân)"
                  required
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Input
                    {...field}
                    placeholder="VD: BIDV, VCB..."
                    maxLength={50}
                  />
                </Form.Item>
              )}
            />
          </Col>

          <Col xs={24} lg={8}>
            <Controller
              name="personalBankAccountNo"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Số tài khoản (Cá nhân)"
                  required
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Input
                    {...field}
                    placeholder="VD: 2610143271"
                    maxLength={30}
                  />
                </Form.Item>
              )}
            />
          </Col>

          <Col xs={24} lg={8}>
            <Controller
              name="personalBankAccountName"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Tên chủ TK (Cá nhân)"
                  required
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Input
                    {...field}
                    placeholder="VD: NGUYEN VAN A"
                    maxLength={100}
                    style={{ textTransform: "uppercase" }}
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
