import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, Card, Typography, Space, Flex, theme } from "antd";
import { MailOutlined, LockOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";
import { loginUser } from "../services/authService";

const { Title, Text } = Typography;

export default function SignIn() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { token } = theme.useToken();

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const { userData } = await loginUser(values.email, values.password);
      const { trangThaiTaiKhoan } = userData;

      switch (trangThaiTaiKhoan) {
        case "pending":
          toast.info("Tài khoản đang chờ phê duyệt.");
          navigate("/pending");
          break;
        case "reject":
          toast.error("Tài khoản đã bị từ chối.");
          navigate("/reject");
          break;
        case "approve":
          toast.success("Đăng nhập thành công!");
          navigate("/home");
          break;
        case "disabled":
          toast.error("Tài khoản đã bị vô hiệu hóa.");
          // Đăng xuất user nếu tài khoản bị disabled
          // await auth.signOut(); // Nếu muốn, import auth từ firebase
          break;
        default:
          toast.error("Trạng thái tài khoản không hợp lệ.");
        // await auth.signOut();
      }
    } catch (error) {
      if (error.message === "user-not-found") toast.error("Không tìm thấy thông tin tài khoản!");
      else if (error.code === "auth/user-not-found") toast.error("Email không tồn tại!");
      else if (error.code === "auth/wrong-password") toast.error("Mật khẩu không đúng!");
      else if (error.code === "auth/invalid-email") toast.error("Email không hợp lệ!");
      else if (error.code === "auth/user-disabled") toast.error("Tài khoản đã bị vô hiệu hóa!");
      else if (error.code === "auth/too-many-requests") toast.error("Quá nhiều lần thử. Vui lòng thử lại sau!");
      else if (error.code === "auth/invalid-credential") toast.error("Thông tin đăng nhập không chính xác!");
      else toast.error("Có lỗi xảy ra khi đăng nhập!");
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
      <Card style={{ width: "100%", maxWidth: "450px" }}>
        <Space direction="vertical" size="large" style={{ width: "100%", textAlign: "center" }}>
          <Space direction="vertical" size="small">
            <Title level={2} style={{ color: token.colorPrimary, margin: 0 }}>
              Đăng Nhập
            </Title>
            <Text type="secondary" style={{ fontSize: token.fontSizeLG }}>
              Chào mừng bạn quay trở lại!
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
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block size="large">
                {loading ? "Đang xử lý..." : "Đăng Nhập"}
              </Button>
            </Form.Item>
            <Flex justify="space-between" align="center">
              <Button type="link" onClick={() => navigate("/forgot-password")} style={{ padding: 0, height: "auto" }}>
                Quên mật khẩu?
              </Button>
              <Space size="small">
                <Text type="secondary">Chưa có tài khoản?</Text>
                <Button type="link" onClick={() => navigate("/signup")} style={{ padding: 0, height: "auto" }}>
                  Đăng ký ngay
                </Button>
              </Space>
            </Flex>
          </Form>
        </Space>
      </Card>
    </Flex>
  );
}
