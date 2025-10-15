// src/features/auth/views/ForgotPasswordView.tsx
"use client";

import React from "react";
import { Layout, theme } from "antd";
import ForgotPasswordForm from "@/features/auth/components/ForgotPasswordForm";

const { Content } = Layout;

export default function ForgotPasswordView() {
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
        <ForgotPasswordForm />
      </Content>
    </Layout>
  );
}
