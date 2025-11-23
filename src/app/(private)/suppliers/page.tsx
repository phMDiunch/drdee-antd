// src/app/(private)/suppliers/page.tsx
import React from "react";
import { getSessionUser } from "@/server/utils/sessionCache";
import SuppliersPageView from "@/features/suppliers/views/SuppliersPageView";

export default async function SuppliersPage() {
  const user = await getSessionUser();
  const isAdmin = (user?.role || "").toString().toLowerCase() === "admin";
  return <SuppliersPageView isAdmin={isAdmin} />;
}
