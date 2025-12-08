// src/features/labo-services/components/LaboServiceTable.tsx
"use client";

import React, { useMemo } from "react";
import { Table, Tag, Button, Popconfirm, Space, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  DeleteOutlined,
  EditOutlined,
  InboxOutlined,
  RollbackOutlined,
} from "@ant-design/icons";
import type { LaboServiceResponse } from "@/shared/validation/labo-service.schema";
import { LABO_WARRANTY_LABELS } from "../constants";

type Props = {
  data: LaboServiceResponse[];
  loading?: boolean;
  onEdit: (row: LaboServiceResponse) => void;
  onDelete: (row: LaboServiceResponse) => void;
  onArchive: (row: LaboServiceResponse) => void;
  onUnarchive: (row: LaboServiceResponse) => void;
};

export default function LaboServiceTable({
  data,
  loading,
  onEdit,
  onDelete,
  onArchive,
  onUnarchive,
}: Props) {
  // Tạo bộ lọc động từ dữ liệu
  const supplierFilters = useMemo(() => {
    const suppliers = Array.from(
      new Set(
        (data || [])
          .map((d) => d.supplier?.shortName || d.supplier?.name)
          .filter(Boolean)
      )
    ) as string[];
    return suppliers.map((v) => ({ text: v, value: v }));
  }, [data]);

  const serviceGroupFilters = useMemo(() => {
    const groups = Array.from(
      new Set((data || []).map((d) => d.laboItem?.serviceGroup).filter(Boolean))
    ) as string[];
    return groups.map((v) => ({ text: v, value: v }));
  }, [data]);

  const columns: ColumnsType<LaboServiceResponse> = [
    {
      title: "Xưởng",
      dataIndex: ["supplier", "name"],
      sorter: (a, b) =>
        (a.supplier?.shortName || a.supplier?.name || "").localeCompare(
          b.supplier?.shortName || b.supplier?.name || ""
        ),
      filters: supplierFilters,
      onFilter: (value, record) =>
        (record.supplier?.shortName || record.supplier?.name || "") === value,
      render: (_, record) =>
        record.supplier?.shortName || record.supplier?.name,
      width: 180,
    },
    {
      title: "Tên dịch vụ",
      dataIndex: ["laboItem", "name"],
      sorter: (a, b) =>
        (a.laboItem?.name || "").localeCompare(b.laboItem?.name || ""),
      width: 200,
    },
    {
      title: "Nhóm DV",
      dataIndex: ["laboItem", "serviceGroup"],
      sorter: (a, b) =>
        (a.laboItem?.serviceGroup || "").localeCompare(
          b.laboItem?.serviceGroup || ""
        ),
      filters: serviceGroupFilters,
      onFilter: (value, record) =>
        (record.laboItem?.serviceGroup || "") === value,
      width: 150,
    },
    {
      title: "Đơn vị",
      dataIndex: ["laboItem", "unit"],
      width: 100,
    },
    {
      title: "Giá",
      dataIndex: "price",
      sorter: (a, b) => a.price - b.price,
      render: (v: number) => (
        <Tag color="blue">{v.toLocaleString("vi-VN")} ₫</Tag>
      ),
      width: 140,
    },
    {
      title: "Bảo hành",
      dataIndex: "warranty",
      render: (v: string) => LABO_WARRANTY_LABELS[v] || v,
      width: 100,
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
            <Tooltip title="Sửa giá">
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
              title="Xóa dịch vụ"
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
    <Table<LaboServiceResponse>
      size="small"
      rowKey={(r) => r.id}
      loading={loading}
      columns={columns}
      dataSource={data}
      pagination={false}
      scroll={{ x: 1290 }}
    />
  );
}
