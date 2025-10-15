"use client";

import React, { useState, useEffect } from "react";
import { Button, Input, Space } from "antd";
import { PlusOutlined } from "@ant-design/icons";

type Props = {
  defaultSearch?: string;
  onSearchChange: (value: string) => void;
  onCreateClick: () => void;
};

export default function EmployeeFilters({
  defaultSearch,
  onSearchChange,
  onCreateClick,
}: Props) {
  const [search, setSearch] = useState(defaultSearch ?? "");

  useEffect(() => {
    setSearch(defaultSearch ?? "");
  }, [defaultSearch]);

  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        flexWrap: "wrap",
        justifyContent: "space-between",
        marginBottom: 16,
      }}
    >
      <Space size="middle" wrap>
        <Input.Search
          placeholder="Tìm theo tên nhân viên"
          allowClear
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onSearch={(value) => onSearchChange(value.trim())}
          enterButton
          style={{ minWidth: 220, maxWidth: 320 }}
        />
      </Space>

      <Button type="primary" icon={<PlusOutlined />} onClick={onCreateClick}>
        Thêm nhân viên
      </Button>
    </div>
  );
}
