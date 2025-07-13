import React from "react";
import { Modal, Form, Input, Select, Button, DatePicker } from "antd";
import { CHANNEL_OPTIONS, SERVICE_OPTIONS, REGION_OPTIONS } from "../../../constants";

export default function LeadAddModal({
    visible,
    onCancel,
    onSubmit,
    loading,
    existingPhones = [],
}) {
    const [form] = Form.useForm();

    const validatePhone = (_, value) => {
        if (!value) return Promise.reject("Nhập số điện thoại!");
        if (!/^\d{8,12}$/.test(value)) return Promise.reject("Số điện thoại không hợp lệ!");
        if (existingPhones.includes(value)) return Promise.reject("Số điện thoại đã tồn tại!");
        return Promise.resolve();
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            if (values.ngayLaySo) values.ngayLaySo = values.ngayLaySo.toISOString();
            // LOG
            console.log("Modal form values gửi lên:", values);
            const success = await onSubmit(values);
            if (success !== false) form.resetFields();
        } catch (err) {
            // Nếu validate lỗi thì không reset form
            console.log("Form validate lỗi", err);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        onCancel();
    };

    return (
        <Modal
            title="Thêm Lead Mới"
            open={visible}
            onOk={handleOk}
            onCancel={handleCancel}
            footer={[
                <Button key="back" onClick={handleCancel}>Hủy</Button>,
                <Button key="submit" type="primary" loading={loading} onClick={handleOk}>Lưu</Button>,
            ]}
            destroyOnHidden
        >
            <Form layout="vertical" form={form}>
                <Form.Item
                    name="tenKhach"
                    label="Tên khách hàng"
                    rules={[{ required: true, message: "Nhập tên khách hàng!" }]}
                >
                    <Input autoFocus />
                </Form.Item>
                <Form.Item
                    name="soDienThoai"
                    label="Số điện thoại"
                    hasFeedback
                    rules={[{ validator: validatePhone }]}
                >
                    <Input maxLength={12} />
                </Form.Item>
                <Form.Item
                    name="kenhNguon"
                    label="Kênh nguồn"
                    rules={[{ required: true, message: "Chọn kênh nguồn!" }]}
                >
                    <Select options={CHANNEL_OPTIONS} allowClear placeholder="Chọn kênh" />
                </Form.Item>
                <Form.Item name="cuTheNguon" label="Cụ thể nguồn">
                    <Input />
                </Form.Item>
                <Form.Item
                    name="dichVuQuanTam"
                    label="Dịch vụ quan tâm"
                    rules={[{ required: true, message: "Chọn dịch vụ quan tâm!" }]}
                >
                    <Select mode="multiple" options={SERVICE_OPTIONS} allowClear placeholder="Chọn dịch vụ" />
                </Form.Item>
                <Form.Item
                    name="khuVuc"
                    label="Khu vực"
                    rules={[{ required: true, message: "Chọn khu vực!" }]}
                >
                    <Select options={REGION_OPTIONS} allowClear placeholder="Chọn khu vực" />
                </Form.Item>
                <Form.Item name="vanDeKhach" label="Vấn đề của khách hàng">
                    <Input.TextArea rows={2} placeholder="Nhập vấn đề hoặc nhu cầu khách" />
                </Form.Item>
                <Form.Item
                    name="ngayLaySo"
                    label="Ngày lấy số điện thoại"
                    rules={[{ required: true, message: "Chọn ngày!" }]}
                >
                    <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
                </Form.Item>
                <Form.Item name="ghiChu" label="Ghi chú">
                    <Input.TextArea rows={2} />
                </Form.Item>
            </Form>
        </Modal>
    );
}
