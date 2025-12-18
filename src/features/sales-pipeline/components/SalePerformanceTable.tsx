// src/features/sales-pipeline/components/SalePerformanceTable.tsx
"use client";

import React from "react";
import { Card, Table, Empty, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";

interface SalePerformance {
  saleId: string;
  saleName: string;
  employeeCode: string;
  totalDeals: number;
  wonCount: number;
  lostCount: number;
  winRate: number;
}

interface SalePerformanceTableProps {
  data: SalePerformance[];
  loading?: boolean;
}

/**
 * Sale Performance Table
 * Shows individual sale metrics with win rates
 */
export default function SalePerformanceTable({
  data,
  loading,
}: SalePerformanceTableProps) {
  const columns: ColumnsType<SalePerformance> = [
    {
      title: "Mã NV",
      dataIndex: "employeeCode",
      key: "employeeCode",
      width: 100,
    },
    {
      title: "Tên Sale",
      dataIndex: "saleName",
      key: "saleName",
      width: 150,
    },
    {
      title: "Tổng deals",
      dataIndex: "totalDeals",
      key: "totalDeals",
      width: 100,
      align: "right",
      sorter: (a, b) => a.totalDeals - b.totalDeals,
    },
    {
      title: "Thành công",
      dataIndex: "wonCount",
      key: "wonCount",
      width: 100,
      align: "right",
      render: (count: number) => <Tag color="green">{count}</Tag>,
    },
    {
      title: "Thất bại",
      dataIndex: "lostCount",
      key: "lostCount",
      width: 100,
      align: "right",
      render: (count: number) => <Tag color="red">{count}</Tag>,
    },
    {
      title: "Tỷ lệ thành công",
      dataIndex: "winRate",
      key: "winRate",
      width: 120,
      align: "right",
      sorter: (a, b) => a.winRate - b.winRate,
      defaultSortOrder: "descend",
      render: (rate: number) => {
        const color = rate >= 60 ? "success" : rate >= 40 ? "warning" : "error";
        return (
          <Tag color={color} style={{ fontSize: 14, fontWeight: "bold" }}>
            {rate.toFixed(1)}%
          </Tag>
        );
      },
    },
  ];

  return (
    <Card title="Hiệu suất bán hàng theo Sale">
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="saleId"
        pagination={false}
        locale={{
          emptyText: <Empty description="Không có dữ liệu" />,
        }}
        size="middle"
      />
    </Card>
  );
}
