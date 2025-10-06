// src/app/(private)/employees/page.tsx
import EmployeesListView from "@/features/employees/views/EmployeesListView";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nhân viên - DrDee",
  description: "Quản lý nhân viên phòng khám",
};

export default async function EmployeesPage() {
  return <EmployeesListView />;
}
