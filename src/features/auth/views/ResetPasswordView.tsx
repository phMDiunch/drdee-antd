// src/features/auth/views/ResetPasswordView.tsx
"use client";

import React from "react";
import { Layout, Result, Spin, theme, Button } from "antd";
import ResetPasswordForm from "@/features/auth/components/ResetPasswordForm";
import { usePasswordResetSession } from "@/features/auth/hooks/usePasswordResetSession";
import Link from "next/link";

const { Content } = Layout;

export default function ResetPasswordView() {
  const { token } = theme.useToken();
  const { isLoading, isError, isReady, errorMessage } = usePasswordResetSession();
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
        {isLoading && (
          <div
            style={{
              padding: 24,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Spin />
            <div>Đang xác thực yêu cầu...</div>
          </div>
        )}

        {isError && (
          <Result
            status="error"
            title="Liên kết không hợp lệ hoặc đã hết hạn"
            subTitle={errorMessage || undefined}
            extra={
              <Link href="/forgot-password">
                <Button type="primary">Yêu cầu liên kết mới</Button>
              </Link>
            }
          />
        )}

        {isReady && <ResetPasswordForm />}
      </Content>
    </Layout>
  );
}

