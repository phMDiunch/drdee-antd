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
    key: "leads",
    icon: <UserOutlined />,
    label: "Lead",
    children: [{ key: "/leads/daily", label: "Theo ngày" }],
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
    children: [
      { key: "/consulted-services/daily", label: "Theo ngày" },
      { key: "/consulted-services/follow-up", label: "Follow-up" },
    ],
  },
  {
    key: "treatment-logs",
    icon: <ExperimentOutlined />,
    label: "Lịch sử điều trị",
    children: [{ key: "/treatment-logs/daily", label: "Theo ngày" }],
  },
  {
    key: "payments",
    icon: <DollarOutlined />,
    label: "Phiếu thu",
    children: [{ key: "/payments/daily", label: "Theo ngày" }],
  },
  {
    key: "labo",
    icon: <ExperimentOutlined />,
    label: "Labo răng giả",
    children: [{ key: "/labo-orders/daily", label: "Theo ngày" }],
  },

  {
    key: "inventory",
    icon: <InboxOutlined />,
    label: "Quản lý kho",
    children: [{ key: "/inventory/materials", label: "Danh mục vật tư" }],
  },
  {
    key: "reports",
    icon: <BarChartOutlined />,
    label: "Báo cáo",
    children: [
      { key: "/reports/sales", label: "Doanh số" },
      { key: "/reports/revenue", label: "Doanh thu" },
      { key: "/reports/labo", label: "Labo" },
    ],
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
      { key: "/labo-items", label: "Danh mục labo" },
      { key: "/labo-services", label: "Dịch vụ labo" },
    ],
  },
];
