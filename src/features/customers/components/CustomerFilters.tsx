"use client";
import React from "react";
import { Button, Space, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";

type Props = {
  loading?: boolean;
  onCreate: () => void;
  dailyCount?: number;
};

export default function CustomerFilters({ onCreate, dailyCount = 0 }: Props) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <Space>
        <Typography.Text>
          {dailyCount} khách hàng mới trong ngày
        </Typography.Text>
      </Space>
      <Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
          Tạo khách hàng mới
        </Button>
      </Space>
    </div>
  );
}
