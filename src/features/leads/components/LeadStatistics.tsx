// src/features/leads/components/LeadStatistics.tsx
"use client";

import React, { useMemo } from "react";
import { Card, Col, Row, Statistic } from "antd";
import type { LeadResponse } from "@/shared/validation/lead.schema";

type Props = {
  loading?: boolean;
  data: LeadResponse[];
};

export default function LeadStatistics({ loading, data }: Props) {
  const counts = useMemo(() => {
    const total = data.length;
    const braces = data.filter(
      (lead) => lead.serviceOfInterest === "nieng_rang"
    ).length;
    const implant = data.filter(
      (lead) => lead.serviceOfInterest === "implant"
    ).length;
    const general = data.filter(
      (lead) => lead.serviceOfInterest === "tong_quat"
    ).length;
    return { total, braces, implant, general };
  }, [data]);

  return (
    <Row gutter={12} style={{ marginBottom: 16 }}>
      <Col xs={24} md={6}>
        <Card loading={loading}>
          <Statistic title="📊 Tổng Lead" value={counts.total} />
        </Card>
      </Col>
      <Col xs={24} md={6}>
        <Card loading={loading}>
          <Statistic title="🦷 Niềng răng" value={counts.braces} />
        </Card>
      </Col>
      <Col xs={24} md={6}>
        <Card loading={loading}>
          <Statistic title="🔩 Implant" value={counts.implant} />
        </Card>
      </Col>
      <Col xs={24} md={6}>
        <Card loading={loading}>
          <Statistic title="🏥 Tổng quát" value={counts.general} />
        </Card>
      </Col>
    </Row>
  );
}
