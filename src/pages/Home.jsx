import React, { useState, useEffect } from "react";
import {
  Layout,
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Space,
  Button,
  Table,
  Tag,
  Progress,
  theme,
} from "antd";
import {
  UserOutlined,
  FileTextOutlined,
  ProjectOutlined,
  TrophyOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../contexts/AuthContext";

const { Content } = Layout;
const { Title, Text } = Typography;

export default function Home() {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const { token } = theme.useToken();
  const { user } = useAuth();

  // Handle window resize
  React.useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        setCollapsed(true); // Close sidebar on mobile by default
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Call once on mount

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggle = () => {
    setCollapsed(!collapsed);
  };

  const handleSidebarClose = () => {
    setCollapsed(true);
  };

  // Sample data for dashboard
  const stats = [
    {
      title: "Tổng người dùng",
      value: 1234,
      prefix: <UserOutlined style={{ color: token.colorPrimary }} />,
      suffix: <ArrowUpOutlined style={{ color: "#52c41a" }} />,
      valueStyle: { color: token.colorPrimary },
    },
    {
      title: "Tài liệu",
      value: 856,
      prefix: <FileTextOutlined style={{ color: "#52c41a" }} />,
      suffix: <ArrowUpOutlined style={{ color: "#52c41a" }} />,
      valueStyle: { color: "#52c41a" },
    },
    {
      title: "Dự án",
      value: 42,
      prefix: <ProjectOutlined style={{ color: "#fa8c16" }} />,
      suffix: <ArrowDownOutlined style={{ color: "#ff4d4f" }} />,
      valueStyle: { color: "#fa8c16" },
    },
    {
      title: "Thành tích",
      value: 98,
      prefix: <TrophyOutlined style={{ color: "#722ed1" }} />,
      suffix: "%",
      valueStyle: { color: "#722ed1" },
    },
  ];

  const recentActivities = [
    {
      key: "1",
      action: "Thêm tài liệu mới",
      user: "Nguyễn Văn A",
      time: "2 phút trước",
      status: "success",
    },
    {
      key: "2",
      action: "Cập nhật dự án",
      user: "Trần Thị B",
      time: "5 phút trước",
      status: "processing",
    },
    {
      key: "3",
      action: "Hoàn thành task",
      user: "Lê Văn C",
      time: "10 phút trước",
      status: "success",
    },
    {
      key: "4",
      action: "Tạo báo cáo",
      user: "Phạm Thị D",
      time: "15 phút trước",
      status: "warning",
    },
  ];

  const activityColumns = [
    {
      title: "Hoạt động",
      dataIndex: "action",
      key: "action",
    },
    {
      title: "Người thực hiện",
      dataIndex: "user",
      key: "user",
    },
    {
      title: "Thời gian",
      dataIndex: "time",
      key: "time",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const statusConfig = {
          success: { color: "green", text: "Hoàn thành" },
          processing: { color: "blue", text: "Đang xử lý" },
          warning: { color: "orange", text: "Chờ duyệt" },
        };
        return (
          <Tag color={statusConfig[status].color}>
            {statusConfig[status].text}
          </Tag>
        );
      },
    },
    {
      title: "Thao tác",
      key: "action",
      render: () => (
        <Space size="middle">
          <Button type="text" icon={<EyeOutlined />} size="small" />
          <Button type="text" icon={<EditOutlined />} size="small" />
          <Button type="text" icon={<DeleteOutlined />} size="small" danger />
        </Space>
      ),
    },
  ];

  const projects = [
    {
      name: "Dự án Website",
      progress: 85,
      status: "Đang triển khai",
      team: 5,
    },
    {
      name: "Ứng dụng Mobile",
      progress: 60,
      status: "Phát triển",
      team: 3,
    },
    {
      name: "Hệ thống quản lý",
      progress: 95,
      status: "Sắp hoàn thành",
      team: 7,
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar
        collapsed={collapsed}
        onClose={handleSidebarClose}
        isMobile={isMobile}
      />
      <Layout
        style={{
          marginLeft: isMobile ? 0 : (collapsed ? 80 : 250),
          transition: "all 0.2s",
        }}
      >
        <Header collapsed={collapsed} onToggle={toggle} />
        <Content
          style={{
            margin: "24px 24px 0",
            overflow: "initial",
            background: token.colorBgLayout,
          }}
        >
          <div
            style={{
              padding: 24,
              background: token.colorBgContainer,
              borderRadius: token.borderRadiusLG,
              marginBottom: 24,
            }}
          >
            <Title level={2} style={{ marginBottom: 24 }}>
              Trang chủ
            </Title>

            {/* Statistics Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              {stats.map((stat, index) => (
                <Col xs={24} sm={12} md={6} key={index}>
                  <Card hoverable>
                    <Statistic
                      title={stat.title}
                      value={stat.value}
                      prefix={stat.prefix}
                      suffix={stat.suffix}
                      valueStyle={stat.valueStyle}
                    />
                  </Card>
                </Col>
              ))}
            </Row>

            {/* Main Content */}
            <Row gutter={[16, 16]}>
              {/* Recent Activities */}
              <Col xs={24} lg={16}>
                <Card
                  title="Hoạt động gần đây"
                  extra={
                    <Button type="primary" size="small">
                      Xem tất cả
                    </Button>
                  }
                >
                  <Table
                    dataSource={recentActivities}
                    columns={activityColumns}
                    pagination={false}
                    size="small"
                  />
                </Card>
              </Col>

              {/* Project Progress */}
              <Col xs={24} lg={8}>
                <Card title="Tiến độ dự án">
                  <Space direction="vertical" style={{ width: "100%" }}>
                    {projects.map((project, index) => (
                      <div key={index} style={{ marginBottom: 16 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 8,
                          }}
                        >
                          <Text strong>{project.name}</Text>
                          <Text type="secondary">{project.progress}%</Text>
                        </div>
                        <Progress
                          percent={project.progress}
                          size="small"
                          status={project.progress >= 90 ? "success" : "active"}
                        />
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginTop: 4,
                          }}
                        >
                          <Tag color="blue">{project.status}</Tag>
                          <Text type="secondary">{project.team} thành viên</Text>
                        </div>
                      </div>
                    ))}
                  </Space>
                </Card>
              </Col>
            </Row>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

