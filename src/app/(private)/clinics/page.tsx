import ClinicsPageView from "@/features/clinics/views/ClinicsPageView";
import { getSessionUser } from "@/server/services/auth.service";

export default async function ClinicsPage() {
  const user = await getSessionUser();
  // const isAdmin = (user?.role || "").toString().toLowerCase() === "admin";
  const isAdmin = user?.email === "dr.phamminhduc@gmail.com";
  // console.log(">>> ClinicsPage - isAdmin:", isAdmin);
  return <ClinicsPageView isAdmin={isAdmin} />;
}
