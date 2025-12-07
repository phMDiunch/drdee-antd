// src/features/profile/components/BasicInfoForm.tsx
"use client";

import React from "react";
import {
  Form,
  Input,
  DatePicker,
  Select,
  Row,
  Col,
  Button,
  Space,
  ColorPicker,
} from "antd";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import { BasicInfoFormSchema } from "@/shared/validation/profile.schema";
import type {
  BasicInfoFormData,
  ProfileResponse,
} from "@/shared/validation/profile.schema";
import { useUpdateProfile } from "../hooks/useUpdateProfile";

const GENDERS = [
  { label: "Nam", value: "male" },
  { label: "Nữ", value: "female" },
];

type Props = {
  profile: ProfileResponse;
};

export default function BasicInfoForm({ profile }: Props) {
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<BasicInfoFormData>({
    resolver: zodResolver(BasicInfoFormSchema),
    defaultValues: {
      fullName: profile.fullName,
      dob: profile.dob ? dayjs(profile.dob).toDate() : null,
      gender: profile.gender || null,
      avatarUrl: profile.avatarUrl,
      favoriteColor: profile.favoriteColor,
    },
  });

  const updateProfile = useUpdateProfile();

  const onSubmit = (data: BasicInfoFormData) => {
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
            label="Họ tên đầy đủ"
            required
            validateStatus={errors.fullName ? "error" : ""}
            help={errors.fullName?.message}
          >
            <Controller
              name="fullName"
              control={control}
              render={({ field }) => (
                <Input {...field} placeholder="Nguyễn Văn A" />
              )}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            label="Ngày sinh"
            validateStatus={errors.dob ? "error" : ""}
            help={errors.dob?.message}
          >
            <Controller
              name="dob"
              control={control}
              render={({ field }) => (
                <DatePicker
                  {...field}
                  value={field.value ? dayjs(field.value) : null}
                  onChange={(date) => field.onChange(date?.toDate() || null)}
                  format="DD/MM/YYYY"
                  placeholder="Chọn ngày sinh"
                  style={{ width: "100%" }}
                />
              )}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            label="Giới tính"
            validateStatus={errors.gender ? "error" : ""}
            help={errors.gender?.message}
          >
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  value={field.value || undefined}
                  placeholder="Chọn giới tính"
                  options={GENDERS}
                />
              )}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            label="Màu yêu thích"
            validateStatus={errors.favoriteColor ? "error" : ""}
            help={errors.favoriteColor?.message}
          >
            <Controller
              name="favoriteColor"
              control={control}
              render={({ field }) => (
                <ColorPicker
                  value={field.value || "#4096ff"}
                  showText
                  disabledAlpha
                  onChange={(c) => field.onChange(c.toHexString())}
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
