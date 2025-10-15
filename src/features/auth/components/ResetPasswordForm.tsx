// src/features/auth/components/ResetPasswordForm.tsx
"use client";
import "@ant-design/v5-patch-for-react-19";
import React from "react";
import { Form, Input, Button, Typography, Card } from "antd";
import { useResetPassword } from "@/features/auth/hooks/useResetPassword";
import type { ResetPasswordRequest } from "@/shared/validation/auth.schema";
import Link from "next/link";

const { Title, Text } = Typography;

export default function ResetPasswordForm() {
  const [form] = Form.useForm<ResetPasswordRequest>();
  const resetPassword = useResetPassword();

  const onFinish = (values: ResetPasswordRequest) => {
    resetPassword.mutate(values);
  };

  return (
    <Card variant="outlined" style={{ width: "100%", maxWidth: 420 }}>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <Title level={4} style={{ marginBottom: 8 }}>Đặt lại mật khẩu</Title>
        <Text type="secondary">Nhập mật khẩu mới của bạn</Text>
      </div>

      <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false} disabled={resetPassword.isPending}>
        <Form.Item name="password" label="Mật khẩu mới" rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }, { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" }]}>
          <Input.Password placeholder="********" autoComplete="new-password" />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="Xác nhận mật khẩu"
          dependencies={["password"]}
          rules={[{ required: true, message: "Vui lòng xác nhận mật khẩu" }, ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue("password") === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error("Mật khẩu xác nhận không khớp"));
            },
          })]}
        >
          <Input.Password placeholder="********" autoComplete="new-password" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block loading={resetPassword.isPending}>Đặt lại mật khẩu</Button>
        </Form.Item>

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Link href="/login">
            <Button type="link" style={{ padding: 0 }}>Quay lại đăng nhập</Button>
          </Link>
        </div>
      </Form>
    </Card>
  );
}

