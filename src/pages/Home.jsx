import React from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Typography, Row, Col } from "antd";
import { UserAddOutlined, LoginOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export default function Home() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #00b4aa 0%, #48d8cd 100%)",
        padding: "20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: "800px",
          borderRadius: "16px",
          boxShadow: "0 20px 40px rgba(0, 180, 170, 0.2)",
          border: "none",
          textAlign: "center",
        }}
        bodyStyle={{ padding: "60px 40px" }}
      >
        <Title
          level={1}
          style={{
            color: "#00b4aa",
            marginBottom: "16px",
            fontWeight: "700",
            fontSize: "48px",
          }}
        >
          DrDee Platform
        </Title>

        <Text
          style={{
            fontSize: "18px",
            color: "#666",
            lineHeight: "1.6",
            display: "block",
            marginBottom: "48px",
          }}
        >
          Chào mừng bạn đến với hệ thống quản lý người dùng DrDee.
          <br />
          Hãy đăng ký hoặc đăng nhập để bắt đầu sử dụng dịch vụ.
        </Text>

        <Row gutter={24} justify="center">
          <Col xs={24} sm={12} md={8}>
            <Button
              type="primary"
              size="large"
              icon={<UserAddOutlined />}
              onClick={() => navigate("/signup")}
              style={{
                height: "56px",
                borderRadius: "12px",
                backgroundColor: "#00b4aa",
                borderColor: "#00b4aa",
                fontSize: "16px",
                fontWeight: "600",
                background: "linear-gradient(135deg, #00b4aa 0%, #48d8cd 100%)",
                border: "none",
                width: "100%",
              }}
            >
              Đăng Ký
            </Button>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Button
              size="large"
              icon={<LoginOutlined />}
              onClick={() => navigate("/signin")}
              style={{
                height: "56px",
                borderRadius: "12px",
                borderColor: "#00b4aa",
                color: "#00b4aa",
                fontSize: "16px",
                fontWeight: "600",
                width: "100%",
                marginTop: window.innerWidth < 576 ? "16px" : "0",
              }}
            >
              Đăng Nhập
            </Button>
          </Col>
        </Row>

        <div
          style={{
            marginTop: "48px",
            padding: "24px",
            backgroundColor: "#f8f9fa",
            borderRadius: "12px",
            border: "1px solid #e6f7ff",
          }}
        >
          <Title level={4} style={{ color: "#00b4aa", marginBottom: "16px" }}>
            ✨ Tính năng nổi bật
          </Title>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Text style={{ color: "#666", fontSize: "14px" }}>
                🔐 Bảo mật cao với Firebase
              </Text>
            </Col>
            <Col xs={24} md={8}>
              <Text style={{ color: "#666", fontSize: "14px" }}>
                📱 Giao diện responsive
              </Text>
            </Col>
            <Col xs={24} md={8}>
              <Text style={{ color: "#666", fontSize: "14px" }}>
                ⚡ Xử lý nhanh chóng
              </Text>
            </Col>
          </Row>
        </div>
      </Card>
    </div>
  );
}
