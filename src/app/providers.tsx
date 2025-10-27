// src/app/providers.tsx
"use client";

import "@ant-design/v5-patch-for-react-19";
import React from "react";
import { ReactQueryProvider } from "@/shared/providers/react-query";
import { AntdProvider } from "@/shared/providers/antd";
import { UserProvider } from "@/shared/providers/user-provider";
import type { UserCore } from "@/shared/types/user";

type ProvidersProps = {
  children: React.ReactNode;
  user?: UserCore | null;
};

export default function Providers({ children, user }: ProvidersProps) {
  return (
    <ReactQueryProvider>
      <AntdProvider>
        <UserProvider user={user}>{children}</UserProvider>
      </AntdProvider>
    </ReactQueryProvider>
  );
}
