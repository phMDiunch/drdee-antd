// src/features/sales-activities/components/SalesActivityFilters.tsx
"use client";

import React from "react";
import { Space, Typography, Button } from "antd";
import { DownloadOutlined } from "@ant-design/icons";

const { Text } = Typography;

type Props = {
  totalCount?: number;
  loading?: boolean;
};

export default function SalesActivityFilters({ totalCount = 0, loading }: Props) {
  const handleExport = () => {
    // TODO: Implement Excel export functionality
    console.log("Export to Excel");
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <Space style={{ width: "100%", justifyContent: "space-between" }}>
        <Text strong>
          {loading ? "Đang tải..." : `${totalCount} hoạt động liên hệ hôm nay`}
        </Text>
        <Button
          icon={<DownloadOutlined />}
          onClick={handleExport}
          disabled={loading || totalCount === 0}
        >
          Xuất Excel
        </Button>
      </Space>
    </div>
  );
}
