"use client";

import { Card, Col, Row, Statistic } from "antd";
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  DollarOutlined,
  TransactionOutlined,
  BarChartOutlined,
  PieChartOutlined,
} from "@ant-design/icons";
import type { RevenueKPI } from "../types";
import { formatCurrency, formatPercentage } from "../utils";

interface RevenueKpiCardsProps {
  kpi: RevenueKPI;
}

export default function RevenueKpiCards({ kpi }: RevenueKpiCardsProps) {
  const isPositiveChange = kpi.percentageChange >= 0;

  // Calculate payment method percentages
  const totalRevenue = kpi.totalRevenue;
  const paymentPercentages = {
    cash:
      totalRevenue > 0
        ? (kpi.paymentMethodBreakdown.cash / totalRevenue) * 100
        : 0,
    card:
      totalRevenue > 0
        ? (kpi.paymentMethodBreakdown.card / totalRevenue) * 100
        : 0,
    visa:
      totalRevenue > 0
        ? (kpi.paymentMethodBreakdown.visa / totalRevenue) * 100
        : 0,
    transfer:
      totalRevenue > 0
        ? (kpi.paymentMethodBreakdown.transfer / totalRevenue) * 100
        : 0,
  };

  return (
    <Row gutter={[16, 16]}>
      {/* Total Revenue */}
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Tổng doanh thu (Tháng)"
            value={kpi.totalRevenue}
            formatter={(value) => formatCurrency(Number(value))}
            prefix={<DollarOutlined />}
            valueStyle={{ color: "#1890ff" }}
          />
          <div style={{ marginTop: 8, fontSize: 14 }}>
            {isPositiveChange ? (
              <span style={{ color: "#52c41a" }}>
                <ArrowUpOutlined />{" "}
                {formatPercentage(Math.abs(kpi.percentageChange))}
              </span>
            ) : (
              <span style={{ color: "#ff4d4f" }}>
                <ArrowDownOutlined />{" "}
                {formatPercentage(Math.abs(kpi.percentageChange))}
              </span>
            )}{" "}
            <span style={{ color: "#8c8c8c" }}>so với tháng trước</span>
          </div>
        </Card>
      </Col>

      {/* Transaction Count */}
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Số giao dịch"
            value={kpi.transactionCount}
            prefix={<TransactionOutlined />}
            valueStyle={{ color: "#52c41a" }}
          />
          <div style={{ marginTop: 8, fontSize: 14, color: "#8c8c8c" }}>
            Tổng số lượt thu trong tháng
          </div>
        </Card>
      </Col>

      {/* Average per Transaction */}
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Doanh thu trung bình / giao dịch"
            value={kpi.avgPerTransaction}
            formatter={(value) => formatCurrency(Number(value))}
            prefix={<BarChartOutlined />}
            valueStyle={{ color: "#722ed1" }}
          />
          <div style={{ marginTop: 8, fontSize: 14, color: "#8c8c8c" }}>
            Giá trị trung bình mỗi giao dịch
          </div>
        </Card>
      </Col>

      {/* Payment Method Breakdown */}
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Tỷ lệ thu theo phương thức"
            value=""
            prefix={<PieChartOutlined />}
          />
          <div style={{ marginTop: 8, fontSize: 12, lineHeight: 1.8 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>💵 Tiền mặt:</span>
              <strong>{formatPercentage(paymentPercentages.cash)}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>💳 Quẹt thẻ:</span>
              <strong>{formatPercentage(paymentPercentages.card)}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>💎 Visa:</span>
              <strong>{formatPercentage(paymentPercentages.visa)}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>🏦 Chuyển khoản:</span>
              <strong>{formatPercentage(paymentPercentages.transfer)}</strong>
            </div>
          </div>
        </Card>
      </Col>
    </Row>
  );
}
