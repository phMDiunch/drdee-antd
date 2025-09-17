// src/shared/providers/antd.tsx
"use client";

import React from "react";
import { ConfigProvider, App as AntdApp } from "antd";
import viVN from "antd/locale/vi_VN";
import dayjs from "dayjs";
import "dayjs/locale/vi";

dayjs.locale("vi");

export function AntdProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        token: {
          // Có thể tinh chỉnh token sau (colorPrimary, borderRadius, ...).
          colorPrimary: "#0da70fff",
          // colorBgLayout: "#f5f7fb",
          // colorBgContainer: "#ffffff",
          // borderRadius: 8,
        },
      }}
    >
      {/* AntdApp cung cấp context cho message, modal, notification */}
      <AntdApp>{children}</AntdApp>
    </ConfigProvider>
  );
}
