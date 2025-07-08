import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Layout,
  Menu,
  theme,
  Drawer,
} from "antd";
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

export default function Sidebar({ collapsed, onClose, isMobile }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken();

  const menuItems = [
    {
      key: "/home",
      icon: <HomeOutlined />,
      label: "Trang chủ",
      onClick: () => {
        navigate("/home");
        if (isMobile && onClose) onClose();
      },
    },
    {
      key: "dashboard",
      icon: <BarChartOutlined />,
      label: "Thống kê",
      children: [
        {
          key: "analytics",
          label: "Phân tích",
          onClick: () => {
            console.log("Navigate to analytics");
            if (isMobile && onClose) onClose();
          },
        },
        {
          key: "reports",
          label: "Báo cáo",
          onClick: () => {
            console.log("Navigate to reports");
            if (isMobile && onClose) onClose();
          },
        },
      ],
    },
    {
      key: "users",
      icon: <TeamOutlined />,
      label: "Người dùng",
      children: [
        {
          key: "user-list",
          label: "Danh sách",
          onClick: () => console.log("Navigate to user list"),
        },
        {
          key: "user-roles",
          label: "Phân quyền",
          onClick: () => console.log("Navigate to user roles"),
        },
      ],
    },
    {
      key: "documents",
      icon: <FileTextOutlined />,
      label: "Tài liệu",
      children: [
        {
          key: "doc-list",
          label: "Danh sách",
          onClick: () => console.log("Navigate to documents"),
        },
        {
          key: "doc-categories",
          label: "Danh mục",
          onClick: () => console.log("Navigate to categories"),
        },
      ],
    },
    {
      key: "projects",
      icon: <FolderOutlined />,
      label: "Dự án",
      onClick: () => console.log("Navigate to projects"),
    },
    {
      key: "calendar",
      icon: <CalendarOutlined />,
      label: "Lịch làm việc",
      onClick: () => console.log("Navigate to calendar"),
    },
    {
      key: "messages",
      icon: <MessageOutlined />,
      label: "Tin nhắn",
      onClick: () => console.log("Navigate to messages"),
    },
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Hồ sơ",
      onClick: () => console.log("Navigate to profile"),
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "Cài đặt",
      onClick: () => console.log("Navigate to settings"),
    },
  ];

  const getSelectedKeys = () => {
    const currentPath = location.pathname;
    // Find the menu item that matches the current path
    for (const item of menuItems) {
      if (item.key === currentPath) {
        return [item.key];
      }
      if (item.children) {
        for (const child of item.children) {
          if (child.key === currentPath) {
            return [child.key];
          }
        }
      }
    }
    return ["/home"]; // Default selection
  };

  const getOpenKeys = () => {
    const currentPath = location.pathname;
    // Find parent menu keys that should be opened
    const openKeys = [];
    for (const item of menuItems) {
      if (item.children) {
        for (const child of item.children) {
          if (child.key === currentPath) {
            openKeys.push(item.key);
          }
        }
      }
    }
    return openKeys;
  };

  const [openKeys, setOpenKeys] = useState(getOpenKeys());

  const onOpenChange = (keys) => {
    setOpenKeys(keys);
  };

  const sidebarContent = (
    <>
      <div
        style={{
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          background: token.colorBgContainer,
        }}
      >
        {!collapsed && (
          <div
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              color: token.colorPrimary,
              letterSpacing: "1px",
            }}
          >
            DR DEE
          </div>
        )}
        {collapsed && (
          <div
            style={{
              fontSize: "16px",
              fontWeight: "bold",
              color: token.colorPrimary,
            }}
          >
            DD
          </div>
        )}
      </div>

      <Menu
        theme="light"
        mode="inline"
        selectedKeys={getSelectedKeys()}
        openKeys={openKeys}
        onOpenChange={onOpenChange}
        items={menuItems}
        style={{
          border: "none",
          height: "calc(100vh - 64px)",
          overflow: "auto",
        }}
      />
    </>
  );

  // Mobile: Use Drawer
  if (isMobile) {
    return (
      <Drawer
        title={
          <div
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              color: token.colorPrimary,
              letterSpacing: "1px",
            }}
          >
            DR DEE
          </div>
        }
        placement="left"
        onClose={onClose}
        open={!collapsed}
        bodyStyle={{ padding: 0 }}
        width={250}
        styles={{
          body: { padding: 0 },
        }}
      >
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={getSelectedKeys()}
          openKeys={openKeys}
          onOpenChange={onOpenChange}
          items={menuItems}
          style={{
            border: "none",
            height: "100%",
            overflow: "auto",
          }}
        />
      </Drawer>
    );
  }

  // Desktop: Use Sider
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
