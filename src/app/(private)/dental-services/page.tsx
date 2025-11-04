// src/app/(private)/dental-services/page.tsx
import React from "react";
import { getSessionUser } from "@/server/utils/sessionCache";
import DentalServicesPageView from "@/features/dental-services/views/DentalServicesPageView";

export default async function DentalServicesPage() {
  const user = await getSessionUser();
  const isAdmin = (user?.role || "").toString().toLowerCase() === "admin";
  return <DentalServicesPageView isAdmin={isAdmin} />;
}
