// src/features/employees/components/CreateEmployeeModal.tsx
"use client";

import React, { useEffect } from "react";
import { Modal, Form, Input, Row, Col, Select } from "antd";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateEmployeeRequestSchema,
  type CreateEmployeeRequest,
  EMPLOYEE_ROLES,
  EMPLOYEE_STATUSES,
} from "@/shared/validation/employee.schema";
import {
  ORG_DEPARTMENTS,
  ORG_TEAMS,
  ORG_JOB_TITLES,
  ORG_POSITION_TITLES,
} from "@/shared/constants/organization";

type Props = {
  open: boolean;
  clinics: Array<{ label: string; value: string }>;
  confirmLoading?: boolean;
  onCancel: () => void;
  onSubmit: (payload: CreateEmployeeRequest) => void;
};

const defaultEmployeeFormValues: CreateEmployeeRequest = {
  fullName: "",
  email: undefined,
  phone: undefined,
  role: "employee",
  clinicId: "",
  employeeCode: "",
  employeeStatus: "PENDING",
  department: "",
  team: null,
  jobTitle: "",
  positionTitle: null,
};

const STATUS_LABELS: Record<(typeof EMPLOYEE_STATUSES)[number], string> = {
  PENDING: "Chưa hoàn tất",
  WORKING: "Đang làm việc",
  RESIGNED: "Đã nghỉ việc",
};

const departmentOptions = Array.from(ORG_DEPARTMENTS).map((value) => ({
  label: value,
  value,
}));
const teamOptions = Array.from(ORG_TEAMS).map((value) => ({
  label: value,
  value,
}));
const jobTitleOptions = Array.from(ORG_JOB_TITLES).map((value) => ({
  label: value,
  value,
}));
const positionTitleOptions = Array.from(ORG_POSITION_TITLES).map((value) => ({
  label: value,
  value,
}));

export default function CreateEmployeeModal({
  open,
  clinics,
  confirmLoading,
  onCancel,
  onSubmit,
}: Props) {
  const schema = CreateEmployeeRequestSchema;
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<CreateEmployeeRequest>({
    resolver: zodResolver(schema),
    defaultValues: defaultEmployeeFormValues,
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    if (!open) return;
    reset(defaultEmployeeFormValues);
  }, [open, reset]);

  const submit = handleSubmit((values) => {
    const payload: CreateEmployeeRequest = {
      fullName: values.fullName.trim(),
      email: values.email?.trim() || null,
      phone: values.phone?.trim() || null,
      role: values.role,
      clinicId: values.clinicId,
      employeeCode: values.employeeCode?.trim(),
      employeeStatus: values.employeeStatus ?? "PENDING",
      department: values.department,
      team: values.team,
      jobTitle: values.jobTitle,
      positionTitle: values.positionTitle,
    };
    onSubmit(payload);
  });

  return (
    <Modal
      open={open}
      title="Thêm nhân viên"
      onCancel={onCancel}
      onOk={submit}
      okButtonProps={{ loading: confirmLoading || isSubmitting }}
      width="65%"
      styles={{
        content: { maxHeight: "85vh" },
        body: { maxHeight: "60vh", overflowY: "auto", paddingInline: 16 },
      }}
      destroyOnHidden
      maskClosable={false}
    >
      <Form layout="vertical">
        <Row gutter={12}>
          {/* Họ tên */}
          <Col xs={24} md={12}>
            <Controller
              control={control}
              name="fullName"
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Họ và tên"
                  required
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Input {...field} placeholder="Nguyễn Văn A" />
                </Form.Item>
              )}
            />
          </Col>

          {/* Email */}
          <Col xs={24} md={12}>
            <Controller
              control={control}
              name="email"
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Email"
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="you@example.com"
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>

        <Row gutter={12}>
          {/* Phone */}
          <Col xs={24} md={12}>
            <Controller
              control={control}
              name="phone"
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
          {/* Chi nhánh */}
          <Col xs={24} md={12}>
            <Controller
              control={control}
              name="clinicId"
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Chi nhánh"
                  required
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Select
                    value={field.value || undefined}
                    onChange={field.onChange}
                    placeholder="Chọn chi nhánh"
                    options={clinics}
                    showSearch
                    optionFilterProp="label"
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>

        <Row gutter={12}>
          {/* Phòng ban */}
          <Col xs={24} md={12}>
            <Controller
              control={control}
              name="department"
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Phòng ban"
                  required
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Select
                    value={field.value || undefined}
                    onChange={field.onChange}
                    placeholder="Chọn phòng ban"
                    options={departmentOptions}
                    showSearch
                    optionFilterProp="label"
                  />
                </Form.Item>
              )}
            />
          </Col>
          {/* Bộ phận */}
          <Col xs={24} md={12}>
            <Controller
              control={control}
              name="team"
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Bộ phận"
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Select
                    value={field.value ?? undefined}
                    onChange={field.onChange}
                    placeholder="Chọn bộ phận"
                    allowClear
                    options={teamOptions}
                    showSearch
                    optionFilterProp="label"
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>

        <Row gutter={12}>
          {/* Chức danh */}
          <Col xs={24} md={12}>
            <Controller
              control={control}
              name="jobTitle"
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Chức danh"
                  required
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Select
                    value={field.value || undefined}
                    onChange={field.onChange}
                    placeholder="Chọn chức danh"
                    options={jobTitleOptions}
                    showSearch
                    optionFilterProp="label"
                  />
                </Form.Item>
              )}
            />
          </Col>
          {/* Chức vụ */}
          <Col xs={24} md={12}>
            <Controller
              control={control}
              name="positionTitle"
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Chức vụ"
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Select
                    value={field.value ?? undefined}
                    onChange={field.onChange}
                    placeholder="Chọn chức vụ"
                    allowClear
                    options={positionTitleOptions}
                    showSearch
                    optionFilterProp="label"
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>

        <Row gutter={12}>
          {/* Mã nhân viên */}
          <Col xs={24} md={8}>
            <Controller
              control={control}
              name="employeeCode"
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Mã nhân viên"
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="NV001"
                  />
                </Form.Item>
              )}
            />
          </Col>
          {/* Vai trò */}
          <Col xs={24} md={8}>
            <Controller
              control={control}
              name="role"
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Vai trò"
                  required
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Select
                    value={field.value}
                    onChange={field.onChange}
                    options={EMPLOYEE_ROLES.map((role) => ({
                      label: role === "admin" ? "Admin" : "Nhân viên",
                      value: role,
                    }))}
                  />
                </Form.Item>
              )}
            />
          </Col>
          {/* Trạng thái */}
          <Col xs={24} md={8}>
            <Controller
              control={control}
              name="employeeStatus"
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Trạng thái"
                  required
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                >
                  <Select
                    value="PENDING"
                    onChange={field.onChange}
                    // disabled
                    options={[
                      {
                        label: STATUS_LABELS["PENDING"],
                        value: "PENDING",
                      },
                    ]}
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
