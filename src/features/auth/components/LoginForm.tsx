// src/features/auth/components/LoginForm.tsx
"use client";
import "@ant-design/v5-patch-for-react-19";
import React from "react";
import { Form, Input, Button, Typography, Card } from "antd";
import { useLogin } from "@/features/auth/hooks/useLogin";
import type { LoginRequest } from "@/features/auth";

const { Title } = Typography;

export default function LoginForm() {
  const [form] = Form.useForm<LoginRequest>();
  const login = useLogin();

  const onFinish = (values: LoginRequest) => {
    login.mutate({ email: values.email.trim(), password: values.password });
  };

  return (
    <Card variant="outlined" style={{ width: "100%", maxWidth: 420 }}>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <Title level={4} style={{ marginBottom: 0 }}>
          Đăng nhập hệ thống
        </Title>
      </div>

      <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false} disabled={login.isPending}>
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: "Vui lòng nhập email" },
            { type: "email", message: "Email không hợp lệ" },
          ]}
        >
          <Input placeholder="you@example.com" autoComplete="email" />
        </Form.Item>

        <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}>
          <Input.Password placeholder="••••••••" autoComplete="current-password" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block loading={login.isPending}>
            Đăng nhập
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
