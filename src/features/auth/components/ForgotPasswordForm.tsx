// src/features/auth/components/ForgotPasswordForm.tsx
"use client";
import "@ant-design/v5-patch-for-react-19";
import React from "react";
import { Form, Input, Button, Typography, Card } from "antd";
import { useForgotPassword } from "@/features/auth/hooks/useForgotPassword";
import type { ForgotPasswordRequest } from "@/shared/validation/auth.schema";
import Link from "next/link";

const { Title, Text } = Typography;

export default function ForgotPasswordForm() {
  const [form] = Form.useForm<ForgotPasswordRequest>();
  const forgotPassword = useForgotPassword();

  const onFinish = (values: ForgotPasswordRequest) => {
    forgotPassword.mutate({ email: values.email.trim() });
  };

  return (
    <Card variant="outlined" style={{ width: "100%", maxWidth: 420 }}>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <Title level={4} style={{ marginBottom: 8 }}>Quên mật khẩu</Title>
        <Text type="secondary">Nhập email của bạn để nhận liên kết đặt lại mật khẩu</Text>
      </div>

      <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false} disabled={forgotPassword.isPending}>
        <Form.Item name="email" label="Email" rules={[{ required: true, message: "Vui lòng nhập email" }, { type: "email", message: "Email không hợp lệ" }]}>
          <Input placeholder="you@example.com" autoComplete="email" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block loading={forgotPassword.isPending}>Gửi email đặt lại mật khẩu</Button>
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

