// src/features/profile/components/ContactInfoForm.tsx
"use client";

import React from "react";
import { Form, Input, Row, Col, Button, Space } from "antd";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ContactInfoFormSchema } from "@/shared/validation/profile.schema";
import type {
  ContactInfoFormData,
  ProfileResponse,
} from "@/shared/validation/profile.schema";
import { useUpdateProfile } from "../hooks/useUpdateProfile";

type Props = {
  profile: ProfileResponse;
};

export default function ContactInfoForm({ profile }: Props) {
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ContactInfoFormData>({
    resolver: zodResolver(ContactInfoFormSchema),
    defaultValues: {
      phone: profile.phone,
      currentAddress: profile.currentAddress,
      hometown: profile.hometown,
    },
  });

  const updateProfile = useUpdateProfile();

  const onSubmit = (data: ContactInfoFormData) => {
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
    <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item label="Email (Không thể thay đổi)">
            <Input value={profile.email || ""} disabled />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            label="Số điện thoại"
            validateStatus={errors.phone ? "error" : ""}
            help={errors.phone?.message}
          >
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value || undefined}
                  placeholder="0912345678"
                />
              )}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24}>
          <Form.Item
            label="Địa chỉ hiện tại"
            validateStatus={errors.currentAddress ? "error" : ""}
            help={errors.currentAddress?.message}
          >
            <Controller
              name="currentAddress"
              control={control}
              render={({ field }) => (
                <Input.TextArea
                  {...field}
                  value={field.value || undefined}
                  placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                  rows={1}
                />
              )}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24}>
          <Form.Item
            label="Quê quán"
            validateStatus={errors.hometown ? "error" : ""}
            help={errors.hometown?.message}
          >
            <Controller
              name="hometown"
              control={control}
              render={({ field }) => (
                <Input.TextArea
                  {...field}
                  value={field.value || undefined}
                  placeholder="Phường/xã, quận/huyện, tỉnh/thành phố"
                  rows={1}
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
