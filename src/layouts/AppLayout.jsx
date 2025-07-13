import React, { useState, useEffect } from "react";
import { Layout, theme } from "antd";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/layouts/Sidebar";
import Header from "../components/layouts/Header";

const { Content } = Layout;

export default function AppLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const { token } = theme.useToken();

    // Responsive sidebar
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            if (mobile) setCollapsed(true);
        };
        window.addEventListener("resize", handleResize);
        handleResize();
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleSidebarClose = () => setCollapsed(true);

    return (
        <Layout style={{ minHeight: "100vh" }}>
            <Sidebar collapsed={collapsed} onClose={handleSidebarClose} isMobile={isMobile} />
            <Layout style={{
                marginLeft: isMobile ? 0 : (collapsed ? 80 : 250),
                transition: "all 0.2s",
            }}>
                <Header collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
                <Content
                    style={{
                        margin: "16px 8px 0",
                        background: token.colorBgLayout,
                        minHeight: "calc(100vh - 70px)",
                    }}
                >
                    {/* Trang nội dung sẽ hiển thị ở đây */}
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
}
