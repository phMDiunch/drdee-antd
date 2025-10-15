// src/features/auth/views/LoginView.tsx
"use client";

import React, { useMemo } from "react";
import { Alert, Layout, theme } from "antd";
import LoginForm from "@/features/auth/components/LoginForm";
import { useSearchParams } from "next/navigation";

const { Content } = Layout;

export default function LoginView() {
  const { token } = theme.useToken();
  const searchParams = useSearchParams();
  const disabledNotice = useMemo(() => searchParams.get("reason") === "disabled", [searchParams]);
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
        <div style={{ width: "100%", maxWidth: 420 }}>
          {disabledNotice && (
            <Alert
              style={{ marginBottom: 16 }}
              type="warning"
              showIcon
              message="Tài khoản đã bị vô hiệu hóa"
              description="Vui lòng liên hệ quản trị viên để được hỗ trợ."
            />
          )}
          <LoginForm />
        </div>
      </Content>
    </Layout>
  );
}

