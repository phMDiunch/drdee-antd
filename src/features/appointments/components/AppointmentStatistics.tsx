// src/features/appointments/components/AppointmentStatistics.tsx
"use client";

import React, { useMemo } from "react";
import { Card, Col, Row, Statistic } from "antd";

type Props = {
  data: Array<{
    status: string;
    checkInTime?: string | null;
    checkOutTime?: string | null;
  }>;
  loading?: boolean;
};

export default function AppointmentStatistics({ data, loading }: Props) {
  const stats = useMemo(() => {
    const total = data.length;
    const checkedIn = data.filter((a) => a.checkInTime).length;
    const inProgress = data.filter(
      (a) => a.checkInTime && !a.checkOutTime
    ).length;
    const notCheckedIn = total - checkedIn;

    return { total, checkedIn, inProgress, notCheckedIn };
  }, [data]);

  return (
    <Row gutter={16} style={{ marginBottom: 24 }}>
      <Col span={6}>
        <Card loading={loading}>
          <Statistic title="Tổng lịch hẹn" value={stats.total} />
        </Card>
      </Col>
      <Col span={6}>
        <Card loading={loading}>
          <Statistic
            title="Đã check-in"
            value={stats.checkedIn}
            valueStyle={{ color: "#3f8600" }}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card loading={loading}>
          <Statistic
            title="Đang khám"
            value={stats.inProgress}
            valueStyle={{ color: "#1890ff" }}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card loading={loading}>
          <Statistic
            title="Chưa đến"
            value={stats.notCheckedIn}
            valueStyle={{ color: "#faad14" }}
          />
        </Card>
      </Col>
    </Row>
  );
}
