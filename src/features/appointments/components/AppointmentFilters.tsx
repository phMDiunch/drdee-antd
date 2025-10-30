// src/features/appointments/components/AppointmentFilters.tsx
"use client";

import React from "react";
import { Button, Input, Space, Typography } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";

const { Text } = Typography;

type Props = {
  loading?: boolean;
  onCreate: () => void;
  dailyCount: number;
  searchValue: string;
  onSearchChange: (value: string) => void;
};

export default function AppointmentFilters({
  loading,
  onCreate,
  dailyCount,
  searchValue,
  onSearchChange,
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
      <Text strong>{dailyCount} lịch hẹn hôm nay</Text>

      {/* Right side: Search + Create button */}
      <Space>
        <Input
          placeholder="Tìm theo tên hoặc mã khách hàng..."
          prefix={<SearchOutlined />}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{ width: 280 }}
          allowClear
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={onCreate}
          loading={loading}
        >
          Tạo lịch hẹn
        </Button>
      </Space>
    </div>
  );
}
