"use client";

import React from "react";
import { Card, Table, Tag } from "antd";
import { TrophyOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { SalePerformanceData } from "../types";

interface SaleTableProps {
  data: SalePerformanceData[];
}

export default function SaleTable({ data }: SaleTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      notation: "compact",
      compactDisplay: "short",
    }).format(value);
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return "gold";
    if (rank === 2) return "blue";
    if (rank === 3) return "green";
    return "default";
  };

  const columns: ColumnsType<SalePerformanceData> = [
    {
      title: "Ranking",
      dataIndex: "rank",
      key: "rank",
      width: 90,
      align: "center",
      render: (rank: number) => (
        <Tag
          color={getRankColor(rank)}
          icon={rank <= 3 ? <TrophyOutlined /> : undefined}
        >
          #{rank}
        </Tag>
      ),
    },
    {
      title: "Sale",
      dataIndex: "saleName",
      key: "saleName",
      width: 160,
      fixed: "left",
      render: (name: string) => <strong>{name}</strong>,
    },
    {
      title: "Ca được phân",
      dataIndex: "assignedCases",
      key: "assignedCases",
      width: 120,
      align: "center",
    },
    {
      title: "Ca tư vấn",
      dataIndex: "consultedCases",
      key: "consultedCases",
      width: 110,
      align: "center",
    },
    {
      title: "Ca chốt",
      dataIndex: "closedCases",
      key: "closedCases",
      width: 100,
      align: "center",
      render: (value: number) => (
        <span style={{ color: "#52c41a", fontWeight: 600 }}>{value}</span>
      ),
    },
    {
      title: "Doanh số",
      dataIndex: "revenue",
      key: "revenue",
      width: 140,
      align: "right",
      sorter: (a, b) => a.revenue - b.revenue,
      render: (value: number) => (
        <span style={{ color: "#1890ff", fontWeight: 600 }}>
          {formatCurrency(value)}
        </span>
      ),
    },
    {
      title: "TB/ca",
      dataIndex: "averagePerCase",
      key: "averagePerCase",
      width: 120,
      align: "right",
      render: (value: number) => formatCurrency(value),
    },
    {
      title: "Tỷ lệ chốt",
      dataIndex: "closingRate",
      key: "closingRate",
      width: 110,
      align: "center",
      sorter: (a, b) => a.closingRate - b.closingRate,
      render: (rate: number) => {
        const color =
          rate >= 60 ? "#52c41a" : rate >= 40 ? "#fa8c16" : "#ff4d4f";
        return (
          <Tag color={color} style={{ fontWeight: 600 }}>
            {rate.toFixed(1)}%
          </Tag>
        );
      },
    },
  ];

  return (
    <Card
      title={
        <span style={{ fontSize: "16px", fontWeight: 600 }}>
          Hiệu suất Sale tư vấn
        </span>
      }
      variant="borderless"
      style={{
        borderRadius: "12px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
      }}
    >
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        pagination={false}
        scroll={{ x: 1000 }}
        size="middle"
      />
    </Card>
  );
}
