import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  Typography,
  Space,
  theme,
  Result,
} from "antd";
import {
  CloseCircleOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { signOut } from "firebase/auth";
import { auth } from "../../services/firebase";
import { toast } from "react-toastify";

const { Title, Text } = Typography;

export default function Reject() {
  const navigate = useNavigate();

  // Sử dụng theme token của Ant Design
  const { token } = theme.useToken();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success("Đã đăng xuất thành công!");
      navigate("/signin");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Có lỗi xảy ra khi đăng xuất!");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${token.colorError} 0%, ${token.colorErrorBg} 100%)`,
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
        <Result
          icon={<CloseCircleOutlined style={{ color: token.colorError }} />}
          status="error"
          title={
            <Title level={2} style={{ color: token.colorError, marginBottom: token.marginXS }}>
              Tài Khoản Bị Từ Chối
            </Title>
          }
          subTitle={
            <Text type="secondary" style={{ fontSize: token.fontSizeLG }}>
              Rất tiếc, tài khoản của bạn đã bị từ chối
            </Text>
          }
        />

        <Space direction="vertical" size="large" style={{ width: "100%", marginTop: token.marginLG }}>
          <div
            style={{
              padding: token.paddingLG,
              backgroundColor: token.colorInfoBg,
              borderRadius: token.borderRadius,
              border: `1px solid ${token.colorInfoBorder}`,
              textAlign: "center"
            }}
          >
            <Text
              style={{
                fontSize: token.fontSizeLG,
                color: token.colorTextSecondary,
                lineHeight: "1.6",
                display: "block"
              }}
            >
              📞 Vui lòng liên hệ admin để được hướng dẫn
            </Text>
          </div>

          <Button
            type="primary"
            danger
            onClick={handleSignOut}
            block
            size="large"
            style={{ height: "48px", fontWeight: 600 }}
            icon={<LogoutOutlined />}
          >
            Đăng Xuất
          </Button>
        </Space>
      </Card>
    </div>
  );
}
