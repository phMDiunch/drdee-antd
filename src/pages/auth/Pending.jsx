import React from "react";
import { useNavigate } from "react-router-dom";
import { Result, Button, Card, Typography } from "antd";
import { ClockCircleOutlined, HomeOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export default function Pending() {
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
          maxWidth: "600px",
          borderRadius: "16px",
          boxShadow: "0 20px 40px rgba(0, 180, 170, 0.2)",
          border: "none",
          textAlign: "center",
        }}
        bodyStyle={{ padding: "60px 40px" }}
      >
        <Result
          icon={
            <ClockCircleOutlined
              style={{
                fontSize: "80px",
                color: "#00b4aa",
                marginBottom: "24px",
              }}
            />
          }
          title={
            <Title
              level={2}
              style={{
                color: "#00b4aa",
                marginBottom: "16px",
                fontWeight: "700",
              }}
            >
              Tài Khoản Đang Chờ Phê Duyệt
            </Title>
          }
          subTitle={
            <div style={{ marginBottom: "32px" }}>
              <Text
                style={{
                  fontSize: "16px",
                  color: "#666",
                  lineHeight: "1.6",
                  display: "block",
                  marginBottom: "12px",
                }}
              >
                Cảm ơn bạn đã đăng ký tài khoản!
              </Text>
              <Text
                style={{
                  fontSize: "16px",
                  color: "#666",
                  lineHeight: "1.6",
                  display: "block",
                }}
              >
                Tài khoản của bạn đang được xem xét và sẽ được phê duyệt trong thời gian sớm nhất.
              </Text>
            </div>
          }
          extra={[
            <Button
              key="home"
              type="primary"
              size="large"
              icon={<HomeOutlined />}
              onClick={() => navigate("/")}
              style={{
                height: "48px",
                borderRadius: "12px",
                backgroundColor: "#00b4aa",
                borderColor: "#00b4aa",
                fontSize: "16px",
                fontWeight: "600",
                background: "linear-gradient(135deg, #00b4aa 0%, #48d8cd 100%)",
                border: "none",
                paddingLeft: "32px",
                paddingRight: "32px",
              }}
            >
              Về Trang Chủ
            </Button>,
            <Button
              key="signin"
              size="large"
              onClick={() => navigate("/signin")}
              style={{
                height: "48px",
                borderRadius: "12px",
                borderColor: "#00b4aa",
                color: "#00b4aa",
                fontSize: "16px",
                fontWeight: "600",
                paddingLeft: "32px",
                paddingRight: "32px",
                marginLeft: "16px",
              }}
            >
              Đăng Nhập
            </Button>,
          ]}
        />

        <div
          style={{
            marginTop: "40px",
            padding: "24px",
            backgroundColor: "#f8f9fa",
            borderRadius: "12px",
            border: "1px solid #e6f7ff",
          }}
        >
          <Text
            style={{
              fontSize: "14px",
              color: "#666",
              fontStyle: "italic",
              lineHeight: "1.5",
            }}
          >
            💡 <strong>Lưu ý:</strong> Quá trình phê duyệt thường mất từ 1-3 ngày làm việc.
            Chúng tôi sẽ thông báo kết quả qua email mà bạn đã đăng ký.
          </Text>
        </div>
      </Card>
    </div>
  );
}
