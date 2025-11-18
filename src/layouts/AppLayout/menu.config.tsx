// src/layouts/AppLayout/menu.config.tsx

import type { MenuProps } from "antd";
import {
  DashboardOutlined,
  TeamOutlined,
  UserOutlined,
  CalendarOutlined,
  DollarOutlined,
  BarChartOutlined,
  SettingOutlined,
  MedicineBoxOutlined,
  ExperimentOutlined,
} from "@ant-design/icons";

type MenuItem = Required<MenuProps>["items"][number];

export const menuItems: MenuItem[] = [
  { key: "/dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
  {
    key: "employees",
    icon: <TeamOutlined />,
    label: "Nhân sự",
    children: [{ key: "/employees", label: "Danh sách" }],
  },
  {
    key: "customers",
    icon: <UserOutlined />,
    label: "Khách hàng",
    children: [
      { key: "/customers/daily", label: "Theo ngày" },
      { key: "/customers", label: "Danh sách" },
    ],
  },
  {
    key: "appointments",
    icon: <CalendarOutlined />,
    label: "Lịch hẹn",
    children: [
      { key: "/appointments/daily", label: "Theo ngày" },
      { key: "/appointments", label: "Danh sách" },
    ],
  },
  {
    key: "consulted-services",
    icon: <MedicineBoxOutlined />,
    label: "Dịch vụ tư vấn",
    children: [{ key: "/consulted-services/daily", label: "Theo ngày" }],
  },
  {
    key: "treatment-logs",
    icon: <ExperimentOutlined />,
    label: "Lịch sử điều trị",
    children: [{ key: "/treatment-logs", label: "Theo ngày" }],
  },
  {
    key: "payments",
    icon: <DollarOutlined />,
    label: "Thanh toán",
    children: [
      { key: "/payments", label: "Phiếu thu" },
      { key: "/payments/reports", label: "Báo cáo" },
    ],
  },
  {
    key: "reports",
    icon: <BarChartOutlined />,
    label: "Báo cáo",
    children: [{ key: "/reports/sales", label: "Doanh số" }],
  },
  {
    key: "/settings",
    icon: <SettingOutlined />,
    label: "Cài đặt",
    children: [
      { key: "/clinics", label: "Phòng khám" },
      { key: "/dental-services", label: "Dịch vụ nha khoa" },
    ],
  },
  {
    key: "demo",
    icon: <ExperimentOutlined />,
    label: "Demo",
    children: [
      { key: "/demo/sales-dashboard", label: "Sales Dashboard" },
      { key: "/demo/revenue-dashboard", label: "Revenue Dashboard" },
    ],
  },
];
