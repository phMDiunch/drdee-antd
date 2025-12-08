import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/utils/sessionCache";
import { LaboReportView } from "@/features/reports/labo";

export default async function LaboReportPage() {
  const user = await getSessionUser();
  const isAdmin = (user?.role || "").toString().toLowerCase() === "admin";

  // Admin-only access
  if (!isAdmin) {
    redirect("/unauthorized");
  }

  return <LaboReportView />;
}
