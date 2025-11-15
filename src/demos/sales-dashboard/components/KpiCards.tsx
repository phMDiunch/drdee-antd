"use client";

import React from "react";
import { Row, Col, Card, Statistic } from "antd";
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  UserOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import type { KpiData } from "../types";

interface KpiCardsProps {
  data: KpiData;
}

export default function KpiCards({ data }: KpiCardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const kpiItems = [
    {
      title: "Tổng doanh số",
      value: data.totalSales,
      formatter: formatCurrency,
      prefix: <DollarOutlined style={{ color: "#1890ff" }} />,
      valueStyle: { color: "#1890ff", fontSize: "28px", fontWeight: "bold" },
      growth: data.salesGrowth,
    },
    {
      title: "Số ca chốt",
      value: data.closedDeals,
      prefix: <UserOutlined style={{ color: "#52c41a" }} />,
      valueStyle: { color: "#52c41a", fontSize: "28px", fontWeight: "bold" },
      growth: data.dealsGrowth,
    },
    {
      title: "Doanh số TB/ca",
      value: data.averagePerDeal,
      formatter: formatCurrency,
      valueStyle: { color: "#722ed1", fontSize: "28px", fontWeight: "bold" },
      growth: data.averageGrowth,
    },
    {
      title: "Khách mới vs Cũ",
      value: data.newCustomerRevenue,
      formatter: (val: number) => (
        <div>
          <div style={{ fontSize: "16px", color: "#52c41a" }}>
            Mới: {formatCurrency(val)}
          </div>
          <div style={{ fontSize: "14px", color: "#1890ff", marginTop: "4px" }}>
            Cũ: {formatCurrency(data.returningCustomerRevenue)}
          </div>
        </div>
      ),
      growth: data.newCustomerGrowth,
    },
  ];

  return (
    <Row gutter={[24, 24]} style={{ marginBottom: "24px" }}>
      {kpiItems.map((item, index) => (
        <Col xs={24} sm={12} lg={6} key={index}>
          <Card
            variant="borderless"
            style={{
              borderRadius: "12px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
              background: "#fff",
            }}
          >
            <Statistic
              title={
                <span style={{ fontSize: "14px", color: "#8c8c8c" }}>
                  {item.title}
                </span>
              }
              value={item.value}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={item.formatter as any}
              prefix={item.prefix}
              valueStyle={item.valueStyle}
            />
            {item.growth !== undefined && (
              <div style={{ marginTop: "12px", fontSize: "14px" }}>
                {item.growth >= 0 ? (
                  <span style={{ color: "#52c41a" }}>
                    <ArrowUpOutlined /> +{item.growth.toFixed(1)}%
                  </span>
                ) : (
                  <span style={{ color: "#ff4d4f" }}>
                    <ArrowDownOutlined /> {item.growth.toFixed(1)}%
                  </span>
                )}
                <span style={{ color: "#8c8c8c", marginLeft: "8px" }}>
                  vs tháng trước
                </span>
              </div>
            )}
          </Card>
        </Col>
      ))}
    </Row>
  );
}
