import React, { useState, useEffect } from "react";
import {
    Card,
    Form,
    Input,
    Select,
    DatePicker,
    Button,
    Typography,
    Row,
    Col,
    Space,
    Tag,
    Alert,
    theme,
} from "antd";
import {
    SaveOutlined,
    ArrowLeftOutlined,
    EditOutlined,
    EyeOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    StopOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import {
    GENDER_OPTIONS,
    POSITION_OPTIONS,
    ROLE_OPTIONS,
    DEPARTMENT_OPTIONS,
    DIVISION_OPTIONS,
    WORK_STATUS_OPTIONS,
    ACCOUNT_STATUS,
    ACCOUNT_STATUS_OPTIONS,
    getAccountStatusConfig,
} from "../../constants";
import { fetchUserById, updateUser } from "../../services/userServices";

const { Title } = Typography;
const { Option } = Select;

export default function UserEdit() {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [userData, setUserData] = useState(null);
    const [isViewMode, setIsViewMode] = useState(false);
    const { token } = theme.useToken();
    const navigate = useNavigate();
    const { id } = useParams();
    const [searchParams] = useSearchParams();

    // Xác định chế độ xem hay sửa
    useEffect(() => {
        setIsViewMode(searchParams.get("view") === "true");
    }, [searchParams]);

    // Lấy dữ liệu user
    useEffect(() => {
        const loadUser = async () => {
            setLoading(true);
            try {
                const data = await fetchUserById(id);
                setUserData(data);

                // Chuyển timestamp Firebase sang dayjs cho form
                const formData = { ...data };
                if (data.ngaySinh)
                    formData.ngaySinh = data.ngaySinh.toDate
                        ? dayjs(data.ngaySinh.toDate())
                        : dayjs(data.ngaySinh);
                if (data.ngayCapCCCD)
                    formData.ngayCapCCCD = data.ngayCapCCCD.toDate
                        ? dayjs(data.ngayCapCCCD.toDate())
                        : dayjs(data.ngayCapCCCD);

                form.setFieldsValue(formData);
            } catch (error) {
                toast.error("Không tìm thấy thông tin nhân viên");
                navigate("/users");
            } finally {
                setLoading(false);
            }
        };
        if (id) loadUser();
    }, [id, form, navigate]);

    const handleSave = async (values) => {
        setSaving(true);
        try {
            // Chuyển dayjs về JS Date cho Firebase
            const dataToSave = { ...values };
            if (values.ngaySinh) dataToSave.ngaySinh = values.ngaySinh.toDate();
            if (values.ngayCapCCCD) dataToSave.ngayCapCCCD = values.ngayCapCCCD.toDate();

            await updateUser(id, dataToSave);
            toast.success("Cập nhật thông tin nhân viên thành công!");
            navigate("/users");
        } catch (error) {
            toast.error("Có lỗi xảy ra khi lưu thông tin nhân viên");
        } finally {
            setSaving(false);
        }
    };

    const toggleViewMode = () => setIsViewMode(!isViewMode);

    const handleStatusChange = async (newStatus) => {
        try {
            await updateUser(id, { trangThaiTaiKhoan: newStatus });
            setUserData((prev) => ({ ...prev, trangThaiTaiKhoan: newStatus }));
            const config = getAccountStatusConfig(newStatus);
            toast.success(`Đã cập nhật trạng thái: ${config.label}`);
        } catch (error) {
            toast.error("Có lỗi xảy ra khi cập nhật trạng thái");
        }
    };

    const pageTitle = isViewMode ? "Xem thông tin nhân viên" : "Chỉnh sửa thông tin nhân viên";

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
            {/* Header */}
            <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
                <Col>
                    <Space>
                        <Button
                            icon={<ArrowLeftOutlined />}
                            onClick={() => navigate("/users")}
                        >
                            Quay lại
                        </Button>
                        <Title level={2} style={{ margin: 0 }}>
                            {pageTitle}
                        </Title>
                        {userData && (
                            <Tag color={userData.trangThaiTaiKhoan === ACCOUNT_STATUS.APPROVE ? "green" : "orange"}>
                                {getAccountStatusConfig(userData.trangThaiTaiKhoan).label}
                            </Tag>
                        )}
                    </Space>
                </Col>
                <Col>
                    <Space>
                        <Button
                            icon={isViewMode ? <EditOutlined /> : <EyeOutlined />}
                            onClick={toggleViewMode}
                        >
                            {isViewMode ? "Chỉnh sửa" : "Xem"}
                        </Button>
                        {!isViewMode && (
                            <Button
                                type="primary"
                                icon={<SaveOutlined />}
                                loading={saving}
                                onClick={() => form.submit()}
                            >
                                Lưu thay đổi
                            </Button>
                        )}
                    </Space>
                </Col>
            </Row>

            {/* Alert for view mode */}
            {isViewMode && (
                <Alert
                    message="Bạn đang ở chế độ xem. Nhấn 'Chỉnh sửa' để thay đổi thông tin."
                    type="info"
                    showIcon
                    style={{ marginBottom: 24 }}
                />
            )}

            {/* Form */}
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSave}
                disabled={isViewMode}
                loading={loading}
            >
                <Row gutter={[24, 0]}>
                    {/* Thông tin cá nhân */}
                    <Col span={24}>
                        <Card title="Thông tin cá nhân" style={{ marginBottom: 24 }}>
                            <Row gutter={[16, 0]}>
                                <Col xs={24} md={12}>
                                    <Form.Item
                                        label="Họ và tên"
                                        name="hoTen"
                                        rules={[{ required: true, message: "Vui lòng nhập họ và tên!" }]}
                                    >
                                        <Input placeholder="Nhập họ và tên đầy đủ" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item
                                        label="Email"
                                        name="email"
                                        rules={[
                                            { required: true, message: "Vui lòng nhập email!" },
                                            { type: "email", message: "Email không hợp lệ!" }
                                        ]}
                                    >
                                        <Input placeholder="Nhập địa chỉ email" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item
                                        label="Ngày sinh"
                                        name="ngaySinh"
                                        rules={[{ required: true, message: "Vui lòng chọn ngày sinh!" }]}
                                    >
                                        <DatePicker
                                            style={{ width: "100%" }}
                                            format="DD/MM/YYYY"
                                            placeholder="Chọn ngày sinh"
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item
                                        label="Giới tính"
                                        name="gioiTinh"
                                        rules={[{ required: true, message: "Vui lòng chọn giới tính!" }]}
                                    >
                                        <Select placeholder="Chọn giới tính">
                                            {GENDER_OPTIONS.map(option => (
                                                <Option key={option.value} value={option.value}>{option.label}</Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item
                                        label="Số điện thoại"
                                        name="soDienThoai"
                                        rules={[{ required: true, message: "Vui lòng nhập số điện thoại!" }]}
                                    >
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
                                    <Form.Item
                                        label="Quê quán"
                                        name="queQuan"
                                        rules={[{ required: true, message: "Vui lòng nhập quê quán!" }]}
                                    >
                                        <Input placeholder="Nhập quê quán" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item
                                        label="Địa chỉ hiện tại"
                                        name="diaChiHienTai"
                                        rules={[{ required: true, message: "Vui lòng nhập địa chỉ hiện tại!" }]}
                                    >
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
                                    <Form.Item
                                        label="Số CCCD"
                                        name="soCCCD"
                                        rules={[{ required: true, message: "Vui lòng nhập số CCCD!" }]}
                                    >
                                        <Input placeholder="Nhập số căn cước công dân" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item
                                        label="Ngày cấp"
                                        name="ngayCapCCCD"
                                        rules={[{ required: true, message: "Vui lòng chọn ngày cấp!" }]}
                                    >
                                        <DatePicker
                                            style={{ width: "100%" }}
                                            format="DD/MM/YYYY"
                                            placeholder="Chọn ngày cấp"
                                        />
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
                                    <Form.Item
                                        label="Chức danh"
                                        name="chucDanh"
                                        rules={[{ required: true, message: "Vui lòng chọn chức danh!" }]}
                                    >
                                        <Select placeholder="Chọn chức danh">
                                            {POSITION_OPTIONS.map(option => (
                                                <Option key={option} value={option}>{option}</Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item
                                        label="Chức vụ"
                                        name="chucVu"
                                        rules={[{ required: true, message: "Vui lòng chọn chức vụ!" }]}
                                    >
                                        <Select placeholder="Chọn chức vụ">
                                            {ROLE_OPTIONS.map(option => (
                                                <Option key={option} value={option}>{option}</Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item
                                        label="Phòng ban"
                                        name="phongBan"
                                        rules={[{ required: true, message: "Vui lòng chọn phòng ban!" }]}
                                    >
                                        <Select placeholder="Chọn phòng ban">
                                            {DEPARTMENT_OPTIONS.map(option => (
                                                <Option key={option} value={option}>{option}</Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item
                                        label="Bộ phận"
                                        name="boPhan"
                                        rules={[{ required: true, message: "Vui lòng chọn bộ phận!" }]}
                                    >
                                        <Select placeholder="Chọn bộ phận">
                                            {DIVISION_OPTIONS.map(option => (
                                                <Option key={option} value={option}>{option}</Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item
                                        label="Chi nhánh làm việc"
                                        name="chiNhanhLamViec"
                                        rules={[{ required: true, message: "Vui lòng nhập chi nhánh làm việc!" }]}
                                    >
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
                                    <Form.Item
                                        label="Trạng thái làm việc"
                                        name="trangThaiLamViec"
                                        rules={[{ required: true, message: "Vui lòng chọn trạng thái làm việc!" }]}
                                    >
                                        <Select placeholder="Chọn trạng thái làm việc">
                                            {WORK_STATUS_OPTIONS.map(option => (
                                                <Option key={option.value} value={option.value}>{option.label}</Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item label="Trạng thái tài khoản">
                                        <Row gutter={[8, 8]}>
                                            {ACCOUNT_STATUS_OPTIONS.map(option => (
                                                <Col key={option.value}>
                                                    <Button
                                                        icon={option.value === ACCOUNT_STATUS.PENDING ? <ClockCircleOutlined /> :
                                                            option.value === ACCOUNT_STATUS.APPROVE ? <CheckCircleOutlined /> :
                                                                option.value === ACCOUNT_STATUS.REJECT ? <CloseCircleOutlined /> :
                                                                    <StopOutlined />}
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
