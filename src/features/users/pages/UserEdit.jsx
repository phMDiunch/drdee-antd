// src/features/users/pages/UserEdit.jsx
import React from "react";
import {
    Card,
    Form,
    Input,
    Select,
    DatePicker,
    Button,
    Row,
    Col,
    Alert,
    theme,
    Spin,
} from "antd";
import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    StopOutlined,
} from "@ant-design/icons";

// Import các hằng số và options
import {
    GENDER_OPTIONS,
    POSITION_OPTIONS,
    ROLE_OPTIONS,
    DEPARTMENT_OPTIONS,
    DIVISION_OPTIONS,
    WORK_STATUS_OPTIONS,
    ACCOUNT_STATUS,
    ACCOUNT_STATUS_OPTIONS,
} from "../../../constants";

// Import hook và component đã tạo
import { useUser } from "../hooks/useUser";
import UserEditHeader from "../components/UserEditHeader";

const { Option } = Select;

export default function UserEdit() {
    // Lấy tất cả state và logic từ hook `useUser`
    const {
        form,
        userData,
        loading,
        saving,
        isViewMode,
        handleSave,
        handleStatusChange,
        toggleViewMode,
        goBack,
    } = useUser();

    const { token } = theme.useToken();

    // Nếu đang tải dữ liệu lần đầu, hiển thị spinner toàn trang
    if (loading) {
        return <Spin style={{ position: 'absolute', top: '50%', left: '50%' }} tip="Đang tải dữ liệu..." size="large" />;
    }

    return (
        <div
            style={{
                padding: 24,
                background: token.colorBgContainer,
                borderRadius: token.borderRadiusLG,
                marginBottom: 24,
                minHeight: "calc(100vh - 110px)",
            }}
        >
            {/* Sử dụng component Header mới */}
            <UserEditHeader
                isViewMode={isViewMode}
                userData={userData}
                saving={saving}
                toggleViewMode={toggleViewMode}
                onSave={() => form.submit()} // Kích hoạt onFinish của Form
                onBack={goBack}
            />

            {isViewMode && (
                <Alert
                    message="Bạn đang ở chế độ xem. Nhấn 'Chỉnh sửa' để thay đổi thông tin."
                    type="info"
                    showIcon
                    style={{ marginBottom: 24 }}
                />
            )}

            {/* Form được điều khiển hoàn toàn bởi hook */}
            <Form form={form} layout="vertical" onFinish={handleSave} disabled={isViewMode}>
                <Row gutter={[24, 0]}>
                    {/* Thông tin cá nhân */}
                    <Col span={24}>
                        <Card title="Thông tin cá nhân" style={{ marginBottom: 24 }}>
                            <Row gutter={[16, 0]}>
                                <Col xs={24} md={12}>
                                    <Form.Item label="Họ và tên" name="hoTen" rules={[{ required: true, message: "Vui lòng nhập họ và tên!" }]}>
                                        <Input placeholder="Nhập họ và tên đầy đủ" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item label="Email" name="email" rules={[{ required: true, message: "Vui lòng nhập email!" }, { type: "email", message: "Email không hợp lệ!" }]}>
                                        <Input placeholder="Nhập địa chỉ email" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item label="Ngày sinh" name="ngaySinh" rules={[{ required: true, message: "Vui lòng chọn ngày sinh!" }]}>
                                        <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" placeholder="Chọn ngày sinh" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item label="Giới tính" name="gioiTinh" rules={[{ required: true, message: "Vui lòng chọn giới tính!" }]}>
                                        <Select placeholder="Chọn giới tính">
                                            {GENDER_OPTIONS.map(option => <Option key={option.value} value={option.value}>{option.label}</Option>)}
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item label="Số điện thoại" name="soDienThoai" rules={[{ required: true, message: "Vui lòng nhập số điện thoại!" }]}>
                                        <Input placeholder="Nhập số điện thoại" />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Card>
                    </Col>

                    {/* Thông tin địa chỉ */}
                    <Col span={24}>
                        <Card title="Thông tin địa chỉ" style={{ marginBottom: 24 }}>
                            <Row gutter={[16, 0]}>
                                <Col xs={24} md={12}>
                                    <Form.Item label="Quê quán" name="queQuan" rules={[{ required: true, message: "Vui lòng nhập quê quán!" }]}>
                                        <Input placeholder="Nhập quê quán" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item label="Địa chỉ hiện tại" name="diaChiHienTai" rules={[{ required: true, message: "Vui lòng nhập địa chỉ hiện tại!" }]}>
                                        <Input placeholder="Nhập địa chỉ hiện tại" />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Card>
                    </Col>

                    {/* Thông tin căn cước */}
                    <Col span={24}>
                        <Card title="Thông tin căn cước công dân" style={{ marginBottom: 24 }}>
                            <Row gutter={[16, 0]}>
                                <Col xs={24} md={8}>
                                    <Form.Item label="Số CCCD" name="soCCCD" rules={[{ required: true, message: "Vui lòng nhập số CCCD!" }]}>
                                        <Input placeholder="Nhập số căn cước công dân" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item label="Ngày cấp" name="ngayCapCCCD" rules={[{ required: true, message: "Vui lòng chọn ngày cấp!" }]}>
                                        <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" placeholder="Chọn ngày cấp" />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Card>
                    </Col>

                    {/* Thông tin công việc */}
                    <Col span={24}>
                        <Card title="Thông tin công việc" style={{ marginBottom: 24 }}>
                            <Row gutter={[16, 0]}>
                                <Col xs={24} md={8}>
                                    <Form.Item label="Chức danh" name="chucDanh" rules={[{ required: true, message: "Vui lòng chọn chức danh!" }]}>
                                        <Select placeholder="Chọn chức danh">
                                            {POSITION_OPTIONS.map(option => <Option key={option} value={option}>{option}</Option>)}
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item label="Chức vụ" name="chucVu" rules={[{ required: true, message: "Vui lòng chọn chức vụ!" }]}>
                                        <Select placeholder="Chọn chức vụ">
                                            {ROLE_OPTIONS.map(option => <Option key={option} value={option}>{option}</Option>)}
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item label="Phòng ban" name="phongBan" rules={[{ required: true, message: "Vui lòng chọn phòng ban!" }]}>
                                        <Select placeholder="Chọn phòng ban">
                                            {DEPARTMENT_OPTIONS.map(option => <Option key={option} value={option}>{option}</Option>)}
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item label="Bộ phận" name="boPhan" rules={[{ required: true, message: "Vui lòng chọn bộ phận!" }]}>
                                        <Select placeholder="Chọn bộ phận">
                                            {DIVISION_OPTIONS.map(option => <Option key={option} value={option}>{option}</Option>)}
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item label="Chi nhánh làm việc" name="chiNhanhLamViec" rules={[{ required: true, message: "Vui lòng nhập chi nhánh làm việc!" }]}>
                                        <Input placeholder="Nhập chi nhánh làm việc" />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Card>
                    </Col>

                    {/* Thông tin ngân hàng */}
                    <Col span={24}>
                        <Card title="Thông tin ngân hàng" style={{ marginBottom: 24 }}>
                            <Row gutter={[16, 0]}>
                                <Col xs={24} md={12}>
                                    <Form.Item label="Số tài khoản ngân hàng" name="soTkNganHang">
                                        <Input placeholder="Nhập số tài khoản ngân hàng" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item label="Ngân hàng" name="nganHang">
                                        <Input placeholder="Nhập tên ngân hàng" />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Card>
                    </Col>

                    {/* Thông tin trạng thái */}
                    <Col span={24}>
                        <Card title="Thông tin trạng thái">
                            <Row gutter={[16, 16]}>
                                <Col xs={24} md={12}>
                                    <Form.Item label="Trạng thái làm việc" name="trangThaiLamViec" rules={[{ required: true, message: "Vui lòng chọn trạng thái làm việc!" }]}>
                                        <Select placeholder="Chọn trạng thái làm việc">
                                            {WORK_STATUS_OPTIONS.map(option => <Option key={option.value} value={option.value}>{option.label}</Option>)}
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item label="Trạng thái tài khoản">
                                        <Row gutter={[8, 8]}>
                                            {ACCOUNT_STATUS_OPTIONS.map(option => (
                                                <Col key={option.value}>
                                                    <Button
                                                        icon={
                                                            option.value === ACCOUNT_STATUS.PENDING ? <ClockCircleOutlined /> :
                                                                option.value === ACCOUNT_STATUS.APPROVE ? <CheckCircleOutlined /> :
                                                                    option.value === ACCOUNT_STATUS.REJECT ? <CloseCircleOutlined /> :
                                                                        <StopOutlined />
                                                        }
                                                        size="small"
                                                        style={{
                                                            backgroundColor: userData?.trangThaiTaiKhoan === option.value ? option.colorHex : '#f5f5f5',
                                                            borderColor: userData?.trangThaiTaiKhoan === option.value ? option.colorHex : '#d9d9d9',
                                                            color: userData?.trangThaiTaiKhoan === option.value ? '#fff' : '#666'
                                                        }}
                                                        onClick={() => handleStatusChange(option.value)}
                                                        disabled={isViewMode}
                                                    >
                                                        {option.label}
                                                    </Button>
                                                </Col>
                                            ))}
                                        </Row>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Card>
                    </Col>
                </Row>
            </Form>
        </div>
    );
}