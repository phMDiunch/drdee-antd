// src/features/customers/components/CustomerFilters.tsx
"use client";

import React from "react";
import { Button, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";

const { Text } = Typography;

type Props = {
  loading?: boolean;
  onCreate: () => void;
  dailyCount?: number;
};

export default function CustomerFilters({
  loading,
  onCreate,
  dailyCount = 0,
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
      <Text strong>{dailyCount} khách hàng mới trong ngày</Text>

      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={onCreate}
        loading={loading}
      >
        Tạo khách hàng mới
      </Button>
    </div>
  );
}
