"use client";

import React, { useMemo } from "react";
import { Card, Col, Row, Statistic } from "antd";
import type { CustomerResponse } from "@/shared/validation/customer.schema";

type Props = {
  loading?: boolean;
  data: CustomerResponse[];
};

export default function CustomerStatistics({ loading, data }: Props) {
  const counts = useMemo(() => {
    const total = data.length;
    const braces = data.filter(
      (c) => c.serviceOfInterest === "nieng_rang"
    ).length;
    const implant = data.filter(
      (c) => c.serviceOfInterest === "implant"
    ).length;
    const general = data.filter(
      (c) => c.serviceOfInterest === "tong_quat"
    ).length;
    return { total, braces, implant, general };
  }, [data]);

  return (
    <Row gutter={12} style={{ marginBottom: 16 }}>
      <Col xs={24} md={6}>
        <Card loading={loading}>
          <Statistic title="Tổng khách hàng" value={counts.total} />
        </Card>
      </Col>
      <Col xs={24} md={6}>
        <Card loading={loading}>
          <Statistic title="KH niềng răng" value={counts.braces} />
        </Card>
      </Col>
      <Col xs={24} md={6}>
        <Card loading={loading}>
          <Statistic title="KH implant" value={counts.implant} />
        </Card>
      </Col>
      <Col xs={24} md={6}>
        <Card loading={loading}>
          <Statistic title="KH tổng quát" value={counts.general} />
        </Card>
      </Col>
    </Row>
  );
}
