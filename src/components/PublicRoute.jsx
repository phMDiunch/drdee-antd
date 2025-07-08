import React from "react";
import { Navigate } from "react-router-dom";
import { Spin, theme } from "antd";
import { useAuth } from "../contexts/AuthContext";

export default function PublicRoute({ children }) {
    const { user, userData, loading } = useAuth();
    const { token } = theme.useToken();

    if (loading) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryBg} 100%)`,
                }}
            >
                <Spin size="large" />
            </div>
        );
    }

    if (user && userData) {
        const { trangThaiTaiKhoan } = userData;

        switch (trangThaiTaiKhoan) {
            case "pending":
                return <Navigate to="/pending" replace />;
            case "reject":
                return <Navigate to="/reject" replace />;
            case "disabled":
                return children; // Cho phép truy cập trang login
            case "approve":
                return <Navigate to="/home" replace />;
            default:
                return children;
        }
    }

    return children;
}
