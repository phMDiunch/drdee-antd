// import "@ant-design/v5-patch-for-react-19";
import React from "react";
// import { AntdRegistry } from "@ant-design/nextjs-registry";
import AppLayout from "@/layouts/AppLayout/AppLayout";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // <AntdRegistry>
    <AppLayout>{children}</AppLayout>
    // </AntdRegistry>
  );
}
