// src/layouts/AppLayout/AppHeader.tsx

"use client";
import "@ant-design/v5-patch-for-react-19";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Layout,
  Space,
  Typography,
  theme,
  Input,
  Badge,
  Avatar,
  Dropdown,
  Button,
  Tag,
  Grid,
  Tooltip,
  Modal,
} from "antd";
import {
  BellOutlined,
  MenuOutlined,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { APP_LAYOUT } from "./theme";
import type { UserCore } from "@/shared/types/user";
import { useLogout } from "@/features/auth/hooks/useLogout";

const { Header } = Layout;
const { Text } = Typography;
const { useBreakpoint } = Grid;

function roleColor(role: string): string | undefined {
  const r = role.toLowerCase();
  if (r === "admin") return "red";
  if (r === "manager") return "gold";
  if (r === "employee") return "blue";
  return undefined;
}

type Props = {
  currentUser?: UserCore;
  collapsed?: boolean;
  onToggleSider?: () => void;
};

export default function AppHeader({
  currentUser,
  collapsed,
  onToggleSider,
}: Props) {
  const { token } = theme.useToken();
  const router = useRouter();
  const screens = useBreakpoint();
  const isMdUp = !!screens.lg;

  const displayName = useMemo(
    () =>
      (currentUser?.fullName && currentUser.fullName.trim()) ||
      (currentUser?.email && currentUser.email.trim()) ||
      "Người dùng",
    [currentUser?.fullName, currentUser?.email]
  );

  const roleLabel = currentUser?.role ?? "unknown";
  const [searchOpen, setSearchOpen] = useState(false);

  const onSearch = (value: string) => {
    const q = value?.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
    setSearchOpen(false);
  };

  const logout = useLogout();

  const userMenu: MenuProps["items"] = [
    { key: "profile", label: "Hồ sơ" },
    { type: "divider" },
    {
      key: "logout",
      label: logout.isPending ? "Đang đăng xuất..." : "Đăng xuất",
      disabled: logout.isPending,
    },
  ];

  const onUserClick: MenuProps["onClick"] = async (info) => {
    if (info.key === "logout") {
      logout.mutate();
      return;
    }
    if (info.key === "profile") {
      router.push("/settings/profile");
    }
  };

  return (
    <>
      <Header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          width: "100%",
          paddingInline: 12,
          background: token.colorBgContainer,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: APP_LAYOUT.HEADER_HEIGHT,
          lineHeight: `${APP_LAYOUT.HEADER_HEIGHT}px`,
          gap: 8,
        }}
      >
        <Space align="center" size={8} style={{ minWidth: isMdUp ? 200 : 120 }}>
          <Tooltip title={collapsed ? "Mở menu" : "Thu gọn menu"}>
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={onToggleSider}
            />
          </Tooltip>

          <Link href="/dashboard" style={{ textDecoration: "none" }}>
            <Text strong style={{ fontSize: 16 }}>
              {isMdUp ? "Nha khoa DR DEE" : "DR DEE"}
            </Text>
          </Link>
        </Space>

        {isMdUp ? (
          <Input.Search
            placeholder="Tìm khách hàng, lịch hẹn, phiếu thu..."
            onSearch={onSearch}
            enterButton
            allowClear
            style={{ flex: 1, maxWidth: 400, minWidth: 160 }}
          />
        ) : (
          <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <Tooltip title="Tìm kiếm">
              <Button
                type="text"
                icon={<SearchOutlined />}
                onClick={() => setSearchOpen(true)}
              />
            </Tooltip>
          </div>
        )}

        <Space
          align="center"
          size={isMdUp ? 12 : 4}
          style={{ minWidth: isMdUp ? 220 : 90, justifyContent: "flex-end" }}
        >
          <Badge count={3} size="small">
            <Button type="text" shape="circle" icon={<BellOutlined />} />
          </Badge>

          <Dropdown
            trigger={["click"]}
            placement="bottomRight"
            menu={{ items: userMenu, onClick: onUserClick }}
          >
            {isMdUp ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  maxWidth: 260,
                }}
              >
                <Avatar
                  size={32}
                  src={currentUser?.avatarUrl}
                  icon={!currentUser?.avatarUrl ? <UserOutlined /> : undefined}
                />
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    minWidth: 0,
                  }}
                >
                  <Text
                    strong
                    ellipsis={{ tooltip: displayName }}
                    style={{ maxWidth: 140 }}
                  >
                    {displayName}
                  </Text>
                  <Tag
                    color={roleColor(roleLabel)}
                    style={{ marginInlineStart: 0 }}
                  >
                    {roleLabel}
                  </Tag>
                </div>
              </div>
            ) : (
              <Avatar
                size={32}
                src={currentUser?.avatarUrl}
                icon={!currentUser?.avatarUrl ? <UserOutlined /> : undefined}
                style={{ cursor: "pointer" }}
              />
            )}
          </Dropdown>
        </Space>
      </Header>

      <Modal
        open={searchOpen}
        onCancel={() => setSearchOpen(false)}
        footer={null}
        width={isMdUp ? 640 : "90%"}
        title="Tìm kiếm"
        centered
      >
        <Input.Search
          placeholder="Nhập từ khóa..."
          autoFocus
          allowClear
          enterButton
          onSearch={onSearch}
        />
      </Modal>
    </>
  );
}
