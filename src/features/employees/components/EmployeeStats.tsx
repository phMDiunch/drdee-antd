"use client";

import React from "react";
import { Card, Col, Row, Statistic } from "antd";

type Props = {
  total: number;
  pending: number;
  working: number;
  resigned: number;
};

export default function EmployeeStats({ total, pending, working, resigned }: Props) {
  return (
    <Row gutter={12} style={{ marginBottom: 16 }}>
      <Col xs={24} md={6}>
        <Card size="small">
          <Statistic title="Tổng số nhân viên" value={total} />
        </Card>
      </Col>
      <Col xs={24} md={6}>
        <Card size="small">
          <Statistic title="Chưa hoàn tất" value={pending} />
        </Card>
      </Col>
      <Col xs={24} md={6}>
        <Card size="small">
          <Statistic title="Đang làm việc" value={working} valueStyle={{ color: "#3f8600" }} />
        </Card>
      </Col>
      <Col xs={24} md={6}>
        <Card size="small">
          <Statistic title="Đã nghỉ việc" value={resigned} valueStyle={{ color: "#cf1322" }} />
        </Card>
      </Col>
    </Row>
  );
}

