import { Metadata } from "next";
import SalesDashboard from "@/demos/sales-dashboard/components/SalesDashboard";

export const metadata: Metadata = {
  title: "Demo: Sales Dashboard | Hệ thống",
  description: "Demo dashboard doanh số với dữ liệu giả lập",
};

export default function DemoSalesDashboardPage() {
  return <SalesDashboard />;
}
