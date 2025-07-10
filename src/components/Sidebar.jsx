import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Layout, Menu, Drawer, theme } from "antd";
import {
  HomeOutlined, UserOutlined, TeamOutlined, FileTextOutlined,
  SettingOutlined, BarChartOutlined, CalendarOutlined,
  MessageOutlined, FolderOutlined
} from "@ant-design/icons";

const { Sider } = Layout;

// Cấu hình menu (chỉ để path, ko có function)
const menuConfig = [
  {
    key: "/home",
    icon: <HomeOutlined />,
    label: "Trang chủ",
  },
  {
    key: "dashboard",
    icon: <BarChartOutlined />,
    label: "Thống kê",
    children: [
      { key: "/dashboard/analytics", label: "Phân tích" },
      { key: "/dashboard/reports", label: "Báo cáo" }
    ],
  },
  {
    key: "users",
    icon: <TeamOutlined />,
    label: "Người dùng",
    children: [
      { key: "/users", label: "Danh sách" },
      { key: "/users/edit/:id", label: "Chỉnh sửa" }
    ],
  },
  {
    key: "documents",
    icon: <FileTextOutlined />,
    label: "Tài liệu",
    children: [
      { key: "/documents/list", label: "Danh sách" },
      { key: "/documents/categories", label: "Danh mục" },
    ],
  },
  { key: "/projects", icon: <FolderOutlined />, label: "Dự án" },
  { key: "/calendar", icon: <CalendarOutlined />, label: "Lịch làm việc" },
  { key: "/messages", icon: <MessageOutlined />, label: "Tin nhắn" },
  { key: "/profile", icon: <UserOutlined />, label: "Hồ sơ" },
  { key: "/settings", icon: <SettingOutlined />, label: "Cài đặt" },
];

// Helper: Tìm menu cha đang mở dựa vào đường dẫn
function findOpenKey(path) {
  for (const item of menuConfig) {
    if (item.children) {
      for (const child of item.children) {
        if (child.key === path) return [item.key];
      }
    }
  }
  return [];
}

// Helper: Xác định menu đang được chọn
function findSelectedKey(path) {
  for (const item of menuConfig) {
    if (item.key === path) return [item.key];
    if (item.children) {
      for (const child of item.children) {
        if (child.key === path) return [child.key];
      }
    }
  }
  return ["/home"];
}

export default function Sidebar({ collapsed, onClose, isMobile }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken();

  // Chuyển menuConfig sang format antd yêu cầu (có icon, label, key, children)
  const menuItems = menuConfig.map(item => ({
    ...item,
    children: item.children?.map(child => ({
      ...child,
    }))
  }));

  // Chỉ mở đúng 1 menu cha dạng accordion
  const [openKeys, setOpenKeys] = useState(findOpenKey(location.pathname));
  useEffect(() => {
    setOpenKeys(findOpenKey(location.pathname));
  }, [location.pathname]);

  const rootMenuKeys = menuConfig.filter(i => i.children).map(i => i.key);

  // Accordion behavior
  const onOpenChange = keys => {
    const latestOpenKey = keys.find(key => !openKeys.includes(key));
    setOpenKeys(rootMenuKeys.includes(latestOpenKey) ? [latestOpenKey] : []);
  };

  // Xử lý khi click menu
  const handleMenuClick = ({ key }) => {
    // Chỉ navigate khi là trang, không phải menu cha
    if (!rootMenuKeys.includes(key)) {
      navigate(key);
      if (isMobile && onClose) onClose();
    }
  };

  const sidebarContent = (
    <>
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
        <span style={{
          fontWeight: "bold",
          fontSize: !collapsed ? 18 : 16,
          color: token.colorPrimary,
          letterSpacing: 1,
        }}>
          {collapsed ? "DD" : "DR DEE"}
        </span>
      </div>
      <Menu
        mode="inline"
        theme="light"
        selectedKeys={findSelectedKey(location.pathname)}
        openKeys={openKeys}
        onOpenChange={onOpenChange}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ border: "none", height: "calc(100vh - 64px)", overflow: "auto" }}
      />
    </>
  );

  if (isMobile) {
    return (
      <Drawer
        title={<span style={{ fontWeight: "bold", fontSize: 18, color: token.colorPrimary }}>DR DEE</span>}
        placement="left"
        onClose={onClose}
        open={!collapsed}
        bodyStyle={{ padding: 0 }}
        width={250}
      >
        <Menu
          mode="inline"
          theme="light"
          selectedKeys={findSelectedKey(location.pathname)}
          openKeys={openKeys}
          onOpenChange={onOpenChange}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ border: "none", height: "100%", overflow: "auto" }}
        />
      </Drawer>
    );
  }

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      style={{
        overflow: "auto",
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
      {sidebarContent}
    </Sider>
  );
}
