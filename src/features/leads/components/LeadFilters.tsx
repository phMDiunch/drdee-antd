// src/features/leads/components/LeadFilters.tsx
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

export default function LeadFilters({
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
      <Text strong>{dailyCount} lead mới trong ngày</Text>

      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={onCreate}
        loading={loading}
      >
        Tạo Lead
      </Button>
    </div>
  );
}
