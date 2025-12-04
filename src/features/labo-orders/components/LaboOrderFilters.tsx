// src/features/labo-orders/components/LaboOrderFilters.tsx
"use client";

import React from "react";
import { Button, Space, Typography } from "antd";
import { PlusOutlined, DownloadOutlined } from "@ant-design/icons";

const { Text } = Typography;

type Props = {
  loading?: boolean;
  onCreate: () => void;
  onExportExcel?: () => void;
  dailyCount: number;
};

export function LaboOrderFilters({
  loading,
  onCreate,
  onExportExcel,
  dailyCount,
}: Props) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
      }}
    >
      {/* Left side: Count display */}
      <Text strong>{dailyCount} đơn hàng labo hôm nay</Text>

      {/* Right side: Export + Create button */}
      <Space>
        {onExportExcel && (
          <Button
            icon={<DownloadOutlined />}
            onClick={onExportExcel}
            loading={loading}
          >
            Xuất Excel
          </Button>
        )}
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={onCreate}
          loading={loading}
        >
          Thêm đơn hàng
        </Button>
      </Space>
    </div>
  );
}
