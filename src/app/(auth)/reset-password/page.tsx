// src/app/(auth)/reset-password/page.tsx
import React, { Suspense } from "react";
import { Spin } from "antd";
import ResetPasswordView from "@/features/auth/views/ResetPasswordView";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: "40px", textAlign: "center" }}>
          <Spin size="large" />
        </div>
      }
    >
      <ResetPasswordView />
    </Suspense>
  );
}
