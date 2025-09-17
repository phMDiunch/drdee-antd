// src/layouts/AppLayout/SidebarNav.tsx

"use client";

import React from "react";
import { Layout, Menu, theme } from "antd";
import type { MenuProps } from "antd";
import { APP_LAYOUT } from "./theme";

const { Sider } = Layout;

type Props = {
  items: Required<MenuProps>["items"];
  selectedKeys: string[];
  openKeys: string[];
  onOpenChange: (keys: string[]) => void;
  collapsed: boolean;
  onCollapse: (v: boolean) => void;
  onClick: MenuProps["onClick"];
};

export default function SidebarNav(props: Props) {
  const { token } = theme.useToken();

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={props.collapsed}
      onCollapse={props.onCollapse}
      width={APP_LAYOUT.SIDER_WIDTH}
      collapsedWidth={APP_LAYOUT.SIDER_COLLAPSED_WIDTH}
      breakpoint="lg"
      style={{
        background: token.colorBgContainer,
        borderRight: `1px solid ${token.colorBorderSecondary}`,
        height: "100%",
        overflow: "auto", // Sider cuộn riêng
      }}
    >
      <Menu
        mode="inline"
        selectedKeys={props.selectedKeys}
        openKeys={props.openKeys}
        onOpenChange={(keys) => props.onOpenChange(keys as string[])}
        onClick={props.onClick}
        items={props.items}
        style={{ borderInlineEnd: "none", padding: 8 }}
      />
    </Sider>
  );
}
