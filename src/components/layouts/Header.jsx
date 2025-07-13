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
  Grid,
  Flex,
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
import { toast } from "react-toastify";
import { useAuth } from "../../contexts/AuthContext";

const { Header: AntHeader } = Layout;
const { Text } = Typography;
const { useBreakpoint } = Grid;

export default function Header({ collapsed, onToggle }) {
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const { logout, userData } = useAuth();
  const screens = useBreakpoint();
  const isMobile = !screens.md; // md breakpoint is 768px

  const handleLogout = async () => {
    try {
      await logout();
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
        padding: `0 ${isMobile ? token.paddingMD : token.paddingLG}px`,
        background: token.colorBgContainer,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        position: "sticky",
        top: 0,
        zIndex: 1000,
        boxShadow: token.boxShadowTertiary,
      }}
    >
      <Flex justify="space-between" align="center" style={{ height: "100%" }}>
        {/* Left Section - Logo and Menu Toggle */}
        <Flex align="center" gap={isMobile ? "small" : "middle"}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={onToggle}
            size="large"
          />
          <Button
            type="text"
            onClick={() => navigate("/home")}
            style={{
              padding: 0,
              height: "auto",
              border: "none",
              background: "none",
            }}
          >
            <Text
              style={{
                fontSize: isMobile ? token.fontSizeXL : token.fontSizeHeading4,
                fontWeight: "bold",
                color: token.colorPrimary,
                letterSpacing: "1px",
              }}
            >
              DR DEE
            </Text>
          </Button>
        </Flex>

        {/* Center Section - Search */}
        {!isMobile && (
          <div style={{ flex: 1, maxWidth: "500px", margin: `0 ${token.paddingLG}px` }}>
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
                console.log("Search:", e.target.value);
              }}
            />
          </div>
        )}

        {/* Right Section - Notifications and User */}
        <Space size={isMobile ? "small" : "middle"}>
          {/* Search button for mobile */}
          {isMobile && (
            <Button
              type="text"
              icon={<SearchOutlined />}
              size="large"
              onClick={() => {
                console.log("Mobile search clicked");
              }}
            />
          )}

          <Dropdown
            menu={{ items: notificationMenuItems }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <Badge count={5} size="small">
              <Button
                type="text"
                icon={<BellOutlined />}
                size="large"
              />
            </Badge>
          </Dropdown>

          <Dropdown
            menu={{ items: userMenuItems }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <Button
              type="text"
              style={{
                height: "auto",
                padding: `${token.paddingXS}px ${token.paddingSM}px`,
                borderRadius: token.borderRadius,
              }}
            >
              <Flex align="center" gap={isMobile ? 0 : "small"}>
                <Avatar
                  size="small"
                  icon={<UserOutlined />}
                  style={{
                    backgroundColor: token.colorPrimary,
                  }}
                />
                {!isMobile && (
                  <Text
                    style={{
                      fontSize: token.fontSizeSM,
                      fontWeight: "500",
                      color: token.colorText,
                    }}
                  >
                    {userData ? userData.hoTen : "User"}
                  </Text>
                )}
              </Flex>
            </Button>
          </Dropdown>
        </Space>
      </Flex>
    </AntHeader>
  );
}
