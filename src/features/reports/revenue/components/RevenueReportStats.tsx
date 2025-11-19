import { Card, Row, Col, Statistic } from "antd";
import type { RevenueKpiData } from "@/shared/validation/revenue-report.schema";

interface RevenueReportStatsProps {
  data: RevenueKpiData;
  loading?: boolean;
}

interface GrowthIndicatorProps {
  value: number | null;
}

function GrowthIndicator({ value }: GrowthIndicatorProps) {
  if (value === null) {
    return (
      <div style={{ fontSize: 13, color: "#8c8c8c", marginTop: 4 }}>
        Chưa có dữ liệu tháng trước
      </div>
    );
  }

  const isPositive = value >= 0;
  const color = isPositive ? "#52c41a" : "#ff4d4f";
  const arrow = isPositive ? "↑" : "↓";

  return (
    <div style={{ fontSize: 13, color, marginTop: 4 }}>
      {arrow} {value >= 0 ? "+" : ""}
      {value.toFixed(1)}% vs tháng trước
    </div>
  );
}

interface PercentageBadgeProps {
  value: number;
}

function PercentageBadge({ value }: PercentageBadgeProps) {
  return (
    <div style={{ fontSize: 13, color: "#8c8c8c", marginTop: 4 }}>
      {value.toFixed(1)}% tổng
    </div>
  );
}

export default function RevenueReportStats({
  data,
  loading,
}: RevenueReportStatsProps) {
  return (
    <Row gutter={[16, 16]}>
      {/* Tổng doanh thu */}
      <Col xs={24} sm={24} md={24} lg={6}>
        <Card variant="borderless" loading={loading}>
          <Statistic
            title="Tổng doanh thu"
            value={data.totalRevenue}
            formatter={(value) => `${Number(value).toLocaleString("vi-VN")} ₫`}
            valueStyle={{ color: "#1890ff", fontSize: 20 }}
          />
          <GrowthIndicator value={data.totalRevenueGrowthMoM} />
        </Card>
      </Col>

      {/* Tiền mặt */}
      <Col xs={24} sm={12} md={6} lg={4}>
        <Card variant="borderless" loading={loading}>
          <Statistic
            title="💵 Tiền mặt"
            value={data.cash}
            formatter={(value) => `${Number(value).toLocaleString("vi-VN")} ₫`}
            valueStyle={{ fontSize: 20, color: "#52c41a" }}
          />
          <PercentageBadge value={data.cashPercentage} />
        </Card>
      </Col>

      {/* Quẹt thẻ thường */}
      <Col xs={24} sm={12} md={6} lg={4}>
        <Card variant="borderless" loading={loading}>
          <Statistic
            title="💳 Quẹt thẻ thường"
            value={data.cardRegular}
            formatter={(value) => `${Number(value).toLocaleString("vi-VN")} ₫`}
            valueStyle={{ fontSize: 20, color: "#1890ff" }}
          />
          <PercentageBadge value={data.cardRegularPercentage} />
        </Card>
      </Col>

      {/* Quẹt thẻ Visa */}
      <Col xs={24} sm={12} md={6} lg={4}>
        <Card variant="borderless" loading={loading}>
          <Statistic
            title="💎 Quẹt thẻ Visa"
            value={data.cardVisa}
            formatter={(value) => `${Number(value).toLocaleString("vi-VN")} ₫`}
            valueStyle={{ fontSize: 20, color: "#722ed1" }}
          />
          <PercentageBadge value={data.cardVisaPercentage} />
        </Card>
      </Col>

      {/* Chuyển khoản */}
      <Col xs={24} sm={12} md={6} lg={4}>
        <Card variant="borderless" loading={loading}>
          <Statistic
            title="🏦 Chuyển khoản"
            value={data.transfer}
            formatter={(value) => `${Number(value).toLocaleString("vi-VN")} ₫`}
            valueStyle={{ fontSize: 20, color: "#fa8c16" }}
          />
          <PercentageBadge value={data.transferPercentage} />
        </Card>
      </Col>
    </Row>
  );
}
