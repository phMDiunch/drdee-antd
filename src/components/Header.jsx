import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Layout,
  Input,
  Badge,
  Avatar,
  Dropdown,
  Button,
  Space,
  Typography,
  theme,
} from "antd";
import {
  SearchOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebase";
import { toast } from "react-toastify";

const { Header: AntHeader } = Layout;
const { Text } = Typography;

export default function Header({ collapsed, onToggle }) {
  const navigate = useNavigate();
  const { token } = theme.useToken();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Đăng xuất thành công!");
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Có lỗi xảy ra khi đăng xuất!");
    }
  };

  const userMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Thông tin cá nhân",
      onClick: () => {
        // Navigate to profile page
        console.log("Navigate to profile");
      },
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "Cài đặt",
      onClick: () => {
        // Navigate to settings page
        console.log("Navigate to settings");
      },
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Đăng xuất",
      onClick: handleLogout,
    },
  ];

  const notificationMenuItems = [
    {
      key: "1",
      label: "Thông báo 1",
    },
    {
      key: "2",
      label: "Thông báo 2",
    },
    {
      key: "3",
      label: "Xem tất cả thông báo",
    },
  ];

  return (
    <AntHeader
      style={{
        padding: "0 24px",
        background: token.colorBgContainer,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}
    >
      {/* Left Section - Logo and Menu Toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onToggle}
          style={{
            fontSize: "16px",
            width: 40,
            height: 40,
          }}
        />
        <div
          onClick={() => navigate("/home")}
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Text
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: token.colorPrimary,
              letterSpacing: "1px",
            }}
          >
            DR DEE
          </Text>
        </div>
      </div>

      {/* Center Section - Search */}
      <div style={{ flex: 1, maxWidth: "500px", margin: "0 24px" }}>
        <Input
          placeholder="Tìm kiếm..."
          prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
          style={{
            borderRadius: token.borderRadius,
            backgroundColor: token.colorBgLayout,
            border: `1px solid ${token.colorBorder}`,
          }}
          size="large"
          onPressEnter={(e) => {
            // Handle search
            console.log("Search:", e.target.value);
          }}
        />
      </div>

      {/* Right Section - Notifications and User */}
      <Space size="middle">
        <Dropdown
          menu={{ items: notificationMenuItems }}
          trigger={["click"]}
          placement="bottomRight"
        >
          <Badge count={5} size="small">
            <Button
              type="text"
              icon={<BellOutlined />}
              style={{
                fontSize: "18px",
                width: 40,
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            />
          </Badge>
        </Dropdown>

        <Dropdown
          menu={{ items: userMenuItems }}
          trigger={["click"]}
          placement="bottomRight"
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: token.borderRadius,
              transition: "background-color 0.2s",
            }}
            className="user-dropdown"
          >
            <Avatar
              size="small"
              icon={<UserOutlined />}
              style={{
                backgroundColor: token.colorPrimary,
              }}
            />
            <Text
              style={{
                fontSize: "14px",
                fontWeight: "500",
                color: token.colorText,
              }}
            >
              Admin
            </Text>
          </div>
        </Dropdown>
      </Space>
    </AntHeader>
  );
}
