// src/features/users/components/UserEditHeader.jsx
import React from "react";
import { Row, Col, Space, Button, Typography, Tag, Grid, Tooltip } from "antd";
import {
    ArrowLeftOutlined,
    EditOutlined,
    EyeOutlined,
    SaveOutlined,
} from "@ant-design/icons";
import { getAccountStatusConfig } from "../../../constants";

const { Title } = Typography;
const { useBreakpoint } = Grid; // 1. Import hook useBreakpoint

export default function UserEditHeader({
    isViewMode,
    userData,
    saving,
    toggleViewMode,
    onSave,
    onBack,
}) {
    const screens = useBreakpoint(); // 2. Lấy thông tin màn hình hiện tại

    // Xác định là màn hình nhỏ (từ md trở xuống coi là nhỏ)
    const isMobile = !screens.md;

    const pageTitle = isViewMode ? "Xem thông tin" : "Chỉnh sửa";
    const accountStatusConfig = userData ? getAccountStatusConfig(userData.trangThaiTaiKhoan) : {};

    return (
        <Row
            justify="space-between"
            align="middle"
            gutter={[16, 16]} // Thêm gutter để có khoảng cách khi các item bị xuống dòng
            style={{ marginBottom: 24 }}
        >
            {/* Cột bên trái: Quay lại, Tiêu đề, Trạng thái */}
            <Col>
                <Space align="center" wrap> {/* Thêm wrap để tự xuống dòng nếu không đủ chỗ */}
                    <Tooltip title="Quay lại danh sách">
                        <Button
                            icon={<ArrowLeftOutlined />}
                            onClick={onBack}
                        >
                            {/* 3. Ẩn chữ trên màn hình nhỏ */}
                            {isMobile ? null : "Quay lại"}
                        </Button>
                    </Tooltip>
                    <Title level={4} style={{ margin: 0, whiteSpace: 'nowrap' }}>
                        {/* 4. Rút gọn tiêu đề trên màn hình nhỏ */}
                        {isMobile ? pageTitle : `${pageTitle} nhân viên`}
                    </Title>
                    {userData && (
                        <Tag color={accountStatusConfig.color} icon={accountStatusConfig.icon}>
                            {accountStatusConfig.label}
                        </Tag>
                    )}
                </Space>
            </Col>

            {/* Cột bên phải: Các nút hành động */}
            <Col>
                <Space>
                    <Tooltip title={isViewMode ? "Chuyển sang chế độ sửa" : "Chuyển sang chế độ xem"}>
                        <Button
                            icon={isViewMode ? <EditOutlined /> : <EyeOutlined />}
                            onClick={toggleViewMode}
                        >
                            {isMobile ? null : (isViewMode ? "Chỉnh sửa" : "Chế độ xem")}
                        </Button>
                    </Tooltip>

                    {!isViewMode && (
                        <Tooltip title="Lưu lại các thay đổi">
                            <Button
                                type="primary"
                                icon={<SaveOutlined />}
                                loading={saving}
                                onClick={onSave}
                            >
                                {isMobile ? null : "Lưu thay đổi"}
                            </Button>
                        </Tooltip>
                    )}
                </Space>
            </Col>
        </Row>
    );
}