import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Space,
  Row,
  Col,
  theme,
} from "antd";
import {
  MailOutlined,
  ArrowLeftOutlined,
  LoginOutlined,
} from "@ant-design/icons";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../services/firebase";
import { toast } from "react-toastify";

const { Title, Text } = Typography;

export default function ForgotPassword() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  // Sử dụng theme token của Ant Design
  const { token } = theme.useToken();

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, values.email);
      setEmailSent(true);
      toast.success("Email khôi phục mật khẩu đã được gửi!");
      form.resetFields();
    } catch (error) {
      console.error("Error sending password reset email:", error);
      if (error.code === "auth/user-not-found") {
        toast.error("Email không tồn tại trong hệ thống!");
      } else if (error.code === "auth/invalid-email") {
        toast.error("Email không hợp lệ!");
      } else if (error.code === "auth/too-many-requests") {
        toast.error("Quá nhiều lần thử. Vui lòng thử lại sau!");
      } else {
        toast.error("Có lỗi xảy ra khi gửi email khôi phục!");
      }
    }
    setLoading(false);
  };

  const handleBackToSignIn = () => {
    navigate("/signin");
  };

  const handleResendEmail = () => {
    setEmailSent(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryBg} 100%)`,
        padding: token.paddingLG,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: "450px",
          boxShadow: token.boxShadowSecondary,
        }}
        styles={{
          body: { padding: token.paddingXL }
        }}
      >
        <Space
          direction="vertical"
          size="large"
          style={{ width: "100%", textAlign: "center" }}
        >
          <div>
            <Title level={2} style={{ color: token.colorPrimary, marginBottom: token.marginXS }}>
              {emailSent ? "Email Đã Được Gửi" : "Quên Mật Khẩu"}
            </Title>
            <Text type="secondary" style={{ fontSize: token.fontSizeLG }}>
              {emailSent
                ? "Vui lòng kiểm tra email để đặt lại mật khẩu"
                : "Nhập email để nhận liên kết đặt lại mật khẩu"
              }
            </Text>
          </div>

          {emailSent ? (
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              <div
                style={{
                  padding: token.paddingLG,
                  backgroundColor: token.colorSuccessBg,
                  borderRadius: token.borderRadius,
                  border: `1px solid ${token.colorSuccessBorder}`,
                }}
              >
                <Text
                  style={{
                    fontSize: token.fontSizeSM,
                    color: token.colorSuccessText,
                    lineHeight: "1.6",
                    display: "block"
                  }}
                >
                  ✅ <strong>Thành công!</strong><br />
                  Email khôi phục mật khẩu đã được gửi đến địa chỉ email của bạn.
                  Vui lòng kiểm tra hộp thư đến và làm theo hướng dẫn.
                </Text>
              </div>

              <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                <Button
                  type="primary"
                  onClick={handleBackToSignIn}
                  block
                  size="large"
                  style={{ height: "48px", fontWeight: 600 }}
                >
                  Quay Về Đăng Nhập
                </Button>

                <Button
                  type="default"
                  onClick={handleResendEmail}
                  block
                  style={{ fontWeight: 500 }}
                >
                  Gửi Lại Email Khác
                </Button>
              </Space>
            </Space>
          ) : (
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
                <Input
                  prefix={<MailOutlined style={{ color: token.colorPrimary }} />}
                  placeholder="Nhập địa chỉ email"
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: token.marginMD }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  size="large"
                  style={{ height: "48px", fontWeight: 600 }}
                >
                  {loading ? "Đang gửi..." : "Gửi Email Khôi Phục"}
                </Button>
              </Form.Item>

              <Row justify="space-between" align="middle" style={{ marginTop: token.marginSM }}>
                <Col>
                  <Button
                    type="link"
                    onClick={handleBackToSignIn}
                    style={{
                      padding: 0,
                      fontSize: token.fontSizeXS,
                      color: token.colorTextTertiary,
                      height: "auto"
                    }}
                    icon={<ArrowLeftOutlined />}
                  >
                    Quay lại đăng nhập
                  </Button>
                </Col>
                <Col>
                  <Text type="secondary" style={{ fontSize: token.fontSizeXS }}>
                    Chưa có tài khoản?{" "}
                  </Text>
                  <Button
                    type="link"
                    onClick={() => navigate("/signup")}
                    style={{
                      padding: 0,
                      fontSize: token.fontSizeXS,
                      fontWeight: 500,
                      height: "auto"
                    }}
                    icon={<LoginOutlined />}
                  >
                    Đăng ký ngay
                  </Button>
                </Col>
              </Row>
            </Form>
          )}
        </Space>
      </Card>
    </div>
  );
}
