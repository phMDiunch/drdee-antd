// src/features/sales-pipeline/components/PipelineStatistics.tsx
"use client";

import { Card, Col, Row, Statistic } from "antd";
import {
  TeamOutlined,
  AppstoreOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";

interface PipelineStatisticsProps {
  stats: {
    totalCustomers: number;
    totalServices: number;
    unconfirmedServices: number;
    confirmedServices: number;
  };
  loading?: boolean;
}

export default function PipelineStatistics({
  stats,
  loading,
}: PipelineStatisticsProps) {
  const unconfirmedPercentage =
    stats.totalServices > 0
      ? Math.round((stats.unconfirmedServices / stats.totalServices) * 100)
      : 0;

  const confirmedPercentage =
    stats.totalServices > 0
      ? Math.round((stats.confirmedServices / stats.totalServices) * 100)
      : 0;

  return (
    <Row gutter={16} style={{ marginBottom: 16 }}>
      <Col xs={24} sm={12} lg={6}>
        <Card loading={loading}>
          <Statistic
            title="Tổng khách hàng"
            value={stats.totalCustomers}
            prefix={<TeamOutlined />}
            valueStyle={{ color: "#1890ff" }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card loading={loading}>
          <Statistic
            title="Tổng dịch vụ"
            value={stats.totalServices}
            prefix={<AppstoreOutlined />}
            valueStyle={{ color: "#13c2c2" }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card loading={loading}>
          <Statistic
            title="Chưa chốt"
            value={stats.unconfirmedServices}
            suffix={`(${unconfirmedPercentage}%)`}
            prefix={<ClockCircleOutlined />}
            valueStyle={{ color: "#fa8c16" }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card loading={loading}>
          <Statistic
            title="Đã chốt"
            value={stats.confirmedServices}
            suffix={`(${confirmedPercentage}%)`}
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: "#52c41a" }}
          />
        </Card>
      </Col>
    </Row>
  );
}
