// src/features/profile/components/ChangePasswordForm.tsx
"use client";

import React from "react";
import { Form, Input, Button, Space, Alert } from "antd";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChangePasswordFormSchema } from "@/shared/validation/profile.schema";
import type { ChangePasswordFormData } from "@/shared/validation/profile.schema";
import { useChangePassword } from "../hooks/useChangePassword";

export default function ChangePasswordForm() {
  const changePassword = useChangePassword();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(ChangePasswordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPassword = watch("newPassword");

  const onSubmit = (data: ChangePasswordFormData) => {
    changePassword.mutate(data);
  };

  const passwordStrength = (password: string) => {
    if (!password) return null;
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasLength = password.length >= 8;

    return { hasLower, hasUpper, hasNumber, hasLength };
  };

  const strength = passwordStrength(newPassword);

  return (
    <>
      <Alert
        message="Đổi mật khẩu"
        description="Sau khi đổi mật khẩu thành công, bạn sẽ cần đăng nhập lại với mật khẩu mới."
        type="warning"
        showIcon
        style={{ marginBottom: 24 }}
      />

      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Form layout="vertical" onFinish={handleSubmit(onSubmit) as any}>
        <Form.Item
          label="Mật khẩu hiện tại"
          required
          validateStatus={errors.currentPassword ? "error" : ""}
          help={errors.currentPassword?.message}
        >
          <Controller
            name="currentPassword"
            control={control}
            render={({ field }) => (
              <Input.Password {...field} placeholder="Nhập mật khẩu hiện tại" />
            )}
          />
        </Form.Item>

        <Form.Item
          label="Mật khẩu mới"
          required
          validateStatus={errors.newPassword ? "error" : ""}
          help={errors.newPassword?.message}
        >
          <Controller
            name="newPassword"
            control={control}
            render={({ field }) => (
              <Input.Password {...field} placeholder="Nhập mật khẩu mới" />
            )}
          />
        </Form.Item>

        {strength && (
          <div style={{ marginBottom: 16 }}>
            <div>
              <span style={{ color: strength.hasLength ? "green" : "gray" }}>
                {strength.hasLength ? "✓" : "○"} Ít nhất 8 ký tự
              </span>
            </div>
            <div>
              <span style={{ color: strength.hasUpper ? "green" : "gray" }}>
                {strength.hasUpper ? "✓" : "○"} Chứa chữ hoa
              </span>
            </div>
            <div>
              <span style={{ color: strength.hasLower ? "green" : "gray" }}>
                {strength.hasLower ? "✓" : "○"} Chứa chữ thường
              </span>
            </div>
            <div>
              <span style={{ color: strength.hasNumber ? "green" : "gray" }}>
                {strength.hasNumber ? "✓" : "○"} Chứa số
              </span>
            </div>
          </div>
        )}

        <Form.Item
          label="Xác nhận mật khẩu mới"
          required
          validateStatus={errors.confirmPassword ? "error" : ""}
          help={errors.confirmPassword?.message}
        >
          <Controller
            name="confirmPassword"
            control={control}
            render={({ field }) => (
              <Input.Password {...field} placeholder="Nhập lại mật khẩu mới" />
            )}
          />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              loading={changePassword.isPending}
            >
              Đổi mật khẩu
            </Button>
            <Button onClick={() => reset()}>Hủy bỏ</Button>
          </Space>
        </Form.Item>
      </Form>
    </>
  );
}
