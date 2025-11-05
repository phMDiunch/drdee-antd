// src/features/consulted-services/components/ConsultedServiceStatistics.tsx
"use client";

import React from "react";
import { Card, Col, Row, Statistic } from "antd";

type Statistics = {
  total: number;
  confirmed: number;
  unconfirmed: number;
  totalValue: number;
  confirmedValue: number;
};

type Props = {
  statistics?: Statistics;
  loading?: boolean;
};

/**
 * Format number to VND currency
 */
function formatVND(value: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
}

export default function ConsultedServiceStatistics({
  statistics,
  loading,
}: Props) {
  const stats = statistics || {
    total: 0,
    confirmed: 0,
    unconfirmed: 0,
    totalValue: 0,
    confirmedValue: 0,
  };

  return (
    <Row gutter={16} style={{ marginBottom: 24 }}>
      <Col xs={24} sm={12} md={6}>
        <Card loading={loading}>
          <Statistic title="Tổng dịch vụ" value={stats.total} />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card loading={loading}>
          <Statistic
            title="Đã chốt"
            value={stats.confirmed}
            valueStyle={{ color: "#52c41a" }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card loading={loading}>
          <Statistic
            title="Chưa chốt"
            value={stats.unconfirmed}
            valueStyle={{ color: "#fa8c16" }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card loading={loading}>
          <Statistic
            title="Tổng giá trị"
            value={formatVND(stats.confirmedValue)}
            suffix={`/ ${formatVND(stats.totalValue)}`}
            valueStyle={{ fontSize: 18 }}
          />
        </Card>
      </Col>
    </Row>
  );
}
