// src/app/(auth)/login/page.tsx
import React, { Suspense } from "react";
import { Spin } from "antd";
import LoginView from "@/features/auth/views/LoginView";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: "40px", textAlign: "center" }}>
          <Spin size="large" />
        </div>
      }
    >
      <LoginView />
    </Suspense>
  );
}
