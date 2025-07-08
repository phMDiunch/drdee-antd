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
  Flex,
  Alert,
  Result,
} from "antd";
import {
  MailOutlined,
  ArrowLeftOutlined,
  LoginOutlined,
  CheckCircleOutlined,
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
    <Flex
      justify="center"
      align="center"
      style={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryBg} 100%)`,
        padding: token.paddingLG,
      }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: "450px",
          textAlign: "center",
        }}
      >
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {emailSent ? (
            // Email sent success view
            <>
              <Result
                icon={<CheckCircleOutlined style={{ color: token.colorSuccess }} />}
                title={
                  <Title level={3} style={{ color: token.colorPrimary, margin: 0 }}>
                    Email Đã Được Gửi
                  </Title>
                }
                subTitle={
                  <Text type="secondary">
                    Vui lòng kiểm tra email để đặt lại mật khẩu
                  </Text>
                }
              />

              <Alert
                message="Thành công!"
                description="Email khôi phục mật khẩu đã được gửi đến địa chỉ email của bạn. Vui lòng kiểm tra hộp thư đến và làm theo hướng dẫn."
                type="success"
                showIcon
              />

              <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                <Button
                  type="primary"
                  onClick={handleBackToSignIn}
                  block
                  size="large"
                >
                  Quay Về Đăng Nhập
                </Button>

                <Button
                  type="default"
                  onClick={handleResendEmail}
                  block
                >
                  Gửi Lại Email Khác
                </Button>
              </Space>
            </>
          ) : (
            // Forgot password form view
            <>
              <div>
                <Title level={3} style={{ color: token.colorPrimary, margin: 0 }}>
                  Quên Mật Khẩu
                </Title>
                <Text type="secondary">
                  Nhập email để nhận liên kết đặt lại mật khẩu
                </Text>
              </div>

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

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    block
                    size="large"
                  >
                    {loading ? "Đang gửi..." : "Gửi Email Khôi Phục"}
                  </Button>
                </Form.Item>

                <Row justify="space-between" align="middle">
                  <Col>
                    <Button
                      type="link"
                      onClick={handleBackToSignIn}
                      icon={<ArrowLeftOutlined />}
                      style={{ padding: 0, height: "auto" }}
                    >
                      <Text type="secondary" style={{ fontSize: token.fontSizeXS }}>
                        Quay lại đăng nhập
                      </Text>
                    </Button>
                  </Col>
                  <Col>
                    <Text type="secondary" style={{ fontSize: token.fontSizeXS }}>
                      Chưa có tài khoản?{" "}
                    </Text>
                    <Button
                      type="link"
                      onClick={() => navigate("/signup")}
                      icon={<LoginOutlined />}
                      style={{ padding: 0, height: "auto" }}
                    >
                      Đăng ký ngay
                    </Button>
                  </Col>
                </Row>
              </Form>
            </>
          )}
        </Space>
      </Card>
    </Flex>
  );
}
