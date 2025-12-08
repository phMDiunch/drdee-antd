// src/app/(private)/labo-services/page.tsx
import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/services/auth.service";
import LaboServicesPageView from "@/features/labo-services/views/LaboServicesPageView";

export default async function LaboServicesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  // Check admin: by role or by email
  const isAdmin =
    user.role?.toLowerCase() === "admin" ||
    user.email?.toLowerCase() === "dr.phamminhduc@gmail.com";

  if (!isAdmin) redirect("/unauthorized");

  return <LaboServicesPageView isAdmin={isAdmin} />;
}
