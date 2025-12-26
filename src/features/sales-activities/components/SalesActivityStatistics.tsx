// src/features/sales-activities/components/SalesActivityStatistics.tsx
"use client";

import React from "react";
import { Card, Col, Row, Statistic } from "antd";
import {
  PhoneOutlined,
  MessageOutlined,
  TeamOutlined,
} from "@ant-design/icons";

type Statistics = {
  totalActivities: number;
  totalCustomers: number;
  totalServices: number;
  contactTypeDistribution: {
    call: number;
    message: number;
    meet: number;
  };
};

type Props = {
  statistics?: Statistics;
  loading?: boolean;
};

export default function SalesActivityStatistics({
  statistics,
  loading,
}: Props) {
  const stats = statistics || {
    totalActivities: 0,
    totalCustomers: 0,
    totalServices: 0,
    contactTypeDistribution: { call: 0, message: 0, meet: 0 },
  };

  return (
    <Row gutter={16} style={{ marginBottom: 24 }}>
      <Col xs={24} sm={12} md={6}>
        <Card loading={loading}>
          <Statistic
            title="Tổng số liên hệ"
            value={stats.totalActivities}
            suffix="liên hệ"
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card loading={loading}>
          <Statistic
            title="Số khách được liên hệ"
            value={stats.totalCustomers}
            suffix="khách"
            valueStyle={{ color: "#52c41a" }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card loading={loading}>
          <Statistic
            title="Số dịch vụ được follow"
            value={stats.totalServices}
            suffix="dịch vụ"
            valueStyle={{ color: "#1890ff" }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card loading={loading}>
          <div>
            <div
              style={{
                color: "rgba(0, 0, 0, 0.45)",
                fontSize: 14,
                marginBottom: 8,
              }}
            >
              Phân bố theo loại
            </div>
            <div style={{ fontSize: 20, fontWeight: 500 }}>
              <PhoneOutlined /> {stats.contactTypeDistribution.call}{" "}
              <MessageOutlined style={{ marginLeft: 8 }} />{" "}
              {stats.contactTypeDistribution.message}{" "}
              <TeamOutlined style={{ marginLeft: 8 }} />{" "}
              {stats.contactTypeDistribution.meet}
            </div>
          </div>
        </Card>
      </Col>
    </Row>
  );
}
