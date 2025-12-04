// src/features/labo-orders/components/LaboOrderStatistics.tsx
"use client";

import { useMemo } from "react";
import { Card, Col, Row, Statistic } from "antd";

interface LaboOrderStatisticsProps {
  sentOrders: Array<{ returnDate: string | null }>;
  returnedOrders: Array<{ returnDate: string | null }>;
  loading?: boolean;
}

export function LaboOrderStatistics({
  sentOrders,
  returnedOrders,
  loading,
}: LaboOrderStatisticsProps) {
  const stats = useMemo(() => {
    const sentToday = sentOrders.length;
    const returnedToday = returnedOrders.length;

    return { sentToday, returnedToday };
  }, [sentOrders, returnedOrders]);

  return (
    <Row gutter={16} style={{ marginBottom: 24 }}>
      <Col span={12}>
        <Card loading={loading}>
          <Statistic
            title="Gửi đi hôm nay"
            value={stats.sentToday}
            valueStyle={{ color: "#1890ff" }}
          />
        </Card>
      </Col>
      <Col span={12}>
        <Card loading={loading}>
          <Statistic
            title="Nhận về hôm nay"
            value={stats.returnedToday}
            valueStyle={{ color: "#52c41a" }}
          />
        </Card>
      </Col>
    </Row>
  );
}
