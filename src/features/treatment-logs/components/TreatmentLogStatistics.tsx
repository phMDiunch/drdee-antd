// src/features/treatment-logs/components/TreatmentLogStatistics.tsx
"use client";

import React from "react";
import { Card, Col, Row, Statistic } from "antd";

type Statistics = {
  totalCheckedInCustomers: number;
  totalTreatedCustomers: number;
  totalTreatmentLogs: number;
  treatmentRate: number;
};

type Props = {
  statistics?: Statistics;
  loading?: boolean;
};

export default function TreatmentLogStatistics({ statistics, loading }: Props) {
  const stats = statistics || {
    totalCheckedInCustomers: 0,
    totalTreatedCustomers: 0,
    totalTreatmentLogs: 0,
    treatmentRate: 0,
  };

  return (
    <Row gutter={16} style={{ marginBottom: 24 }}>
      <Col xs={24} sm={12} md={6}>
        <Card loading={loading}>
          <Statistic
            title="Khách đã check-in"
            value={stats.totalCheckedInCustomers}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card loading={loading}>
          <Statistic
            title="Khách đã điều trị"
            value={stats.totalTreatedCustomers}
            valueStyle={{ color: "#52c41a" }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card loading={loading}>
          <Statistic
            title="Tổng số dịch vụ điều trị"
            value={stats.totalTreatmentLogs}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card loading={loading}>
          <Statistic
            title="Tỷ lệ điều trị"
            value={stats.treatmentRate}
            suffix="%"
            precision={2}
            valueStyle={{
              color: stats.treatmentRate >= 80 ? "#52c41a" : "#fa8c16",
            }}
          />
        </Card>
      </Col>
    </Row>
  );
}
