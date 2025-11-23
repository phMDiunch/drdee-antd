// src/app/(private)/inventory/materials/page.tsx
import React from "react";
import { getSessionUser } from "@/server/utils/sessionCache";
import MaterialsPageView from "@/features/materials/views/MaterialsPageView";

export default async function MaterialsPage() {
  const user = await getSessionUser();
  const isAdmin = (user?.role || "").toString().toLowerCase() === "admin";
  return <MaterialsPageView isAdmin={isAdmin} />;
}
