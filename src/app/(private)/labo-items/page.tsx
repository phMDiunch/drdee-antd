// src/app/(private)/labo-items/page.tsx
import React from "react";
import { getSessionUser } from "@/server/utils/sessionCache";
import { redirect } from "next/navigation";
import LaboItemsPageView from "@/features/labo-items/views/LaboItemsPageView";

export default async function LaboItemsPage() {
  const user = await getSessionUser();
  const isAdmin = (user?.role || "").toString().toLowerCase() === "admin";

  // Admin-only access
  if (!isAdmin) {
    redirect("/unauthorized");
  }

  return <LaboItemsPageView />;
}
