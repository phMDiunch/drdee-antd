import React, { useState, useEffect } from "react";
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
    SearchOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import {
    ACCOUNT_STATUS,
    getAccountStatusConfig,
    getWorkStatusConfig,
} from "../../constants";
import { fetchUsers } from "../../services/userServices";

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

export default function UserList() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterRole, setFilterRole] = useState("all");
    const { token } = theme.useToken();
    const navigate = useNavigate();

    // Fetch users từ service
    useEffect(() => {
        const loadUsers = async () => {
            setLoading(true);
            try {
                const data = await fetchUsers();
                setUsers(data);
            } catch (error) {
                toast.error("Có lỗi xảy ra khi tải danh sách nhân viên");
            } finally {
                setLoading(false);
            }
        };
        loadUsers();
    }, []);

    const handleEditUser = (userId) => navigate(`/users/edit/${userId}`);

    // Lọc chức danh duy nhất
    const uniqueRoles = Array.from(new Set(users.map(u => u.chucDanh).filter(Boolean)));

    // Filter
    const filteredUsers = users.filter(user => {
        const matchSearch = searchText
            ? user.hoTen?.toLowerCase().includes(searchText.toLowerCase())
            : true;
        const matchStatus = filterStatus === "all" || user.trangThaiTaiKhoan === filterStatus;
        const matchRole = filterRole === "all" || user.chucDanh === filterRole;
        return matchSearch && matchStatus && matchRole;
    });

    // Thống kê theo trạng thái tài khoản
    const approveCount = users.filter(u => u.trangThaiTaiKhoan === ACCOUNT_STATUS.APPROVE).length;
    const pendingCount = users.filter(u => u.trangThaiTaiKhoan === ACCOUNT_STATUS.PENDING).length;
    const rejectCount = users.filter(u => u.trangThaiTaiKhoan === ACCOUNT_STATUS.REJECT).length;

    // Click card để lọc
    const handleStatClick = (status) => setFilterStatus(status);

    // 3 thống kê nhỏ gọn
    const stats = [
        {
            key: ACCOUNT_STATUS.APPROVE,
            title: "Tổng nhân viên",
            value: approveCount,
            icon: <UserOutlined style={{ color: token.colorPrimary }} />,
            color: token.colorPrimary,
        },
        {
            key: ACCOUNT_STATUS.PENDING,
            title: "Chờ duyệt",
            value: pendingCount,
            icon: <ClockCircleOutlined style={{ color: "#fa8c16" }} />,
            color: "#fa8c16",
        },
        {
            key: ACCOUNT_STATUS.REJECT,
            title: "Không hoạt động",
            value: rejectCount,
            icon: <CloseCircleOutlined style={{ color: "#f5222d" }} />,
            color: "#f5222d",
        },
    ];

    // Table columns
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
        { title: "email", dataIndex: "email", key: "email" },
        { title: "Số điện thoại", dataIndex: "soDienThoai", key: "soDienThoai" },
        {
            title: "Chức danh",
            dataIndex: "chucDanh",
            key: "chucDanh",
            render: (text) => text ? <Tag color="blue">{text}</Tag> : "-",
        },
        {
            title: "Phòng ban",
            dataIndex: "phongBan",
            key: "phongBan",
            render: (text) => text ? <Tag color="green">{text}</Tag> : "-",
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
            <Title level={4} style={{ marginBottom: 16 }}>Quản lý nhân viên</Title>
            {/* Thống kê nhỏ gọn */}
            <Row gutter={8} style={{ marginBottom: 8 }}>
                {stats.map(stat => (
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
                            onClick={() => handleStatClick(stat.key)}
                            style={{
                                borderColor: filterStatus === stat.key ? stat.color : "#f0f0f0",
                                boxShadow: filterStatus === stat.key ? "0 0 0 2px " + stat.color : undefined,
                                cursor: "pointer",
                                minHeight: 56,
                            }}
                        >
                            <Statistic
                                title={
                                    <span style={{ fontSize: 12, fontWeight: 400 }}>{stat.title}</span>
                                }
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
                        onChange={e => setSearchText(e.target.value)}
                        style={{ width: "100%" }}
                    />
                </Col>
                <Col xs={8} sm={6} md={4}>
                    <Select
                        placeholder="Chức danh"
                        style={{ width: "100%" }}
                        value={filterRole}
                        onChange={setFilterRole}
                        allowClear
                        size="middle"
                    >
                        <Option value="all">Tất cả</Option>
                        {uniqueRoles.map(role => (
                            <Option key={role} value={role}>{role}</Option>
                        ))}
                    </Select>
                </Col>
            </Row>
            {/* Table */}
            <Table
                columns={columns}
                dataSource={filteredUsers}
                loading={loading}
                rowKey="id"
                scroll={{ x: 900 }}
                pagination={{
                    showSizeChanger: false,
                    pageSize: 10,
                    size: "small",
                    showTotal: (total, range) => `${range[0]}-${range[1]}/${total}`,
                }}
                size="small"
                style={{ background: "white", borderRadius: 8, marginTop: 8 }}
            />
        </div>
    );
}
