// src/features/payments/components/PaymentFilters.tsx
"use client";

import React from "react";
import { Button, Typography } from "antd";
import { FileExcelOutlined } from "@ant-design/icons";

const { Text } = Typography;

type Props = {
  dailyCount: number;
  onExportExcel?: () => void;
};

export default function PaymentFilters({ dailyCount, onExportExcel }: Props) {
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

      {onExportExcel && (
        <Button icon={<FileExcelOutlined />} onClick={onExportExcel}>
          Xuất Excel
        </Button>
      )}
    </div>
  );
}
