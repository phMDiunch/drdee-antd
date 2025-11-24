// src/features/master-data/components/MasterDataList.tsx
"use client";

import React, { useMemo } from "react";
import { Collapse, Table, Button, Space, Popconfirm, Tooltip } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useMasterData } from "../hooks/useMasterData";
import { useDeleteMasterData } from "../hooks/useDeleteMasterData";
import type { MasterDataResponse } from "@/shared/validation/master-data.schema";
import type { ColumnsType } from "antd/es/table";

type Props = {
  isAdmin?: boolean;
  onAdd: (category?: string) => void;
  onEdit: (item: MasterDataResponse) => void;
};

export default function MasterDataList({ isAdmin, onAdd, onEdit }: Props) {
  const { data: allItems = [], isLoading } = useMasterData();
  const deleteMutation = useDeleteMasterData();

  // Group items by category
  const groupedData = useMemo(() => {
    const groups = new Map<string, MasterDataResponse[]>();
    allItems.forEach((item) => {
      const existing = groups.get(item.category) || [];
      groups.set(item.category, [...existing, item]);
    });
    return groups;
  }, [allItems]);

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const columns: ColumnsType<MasterDataResponse> = [
    {
      title: "Tên hiển thị",
      dataIndex: "value",
      key: "value",
      width: "25%",
      render: (value: string) => <strong>{value}</strong>,
    },
    {
      title: "Key",
      dataIndex: "key",
      key: "key",
      width: "20%",
      render: (key: string) => <code style={{ color: "#666" }}>{key}</code>,
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      width: "30%",
      ellipsis: {
        showTitle: false,
      },
      render: (description: string | null) => (
        <Tooltip placement="topLeft" title={description || ""}>
          <span style={{ color: description ? "inherit" : "#ccc" }}>
            {description || "—"}
          </span>
        </Tooltip>
      ),
    },
    ...(isAdmin
      ? [
          {
            title: "Thao tác",
            key: "actions",
            width: "15%",
            render: (_: unknown, record: MasterDataResponse) => (
              <Space size="small">
                <Tooltip title="Sửa">
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => onEdit(record)}
                  />
                </Tooltip>

                <Popconfirm
                  title="Bạn chắc chắn muốn xóa vĩnh viễn?"
                  description="Hành động này không thể hoàn tác."
                  onConfirm={() => handleDelete(record.id)}
                  okText="Xóa"
                  cancelText="Hủy"
                  okButtonProps={{ danger: true }}
                >
                  <Tooltip title="Xóa vĩnh viễn">
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      loading={deleteMutation.isPending}
                    />
                  </Tooltip>
                </Popconfirm>
              </Space>
            ),
          } as ColumnsType<MasterDataResponse>[0],
        ]
      : []),
  ];

  // Convert grouped data to Collapse items
  const collapseItems = Array.from(groupedData.entries()).map(
    ([category, items]) => ({
      key: category,
      label: (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>
            <strong>{category}</strong> ({items.length} items)
          </span>
        </div>
      ),
      extra: isAdmin ? (
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            onAdd(category);
          }}
        >
          Thêm Item
        </Button>
      ) : null,
      children: (
        <Table
          dataSource={items}
          columns={columns}
          rowKey="id"
          pagination={false}
          size="small"
          loading={isLoading}
        />
      ),
    })
  );

  return (
    <div>
      {/* Collapse List */}
      {collapseItems.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px 0",
            color: "#999",
          }}
        >
          Chưa có dữ liệu. Hãy thêm category đầu tiên.
        </div>
      ) : (
        <Collapse items={collapseItems} defaultActiveKey={[]} />
      )}
    </div>
  );
}
