// src/features/master-data/components/MasterDataTable.tsx
"use client";

import React from "react";
import { Table, Tag, Tooltip, Popconfirm, Space, Button } from "antd";
import type { ColumnsType } from "antd/es/table";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { MasterDataResponse } from "@/shared/validation/master-data.schema";
import { MASTER_DATA_TYPE_LABELS } from "../constants";

type Props = {
  data: MasterDataResponse[];
  loading?: boolean;
  onEdit: (row: MasterDataResponse) => void;
  onDelete: (row: MasterDataResponse) => void;
};

export default function MasterDataTable({
  data,
  loading,
  onEdit,
  onDelete,
}: Props) {
  const columns: ColumnsType<MasterDataResponse> = [
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      width: 180,
      render: (type: string) => MASTER_DATA_TYPE_LABELS[type] ?? type,
    },
    {
      title: "Mã",
      dataIndex: "key",
      key: "key",
      width: 150,
    },
    {
      title: "Giá trị",
      dataIndex: "value",
      key: "value",
      ellipsis: true,
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (text: string | undefined) => text ?? "—",
    },
    {
      title: "Parent",
      dataIndex: "parentId",
      key: "parentId",
      width: 120,
      render: (parentId: string | undefined) => {
        if (!parentId) return "—";
        const parent = data.find((item) => item.id === parentId);
        return parent ? parent.value : parentId.slice(0, 8);
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      width: 100,
      align: "center",
      render: (isActive: boolean) =>
        isActive ? (
          <Tag color="success">Kích hoạt</Tag>
        ) : (
          <Tag color="default">Tắt</Tag>
        ),
    },
    {
      title: "Thao tác",
      key: "actions",
      fixed: "right",
      width: 120,
      render: (_, row) => (
        <Space>
          <Tooltip title="Sửa">
            <Button icon={<EditOutlined />} onClick={() => onEdit(row)} />
          </Tooltip>

          <Popconfirm
            title="Xóa dữ liệu"
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
      ),
    },
  ];

  return (
    <Table
      size="small"
      rowKey="id"
      dataSource={data}
      columns={columns}
      loading={loading}
      pagination={{
        pageSize: 20,
        showSizeChanger: true,
        showTotal: (total) => `Tổng ${total} mục`,
      }}
    />
  );
}
