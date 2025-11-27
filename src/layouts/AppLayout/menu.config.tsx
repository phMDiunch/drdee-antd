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
  InboxOutlined,
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
    children: [{ key: "/customers/daily", label: "Theo ngày" }],
  },
  {
    key: "appointments",
    icon: <CalendarOutlined />,
    label: "Lịch hẹn",
    children: [{ key: "/appointments/daily", label: "Theo ngày" }],
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
    children: [{ key: "/payments", label: "Phiếu thu" }],
  },
  {
    key: "reports",
    icon: <BarChartOutlined />,
    label: "Báo cáo",
    children: [
      { key: "/reports/sales", label: "Doanh số" },
      { key: "/reports/revenue", label: "Doanh thu" },
    ],
  },
  {
    key: "inventory",
    icon: <InboxOutlined />,
    label: "Quản lý kho",
    children: [{ key: "/inventory/materials", label: "Danh mục vật tư" }],
  },
  {
    key: "/settings",
    icon: <SettingOutlined />,
    label: "Cài đặt",
    children: [
      { key: "/clinics", label: "Phòng khám" },
      { key: "/master-data", label: "Danh mục hệ thống" },
      { key: "/dental-services", label: "Dịch vụ nha khoa" },
      { key: "/suppliers", label: "Nhà cung cấp" },
    ],
  },
];
