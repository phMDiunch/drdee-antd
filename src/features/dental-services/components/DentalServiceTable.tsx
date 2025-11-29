// src/features/dental-services/components/DentalServiceTable.tsx
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
import type { DentalServiceResponse } from "@/shared/validation/dental-service.schema";
import { DENTAL_DEPARTMENTS, DENTAL_SERVICE_GROUPS } from "../constants";

type Props = {
  data: DentalServiceResponse[];
  loading?: boolean;
  onEdit: (row: DentalServiceResponse) => void;
  onArchive: (row: DentalServiceResponse) => void;
  onUnarchive: (row: DentalServiceResponse) => void;
  onDelete: (row: DentalServiceResponse) => void;
};

export default function DentalServiceTable({
  data,
  loading,
  onEdit,
  onArchive,
  onUnarchive,
  onDelete,
}: Props) {
  // Tạo bộ lọc động từ dữ liệu và hằng số
  const serviceGroupFilters = useMemo(() => {
    const fromConst = DENTAL_SERVICE_GROUPS;
    const fromData = Array.from(
      new Set((data || []).map((d) => d.serviceGroup).filter(Boolean))
    ) as string[];
    const merged = Array.from(
      new Set([...(fromConst as string[]), ...fromData])
    );
    return merged.map((v) => ({ text: v, value: v }));
  }, [data]);

  const departmentFilters = useMemo(() => {
    const fromConst = DENTAL_DEPARTMENTS;
    const fromData = Array.from(
      new Set((data || []).map((d) => d.department).filter(Boolean))
    ) as string[];
    const merged = Array.from(
      new Set([...(fromConst as string[]), ...fromData])
    );
    return merged.map((v) => ({ text: v, value: v }));
  }, [data]);

  const columns: ColumnsType<DentalServiceResponse> = [
    {
      title: "Tên dịch vụ",
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
      title: "Bộ môn",
      dataIndex: "department",
      sorter: (a, b) => (a.department || "").localeCompare(b.department || ""),
      filters: departmentFilters,
      onFilter: (value, record) => (record.department || "") === value,
    },
    {
      title: "Đơn vị",
      dataIndex: "unit",
      width: 120,
    },
    {
      title: "Giá niêm yết",
      dataIndex: "price",
      sorter: (a, b) => a.price - b.price,
      render: (v: number) => (
        <Tag color="blue">{v.toLocaleString("vi-VN")} ₫</Tag>
      ),
      width: 160,
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
      title: "Tags",
      dataIndex: "tags",
      render: (tags: string[]) =>
        (tags || []).map((t) => <Tag key={t}>{t}</Tag>),
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
    <Table<DentalServiceResponse>
      size="small"
      rowKey={(r) => r.id}
      loading={loading}
      columns={columns}
      dataSource={data}
      pagination={false}
      scroll={{ x: 1200 }}
    />
  );
}
