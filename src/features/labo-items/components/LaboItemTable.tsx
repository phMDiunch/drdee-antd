// src/features/labo-items/components/LaboItemTable.tsx
"use client";

import React, { useMemo } from "react";
import { Table, Tag, Button, Popconfirm, Space, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  InboxOutlined,
  DeleteOutlined,
  EditOutlined,
  RollbackOutlined,
} from "@ant-design/icons";
import type { LaboItemResponse } from "@/shared/validation/labo-item.schema";
import { LABO_SERVICE_GROUPS } from "../constants";

type Props = {
  data: LaboItemResponse[];
  loading?: boolean;
  onEdit: (row: LaboItemResponse) => void;
  onArchive: (row: LaboItemResponse) => void;
  onUnarchive: (row: LaboItemResponse) => void;
  onDelete: (row: LaboItemResponse) => void;
};

export default function LaboItemTable({
  data,
  loading,
  onEdit,
  onArchive,
  onUnarchive,
  onDelete,
}: Props) {
  // Tạo bộ lọc động từ dữ liệu và hằng số
  const serviceGroupFilters = useMemo(() => {
    const fromConst = LABO_SERVICE_GROUPS;
    const fromData = Array.from(
      new Set((data || []).map((d) => d.serviceGroup).filter(Boolean))
    ) as string[];
    const merged = Array.from(
      new Set([...(fromConst as string[]), ...fromData])
    );
    return merged.map((v) => ({ text: v, value: v }));
  }, [data]);

  const columns: ColumnsType<LaboItemResponse> = [
    {
      title: "Tên hàng labo",
      dataIndex: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Nhóm dịch vụ",
      dataIndex: "serviceGroup",
      sorter: (a, b) =>
        (a.serviceGroup || "").localeCompare(b.serviceGroup || ""),
      filters: serviceGroupFilters,
      onFilter: (value, record) => (record.serviceGroup || "") === value,
    },
    {
      title: "Đơn vị tính",
      dataIndex: "unit",
      width: 120,
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      ellipsis: true,
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
        // ✅ Calculate values once at function start (avoid CSS-in-JS warning)
        const isArchived = !!row.archivedAt;
        const archiveButton = isArchived ? (
          <Tooltip title="Khôi phục">
            <Button
              icon={<RollbackOutlined />}
              onClick={() => onUnarchive(row)}
            />
          </Tooltip>
        ) : (
          <Tooltip title="Lưu trữ">
            <Button icon={<InboxOutlined />} onClick={() => onArchive(row)} />
          </Tooltip>
        );

        return (
          <Space>
            <Tooltip title="Sửa">
              <Button icon={<EditOutlined />} onClick={() => onEdit(row)} />
            </Tooltip>

            {archiveButton}

            <Tooltip title="Xóa">
              <Popconfirm
                title="Xóa hàng labo"
                description="Bạn chắc chắn muốn xóa? Hành động này không thể hoàn tác."
                okText="Xóa"
                cancelText="Hủy"
                onConfirm={() => onDelete(row)}
              >
                <Button danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  return (
    <Table<LaboItemResponse>
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
