// src/components/layouts/Sidebar.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Layout, Menu, Drawer, theme } from "antd";
import {
  HomeOutlined,
  UserOutlined,
  TeamOutlined,
  FileTextOutlined,
  SettingOutlined,
  BarChartOutlined,
  CalendarOutlined,
  MessageOutlined,
  FolderOutlined,
} from "@ant-design/icons";

const { Sider } = Layout;

// 1. Cải tiến menuConfig: Xóa bỏ các route động không cần hiển thị.
// Trang "Chỉnh sửa" sẽ tự động làm sáng menu "Danh sách".
const menuConfig = [
  { key: "/home", icon: <HomeOutlined />, label: "Trang chủ" },
  {
    key: "dashboard",
    icon: <BarChartOutlined />,
    label: "Thống kê",
    children: [
      { key: "/dashboard/analytics", label: "Phân tích" },
      { key: "/dashboard/reports", label: "Báo cáo" },
    ],
  },
  {
    key: "users",
    icon: <TeamOutlined />,
    label: "Người dùng",
    children: [{ key: "/users", label: "Danh sách" }], // Chỉ cần key cha là đủ
  },
  {
    key: "leads",
    icon: <FileTextOutlined />,
    label: "Leads",
    children: [{ key: "/leads", label: "Danh sách" }],
  },
  { key: "/projects", icon: <FolderOutlined />, label: "Dự án" },
  { key: "/calendar", icon: <CalendarOutlined />, label: "Lịch làm việc" },
  { key: "/messages", icon: <MessageOutlined />, label: "Tin nhắn" },
  { key: "/profile", icon: <UserOutlined />, label: "Hồ sơ" },
  { key: "/settings", icon: <SettingOutlined />, label: "Cài đặt" },
];

export default function Sidebar({ collapsed, onClose, isMobile }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken();

  // 2. Tối ưu hiệu năng: Dùng useMemo để chỉ tính toán lại menu state khi đường dẫn thay đổi.
  const { selectedKeys, defaultOpenKeys } = useMemo(() => {
    const path = location.pathname;
    let selected = [];
    let open = [];

    for (const item of menuConfig) {
      // Xử lý menu cha có con
      if (item.children) {
        for (const child of item.children) {
          // "/users/edit/123".startsWith("/users") -> true
          if (path.startsWith(child.key)) {
            selected.push(child.key);
            open.push(item.key); // Mở menu cha tương ứng
            break; // Thoát vòng lặp con khi đã tìm thấy
          }
        }
      } else {
        // Xử lý menu đơn
        if (path.startsWith(item.key)) {
          selected.push(item.key);
          break;
        }
      }
      if (selected.length > 0) break; // Thoát vòng lặp cha khi đã tìm thấy
    }

    // Fallback về trang chủ nếu không tìm thấy
    if (selected.length === 0) {
      selected.push("/home");
    }

    return { selectedKeys: selected, defaultOpenKeys: open };
  }, [location.pathname]); // Chỉ chạy lại khi pathname thay đổi

  const [openKeys, setOpenKeys] = useState(defaultOpenKeys);

  // Cập nhật openKeys khi route thay đổi (ví dụ khi người dùng điều hướng trực tiếp bằng URL)
  useEffect(() => {
    if (!collapsed) {
      setOpenKeys(defaultOpenKeys);
    }
  }, [defaultOpenKeys, collapsed]);

  const rootMenuKeys = useMemo(
    () => menuConfig.filter((i) => i.children).map((i) => i.key),
    []
  );

  // Accordion behavior: Chỉ cho phép mở 1 menu cha
  const onOpenChange = (keys) => {
    const latestOpenKey = keys.find((key) => !openKeys.includes(key));
    if (rootMenuKeys.includes(latestOpenKey)) {
      setOpenKeys([latestOpenKey]);
    } else {
      setOpenKeys(keys);
    }
  };

  // Xử lý khi click menu
  const handleMenuClick = ({ key }) => {
    navigate(key);
    if (isMobile && onClose) onClose();
  };

  // 3. Tái sử dụng code: Tạo một biến chứa component Menu để tránh lặp code.
  const menuContent = (
    <Menu
      mode="inline"
      theme="light"
      selectedKeys={selectedKeys}
      openKeys={openKeys}
      onOpenChange={onOpenChange}
      items={menuConfig} // Antd v5+ có thể nhận trực tiếp config mà không cần map lại
      onClick={handleMenuClick}
      style={{
        border: "none",
        height: isMobile ? "100%" : "calc(100vh - 64px)",
        overflowY: "auto",
        overflowX: "hidden",
      }}
    />
  );

  const logo = (
    <div
      style={{
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        background: token.colorBgContainer,
      }}
    >
      <span
        style={{
          fontWeight: "bold",
          fontSize: !collapsed ? 18 : 16,
          color: token.colorPrimary,
          letterSpacing: 1,
          transition: "font-size 0.2s",
        }}
      >
        {collapsed ? "DD" : "DR DEE"}
      </span>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer
        placement="left"
        onClose={onClose}
        open={!collapsed}
        bodyStyle={{ padding: 0 }}
        width={250}
        closable={false}
      >
        {logo}
        {menuContent}
      </Drawer>
    );
  }

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      style={{
        overflow: "hidden",
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 999,
        background: token.colorBgContainer,
        borderRight: `1px solid ${token.colorBorderSecondary}`,
      }}
      width={250}
      collapsedWidth={80}
    >
      {logo}
      {menuContent}
    </Sider>
  );
}
