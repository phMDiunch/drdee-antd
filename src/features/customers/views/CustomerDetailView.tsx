// src/features/customers/views/CustomerDetailView.tsx
"use client";

import { useState } from "react";
import { Row, Col, Card, Tabs, Empty, Space, Typography, Spin } from "antd";
import { UserOutlined, IdcardOutlined, PhoneOutlined } from "@ant-design/icons";
import { useCustomerDetail } from "@/features/customers";
import CustomerInfoTab from "../components/detail-tabs/CustomerInfoTab";
import AppointmentsTab from "../components/detail-tabs/AppointmentsTab";
import ConsultedServicesTab from "../components/detail-tabs/ConsultedServicesTab";
import TreatmentLogsTab from "../components/detail-tabs/TreatmentLogsTab";
import TreatmentCareTab from "../components/detail-tabs/TreatmentCareTab";
import PaymentsTab from "../components/detail-tabs/PaymentsTab";
import dayjs from "dayjs";

const { Text } = Typography;

interface CustomerDetailViewProps {
  customerId: string;
}

/**
 * Customer Detail View - Main page component
 * Phase 1: Summary Cards + Tab system with CustomerInfoTab
 * Phase 2+: Populate other tabs when modules are ready
 */
export default function CustomerDetailView({
  customerId,
}: CustomerDetailViewProps) {
  const [activeTab, setActiveTab] = useState<string>("info");

  const {
    data: customer,
    isLoading,
    error,
    refetch,
  } = useCustomerDetail(customerId);

  // Calculate age from dob
  const getAge = (dob: string | null) => {
    if (!dob) return null;
    return dayjs().diff(dayjs(dob), "year");
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "100px 0" }}>
        <Spin size="large">
          <div style={{ paddingTop: 50 }}>Đang tải thông tin khách hàng...</div>
        </Spin>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "50px 0" }}>
        <Empty
          description={
            <Text type="danger">
              {error instanceof Error
                ? error.message
                : "Không thể tải thông tin khách hàng"}
            </Text>
          }
        />
      </div>
    );
  }

  if (!customer) {
    return (
      <div style={{ textAlign: "center", padding: "50px 0" }}>
        <Empty description="Không tìm thấy khách hàng" />
      </div>
    );
  }

  const age = getAge(customer.dob);

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      {/* Summary Cards */}
      <Row gutter={16}>
        {/* Card 1: Customer Basic Info */}
        <Col xs={24} md={12}>
          <Card>
            <Space direction="vertical" size="small" style={{ width: "100%" }}>
              <Space>
                <UserOutlined style={{ fontSize: "20px" }} />
                <Text strong style={{ fontSize: "18px" }}>
                  {customer.fullName}
                  {age !== null && <Text type="secondary"> ({age} tuổi)</Text>}
                </Text>
              </Space>

              <Space>
                <IdcardOutlined />
                <Text type="secondary">
                  Mã KH: {customer.customerCode || "—"}
                </Text>
              </Space>

              <Space>
                <PhoneOutlined />
                <Text>{customer.phone || "—"}</Text>
              </Space>

              {/* Phase 2: Check-in status */}
              {/* <Space>
                <ClockCircleOutlined />
                <Text type="warning">Chưa check-in</Text>
              </Space> */}
            </Space>
          </Card>
        </Col>

        {/* Card 2: Financial Summary - Placeholder Phase 1 */}
        <Col xs={24} md={12}>
          <Card>
            <Space
              direction="vertical"
              size="small"
              style={{ width: "100%", textAlign: "center" }}
            >
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="📋 Chưa có dịch vụ nào được chốt"
              />
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Tabs */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "info",
              label: "Thông tin chung",
              children: (
                <CustomerInfoTab
                  customer={customer}
                  onEditSuccess={() => refetch()}
                />
              ),
            },
            {
              key: "appointments",
              label: "Lịch hẹn (0)",
              children: <AppointmentsTab />,
            },
            {
              key: "consultedServices",
              label: "Dịch vụ (0)",
              children: <ConsultedServicesTab />,
            },
            {
              key: "payments",
              label: "Phiếu thu",
              children: <PaymentsTab />,
            },
            {
              key: "treatmentLogs",
              label: "Lịch sử điều trị",
              children: <TreatmentLogsTab />,
            },
            {
              key: "treatmentCare",
              label: "Chăm sóc sau điều trị",
              children: <TreatmentCareTab />,
            },
          ]}
        />
      </Card>
    </Space>
  );
}
