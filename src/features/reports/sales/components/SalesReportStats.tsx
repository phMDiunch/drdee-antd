import { Card, Row, Col, Statistic, Typography } from "antd";
import {
  DollarOutlined,
  CheckCircleOutlined,
  UserAddOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import type { KpiData } from "@/shared/validation/sales-report.schema";

const { Text } = Typography;

interface KpiCardsProps {
  data: KpiData;
  loading?: boolean;
}

interface GrowthIndicatorProps {
  value: number;
  label: string;
}

function GrowthIndicator({ value, label }: GrowthIndicatorProps) {
  const isPositive = value >= 0;
  const color = isPositive ? "#52c41a" : "#ff4d4f";
  const arrow = isPositive ? "↑" : "↓";

  return (
    <div style={{ fontSize: 13, color, marginTop: 4 }}>
      {arrow} {value >= 0 ? "+" : ""}
      {value.toFixed(1)}% - {label}
    </div>
  );
}

export default function SalesReportStats({ data, loading }: KpiCardsProps) {
  return (
    <Row gutter={[16, 16]}>
      {/* Tổng doanh số */}
      <Col xs={24} sm={12} lg={6}>
        <Card variant="borderless" loading={loading}>
          <Statistic
            title="Tổng doanh số"
            value={data.totalSales}
            prefix={<DollarOutlined style={{ color: "#1890ff" }} />}
            valueStyle={{ color: "#1890ff", fontSize: 28, fontWeight: "bold" }}
            suffix="₫"
          />
          <GrowthIndicator
            value={data.totalSalesGrowthMoM}
            label="vs tháng trước"
          />
          <GrowthIndicator
            value={data.totalSalesGrowthYoY}
            label="vs cùng kỳ năm trước"
          />
        </Card>
      </Col>

      {/* Số dịch vụ chốt */}
      <Col xs={24} sm={12} lg={6}>
        <Card variant="borderless" loading={loading}>
          <Statistic
            title="Số dịch vụ chốt"
            value={data.closedDeals}
            prefix={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
            valueStyle={{ color: "#52c41a", fontSize: 28, fontWeight: "bold" }}
          />
          <GrowthIndicator
            value={data.closedDealsGrowthMoM}
            label="vs tháng trước"
          />
          <GrowthIndicator
            value={data.closedDealsGrowthYoY}
            label="vs cùng kỳ năm trước"
          />
        </Card>
      </Col>

      {/* Số khách mới */}
      <Col xs={24} sm={12} lg={6}>
        <Card variant="borderless" loading={loading}>
          <Statistic
            title="Số khách mới"
            value={data.newCustomers}
            prefix={<UserAddOutlined style={{ color: "#722ed1" }} />}
            valueStyle={{ color: "#722ed1", fontSize: 28, fontWeight: "bold" }}
          />
          <GrowthIndicator
            value={data.newCustomersGrowthMoM}
            label="vs tháng trước"
          />
          <GrowthIndicator
            value={data.newCustomersGrowthYoY}
            label="vs cùng kỳ năm trước"
          />
        </Card>
      </Col>

      {/* Khách mới vs Cũ */}
      <Col xs={24} sm={12} lg={6}>
        <Card variant="borderless" loading={loading}>
          <div style={{ marginBottom: 8 }}>
            <Text type="secondary" style={{ fontSize: 14 }}>
              Khách mới vs Cũ
            </Text>
          </div>
          <div style={{ marginBottom: 8 }}>
            <TeamOutlined style={{ fontSize: 24, color: "#1890ff" }} />
          </div>
          <div>
            <Text
              style={{ fontSize: 16, fontWeight: "bold", color: "#52c41a" }}
            >
              Mới: {data.newCustomerSales.toLocaleString()} ₫
            </Text>
          </div>
          <div>
            <Text style={{ fontSize: 14, color: "#1890ff" }}>
              Cũ: {data.oldCustomerSales.toLocaleString()} ₫
            </Text>
          </div>
          <GrowthIndicator value={data.newCustomerGrowth} label="khách mới" />
        </Card>
      </Col>
    </Row>
  );
}
