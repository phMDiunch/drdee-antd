"use client";

import React from "react";
import { Table, Tag, Tooltip, Popconfirm, Space, Button } from "antd";
import type { ColumnsType } from "antd/es/table";
import { EditOutlined, DeleteOutlined, InboxOutlined, RollbackOutlined } from "@ant-design/icons";
import { ClinicResponse } from "@/features/clinics/types";

type Props = {
  data: ClinicResponse[];
  loading?: boolean;
  onEdit: (row: ClinicResponse) => void;
  onDelete: (row: ClinicResponse) => void;
  onArchive: (row: ClinicResponse) => void;
  onUnarchive: (row: ClinicResponse) => void;
};

export default function ClinicTable({ data, loading, onEdit, onDelete, onArchive, onUnarchive }: Props) {
  const columns: ColumnsType<ClinicResponse> = [
    { title: "Mã", dataIndex: "clinicCode", key: "clinicCode", width: 140 },
    { title: "Tên phòng khám", dataIndex: "name", key: "name" },
    { title: "Điện thoại", dataIndex: "phone", key: "phone", width: 160 },
    { title: "Địa chỉ", dataIndex: "address", key: "address" },
    {
      title: "Màu",
      dataIndex: "colorCode",
      key: "colorCode",
      width: 120,
      render: (hex: string) => (
        <Tag color={hex} style={{ borderColor: hex }}>
          {hex}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      fixed: "right",
      width: 150,
      render: (_: any, row) => {
        const isArchived = !!row.archivedAt;
        return (
          <Space>
            <Tooltip title="Sửa">
              <Button icon={<EditOutlined />} onClick={() => onEdit(row)} />
            </Tooltip>

            {!isArchived ? (
              <Tooltip title="Lưu trữ">
                <Button icon={<InboxOutlined />} onClick={() => onArchive(row)} />
              </Tooltip>
            ) : (
              <Tooltip title="Khôi phục">
                <Button icon={<RollbackOutlined />} onClick={() => onUnarchive(row)} />
              </Tooltip>
            )}

            <Popconfirm
              title="Xoá phòng khám"
              description="Bạn chắc chắn muốn xoá? Hành động này không thể hoàn tác."
              okText="Xoá"
              cancelText="Huỷ"
              onConfirm={() => onDelete(row)}
            >
              <Tooltip title="Xoá">
                <Button danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <Table
      rowKey="id"
      loading={loading}
      columns={columns}
      dataSource={data}
      pagination={false}
      scroll={{ x: 900 }}
      size="middle"
    />
  );
}
