import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, Card, Row, Col, DatePicker, Typography, Space, Flex, theme } from "antd";
import { UserOutlined, MailOutlined, LockOutlined, PhoneOutlined, IdcardOutlined, HomeOutlined, ManOutlined, WomanOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";
import GenderButton from "../components/GenderButton";
import { registerUser } from "../services/authService";

const { Title, Text } = Typography;

export default function SignUp() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedGender, setSelectedGender] = useState("");
  const navigate = useNavigate();
  const { token } = theme.useToken();

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await registerUser(values);
      toast.success("Đăng ký thành công! Vui lòng chờ phê duyệt.");
      navigate("/pending");
    } catch (error) {
      if (error.message === "phone-exists") toast.error("Số điện thoại đã được sử dụng!");
      else if (error.message === "idcard-exists") toast.error("Số CCCD đã được sử dụng!");
      else if (error.code === "auth/email-already-in-use") toast.error("Email đã được sử dụng!");
      else if (error.code === "auth/weak-password") toast.error("Mật khẩu quá yếu!");
      else toast.error("Có lỗi xảy ra khi đăng ký!");
    }
    setLoading(false);
  };

  return (
    <Flex
      justify="center"
      align="center"
      style={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryBg} 100%)`,
        padding: token.paddingLG,
      }}
    >
      <Card style={{ width: "100%", maxWidth: "800px" }}>
        <Space direction="vertical" size="large" style={{ width: "100%", textAlign: "center" }}>
          <Space direction="vertical" size="small">
            <Title level={2} style={{ color: token.colorPrimary, margin: 0 }}>
              Đăng Ký Tài Khoản
            </Title>
            <Text type="secondary" style={{ fontSize: token.fontSizeLG }}>
              Tạo tài khoản mới để bắt đầu sử dụng dịch vụ
            </Text>
          </Space>

          <Form
            form={form}
            onFinish={handleSubmit}
            layout="vertical"
            requiredMark={false}
            size="large"
            style={{ textAlign: "left" }}
          >
            {/* Hàng 1: Thông tin cá nhân */}
            <Row gutter={[16, 0]}>
              <Col xs={24} md={8}>
                <Form.Item
                  name="hoTen"
                  label="Họ và tên"
                  rules={[
                    { required: true, message: "Vui lòng nhập họ và tên!" },
                    { min: 2, message: "Họ và tên phải có ít nhất 2 ký tự!" },
                  ]}
                >
                  <Input prefix={<UserOutlined style={{ color: token.colorPrimary }} />} placeholder="Nhập họ và tên" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  name="ngaySinh"
                  label="Ngày sinh"
                  rules={[{ required: true, message: "Vui lòng chọn ngày sinh!" }]}
                >
                  <DatePicker placeholder="Chọn ngày sinh" style={{ width: "100%" }} format="DD/MM/YYYY" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  name="gioiTinh"
                  label="Giới tính"
                  rules={[{ required: true, message: "Vui lòng chọn giới tính!" }]}
                >
                  <Row gutter={8}>
                    <Col span={12}>
                      <GenderButton
                        value="male"
                        icon={<ManOutlined />}
                        label="Nam"
                        selected={selectedGender === "male"}
                        onClick={(value) => {
                          setSelectedGender(value);
                          form.setFieldsValue({ gioiTinh: value });
                        }}
                      />
                    </Col>
                    <Col span={12}>
                      <GenderButton
                        value="female"
                        icon={<WomanOutlined />}
                        label="Nữ"
                        selected={selectedGender === "female"}
                        onClick={(value) => {
                          setSelectedGender(value);
                          form.setFieldsValue({ gioiTinh: value });
                        }}
                      />
                    </Col>
                  </Row>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={24}>
              <Col xs={24} md={8}>
                <Form.Item
                  name="soDienThoai"
                  label="Số điện thoại"
                  rules={[
                    { required: true, message: "Vui lòng nhập số điện thoại!" },
                    { pattern: /^[0-9]{10,11}$/, message: "Số điện thoại không hợp lệ!" },
                  ]}
                >
                  <Input prefix={<PhoneOutlined style={{ color: token.colorPrimary }} />} placeholder="Nhập số điện thoại" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { required: true, message: "Vui lòng nhập email!" },
                    { type: "email", message: "Email không hợp lệ!" },
                  ]}
                >
                  <Input prefix={<MailOutlined style={{ color: token.colorPrimary }} />} placeholder="Nhập địa chỉ email" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  name="password"
                  label="Mật khẩu"
                  rules={[
                    { required: true, message: "Vui lòng nhập mật khẩu!" },
                    { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự!" },
                  ]}
                >
                  <Input.Password prefix={<LockOutlined style={{ color: token.colorPrimary }} />} placeholder="Nhập mật khẩu" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="queQuan"
                  label="Quê quán"
                  rules={[{ required: true, message: "Vui lòng nhập quê quán!" }]}
                >
                  <Input prefix={<HomeOutlined style={{ color: token.colorPrimary }} />} placeholder="Nhập quê quán" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="diaChiHienTai"
                  label="Địa chỉ hiện tại"
                  rules={[{ required: true, message: "Vui lòng nhập địa chỉ hiện tại!" }]}
                >
                  <Input prefix={<HomeOutlined style={{ color: token.colorPrimary }} />} placeholder="Nhập địa chỉ hiện tại" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="soCCCD"
                  label="Số CCCD"
                  rules={[
                    { required: true, message: "Vui lòng nhập số CCCD!" },
                    { pattern: /^[0-9]{12}$/, message: "Số CCCD phải có 12 chữ số!" },
                  ]}
                >
                  <Input prefix={<IdcardOutlined style={{ color: token.colorPrimary }} />} placeholder="Nhập số CCCD" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="ngayCapCCCD"
                  label="Ngày cấp CCCD"
                  rules={[{ required: true, message: "Vui lòng chọn ngày cấp CCCD!" }]}
                >
                  <DatePicker placeholder="Chọn ngày cấp" style={{ width: "100%" }} format="DD/MM/YYYY" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block size="large">
                {loading ? "Đang xử lý..." : "Đăng Ký"}
              </Button>
            </Form.Item>
            <Space direction="vertical" size="small" style={{ width: "100%", textAlign: "center" }}>
              <Text type="secondary">
                Đã có tài khoản?{" "}
                <Button type="link" style={{ padding: 0, height: "auto" }} onClick={() => navigate("/signin")}>
                  Đăng nhập ngay
                </Button>
              </Text>
            </Space>
          </Form>
        </Space>
      </Card>
    </Flex>
  );
}
