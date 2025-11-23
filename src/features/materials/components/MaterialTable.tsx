// src/features/materials/components/MaterialTable.tsx
"use client";

import React from "react";
import { Table, Tag, Button, Popconfirm, Space, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  InboxOutlined,
  DeleteOutlined,
  EditOutlined,
  RollbackOutlined,
} from "@ant-design/icons";
import type { MaterialResponse } from "@/shared/validation/material.schema";

type Props = {
  data: MaterialResponse[];
  loading?: boolean;
  materialTypeOptions?: { value: string; label: string }[]; // From MasterData
  departmentOptions?: { value: string; label: string }[]; // From MasterData
  categoryOptions?: { value: string; label: string }[]; // From MasterData
  tagsOptions?: { value: string; label: string }[]; // From MasterData
  onEdit: (row: MaterialResponse) => void;
  onArchive: (row: MaterialResponse) => void;
  onUnarchive: (row: MaterialResponse) => void;
  onDelete: (row: MaterialResponse) => void;
};

export default function MaterialTable({
  data,
  loading,
  materialTypeOptions = [],
  departmentOptions = [],
  categoryOptions = [],
  tagsOptions = [],
  onEdit,
  onArchive,
  onUnarchive,
  onDelete,
}: Props) {
  // Create filters
  const materialTypeFilters = materialTypeOptions.map((opt) => ({
    text: opt.label,
    value: opt.value,
  }));

  const departmentFilters = departmentOptions.map((opt) => ({
    text: opt.label,
    value: opt.value,
  }));

  const categoryFilters = categoryOptions.map((opt) => ({
    text: opt.label,
    value: opt.value,
  }));

  // Helper function to get label from key
  const getLabel = (
    key: string | null | undefined,
    options: { value: string; label: string }[]
  ) => {
    if (!key) return "-";
    const option = options.find((opt) => opt.value === key);
    return option ? option.label : key;
  };

  const columns: ColumnsType<MaterialResponse> = [
    {
      title: "Mã VT",
      dataIndex: "code",
      width: 120,
      sorter: (a, b) => a.code.localeCompare(b.code),
    },
    {
      title: "Tên vật tư",
      dataIndex: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "ĐVT",
      dataIndex: "unit",
      width: 100,
      render: (key: string) =>
        getLabel(key, [
          // This will be replaced with actual MasterData options
          { value: key, label: key },
        ]),
    },
    {
      title: "Loại VT",
      dataIndex: "materialType",
      width: 140,
      filters: materialTypeFilters,
      onFilter: (value, record) => record.materialType === value,
      render: (key: string) => getLabel(key, materialTypeOptions),
    },
    {
      title: "Bộ môn",
      dataIndex: "department",
      width: 140,
      filters: departmentFilters,
      onFilter: (value, record) => record.department === value,
      render: (key: string) => getLabel(key, departmentOptions),
    },
    {
      title: "Nhóm VT",
      dataIndex: "category",
      width: 140,
      filters: categoryFilters,
      onFilter: (value, record) => (record.category || "") === value,
      render: (key: string | null) => getLabel(key, categoryOptions),
    },
    {
      title: "Tồn tối thiểu",
      dataIndex: "minStockLevel",
      width: 120,
      align: "right",
      render: (v: number | null) => (v !== null && v !== undefined ? v : "-"),
    },
    {
      title: "Trạng thái",
      dataIndex: "archivedAt",
      width: 120,
      render: (v: string | null | undefined) =>
        v ? (
          <Tag color="default">Archived</Tag>
        ) : (
          <Tag color="green">Active</Tag>
        ),
    },
    {
      title: "Tags",
      dataIndex: "tags",
      render: (tags: string[] | undefined) => {
        if (!tags || tags.length === 0) return "-";
        const displayTags = tags.slice(0, 3);
        const remaining = tags.length - 3;
        return (
          <Space size={4} wrap>
            {displayTags.map((tagKey) => {
              const label = getLabel(tagKey, tagsOptions);
              return (
                <Tag key={tagKey} color="blue">
                  {label}
                </Tag>
              );
            })}
            {remaining > 0 && <Tag color="default">+{remaining}</Tag>}
          </Space>
        );
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      fixed: "right",
      width: 180,
      render: (_, row) => {
        const isArchived = !!row.archivedAt;
        return (
          <Space>
            <Tooltip title="Sửa">
              <Button icon={<EditOutlined />} onClick={() => onEdit(row)} />
            </Tooltip>

            {!isArchived ? (
              <Tooltip title="Lưu trữ">
                <Button
                  icon={<InboxOutlined />}
                  onClick={() => onArchive(row)}
                />
              </Tooltip>
            ) : (
              <Tooltip title="Khôi phục">
                <Button
                  icon={<RollbackOutlined />}
                  onClick={() => onUnarchive(row)}
                />
              </Tooltip>
            )}

            <Popconfirm
              title="Xóa vật tư"
              description="Bạn chắc chắn muốn xóa? Hành động này không thể hoàn tác."
              okText="Xóa"
              cancelText="Hủy"
              onConfirm={() => onDelete(row)}
            >
              <Tooltip title="Xóa">
                <Button danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <Table<MaterialResponse>
      size="small"
      rowKey={(r) => r.id}
      loading={loading}
      columns={columns}
      dataSource={data}
      pagination={false}
      scroll={{ x: 1400 }}
    />
  );
}
