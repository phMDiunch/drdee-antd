// src/features/sales-pipeline/components/ServiceWinRateTable.tsx
"use client";

import React from "react";
import { Card, Table, Empty, Progress, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";

interface ServiceWinRate {
  serviceId: string;
  serviceName: string;
  totalCount: number;
  wonCount: number;
  winRate: number;
}

interface ServiceWinRateTableProps {
  data: ServiceWinRate[];
  loading?: boolean;
}

/**
 * Service Win Rate Table
 * Shows win rates by service type
 */
export default function ServiceWinRateTable({
  data,
  loading,
}: ServiceWinRateTableProps) {
  const columns: ColumnsType<ServiceWinRate> = [
    {
      title: "Dịch vụ",
      dataIndex: "serviceName",
      key: "serviceName",
      ellipsis: true,
    },
    {
      title: "Tổng số",
      dataIndex: "totalCount",
      key: "totalCount",
      width: 100,
      align: "right",
      sorter: (a, b) => a.totalCount - b.totalCount,
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
      title: "Tỷ lệ thành công",
      dataIndex: "winRate",
      key: "winRate",
      width: 200,
      sorter: (a, b) => a.winRate - b.winRate,
      defaultSortOrder: "descend",
      render: (rate: number) => {
        const color =
          rate >= 60 ? "success" : rate >= 40 ? "normal" : "exception";
        return (
          <Progress
            percent={rate}
            status={color}
            format={(percent) => `${percent?.toFixed(1)}%`}
            size={["100%", 12]}
          />
        );
      },
    },
  ];

  return (
    <Card title="Tỷ lệ thành công theo loại dịch vụ">
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="serviceId"
        pagination={{ pageSize: 10, showSizeChanger: false }}
        locale={{
          emptyText: <Empty description="Không có dữ liệu" />,
        }}
        size="middle"
      />
    </Card>
  );
}
