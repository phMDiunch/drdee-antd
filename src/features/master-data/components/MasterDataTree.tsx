// src/features/master-data/components/MasterDataTree.tsx
"use client";

import React, { useMemo } from "react";
import {
  Tree,
  Tag,
  Space,
  Button,
  Tooltip,
  Popconfirm,
  Typography,
  Empty,
} from "antd";
import type { DataNode } from "antd/es/tree";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  FolderOutlined,
  FileTextOutlined,
  StopOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import type { MasterDataResponse } from "@/shared/validation/master-data.schema";

const { Text } = Typography;

type Props = {
  data: MasterDataResponse[];
  loading?: boolean;
  isAdmin?: boolean;
  onEdit: (row: MasterDataResponse) => void;
  onDelete: (row: MasterDataResponse) => void;
  onToggleActive?: (row: MasterDataResponse) => void;
  onAddChild?: (parent: MasterDataResponse) => void;
};

export default function MasterDataTree({
  data,
  loading,
  isAdmin,
  onEdit,
  onDelete,
  onToggleActive,
  onAddChild,
}: Props) {
  // Build tree structure from flat data
  const treeData = useMemo(() => {
    const rootNodes: DataNode[] = [];

    // Build tree recursively
    const buildTree = (item: MasterDataResponse): DataNode => {
      const children = data
        .filter((child) => child.parentId === item.id)
        .map(buildTree);

      return {
        key: item.id,
        title: (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            {/* Left: Icon + Value + Key */}
            <Space size={8}>
              {item.allowHierarchy ? (
                <FolderOutlined style={{ color: "#1890ff" }} />
              ) : (
                <FileTextOutlined style={{ color: "#8c8c8c" }} />
              )}
              <Text strong>{item.value}</Text>
              <Text type="secondary" code>
                {item.key}
              </Text>
              {!item.isActive && <Tag color="default">Tắt</Tag>}
            </Space>

            {/* Right: Actions (Admin Only) */}
            {isAdmin && (
              <Space size={4} onClick={(e) => e.stopPropagation()}>
                {item.allowHierarchy && onAddChild && (
                  <Tooltip title="Thêm mục con">
                    <Button
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() => onAddChild(item)}
                    />
                  </Tooltip>
                )}

                <Tooltip title="Sửa">
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => onEdit(item)}
                  />
                </Tooltip>

                {onToggleActive && (
                  <Tooltip title={item.isActive ? "Vô hiệu hóa" : "Kích hoạt"}>
                    <Button
                      size="small"
                      icon={
                        item.isActive ? (
                          <StopOutlined />
                        ) : (
                          <CheckCircleOutlined />
                        )
                      }
                      onClick={() => onToggleActive(item)}
                    />
                  </Tooltip>
                )}

                <Popconfirm
                  title="Xóa dữ liệu chủ"
                  description="Bạn chắc chắn muốn xóa vĩnh viễn? Hành động này không thể hoàn tác."
                  okText="Xóa"
                  cancelText="Hủy"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => onDelete(item)}
                >
                  <Tooltip title="Xóa vĩnh viễn">
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Tooltip>
                </Popconfirm>
              </Space>
            )}
          </div>
        ),
        children: children.length > 0 ? children : undefined,
        isLeaf: children.length === 0,
      };
    };

    // Find root items (no parent)
    const roots = data.filter((item) => !item.parentId);
    roots.forEach((root) => {
      rootNodes.push(buildTree(root));
    });

    return rootNodes;
  }, [data, isAdmin, onEdit, onDelete, onToggleActive, onAddChild]);

  if (loading) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>Đang tải...</div>
    );
  }

  if (treeData.length === 0) {
    return (
      <Empty description="Chưa có dữ liệu" style={{ padding: "48px 0" }} />
    );
  }

  return (
    <div
      style={{
        border: "1px solid #f0f0f0",
        borderRadius: "8px",
        padding: "16px",
        background: "#fff",
      }}
    >
      <Tree
        showLine
        showIcon={false}
        defaultExpandAll
        treeData={treeData}
        style={{ fontSize: "14px" }}
      />
    </div>
  );
}
