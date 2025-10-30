"use client";

import React, { useEffect, useMemo } from "react";
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Select,
  Space,
  Spin,
  Typography,
} from "antd";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  UpdateEmployeeFormSchema,
  type EmployeeResponse,
  type UpdateEmployeeFormData,
  type UpdateEmployeeRequest,
  EMPLOYEE_ROLES,
  EMPLOYEE_STATUSES,
} from "@/shared/validation/employee.schema";
import {
  ORG_DEPARTMENTS,
  ORG_JOB_TITLES,
  ORG_TEAMS,
  ORG_POSITION_TITLES,
} from "@/shared/constants/organization";
import { useClinics } from "@/features/clinics";
import { useUpdateEmployee } from "@/features/employees";
import { useRouter } from "next/navigation";
import { DatePicker, ColorPicker } from "antd";
import dayjs from "dayjs";

const { Title, Paragraph, Text } = Typography;

const departmentOptions = Array.from(ORG_DEPARTMENTS).map((value) => ({
  label: value,
  value,
}));
const jobTitleOptions = Array.from(ORG_JOB_TITLES).map((value) => ({
  label: value,
  value,
}));
const teamOptions = Array.from(ORG_TEAMS).map((value) => ({
  label: value,
  value,
}));
const positionTitleOptions = Array.from(ORG_POSITION_TITLES).map((value) => ({
  label: value,
  value,
}));

type Props = { employee: EmployeeResponse };

export default function EmployeeEditView({ employee }: Props) {
  const router = useRouter();
  const clinicsQuery = useClinics(false);
  const updateMutation = useUpdateEmployee();

  const formatDateTime = (value?: string | null) =>
    value ? new Date(value).toLocaleString("vi-VN") : "-";

  // Memoize defaultValues to prevent infinite loop in useEffect
  const defaultValues = useMemo(
    () => ({
      ...employee,
      email: employee.email ?? undefined,
      phone: employee.phone ?? undefined,
      employeeCode: employee.employeeCode ?? undefined,
      team: employee.team ?? null,
      positionTitle: employee.positionTitle ?? null,
      dob: employee.dob ? new Date(employee.dob) : undefined,
      favoriteColor: employee.favoriteColor ?? undefined,
      currentAddress: employee.currentAddress ?? undefined,
      hometown: employee.hometown ?? undefined,
      nationalId: employee.nationalId ?? undefined,
      nationalIdIssueDate: employee.nationalIdIssueDate
        ? new Date(employee.nationalIdIssueDate)
        : undefined,
      nationalIdIssuePlace: employee.nationalIdIssuePlace ?? undefined,
      taxId: employee.taxId ?? undefined,
      insuranceNumber: employee.insuranceNumber ?? undefined,
      bankAccountNumber: employee.bankAccountNumber ?? undefined,
      bankName: employee.bankName ?? undefined,
    }),
    [employee]
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<UpdateEmployeeFormData>({
    resolver: zodResolver(UpdateEmployeeFormSchema),
    defaultValues,
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const clinicOptions =
    clinicsQuery.data?.map((clinic) => ({
      label: clinic.name,
      value: clinic.id,
    })) ?? [];

  const submit = handleSubmit(async (values) => {
    const payload: UpdateEmployeeRequest = {
      ...values,
      email: values.email?.trim() || null,
      phone: values.phone?.trim() || null,
      employeeCode: values.employeeCode?.trim() || null,
      team: values.team || null,
      positionTitle: values.positionTitle || null,
      currentAddress: values.currentAddress?.trim() || null,
      hometown: values.hometown?.trim() || null,
      nationalId: values.nationalId?.trim() || null,
      nationalIdIssuePlace: values.nationalIdIssuePlace?.trim() || null,
      taxId: values.taxId?.trim() || null,
      insuranceNumber: values.insuranceNumber?.trim() || null,
      bankAccountNumber: values.bankAccountNumber?.trim() || null,
      bankName: values.bankName?.trim() || null,
      favoriteColor: values.favoriteColor || null,
      dob: values.dob ?? null,
      nationalIdIssueDate: values.nationalIdIssueDate ?? null,
    };

    try {
      await updateMutation.mutateAsync(payload);
      router.push("/employees");
    } catch {
      // Error already handled in hook's onError
    }
  });

  return (
    <div>
      <Card style={{ width: "100%" }}>
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <div>
            <Title level={4} style={{ marginBottom: 0 }}>
              Chỉnh sửa nhân viên
            </Title>
            <Paragraph type="secondary" style={{ marginTop: 0 }}>
              Cập nhật thông tin chi tiết của nhân viên.
            </Paragraph>
          </div>

          <div style={{ marginTop: 8 }}>
            <Row gutter={12}>
              <Col xs={24} md={12}>
                <Text type="secondary">Tạo bởi: </Text>
                <Text strong>
                  {typeof employee.createdBy === "object"
                    ? employee.createdBy?.fullName
                    : employee.createdById || "-"}
                </Text>
              </Col>
              <Col xs={24} md={12}>
                <Text type="secondary">Cập nhật bởi: </Text>
                <Text strong>
                  {typeof employee.updatedBy === "object"
                    ? employee.updatedBy?.fullName
                    : employee.updatedById || "-"}
                </Text>
              </Col>
            </Row>
            <Row gutter={12} style={{ marginTop: 4 }}>
              <Col xs={24} md={12}>
                <Text type="secondary">Tạo lúc: </Text>
                <Text>{formatDateTime(employee.createdAt)}</Text>
              </Col>
              <Col xs={24} md={12}>
                <Text type="secondary">Cập nhật lúc: </Text>
                <Text>{formatDateTime(employee.updatedAt)}</Text>
              </Col>
            </Row>
          </div>

          <Spin spinning={clinicsQuery.isLoading}>
            <Form layout="vertical" onFinish={submit}>
              {/* Basic profile */}
              <Row gutter={12}>
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
                        <Input {...field} />
                      </Form.Item>
                    )}
                  />
                </Col>
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
                        <Input {...field} value={field.value ?? ""} />
                      </Form.Item>
                    )}
                  />
                </Col>
              </Row>

              {/* Extended profile */}
              <Row gutter={12}>
                <Col xs={24} md={8}>
                  <Controller
                    control={control}
                    name="dob"
                    render={({ field, fieldState }) => (
                      <Form.Item
                        label="Ngày sinh"
                        validateStatus={fieldState.error ? "error" : ""}
                        help={fieldState.error?.message}
                      >
                        <DatePicker
                          style={{ width: "100%" }}
                          value={field.value ? dayjs(field.value) : undefined}
                          onChange={(d) =>
                            field.onChange(d ? d.toDate() : undefined)
                          }
                          format="DD/MM/YYYY"
                        />
                      </Form.Item>
                    )}
                  />
                </Col>
                <Col xs={24} md={8}>
                  <Controller
                    control={control}
                    name="gender"
                    render={({ field, fieldState }) => (
                      <Form.Item
                        label="Giới tính"
                        validateStatus={fieldState.error ? "error" : ""}
                        help={fieldState.error?.message}
                      >
                        <Select
                          value={field.value || undefined}
                          onChange={field.onChange}
                          placeholder="Chọn giới tính"
                          options={[
                            { value: "male", label: "Nam" },
                            { value: "female", label: "Nữ" },
                          ]}
                        />
                      </Form.Item>
                    )}
                  />
                </Col>
                <Col xs={24} md={8}>
                  <Controller
                    control={control}
                    name="favoriteColor"
                    render={({ field, fieldState }) => (
                      <Form.Item
                        label="Màu yêu thích"
                        validateStatus={fieldState.error ? "error" : ""}
                        help={fieldState.error?.message}
                      >
                        <ColorPicker
                          value={field.value || "#4096ff"}
                          showText
                          disabledAlpha
                          onChange={(c) => field.onChange(c.toHexString())}
                        />
                      </Form.Item>
                    )}
                  />
                </Col>
              </Row>

              <Row gutter={12}>
                <Col xs={24} md={12}>
                  <Controller
                    control={control}
                    name="currentAddress"
                    render={({ field, fieldState }) => (
                      <Form.Item
                        label="Địa chỉ hiện tại"
                        validateStatus={fieldState.error ? "error" : ""}
                        help={fieldState.error?.message}
                      >
                        <Input {...field} value={field.value ?? ""} />
                      </Form.Item>
                    )}
                  />
                </Col>
                <Col xs={24} md={12}>
                  <Controller
                    control={control}
                    name="hometown"
                    render={({ field, fieldState }) => (
                      <Form.Item
                        label="Quê quán"
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
                <Col xs={24} md={8}>
                  <Controller
                    control={control}
                    name="nationalId"
                    render={({ field, fieldState }) => (
                      <Form.Item
                        label="CMND/CCCD"
                        validateStatus={fieldState.error ? "error" : ""}
                        help={fieldState.error?.message}
                      >
                        <Input {...field} value={field.value ?? ""} />
                      </Form.Item>
                    )}
                  />
                </Col>
                <Col xs={24} md={8}>
                  <Controller
                    control={control}
                    name="nationalIdIssueDate"
                    render={({ field, fieldState }) => (
                      <Form.Item
                        label="Ngày cấp CCCD"
                        validateStatus={fieldState.error ? "error" : ""}
                        help={fieldState.error?.message}
                      >
                        <DatePicker
                          style={{ width: "100%" }}
                          value={field.value ? dayjs(field.value) : undefined}
                          onChange={(d) =>
                            field.onChange(d ? d.toDate() : undefined)
                          }
                          format="DD/MM/YYYY"
                        />
                      </Form.Item>
                    )}
                  />
                </Col>
                <Col xs={24} md={8}>
                  <Controller
                    control={control}
                    name="nationalIdIssuePlace"
                    render={({ field, fieldState }) => (
                      <Form.Item
                        label="Nơi cấp CCCD"
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
                <Col xs={24} md={12}>
                  <Controller
                    control={control}
                    name="taxId"
                    render={({ field, fieldState }) => (
                      <Form.Item
                        label="Mã số thuế"
                        validateStatus={fieldState.error ? "error" : ""}
                        help={fieldState.error?.message}
                      >
                        <Input {...field} value={field.value ?? ""} />
                      </Form.Item>
                    )}
                  />
                </Col>
                <Col xs={24} md={12}>
                  <Controller
                    control={control}
                    name="insuranceNumber"
                    render={({ field, fieldState }) => (
                      <Form.Item
                        label="Số sổ BHXH"
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
                <Col xs={24} md={12}>
                  <Controller
                    control={control}
                    name="bankAccountNumber"
                    render={({ field, fieldState }) => (
                      <Form.Item
                        label="Số tài khoản ngân hàng"
                        validateStatus={fieldState.error ? "error" : ""}
                        help={fieldState.error?.message}
                      >
                        <Input {...field} value={field.value ?? ""} />
                      </Form.Item>
                    )}
                  />
                </Col>
                <Col xs={24} md={12}>
                  <Controller
                    control={control}
                    name="bankName"
                    render={({ field, fieldState }) => (
                      <Form.Item
                        label="Tên ngân hàng"
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
                        <Input {...field} value={field.value ?? ""} />
                      </Form.Item>
                    )}
                  />
                </Col>
                <Col xs={24} md={12}>
                  <Controller
                    control={control}
                    name="clinicId"
                    render={({ field, fieldState }) => (
                      <Form.Item
                        label="Phòng khám"
                        required
                        validateStatus={fieldState.error ? "error" : ""}
                        help={fieldState.error?.message}
                      >
                        <Select
                          value={field.value || undefined}
                          onChange={field.onChange}
                          placeholder="Chọn phòng khám"
                          options={clinicOptions}
                          showSearch
                          optionFilterProp="label"
                        />
                      </Form.Item>
                    )}
                  />
                </Col>
              </Row>

              <Row gutter={12}>
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
                        <Input {...field} value={field.value ?? ""} />
                      </Form.Item>
                    )}
                  />
                </Col>
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
                          value={field.value ?? "WORKING"}
                          onChange={field.onChange}
                          options={EMPLOYEE_STATUSES.map((status) => ({
                            label:
                              status === "PENDING"
                                ? "Chưa hoàn tất"
                                : status === "WORKING"
                                ? "Đang làm việc"
                                : "Đã nghỉ việc",
                            value: status,
                          }))}
                        />
                      </Form.Item>
                    )}
                  />
                </Col>
              </Row>

              <Form.Item>
                <Space>
                  <Button onClick={() => router.push(`/employees`)}>Hủy</Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isSubmitting || updateMutation.isPending}
                  >
                    Lưu
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Spin>
        </Space>
      </Card>
    </div>
  );
}
