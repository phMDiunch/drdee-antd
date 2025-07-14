// src/features/leads/components/LeadForm.jsx
import React from "react";
import { Form, Input, Select, Button, Row, Col, Card } from "antd";
import { DICH_VU_OPTIONS, KENH_TUONG_TAC_OPTIONS } from "../constants/leadOptions";
import { LEAD_POTENTIAL_OPTIONS } from "../constants/leadPotential";
import { PROVINCE_OPTIONS } from "../constants/locationOptions";

export default function LeadForm({
    form,
    initialValues = {},
    onSubmit,
    loading,
    isEdit = false,
    onBack,
    onDelete,
    checkPhoneExists,
    currentLeadId = null,
    salesStaffOptions = [],
}) {
    const validatePhone = async (_, value) => {
        if (!value) return Promise.reject("Vui lòng nhập số điện thoại!");
        if (!/^\d{8,13}$/.test(value))
            return Promise.reject("Số điện thoại không hợp lệ!");

        if (checkPhoneExists) {
            const exists = await checkPhoneExists(value, isEdit ? currentLeadId : null);
            if (exists) return Promise.reject("Số điện thoại đã tồn tại!");
        }

        return Promise.resolve();
    };

    return (
        <Form
            form={form}
            layout="vertical"
            initialValues={initialValues}
            onFinish={onSubmit}
            autoComplete="off"
            disabled={loading}
        >
            <Card title="Thông tin liên hệ" style={{ marginBottom: 24 }}>
                <Row gutter={[24, 0]}>
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Họ và tên"
                            name="hoTen"
                            rules={[{ required: true, message: "Vui lòng nhập họ tên!" }]}
                        >
                            <Input placeholder="Nhập họ và tên khách hàng" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Số điện thoại"
                            name="soDienThoai"
                            rules={[{ required: true, validator: validatePhone }]}
                            hasFeedback
                        >
                            <Input placeholder="Nhập số điện thoại" maxLength={13} />
                        </Form.Item>
                    </Col>
                </Row>
            </Card>

            <Card title="Thông tin dịch vụ" style={{ marginBottom: 24 }}>
                <Row gutter={[24, 0]}>
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Dịch vụ quan tâm"
                            name="dichVuQuanTam"
                            rules={[{ required: true, message: "Vui lòng chọn dịch vụ!" }]}
                        >
                            <Select
                                options={DICH_VU_OPTIONS}
                                showSearch
                                allowClear={false}
                                placeholder="Chọn dịch vụ"
                                filterOption={(input, option) =>
                                    (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                                }
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Tiềm năng"
                            name="tiemNangLead"
                            rules={[{ required: true, message: "Vui lòng chọn tiềm năng!" }]}
                        >
                            <Select
                                options={LEAD_POTENTIAL_OPTIONS}
                                showSearch
                                allowClear
                                placeholder="Chọn tiềm năng"
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </Card>

            <Card title="Thông tin nguồn & phụ trách" style={{ marginBottom: 24 }}>
                <Row gutter={[24, 0]}>
                    <Col xs={24} md={12}>
                        <Form.Item name="tinhThanhPho" label="Tỉnh/Thành phố">
                            <Select
                                placeholder="Chọn hoặc gõ tên tỉnh/thành"
                                showSearch
                                allowClear
                                filterOption={(input, option) =>
                                    (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                                }
                                options={PROVINCE_OPTIONS}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item name="kenhTuongTac" label="Kênh tương tác">
                            <Select
                                options={KENH_TUONG_TAC_OPTIONS}
                                showSearch
                                allowClear
                                placeholder="Chọn hoặc gõ kênh"
                                filterOption={(input, option) =>
                                    (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                                }
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item name="nguonCuThe" label="Nguồn cụ thể">
                            <Input placeholder="Ví dụ: Page A, Group B, YouTube..." />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item name="hanhDong" label="Hành động">
                            <Input placeholder="Ví dụ: inbox page, call hotline..." />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item name="linkChat" label="Link chat">
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item name="idAd" label="ID Facebook Ads">
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item name="saleOnline" label="Sale online phụ trách">
                            <Select
                                options={salesStaffOptions}
                                placeholder="Chọn người phụ trách"
                                showSearch
                                filterOption={(input, option) =>
                                    (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                                }
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </Card>

            <Row gutter={[16, 16]} justify="end">
                {isEdit && onDelete && (
                    <Col>
                        <Button danger onClick={onDelete} style={{ marginRight: 8 }}>
                            Xoá Lead
                        </Button>
                    </Col>
                )}
                <Col>
                    <Button onClick={onBack} style={{ marginRight: 8 }}>
                        Quay lại
                    </Button>
                    <Button type="primary" htmlType="submit" loading={loading}>
                        {isEdit ? "Lưu thay đổi" : "Tạo mới"}
                    </Button>
                </Col>
            </Row>
        </Form>
    );
}