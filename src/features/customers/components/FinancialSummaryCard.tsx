// src/features/customers/components/FinancialSummaryCard.tsx

import { Card, Space, Typography, Row, Col, Empty } from "antd";
import { DollarOutlined } from "@ant-design/icons";
import type { ConsultedServiceResponse } from "@/shared/validation/consulted-service.schema";
import {
  calculateFinancialSummary,
  formatFinancialSummary,
  hasConfirmedServices,
} from "../utils/financialSummary";

const { Text } = Typography;

interface FinancialSummaryCardProps {
  consultedServices?: ConsultedServiceResponse[];
  loading?: boolean;
}

/**
 * Financial Summary Card Component
 * Displays financial metrics calculated from confirmed consulted services
 *
 * Usage: Customer Detail View - Card 2 (Financial Summary)
 * Data source: useConsultedServicesByCustomer hook
 * Business logic: Only count services with serviceStatus === "Đã chốt"
 */
export default function FinancialSummaryCard({
  consultedServices,
  loading = false,
}: FinancialSummaryCardProps) {
  const hasConfirmed = hasConfirmedServices(consultedServices);

  // Empty state: No confirmed services
  if (!loading && !hasConfirmed) {
    return (
      <Card loading={loading}>
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
    );
  }

  // Calculate and format financial summary
  const summary = calculateFinancialSummary(consultedServices);
  const formatted = formatFinancialSummary(summary);

  return (
    <Card loading={loading}>
      <Space direction="vertical" size="small" style={{ width: "100%" }}>
        {/* Header */}
        <Space>
          <DollarOutlined style={{ fontSize: "20px", color: "#1890ff" }} />
          <Text strong style={{ fontSize: "16px" }}>
            Tổng quan tài chính
          </Text>
        </Space>

        {/* Financial metrics */}
        <Row gutter={[0, 8]}>
          {/* Total amount */}
          <Col span={24}>
            <Space style={{ justifyContent: "space-between", width: "100%" }}>
              <Text>{formatted.totalAmount.label}</Text>
              <Text
                strong
                style={{
                  color: formatted.totalAmount.color,
                  fontSize: "14px",
                }}
              >
                {formatted.totalAmount.value}
              </Text>
            </Space>
          </Col>

          {/* Amount paid */}
          <Col span={24}>
            <Space style={{ justifyContent: "space-between", width: "100%" }}>
              <Text>{formatted.amountPaid.label}</Text>
              <Text
                strong
                style={{
                  color: formatted.amountPaid.color,
                  fontSize: "14px",
                }}
              >
                {formatted.amountPaid.value}
              </Text>
            </Space>
          </Col>

          {/* Debt */}
          <Col span={24}>
            <Space style={{ justifyContent: "space-between", width: "100%" }}>
              <Text>{formatted.debt.label}</Text>
              <Text
                strong
                style={{
                  color: formatted.debt.color,
                  fontSize: "14px",
                }}
              >
                {formatted.debt.value}
              </Text>
            </Space>
          </Col>
        </Row>
      </Space>
    </Card>
  );
}
