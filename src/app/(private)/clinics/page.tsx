import ClinicsPageView from "@/features/clinics/views/ClinicsPageView";
import { getSessionUser } from "@/server/utils/sessionCache";

export default async function ClinicsPage() {
  const user = await getSessionUser();
  const isAdmin = (user?.role || "").toString().toLowerCase() === "admin";
  // const isAdmin = user?.email === "dr.phamminhduc@gmail.com";
  return <ClinicsPageView isAdmin={isAdmin} />;
}
