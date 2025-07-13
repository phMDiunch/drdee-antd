import React from "react";
import { Navigate } from "react-router-dom";
import { Spin, theme } from "antd";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute({ children }) {
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

    if (!user) {
        return <Navigate to="/signin" replace />;
    }

    // Chờ userData load xong trước khi cho phép truy cập
    if (!userData) {
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

    // Kiểm tra trạng thái tài khoản
    const { trangThaiTaiKhoan } = userData;

    switch (trangThaiTaiKhoan) {
        case "pending":
            return <Navigate to="/pending" replace />;
        case "reject":
            return <Navigate to="/reject" replace />;
        case "disabled":
            return <Navigate to="/signin" replace />;
        case "approve":
            return children;
        default:
            return <Navigate to="/signin" replace />;
    }
}
