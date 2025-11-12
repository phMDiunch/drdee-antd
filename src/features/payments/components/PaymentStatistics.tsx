// src/features/payments/components/PaymentStatistics.tsx
"use client";

import React from "react";
import { Card, Col, Row, Statistic, Spin, Typography } from "antd";
import { PAYMENT_METHODS } from "../constants";
import type { PaymentVouchersDailyStatistics } from "@/shared/validation/payment-voucher.schema";
import { DollarOutlined } from "@ant-design/icons";

type Props = {
  statistics: PaymentVouchersDailyStatistics | null | undefined;
  loading?: boolean;
};

/**
 * Format number to VND currency
 */
export const formatVND = (amount: number): string => {
  if (!amount && amount !== 0) return "0 đ";
  return amount.toLocaleString("vi-VN") + " đ";
};

const { Text } = Typography;

export default function PaymentStatistics({ statistics, loading }: Props) {
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!statistics) {
    return null;
  }

  return (
    <Row gutter={[16, 16]}>
      {/* Main card - Total */}
      <Col xs={24} sm={24} md={24} lg={6}>
        <Card>
          <Statistic
            title="Tổng tiền thu"
            value={statistics.totalAmount}
            formatter={(value) => `${formatVND(Number(value))}`}
            prefix={<DollarOutlined style={{ color: "#52c41a" }} />}
            valueStyle={{ color: "#52c41a", fontSize: "20px" }}
          />
          <Text type="secondary">{statistics.totalCount} phiếu thu</Text>
        </Card>
      </Col>

      {/* Method cards */}
      {PAYMENT_METHODS.map((method) => {
        const stat = statistics.byMethod[method.value] || {
          amount: 0,
          count: 0,
        };
        return (
          <Col xs={24} sm={12} md={6} lg={4} key={method.value}>
            <Card>
              <Statistic
                title={`${method.icon} ${method.label}`}
                value={stat.amount}
                formatter={(value) => formatVND(Number(value))}
                valueStyle={{ fontSize: 20, color: method.color }}
              />
            </Card>
          </Col>
        );
      })}
    </Row>
  );
}
