import React from "react";
import { Card, Col, Row, Statistic } from "antd";
import { ExperimentOutlined, DollarOutlined } from "@ant-design/icons";
import type { LaboKpiData } from "@/shared/validation/labo-report.schema";

type Props = {
  data: LaboKpiData | undefined;
  loading: boolean;
};

interface GrowthIndicatorProps {
  value: number | null;
}

function GrowthIndicator({ value }: GrowthIndicatorProps) {
  if (value === null) return null;

  const isPositive = value >= 0;
  const color = isPositive ? "#52c41a" : "#ff4d4f";
  const arrow = isPositive ? "↑" : "↓";

  return (
    <div style={{ fontSize: 13, color, marginTop: 4 }}>
      {arrow} {value >= 0 ? "+" : ""}
      {value.toFixed(1)}% - vs tháng trước
    </div>
  );
}

export default function LaboReportStats({ data, loading }: Props) {
  if (!data) return null;

  return (
    <Row gutter={[16, 16]}>
      {/* Tổng đơn */}
      <Col xs={24} sm={12}>
        <Card variant="borderless" loading={loading}>
          <Statistic
            title="Tổng đơn"
            value={data.totalOrders}
            prefix={<ExperimentOutlined style={{ color: "#1890ff" }} />}
            valueStyle={{ color: "#1890ff", fontSize: 20 }}
          />
          <GrowthIndicator value={data.totalOrdersGrowthMoM} />
        </Card>
      </Col>

      {/* Tổng chi phí */}
      <Col xs={24} sm={12}>
        <Card variant="borderless" loading={loading}>
          <Statistic
            title="Tổng chi phí"
            value={data.totalCost}
            prefix={<DollarOutlined style={{ color: "#52c41a" }} />}
            suffix="₫"
            valueStyle={{ color: "#52c41a", fontSize: 20 }}
          />
          <GrowthIndicator value={data.totalCostGrowthMoM} />
        </Card>
      </Col>
    </Row>
  );
}
