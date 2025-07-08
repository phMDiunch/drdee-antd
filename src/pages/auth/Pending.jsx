import React from "react";
import { useNavigate } from "react-router-dom";
import { Result, Button, Card, Typography, theme, Space, Flex, Alert } from "antd";
import { ClockCircleOutlined, LogoutOutlined, PhoneOutlined } from "@ant-design/icons";
import { useAuth } from "../../contexts/AuthContext";

const { Title, Text } = Typography;

export default function Pending() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { token } = theme.useToken();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/signin");
    } catch (error) {
      console.error("Error signing out:", error);
    }
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
          {/* Thông báo chính */}
          <Result
            icon={<ClockCircleOutlined style={{ color: token.colorPrimary }} />}
            title={
              <Title level={3} style={{ color: token.colorPrimary, margin: 0 }}>
                Tài Khoản Đang Chờ Phê Duyệt
              </Title>
            }
            subTitle={
              <Text type="secondary">
                Cảm ơn bạn đã đăng ký! Tài khoản của bạn đang được xem xét và sẽ được phê duyệt trong thời gian sớm nhất.
              </Text>
            }
          />

          {/* Button đăng xuất */}
          <Button
            type="primary"
            size="large"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            block
          >
            Đăng Xuất
          </Button>

          {/* Hotline liên hệ */}
          <Alert
            message="Cần hỗ trợ?"
            description={
              <Space direction="vertical" size="small" style={{ width: "100%" }}>
                <Flex align="center" justify="center" gap="small">
                  <PhoneOutlined style={{ color: token.colorPrimary }} />
                  <Text strong>Hotline: 1900-xxxx</Text>
                </Flex>
                <Text type="secondary" style={{ fontSize: token.fontSizeXS }}>
                  Thời gian làm việc: 8:00 - 17:30 (T2-T6)
                </Text>
              </Space>
            }
            type="info"
            showIcon={false}
          />
        </Space>
      </Card>
    </Flex>
  );
}
