// src/features/labo-services/components/LaboPriceTable.tsx
"use client";

import React, { useMemo } from "react";
import { Table, Tag, Button, Popconfirm, Space, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import type { LaboServiceResponse } from "@/shared/validation/labo-service.schema";
import { LABO_WARRANTY_LABELS } from "../constants";

type Props = {
  data: LaboServiceResponse[];
  loading?: boolean;
  onEdit: (row: LaboServiceResponse) => void;
  onDelete: (row: LaboServiceResponse) => void;
};

export default function LaboPriceTable({
  data,
  loading,
  onEdit,
  onDelete,
}: Props) {
  // Tạo bộ lọc động từ dữ liệu
  const supplierFilters = useMemo(() => {
    const suppliers = Array.from(
      new Set((data || []).map((d) => d.supplier?.name).filter(Boolean))
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
        (a.supplier?.name || "").localeCompare(b.supplier?.name || ""),
      filters: supplierFilters,
      onFilter: (value, record) => (record.supplier?.name || "") === value,
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
      title: "Thao tác",
      key: "actions",
      fixed: "right",
      width: 120,
      render: (_, row) => {
        return (
          <Space>
            <Tooltip title="Sửa giá">
              <Button icon={<EditOutlined />} onClick={() => onEdit(row)} />
            </Tooltip>

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
      scroll={{ x: 1100 }}
    />
  );
}
