// src/features/profile/components/LegalInfoForm.tsx
"use client";

import React from "react";
import { Form, Input, DatePicker, Row, Col, Button, Space } from "antd";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import { LegalInfoFormSchema } from "@/shared/validation/profile.schema";
import type {
  LegalInfoFormData,
  ProfileResponse,
} from "@/shared/validation/profile.schema";
import { useUpdateProfile } from "../hooks/useUpdateProfile";

type Props = {
  profile: ProfileResponse;
};

export default function LegalInfoForm({ profile }: Props) {
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<LegalInfoFormData>({
    resolver: zodResolver(LegalInfoFormSchema),
    defaultValues: {
      nationalId: profile.nationalId,
      nationalIdIssueDate: profile.nationalIdIssueDate
        ? dayjs(profile.nationalIdIssueDate).toDate()
        : null,
      nationalIdIssuePlace: profile.nationalIdIssuePlace,
      taxId: profile.taxId,
      insuranceNumber: profile.insuranceNumber,
    },
  });

  const updateProfile = useUpdateProfile();

  const onSubmit = (data: LegalInfoFormData) => {
    updateProfile.mutate(data, {
      onSuccess: () => {
        reset(data);
      },
    });
  };

  const handleCancel = () => {
    reset();
  };

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Form layout="vertical" onFinish={handleSubmit(onSubmit) as any}>
      <Row gutter={16}>
        <Col xs={24} md={8}>
          <Form.Item
            label="Số CCCD"
            validateStatus={errors.nationalId ? "error" : ""}
            help={errors.nationalId?.message}
          >
            <Controller
              name="nationalId"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value || undefined}
                  placeholder="079123456789"
                />
              )}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item
            label="Ngày cấp"
            validateStatus={errors.nationalIdIssueDate ? "error" : ""}
            help={errors.nationalIdIssueDate?.message}
          >
            <Controller
              name="nationalIdIssueDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  {...field}
                  value={field.value ? dayjs(field.value) : null}
                  onChange={(date) => field.onChange(date?.toDate() || null)}
                  format="DD/MM/YYYY"
                  placeholder="Chọn ngày cấp"
                  style={{ width: "100%" }}
                />
              )}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item
            label="Nơi cấp"
            validateStatus={errors.nationalIdIssuePlace ? "error" : ""}
            help={errors.nationalIdIssuePlace?.message}
          >
            <Controller
              name="nationalIdIssuePlace"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value || undefined}
                  placeholder="Cục Cảnh sát ĐKQL cư trú và DLQG về dân cư"
                />
              )}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            label="Mã số thuế"
            validateStatus={errors.taxId ? "error" : ""}
            help={errors.taxId?.message}
          >
            <Controller
              name="taxId"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value || undefined}
                  placeholder="0123456789"
                />
              )}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            label="Số sổ BHXH"
            validateStatus={errors.insuranceNumber ? "error" : ""}
            help={errors.insuranceNumber?.message}
          >
            <Controller
              name="insuranceNumber"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value || undefined}
                  placeholder="1234567890"
                />
              )}
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item>
        <Space>
          <Button
            type="primary"
            htmlType="submit"
            loading={updateProfile.isPending}
            disabled={!isDirty}
          >
            Lưu thay đổi
          </Button>
          <Button onClick={handleCancel} disabled={!isDirty}>
            Hủy bỏ
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
}
