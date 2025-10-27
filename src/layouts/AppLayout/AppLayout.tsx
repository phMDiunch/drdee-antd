// src/layouts/AppLayout/AppLayout.tsx

"use client";

import React, { useMemo, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Layout, theme } from "antd";
import type { MenuProps } from "antd";
import AppHeader from "./AppHeader";
import SidebarNav from "./SidebarNav";
import { menuItems } from "./menu.config";
import { APP_LAYOUT } from "./theme";
import type { UserCore } from "@/shared/types/user";

const { Content } = Layout;

type MenuItem = NonNullable<NonNullable<MenuProps["items"]>[number]>;

type Props = {
  children: React.ReactNode;
  /** được SSR inject từ (private)/layout.tsx */
  currentUser?: UserCore;
};

function buildIndex(items: MenuItem[]) {
  const parentOf = new Map<string, string | null>();
  const allKeys = new Set<string>();
  const walk = (nodes: MenuItem[], parentKey: string | null) => {
    nodes.forEach((n: MenuItem) => {
      if (!n) return;
      const key = n.key as string;
      allKeys.add(key);
      parentOf.set(key, parentKey);
      // Type guard: check if item has children property (not a divider)
      const children = ("children" in n ? n.children : undefined) as
        | MenuItem[]
        | undefined;
      if (children?.length) walk(children, key);
    });
  };
  walk(items, null);
  return { parentOf, allKeys };
}

function findSelectedKey(
  pathname: string,
  allKeys: Set<string>
): string | undefined {
  if (allKeys.has(pathname)) return pathname;
  const segs = pathname.split("/").filter(Boolean);
  for (let i = segs.length; i > 0; i--) {
    const candidate = "/" + segs.slice(0, i).join("/");
    if (allKeys.has(candidate)) return candidate;
  }
  return undefined;
}

function getOpenKeys(
  key: string | undefined,
  parentOf: Map<string, string | null>
): string[] {
  const chain: string[] = [];
  let cur = key ? parentOf.get(key) ?? null : null;
  while (cur) {
    chain.unshift(cur);
    cur = parentOf.get(cur) ?? null;
  }
  return chain;
}

export default function AppLayout({ children, currentUser }: Props) {
  const { token } = theme.useToken();
  const router = useRouter();
  const pathname = usePathname() || "/";

  const { parentOf, allKeys } = useMemo(
    () => buildIndex(menuItems as MenuItem[]),
    []
  );
  const selectedKey = useMemo(
    () => findSelectedKey(pathname, allKeys),
    [pathname, allKeys]
  );

  const [collapsed, setCollapsed] = useState(false);
  const [openKeys, setOpenKeys] = useState<string[]>([]);

  useEffect(() => {
    setOpenKeys(getOpenKeys(selectedKey, parentOf));
  }, [selectedKey, parentOf]);

  const onMenuClick: MenuProps["onClick"] = (info) => {
    if (info.key.startsWith("/")) router.push(info.key);
  };

  return (
    <Layout style={{ height: "100vh" }}>
      <AppHeader
        currentUser={currentUser}
        collapsed={collapsed}
        onToggleSider={() => setCollapsed((c) => !c)}
      />

      <Layout
        style={{
          height: `calc(100vh - ${APP_LAYOUT.HEADER_HEIGHT}px)`,
          overflow: "hidden",
          background: token.colorBgLayout,
        }}
      >
        <SidebarNav
          items={menuItems}
          selectedKeys={selectedKey ? [selectedKey] : []}
          openKeys={openKeys}
          onOpenChange={setOpenKeys}
          collapsed={collapsed}
          onCollapse={setCollapsed}
          onClick={onMenuClick}
        />

        <Layout style={{ height: "100%", overflow: "hidden" }}>
          {/* Breadcrumb sẽ bổ sung sau */}
          <Content
            style={{
              height: "100%",
              overflow: "auto",
              padding: token.paddingLG,
            }}
          >
            <div
              style={{
                background: token.colorBgContainer,
                borderRadius: token.borderRadiusLG,
                padding: token.paddingLG,
                minHeight: 280,
                boxShadow: token.boxShadowTertiary,
              }}
            >
              {children}
            </div>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}
