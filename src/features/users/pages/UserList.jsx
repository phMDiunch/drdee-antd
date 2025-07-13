// src/features/users/pages/UserList.jsx
import React from "react";
import {
    Card,
    Table,
    Tag,
    Typography,
    Row,
    Col,
    Statistic,
    Input,
    Select,
    theme,
} from "antd";
import {
    UserOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import {
    ACCOUNT_STATUS,
    getAccountStatusConfig,
    getWorkStatusConfig,
} from "../../../constants";
// 1. Import hook mới
import { useUsers } from "../hooks/useUsers";

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

export default function UserList() {
    // 2. Sử dụng hook để lấy tất cả state và logic cần thiết
    const {
        users, // Đây là `filteredUsers` đã được xử lý từ hook
        loading,
        searchText,
        setSearchText,
        filterStatus,
        setFilterStatus,
        filterRole,
        setFilterRole,
        uniqueRoles,
        statsData,
    } = useUsers();

    const { token } = theme.useToken();
    const navigate = useNavigate();

    const handleEditUser = (userId) => navigate(`/users/edit/${userId}`);

    // 3. Tạo mảng thống kê dựa trên `statsData` từ hook
    const stats = [
        {
            key: ACCOUNT_STATUS.APPROVE,
            title: "Tổng nhân viên",
            value: statsData.approveCount,
            icon: <UserOutlined style={{ color: token.colorPrimary }} />,
            color: token.colorPrimary,
        },
        {
            key: ACCOUNT_STATUS.PENDING,
            title: "Chờ duyệt",
            value: statsData.pendingCount,
            icon: <ClockCircleOutlined style={{ color: "#fa8c16" }} />,
            color: "#fa8c16",
        },
        {
            key: ACCOUNT_STATUS.REJECT,
            title: "Không hoạt động",
            value: statsData.rejectCount,
            icon: <CloseCircleOutlined style={{ color: "#f5222d" }} />,
            color: "#f5222d",
        },
    ];

    // Table columns không thay đổi nhiều
    const columns = [
        {
            title: "Họ và tên",
            dataIndex: "hoTen",
            key: "hoTen",
            width: 180,
            render: (text, record) => (
                <a style={{ fontWeight: "500" }} onClick={() => handleEditUser(record.id)}>
                    {text}
                </a>
            ),
        },
        { title: "Email", dataIndex: "email", key: "email" },
        { title: "Số điện thoại", dataIndex: "soDienThoai", key: "soDienThoai" },
        {
            title: "Chức danh",
            dataIndex: "chucDanh",
            key: "chucDanh",
            render: (text) => (text ? <Tag color="blue">{text}</Tag> : "-"),
        },
        {
            title: "Phòng ban",
            dataIndex: "phongBan",
            key: "phongBan",
            render: (text) => (text ? <Tag color="green">{text}</Tag> : "-"),
        },
        {
            title: "Trạng thái tài khoản",
            dataIndex: "trangThaiTaiKhoan",
            key: "trangThaiTaiKhoan",
            render: (status) => {
                const config = getAccountStatusConfig(status);
                return <Tag color={config.color}>{config.label}</Tag>;
            },
        },
        {
            title: "Trạng thái làm việc",
            dataIndex: "trangThaiLamViec",
            key: "trangThaiLamViec",
            render: (status) => {
                const config = getWorkStatusConfig(status);
                return <Tag color={config.color}>{config.shortLabel}</Tag>;
            },
        },
        {
            title: "Ngày sinh",
            dataIndex: "ngaySinh",
            key: "ngaySinh",
            render: (date) => {
                if (!date) return "-";
                // Firebase timestamp object has a toDate() method
                if (date.toDate) return dayjs(date.toDate()).format("DD/MM/YYYY");
                return dayjs(date).format("DD/MM/YYYY");
            },
        },
    ];

    return (
        <div
            style={{
                padding: 16,
                background: token.colorBgContainer,
                borderRadius: token.borderRadiusLG,
                marginBottom: 12,
                minHeight: "calc(100vh - 110px)",
            }}
        >
            <Title level={4} style={{ marginBottom: 16 }}>
                Quản lý nhân viên
            </Title>

            {/* Thống kê nhỏ gọn */}
            <Row gutter={8} style={{ marginBottom: 8 }}>
                {stats.map((stat) => (
                    <Col xs={8} sm={6} md={4} key={stat.key}>
                        <Card
                            size="small"
                            hoverable
                            bodyStyle={{
                                padding: 8,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                            // 4. Sử dụng hàm setFilterStatus từ hook
                            onClick={() => setFilterStatus(stat.key)}
                            style={{
                                borderColor: filterStatus === stat.key ? stat.color : "#f0f0f0",
                                boxShadow: filterStatus === stat.key ? "0 0 0 2px " + stat.color : undefined,
                                cursor: "pointer",
                                minHeight: 56,
                            }}
                        >
                            <Statistic
                                title={<span style={{ fontSize: 12, fontWeight: 400 }}>{stat.title}</span>}
                                value={stat.value}
                                prefix={stat.icon}
                                valueStyle={{
                                    color: stat.color,
                                    fontSize: 16,
                                    fontWeight: 600,
                                }}
                            />
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Tìm kiếm và lọc chức danh */}
            <Row gutter={8} align="middle" style={{ marginBottom: 8 }}>
                <Col xs={16} sm={8} md={6}>
                    <Search
                        placeholder="Tìm kiếm tên..."
                        allowClear
                        size="middle"
                        value={searchText}
                        // 5. Sử dụng hàm setSearchText từ hook
                        onChange={(e) => setSearchText(e.target.value)}
                        style={{ width: "100%" }}
                    />
                </Col>
                <Col xs={8} sm={6} md={4}>
                    <Select
                        placeholder="Chức danh"
                        style={{ width: "100%" }}
                        value={filterRole}
                        // 6. Sử dụng hàm setFilterRole từ hook
                        onChange={setFilterRole}
                        allowClear
                        size="middle"
                    >
                        <Option value="all">Tất cả</Option>
                        {/* 7. Dùng `uniqueRoles` từ hook */}
                        {uniqueRoles.map((role) => (
                            <Option key={role} value={role}>
                                {role}
                            </Option>
                        ))}
                    </Select>
                </Col>
            </Row>

            {/* Table */}
            <Table
                columns={columns}
                // 8. Dùng `users` (đã lọc) từ hook
                dataSource={users}
                loading={loading}
                rowKey="id"
                scroll={{ x: 900 }}
                pagination={{
                    showSizeChanger: false,
                    pageSize: 10,
                    size: "small",
                    showTotal: (total, range) => `${range[0]}-${range[1]} / ${total}`,
                }}
                size="small"
                style={{ background: "white", borderRadius: 8, marginTop: 8 }}
            />
        </div>
    );
}