// src/features/leads/pages/LeadList.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Table, Tag, Typography, Row, Col, Input, Select, Button, Card, Statistic, theme } from "antd";
import { PhoneOutlined, CalendarOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from "react-router-dom";

// Hooks
import { useLeads } from "../hooks/useLeads";
import { useDebounce } from "../../../hooks/useDebounce";
import { useLeadAnalytics } from "../hooks/useLeadAnalytics";

// Services & Constants
import { fetchUsers } from "../../users/services/userServices";
import { DICH_VU_OPTIONS } from "../constants/leadOptions";
import { LEAD_STATUS_OPTIONS, getLeadStatusConfig } from "../constants/leadStatus";
import { LEAD_POTENTIAL_OPTIONS, getLeadPotentialConfig } from "../constants/leadPotential";


const { Title } = Typography;
const { Search } = Input;

const DATE_RANGE_OPTIONS = [
    { label: 'Tháng này', value: 'this_month' },
    { label: '3 tháng qua', value: 'last_3_months' },
    { label: '6 tháng qua', value: 'last_6_months' },
    { label: '1 năm qua', value: 'last_1_year' },
];

export default function LeadList() {
    const {
        leads,
        loading: loadingTable,
        setSearch,
        filterStatus,
        setFilterStatus,
        filterPotential,
        setFilterPotential,
    } = useLeads();
    console.log("Leads data:", leads);
    const {
        stats,
        loading: loadingStats,
        filterDateRange,
        setFilterDateRange,
        filterService,
        setFilterService,
        filterEmployee,
        setFilterEmployee,
    } = useLeadAnalytics();

    const [employees, setEmployees] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const { token } = theme.useToken();
    const navigate = useNavigate();

    useEffect(() => {
        fetchUsers().then(setEmployees).catch(console.error);
    }, []);

    useEffect(() => {
        setSearch(debouncedSearchTerm);
    }, [debouncedSearchTerm, setSearch]);

    const employeeOptions = useMemo(() =>
        employees.map(emp => ({ label: emp.hoTen, value: emp.id })),
        [employees]);

    const columns = [
        {
            title: "Họ và tên",
            dataIndex: "hoTen",
            key: "hoTen",
            render: (text, record) => (
                <a style={{ fontWeight: 500 }} onClick={() => navigate(`/leads/${record.id}/edit`)}>
                    {text}
                </a>
            ),
        },
        { title: "SĐT", dataIndex: "soDienThoai", key: "soDienThoai" },
        {
            title: "Trạng thái",
            dataIndex: "trangThaiLead",
            key: "trangThaiLead",
            render: (status) => {
                const config = getLeadStatusConfig(status);
                return <Tag color={config.color}>{config.label}</Tag>;
            },
        },
        {
            title: "Tiềm năng",
            dataIndex: "tiemNangLead",
            key: "tiemNangLead",
            render: (potential) => {
                const config = getLeadPotentialConfig(potential);
                return <Tag color={config.color}>{config.label}</Tag>;
            },
        },
        {
            title: "Dịch vụ quan tâm",
            dataIndex: "dichVuQuanTam",
            key: "dichVuQuanTam",
            render: (arr) => (arr ? <Tag key={arr}>{arr}</Tag> : null),
        },
        { title: "Tỉnh/TP", dataIndex: "tinhThanhPho", key: "tinhThanhPho" },
        { title: "Ngày đặt lịch", dataIndex: "ngayDatLich", key: "ngayDatLich" },
        { title: "Ngày đến", dataIndex: "ngayDen", key: "ngayDen" },
    ];

    const statCards = [
        { key: 'total', title: 'Số điện thoại', value: stats.total, icon: <PhoneOutlined style={{ color: token.colorPrimary }} />, color: token.colorPrimary },
        { key: 'scheduled', title: 'Số đặt lịch', value: stats.scheduled, icon: <CalendarOutlined style={{ color: '#13c2c2' }} />, color: '#13c2c2' },
        { key: 'arrived', title: 'Số khách đến', value: stats.arrived, icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />, color: '#52c41a' },
    ];

    return (
        <div style={{ padding: 16, background: "#fff", borderRadius: 8 }}>
            <Title level={4}>Thống kê Leads</Title>
            <Card loading={loadingStats} style={{ marginBottom: 16 }}>
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={8}>
                        <Select
                            value={filterDateRange}
                            onChange={setFilterDateRange}
                            options={DATE_RANGE_OPTIONS}
                            style={{ width: '100%' }}
                        />
                    </Col>
                    <Col xs={24} sm={8}>
                        <Select
                            placeholder="Lọc theo dịch vụ"
                            allowClear
                            style={{ width: '100%' }}
                            value={filterService}
                            onChange={setFilterService}
                            options={DICH_VU_OPTIONS}
                        />
                    </Col>
                    <Col xs={24} sm={8}>
                        <Select
                            placeholder="Lọc theo nhân viên"
                            allowClear
                            style={{ width: '100%' }}
                            value={filterEmployee}
                            onChange={setFilterEmployee}
                            options={employeeOptions}
                            showSearch
                            filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                        />
                    </Col>
                </Row>
                <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                    {statCards.map(stat => (
                        <Col xs={24} sm={8} key={stat.key}>
                            <Statistic
                                title={stat.title}
                                value={stat.value}
                                prefix={stat.icon}
                                valueStyle={{ color: stat.color, fontWeight: 600 }}
                            />
                        </Col>
                    ))}
                </Row>
            </Card>

            <Row justify="space-between" align="middle" style={{ marginBottom: 8 }}>
                <Col>
                    <Title level={4}>Quản lý khách hàng tiềm năng (Lead)</Title>
                </Col>
                <Col>
                    <Button type="primary" onClick={() => navigate("/leads/create")}>
                        Thêm mới lead
                    </Button>
                </Col>
            </Row>
            <Row gutter={8} style={{ marginBottom: 8 }}>
                <Col>
                    <Search
                        placeholder="Tìm kiếm tên/SĐT..."
                        allowClear
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: 200 }}
                    />
                </Col>
                <Col>
                    <Select
                        placeholder="Trạng thái"
                        style={{ width: 150 }}
                        value={filterStatus}
                        onChange={setFilterStatus}
                        allowClear
                        options={LEAD_STATUS_OPTIONS}
                    />
                </Col>
                <Col>
                    <Select
                        placeholder="Tiềm năng"
                        style={{ width: 150 }}
                        value={filterPotential}
                        onChange={setFilterPotential}
                        allowClear
                        options={LEAD_POTENTIAL_OPTIONS}
                    />
                </Col>
            </Row>
            <Table
                columns={columns}
                dataSource={leads}
                loading={loadingTable}
                rowKey="id"
                pagination={{ pageSize: 10 }}
            />
        </div>
    );
}