import type { Metadata } from "next";
import { RevenueReportView } from "@/features/reports/revenue";

export const metadata: Metadata = {
  title: "Báo cáo Doanh Thu",
  description: "Báo cáo tổng hợp doanh thu thực thu từ thanh toán",
};

export default function RevenueReportPage() {
  return <RevenueReportView />;
}
