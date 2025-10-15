// src/app/providers.tsx
"use client";

import "@ant-design/v5-patch-for-react-19";
import React from "react";
import { ReactQueryProvider } from "@/shared/providers/react-query";
import { AntdProvider } from "@/shared/providers/antd";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReactQueryProvider>
      <AntdProvider>{children}</AntdProvider>
    </ReactQueryProvider>
  );
}
