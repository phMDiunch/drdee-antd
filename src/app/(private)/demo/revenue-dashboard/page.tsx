import { Metadata } from "next";
import RevenueDashboard from "@/demos/revenue-dashboard/components/RevenueDashboard";

export const metadata: Metadata = {
  title: "Demo: Revenue Dashboard | Hệ thống",
  description: "Demo dashboard doanh thu với dữ liệu giả lập",
};

export default function DemoRevenueDashboardPage() {
  return <RevenueDashboard />;
}
