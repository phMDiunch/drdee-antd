import React, { useEffect, useState, useMemo } from "react";
import { Button, Select, Space, Tag, Collapse, Typography, Empty, Spin, Row, Col, Card } from "antd";
import { PlusOutlined, PhoneOutlined } from "@ant-design/icons";
import { getLeads, addLead } from "../services/leadServices";
import { LEAD_STATUS_OPTIONS, CHANNEL_OPTIONS } from "../../../constants";
import LeadAddModal from "../components/LeadAddModal";
import { useAuth } from "../../../contexts/AuthContext";

const { Panel } = Collapse;
const { Paragraph, Text } = Typography;

// Helper loại bỏ undefined field
function cleanObj(obj) {
    return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));
}

// Group lead theo tháng
function groupLeadsByMonth(leads) {
    const groups = {};
    leads.forEach((lead) => {
        const dateStr = lead.ngayLaySo || lead.thoiGianTiepNhan;
        if (!dateStr) return;
        const date = new Date(dateStr);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(lead);
    });
    return Object.entries(groups)
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([key, items]) => ({ key, items }));
}

// "2025-07" -> "Tháng 7/2025"
function formatMonth(key) {
    const [year, month] = key.split("-");
    return `Tháng ${parseInt(month)}/${year}`;
}

// Mock API get interaction list
async function getInteractionsByLeadId(leadId) {
    return [
        { id: "1", thoiGian: "2025-07-01", noiDung: "Gọi tư vấn lần 1", nhanVien: "Nguyễn A" },
        { id: "2", thoiGian: "2025-07-03", noiDung: "Nhắn Zalo tư vấn", nhanVien: "Nguyễn A" }
    ];
}

function LeadInteractions({ leadId }) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    useEffect(() => {
        let cancel = false;
        setLoading(true);
        getInteractionsByLeadId(leadId).then(rs => {
            if (!cancel) {
                setData(rs);
                setLoading(false);
            }
        });
        return () => { cancel = true; };
    }, [leadId]);
    if (loading) return <Spin size="small" />;
    if (!data.length) return <Empty description="Chưa có lịch sử chăm sóc" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
    return (
        <div style={{ margin: "12px 0" }}>
            {data.map(item => (
                <div key={item.id} style={{ marginBottom: 10, paddingBottom: 6, borderBottom: "1px dashed #eee" }}>
                    <Space direction="vertical" size={0}>
                        <span><b>{item.thoiGian}:</b> {item.noiDung}</span>
                        <span style={{ fontSize: 12, color: "#888" }}>
                            Nhân viên: {item.nhanVien}
                        </span>
                    </Space>
                </div>
            ))}
        </div>
    );
}

export default function LeadList({ onViewDetail }) {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [adding, setAdding] = useState(false);

    const { user, userData, loading: loadingAuth } = useAuth();
    const [status, setStatus] = useState();
    const [channel, setChannel] = useState();

    useEffect(() => { fetchLeads(); }, [status, channel]);
    if (loadingAuth) return null;
    if (!user) return null;

    const fetchLeads = async () => {
        setLoading(true);
        const data = await getLeads({ status, channel });
        setLeads(data);
        setLoading(false);
    };

    const handleAddLead = async (values) => {
        setAdding(true);
        try {
            const saleOnlineId = userData?.id || user.uid;
            const saleOnlineName =
                userData?.tenNhanVien ||
                user.displayName ||
                user.email ||
                userData?.email;
            if (!saleOnlineId) return false;
            const fullData = {
                ...values,
                trangThai: "new",
                saleOnlineId,
                saleOnlineName,
            };
            const cleanData = cleanObj(fullData);

            await addLead(cleanData);
            setModalVisible(false);
            fetchLeads();
            return true;
        } catch {
            return false;
        } finally {
            setAdding(false);
        }
    };

    const renderStatus = (status) => {
        const option = LEAD_STATUS_OPTIONS.find((opt) => opt.value === status);
        return <Tag color="blue">{option?.label || status}</Tag>;
    };

    const leadsByMonth = useMemo(() => groupLeadsByMonth(leads), [leads]);

    return (
        <div>
            <Space style={{ marginBottom: 16, flexWrap: "wrap" }}>
                <Select
                    placeholder="Trạng thái"
                    value={status}
                    allowClear
                    onChange={setStatus}
                    options={LEAD_STATUS_OPTIONS}
                    style={{ minWidth: 150 }}
                />
                <Select
                    placeholder="Kênh nguồn"
                    value={channel}
                    allowClear
                    onChange={setChannel}
                    options={CHANNEL_OPTIONS}
                    style={{ minWidth: 150 }}
                />
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setModalVisible(true)}
                >
                    Thêm lead mới
                </Button>
            </Space>
            {loading ? (
                <Spin />
            ) : leadsByMonth.length === 0 ? (
                <Empty description="Không có lead nào" />
            ) : (
                <Collapse accordion ghost>
                    {leadsByMonth.map((group) => (
                        <Panel
                            header={
                                <Space>
                                    <b>{formatMonth(group.key)}</b>
                                    <Tag color="geekblue">{group.items.length} khách</Tag>
                                </Space>
                            }
                            key={group.key}
                        >
                            <Row gutter={[24, 24]}>
                                {group.items.map((lead) => (
                                    <Col xs={24} sm={12} md={8} lg={6} key={lead.id}>
                                        <Card
                                            style={{
                                                borderRadius: 14,
                                                boxShadow: "0 2px 16px 0 #d4e3f5b3",
                                                border: "1.5px solid #c6e1ff",
                                                background: "#fafdff",
                                                minHeight: 240,
                                                transition: "box-shadow .2s",
                                                cursor: "pointer"
                                            }}
                                            bodyStyle={{ padding: 20 }}
                                            hoverable
                                            title={
                                                <Space>
                                                    <Text strong style={{ fontSize: 17, color: "#2465b3" }}>
                                                        {lead.tenKhach}
                                                    </Text>
                                                    <Tag icon={<PhoneOutlined />} color="blue" style={{ fontSize: 14 }}>
                                                        {lead.soDienThoai}
                                                    </Tag>
                                                </Space>
                                            }
                                            extra={
                                                <Button
                                                    type="link"
                                                    size="small"
                                                    style={{ padding: 0 }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onViewDetail && onViewDetail(lead.id);
                                                    }}
                                                >
                                                    Xem chi tiết
                                                </Button>
                                            }
                                        >
                                            <div style={{ marginBottom: 6 }}>
                                                {renderStatus(lead.trangThai)}
                                                <Tag color="default" style={{ marginLeft: 8 }}>
                                                    {lead.kenhNguon}
                                                </Tag>
                                            </div>
                                            <Paragraph style={{ margin: "2px 0" }}>
                                                <Text type="secondary">Người CS:</Text> {lead.saleOnlineName}
                                            </Paragraph>
                                            {lead.dichVuQuanTam && (
                                                <Paragraph style={{ margin: "2px 0" }}>
                                                    <Text type="secondary">Dịch vụ:</Text> {Array.isArray(lead.dichVuQuanTam)
                                                        ? lead.dichVuQuanTam.join(", ") : lead.dichVuQuanTam}
                                                </Paragraph>
                                            )}
                                            {lead.khuVuc && (
                                                <Paragraph style={{ margin: "2px 0" }}>
                                                    <Text type="secondary">Khu vực:</Text> {lead.khuVuc}
                                                </Paragraph>
                                            )}
                                            {lead.ngayLaySo && (
                                                <Paragraph style={{ margin: "2px 0" }}>
                                                    <Text type="secondary">Ngày lấy số:</Text>{" "}
                                                    {new Date(lead.ngayLaySo).toLocaleDateString()}
                                                </Paragraph>
                                            )}
                                            {lead.ghiChu && (
                                                <Paragraph style={{ margin: "2px 0" }}>
                                                    <Text type="secondary">Ghi chú:</Text> {lead.ghiChu}
                                                </Paragraph>
                                            )}

                                            <div style={{
                                                marginTop: 14,
                                                borderTop: "1px solid #eaeaea",
                                                paddingTop: 10,
                                            }}>
                                                <Text strong style={{ color: "#1976d2", fontSize: 15 }}>Lịch sử chăm sóc</Text>
                                                <LeadInteractions leadId={lead.id} />
                                            </div>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        </Panel>
                    ))}
                </Collapse>
            )}
            <LeadAddModal
                visible={modalVisible}
                onCancel={() => setModalVisible(false)}
                onSubmit={handleAddLead}
                loading={adding}
                existingPhones={leads.map(l => l.soDienThoai)}
            />
        </div>
    );
}
