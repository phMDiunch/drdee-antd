// src/features/treatment-logs/components/TreatmentLogFilters.tsx
"use client";

import React from "react";
import { Button, Space, Typography } from "antd";
import { FileExcelOutlined } from "@ant-design/icons";

const { Text } = Typography;

type Props = {
  loading?: boolean;
  dailyCount: number;
  onExport?: () => void;
};

export default function TreatmentLogFilters({
  loading,
  dailyCount,
  onExport,
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
      <Text strong>{dailyCount} dịch vụ điều trị hôm nay</Text>

      {/* Right side: Export button */}
      <Space>
        <Button
          icon={<FileExcelOutlined />}
          onClick={onExport}
          loading={loading}
          disabled={dailyCount === 0}
        >
          Xuất Excel
        </Button>
      </Space>
    </div>
  );
}
