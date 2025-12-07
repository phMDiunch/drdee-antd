// src/features/profile/components/BankingInfoForm.tsx
"use client";

import React from "react";
import { Form, Input, Row, Col, Button, Space } from "antd";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BankingInfoFormSchema } from "@/shared/validation/profile.schema";
import type {
  BankingInfoFormData,
  ProfileResponse,
} from "@/shared/validation/profile.schema";
import { useUpdateProfile } from "../hooks/useUpdateProfile";

type Props = {
  profile: ProfileResponse;
};

export default function BankingInfoForm({ profile }: Props) {
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<BankingInfoFormData>({
    resolver: zodResolver(BankingInfoFormSchema),
    defaultValues: {
      bankAccountNumber: profile.bankAccountNumber,
      bankName: profile.bankName,
    },
  });

  const updateProfile = useUpdateProfile();

  const onSubmit = (data: BankingInfoFormData) => {
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
        <Col xs={24} md={12}>
          <Form.Item
            label="Số tài khoản"
            validateStatus={errors.bankAccountNumber ? "error" : ""}
            help={errors.bankAccountNumber?.message}
          >
            <Controller
              name="bankAccountNumber"
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
        <Col xs={24} md={12}>
          <Form.Item
            label="Tên ngân hàng"
            validateStatus={errors.bankName ? "error" : ""}
            help={errors.bankName?.message}
          >
            <Controller
              name="bankName"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value || undefined}
                  placeholder="Vietcombank"
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
