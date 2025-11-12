// src/features/payments/components/PaymentFilters.tsx
"use client";

import React from "react";
import { Button, Space, Typography } from "antd";
import { PlusOutlined, FileExcelOutlined } from "@ant-design/icons";

const { Text } = Typography;

type Props = {
  dailyCount: number;
  onCreate: () => void;
  onExportExcel?: () => void;
};

export default function PaymentFilters({
  dailyCount,
  onCreate,
  onExportExcel,
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
      <Text strong style={{ fontSize: 16 }}>
        {dailyCount} phiếu thu hôm nay
      </Text>

      <Space>
        {onExportExcel && (
          <Button icon={<FileExcelOutlined />} onClick={onExportExcel}>
            Xuất Excel
          </Button>
        )}
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
          Tạo phiếu thu
        </Button>
      </Space>
    </div>
  );
}
