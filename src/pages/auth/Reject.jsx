import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  Typography,
  Space,
  theme,
  Result,
  Flex,
  Alert,
} from "antd";
import {
  CloseCircleOutlined,
  LogoutOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import { toast } from "react-toastify";
import { useAuth } from "../../contexts/AuthContext";

const { Title, Text } = Typography;

export default function Reject() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { token } = theme.useToken();

  const handleSignOut = async () => {
    try {
      await logout();
      toast.success("Đã đăng xuất thành công!");
      navigate("/signin");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Có lỗi xảy ra khi đăng xuất!");
    }
  };

  return (
    <Flex
      justify="center"
      align="center"
      style={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${token.colorError} 0%, ${token.colorErrorBg} 100%)`,
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
          {/* Thông báo chính */}
          <Result
            icon={<CloseCircleOutlined style={{ color: token.colorError }} />}
            status="error"
            title={
              <Title level={3} style={{ color: token.colorError, margin: 0 }}>
                Tài Khoản Bị Từ Chối
              </Title>
            }
            subTitle={
              <Text type="secondary">
                Rất tiếc, tài khoản của bạn đã bị từ chối
              </Text>
            }
          />

          {/* Thông tin liên hệ */}
          <Alert
            message="Cần hỗ trợ?"
            description={
              <Space direction="vertical" size="small" style={{ width: "100%" }}>
                <Flex align="center" justify="center" gap="small">
                  <PhoneOutlined style={{ color: token.colorPrimary }} />
                  <Text strong>Vui lòng liên hệ admin để được hướng dẫn</Text>
                </Flex>
                <Text type="secondary" style={{ fontSize: token.fontSizeXS }}>
                  Hotline: 1900-xxxx | Email: support@example.com
                </Text>
              </Space>
            }
            type="warning"
            showIcon={false}
          />

          {/* Button đăng xuất */}
          <Button
            type="primary"
            danger
            size="large"
            icon={<LogoutOutlined />}
            onClick={handleSignOut}
            block
          >
            Đăng Xuất
          </Button>
        </Space>
      </Card>
    </Flex>
  );
}
