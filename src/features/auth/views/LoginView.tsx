// src/features/auth/views/LoginView.tsx
"use client";

import React from "react";
import { Layout, theme } from "antd";
import LoginForm from "@/features/auth/components/LoginForm";

const { Content } = Layout;

export default function LoginView() {
  const { token } = theme.useToken();
  return (
    <Layout style={{ minHeight: "100vh", background: token.colorBgLayout }}>
      <Content
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: token.paddingLG,
        }}
      >
        <LoginForm />
      </Content>
    </Layout>
  );
}
