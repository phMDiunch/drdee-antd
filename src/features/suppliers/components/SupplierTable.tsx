// src/features/suppliers/components/SupplierTable.tsx
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
import type { SupplierResponse } from "@/shared/validation/supplier.schema";

type Props = {
  data: SupplierResponse[];
  loading?: boolean;
  supplierGroupOptions?: { value: string; label: string }[]; // From MasterData
  onEdit: (row: SupplierResponse) => void;
  onArchive: (row: SupplierResponse) => void;
  onUnarchive: (row: SupplierResponse) => void;
  onDelete: (row: SupplierResponse) => void;
};

export default function SupplierTable({
  data,
  loading,
  supplierGroupOptions = [],
  onEdit,
  onArchive,
  onUnarchive,
  onDelete,
}: Props) {
  // Create filters from supplierGroupOptions
  const supplierGroupFilters = supplierGroupOptions.map((opt) => ({
    text: opt.label,
    value: opt.value,
  }));

  const columns: ColumnsType<SupplierResponse> = [
    {
      title: "Tên nhà cung cấp",
      dataIndex: "name",
      width: 200,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Tên ngắn gọn",
      dataIndex: "shortName",
      width: 140,
      render: (v: string | null) => v || "-",
    },
    {
      title: "Nhóm NCC",
      dataIndex: "supplierGroup",
      width: 180,
      filters: supplierGroupFilters,
      onFilter: (value, record) => (record.supplierGroup || "") === value,
      render: (key: string | null) => {
        if (!key) return "-";
        // Find label from options
        const option = supplierGroupOptions.find((opt) => opt.value === key);
        return option ? option.label : key;
      },
    },
    {
      title: "SĐT",
      dataIndex: "phone",
      width: 140,
      render: (v: string | null) => v || "-",
    },
    {
      title: "Trạng thái",
      dataIndex: "archivedAt",
      render: (v: string | null | undefined) =>
        v ? (
          <Tag color="default">Archived</Tag>
        ) : (
          <Tag color="green">Active</Tag>
        ),
      width: 140,
    },
    {
      title: "Thao tác",
      key: "actions",
      fixed: "right",
      width: 150,
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
              title="Xóa nhà cung cấp"
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
    <Table<SupplierResponse>
      size="small"
      rowKey={(r) => r.id}
      loading={loading}
      columns={columns}
      dataSource={data}
      pagination={false}
      scroll={{ x: 1000 }}
    />
  );
}
