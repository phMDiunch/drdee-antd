// src/app/(private)/master-data/page.tsx
import React from "react";
import { getSessionUser } from "@/server/utils/sessionCache";
import { MasterDataPageView } from "@/features/master-data";

export const metadata = {
  title: "Dữ liệu chủ | DrDee",
  description: "Quản lý dữ liệu chủ hệ thống",
};

export default async function MasterDataPage() {
  const user = await getSessionUser();
  const isAdmin = (user?.role || "").toString().toLowerCase() === "admin";
  return <MasterDataPageView isAdmin={isAdmin} />;
}
