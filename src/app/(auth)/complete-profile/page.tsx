// src/app/(auth)/complete-profile/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, Suspense } from "react";
import {
  Card,
  Typography,
  Spin,
  Empty,
  Form,
  Row,
  Col,
  Input,
  DatePicker,
  Select,
  Button,
  ColorPicker,
  App,
} from "antd";
import dayjs from "dayjs";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CompleteProfileRequestSchema, type CompleteProfileRequest } from "@/shared/validation/employee.schema";
import { useCompleteProfilePublic, useEmployeeForProfileCompletion } from "@/features/employees/hooks";

const { Title, Paragraph, Text } = Typography;

const genderOptions = [
  { value: "male", label: "Nam" },
  { value: "female", label: "Nu" },
  { value: "other", label: "Khac" },
];

type FormValues = {
  id: string;
  fullName: string;
  dob?: Date;
  gender: string;
  favoriteColor: string;
  currentAddress: string;
  hometown: string;
  nationalId: string;
  nationalIdIssueDate?: Date;
  nationalIdIssuePlace: string;
  taxId?: string;
  insuranceNumber?: string;
  bankAccountNumber?: string;
  bankName?: string;
  password: string;
  confirmPassword: string;
};

export default function CompleteProfilePage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: "40px", textAlign: "center" }}>
          <Spin size="large" />
        </div>
      }
    >
      <CompleteProfileContent />
    </Suspense>
  );
}

function CompleteProfileContent() {
  const { message } = App.useApp();
  const searchParams = useSearchParams();
  const employeeId = searchParams?.get("employeeId") ?? undefined;
  const router = useRouter();

  const employeeQuery = useEmployeeForProfileCompletion(employeeId);
  const completeMutation = useCompleteProfilePublic();
  const redirectGuardRef = useRef(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(CompleteProfileRequestSchema) as any,
    defaultValues: useMemo(
      () => ({
        id: employeeId ?? "",
        fullName: "",
        dob: undefined,
        gender: "",
        favoriteColor: "#4096ff",
        currentAddress: "",
        hometown: "",
        nationalId: "",
        nationalIdIssueDate: undefined,
        nationalIdIssuePlace: "",
        taxId: "",
        insuranceNumber: "",
        bankAccountNumber: "",
        bankName: "",
        password: "",
        confirmPassword: "",
      }),
      [employeeId]
    ),
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    if (!employeeQuery.data) return;
    const emp = employeeQuery.data;
    reset({
      id: emp.id,
      fullName: emp.fullName,
      dob: emp.dob ? new Date(emp.dob) : undefined,
      gender: emp.gender ?? "",
      favoriteColor: emp.favoriteColor ?? "#4096ff",
      currentAddress: emp.currentAddress ?? "",
      hometown: emp.hometown ?? "",
      nationalId: emp.nationalId ?? "",
      nationalIdIssueDate: emp.nationalIdIssueDate ? new Date(emp.nationalIdIssueDate) : undefined,
      nationalIdIssuePlace: emp.nationalIdIssuePlace ?? "",
      taxId: emp.taxId ?? "",
      insuranceNumber: emp.insuranceNumber ?? "",
      bankAccountNumber: emp.bankAccountNumber ?? "",
      bankName: emp.bankName ?? "",
    });
  }, [employeeQuery.data, reset]);

  useEffect(() => {
    const status = employeeQuery.data?.employeeStatus;
    if (!status || status === "PENDING" || redirectGuardRef.current) {
      return;
    }

    redirectGuardRef.current = true;

    if (status === "RESIGNED") {
      message.error("Tài khoản đã bị vô hiệu hoá. Vui lòng liên hệ quản trị viên.");
      router.replace("/login");
      return;
    }

    message.info("Hồ sơ đã hoàn tất. Đang chuyển về trang chính.");
    router.replace("/dashboard");
  }, [employeeQuery.data?.employeeStatus, message, router]);

  const submit = handleSubmit(async (values) => {
    const payload: CompleteProfileRequest = {
      id: values.id,
      fullName: values.fullName.trim(),
      dob: values.dob!,
      gender: values.gender,
      favoriteColor: values.favoriteColor,
      currentAddress: values.currentAddress.trim(),
      hometown: values.hometown.trim(),
      nationalId: values.nationalId.trim(),
      nationalIdIssueDate: values.nationalIdIssueDate!,
      nationalIdIssuePlace: values.nationalIdIssuePlace.trim(),
      taxId: values.taxId?.trim() ? values.taxId.trim() : null,
      insuranceNumber: values.insuranceNumber?.trim() ? values.insuranceNumber.trim() : null,
      bankAccountNumber: values.bankAccountNumber?.trim() ? values.bankAccountNumber.trim() : null,
      bankName: values.bankName?.trim() ? values.bankName.trim() : null,
      password: values.password,
      confirmPassword: values.confirmPassword,
    };

    try {
      await completeMutation.mutateAsync(payload);
      redirectGuardRef.current = true;
      router.replace("/dashboard");
    } catch {
      // Error toast is handled inside the mutation hook.
    }
  });

  if (!employeeId) {
    return (
      <Empty description="Không tìm thấy mã nhân viên. Vui lòng kiểm tra lại link mời." style={{ marginTop: 80 }} />
    );
  }

  if (employeeQuery.isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", marginTop: 80 }}>
        <Spin tip="Đang tải thông tin nhân viên..." size="large">
          <div style={{ width: 200, height: 100 }} />
        </Spin>
      </div>
    );
  }

  if (employeeQuery.isError) {
    return (
      <Empty
        description={
          employeeQuery.error?.message || "Không thể tải thông tin nhân viên. Vui lòng liên hệ quản trị viên."
        }
        style={{ marginTop: 80 }}
      />
    );
  }

  if (!employeeQuery.data) {
    return <Empty description="Không thể tải thông tin nhân viên. Vui lòng thử lại sau." style={{ marginTop: 80 }} />;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <Card style={{ maxWidth: 700, width: "100%" }} variant="borderless">
        <Title level={3} style={{ textAlign: "center" }}>
          Hoàn thiện hồ sơ
        </Title>
        <Paragraph style={{ textAlign: "center", marginBottom: 28 }}>
          Xin chào <Text strong>{employeeQuery.data.fullName}</Text>. Vui lòng cập nhật thông tin để hoàn thiện hồ sơ
          của bạn.
        </Paragraph>

        <Form layout="vertical" onFinish={submit}>
          <Row gutter={12}>
            <Col xs={24} md={12}>
              <Controller
                control={control}
                name="fullName"
                render={({ field, fieldState }) => (
                  <Form.Item
                    label="Ho va ten"
                    required
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
                name="dob"
                render={({ field, fieldState }) => (
                  <Form.Item
                    label="Ngay sinh"
                    required
                    validateStatus={fieldState.error ? "error" : ""}
                    help={fieldState.error?.message}
                  >
                    <DatePicker
                      style={{ width: "100%" }}
                      value={field.value ? dayjs(field.value) : undefined}
                      onChange={(date) => field.onChange(date ? date.toDate() : undefined)}
                      format="DD/MM/YYYY"
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
                name="gender"
                render={({ field, fieldState }) => (
                  <Form.Item
                    label="Giới tính"
                    required
                    validateStatus={fieldState.error ? "error" : ""}
                    help={fieldState.error?.message}
                  >
                    <Select
                      value={field.value || undefined}
                      onChange={field.onChange}
                      options={genderOptions}
                      placeholder="Chọn giới tính"
                    />
                  </Form.Item>
                )}
              />
            </Col>
            <Col xs={24} md={12}>
              <Controller
                control={control}
                name="favoriteColor"
                render={({ field, fieldState }) => (
                  <Form.Item
                    label="Màu yêu thích"
                    required
                    validateStatus={fieldState.error ? "error" : ""}
                    help={fieldState.error?.message}
                  >
                    <ColorPicker
                      value={field.value || "#4096ff"}
                      showText
                      disabledAlpha
                      onChange={(color) => field.onChange(color.toHexString())}
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
                    required
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
                    required
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
                name="nationalId"
                render={({ field, fieldState }) => (
                  <Form.Item
                    label="Số CCCD"
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
                name="nationalIdIssueDate"
                render={({ field, fieldState }) => (
                  <Form.Item
                    label="Ngày cấp CCCD"
                    required
                    validateStatus={fieldState.error ? "error" : ""}
                    help={fieldState.error?.message}
                  >
                    <DatePicker
                      style={{ width: "100%" }}
                      value={field.value ? dayjs(field.value) : undefined}
                      onChange={(date) => field.onChange(date ? date.toDate() : undefined)}
                      format="DD/MM/YYYY"
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
                name="nationalIdIssuePlace"
                render={({ field, fieldState }) => (
                  <Form.Item
                    label="Nơi cấp CCCD"
                    required
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
          </Row>

          <Row gutter={12}>
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
          </Row>

          <Row gutter={12}>
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
                name="password"
                render={({ field, fieldState }) => (
                  <Form.Item
                    label="Mật khẩu"
                    required
                    validateStatus={fieldState.error ? "error" : ""}
                    help={fieldState.error?.message}
                  >
                    <Input.Password {...field} placeholder="Nhập mật khẩu" />
                  </Form.Item>
                )}
              />
            </Col>
            <Col xs={24} md={12}>
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field, fieldState }) => (
                  <Form.Item
                    label="Xác nhận mật khẩu"
                    required
                    validateStatus={fieldState.error ? "error" : ""}
                    help={fieldState.error?.message}
                  >
                    <Input.Password {...field} placeholder="Nhập lại mật khẩu" />
                  </Form.Item>
                )}
              />
            </Col>
          </Row>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: 24,
            }}
          >
            <Button type="primary" htmlType="submit" loading={isSubmitting || completeMutation.isPending}>
              Hoàn tất
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}
