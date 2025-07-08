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
  LockOutlined,
} from "@ant-design/icons";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../services/firebase";
import { toast } from "react-toastify";

const { Title, Text } = Typography;

export default function SignIn() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Sử dụng theme token của Ant Design
  const { token } = theme.useToken();

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // Đăng nhập Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );

      // Lấy thông tin user từ Firestore
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));

      if (!userDoc.exists()) {
        toast.error("Không tìm thấy thông tin tài khoản!");
        setLoading(false);
        return;
      }

      const userData = userDoc.data();
      const { trangThaiTaiKhoan } = userData;

      // Kiểm tra trạng thái tài khoản và chuyển hướng
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
          navigate("/");
          break;
        case "disabled":
          toast.error("Tài khoản đã bị vô hiệu hóa.");
          break;
        default:
          toast.error("Trạng thái tài khoản không hợp lệ.");
      }
    } catch (error) {
      console.error("Error signing in:", error);
      if (error.code === "auth/user-not-found") {
        toast.error("Email không tồn tại!");
      } else if (error.code === "auth/wrong-password") {
        toast.error("Mật khẩu không đúng!");
      } else if (error.code === "auth/invalid-email") {
        toast.error("Email không hợp lệ!");
      } else if (error.code === "auth/user-disabled") {
        toast.error("Tài khoản đã bị vô hiệu hóa!");
      } else if (error.code === "auth/too-many-requests") {
        toast.error("Quá nhiều lần thử. Vui lòng thử lại sau!");
      } else {
        toast.error("Có lỗi xảy ra khi đăng nhập!");
      }
    }
    setLoading(false);
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
              Đăng Nhập
            </Title>
            <Text type="secondary" style={{ fontSize: token.fontSizeLG }}>
              Chào mừng bạn quay trở lại!
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

            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[
                { required: true, message: "Vui lòng nhập mật khẩu!" },
                { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự!" },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: token.colorPrimary }} />}
                placeholder="Nhập mật khẩu"
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
                {loading ? "Đang xử lý..." : "Đăng Nhập"}
              </Button>
            </Form.Item>

            <Row justify="space-between" align="middle" style={{ marginTop: token.marginSM }}>
              <Col>
                <Button
                  type="link"
                  onClick={() => navigate("/forgot-password")}
                  style={{
                    padding: 0,
                    fontSize: token.fontSizeXS,
                    color: token.colorTextTertiary,
                    height: "auto"
                  }}
                >
                  Quên mật khẩu?
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
                >
                  Đăng ký ngay
                </Button>
              </Col>
            </Row>
          </Form>
        </Space>
      </Card>
    </div>
  );
}
