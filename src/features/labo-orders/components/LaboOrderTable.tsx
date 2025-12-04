// src/features/labo-orders/components/LaboOrderTable.tsx
"use client";

import React, { useMemo } from "react";
import {
  Button,
  Divider,
  Popconfirm,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { CheckOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import type { DailyLaboOrderResponse } from "@/shared/validation/labo-order.schema";

const { Text } = Typography;

type Props = {
  data: DailyLaboOrderResponse[];
  loading?: boolean;
  isAdmin: boolean;
  onReceive: (id: string) => void;
  onEdit: (order: DailyLaboOrderResponse) => void;
  onDelete: (id: string) => void;
  actionLoading?: boolean;
};

export function LaboOrderTable({
  data,
  loading,
  isAdmin,
  onReceive,
  onEdit,
  onDelete,
  actionLoading,
}: Props) {
  const columns = useMemo<ColumnsType<DailyLaboOrderResponse>>(() => {
    return [
      {
        title: "Khách hàng",
        dataIndex: "customer",
        key: "customer",
        width: 170,
        render: (_, record) => {
          const customerName = record.customer.fullName;
          const customerCode = record.customer.customerCode;
          return (
            <div>
              <Link
                href={`/customers/${record.customerId}`}
                style={{ fontWeight: 500 }}
              >
                {customerName}
              </Link>
              <br />
              {customerCode && (
                <Tag color="blue" style={{ fontSize: 11, marginTop: 4 }}>
                  {customerCode}
                </Tag>
              )}
            </div>
          );
        },
      },
      {
        title: "Bác sĩ",
        dataIndex: "doctor",
        key: "doctor",
        width: 120,
        render: (_, record) => record.doctor.fullName,
      },
      {
        title: "Xưởng",
        dataIndex: "supplier",
        key: "supplier",
        width: 120,
        render: (_, record) => record.supplier.name,
      },
      {
        title: "Loại răng",
        dataIndex: "laboItem",
        key: "laboItem",
        width: 140,
        render: (_, record) => {
          const itemName = record.laboItem.name;
          const serviceGroup = record.laboItem.serviceGroup;
          // TODO: Resolve serviceGroupLabel from MasterData
          const serviceGroupLabel = serviceGroup;
          return (
            <div>
              <div>{itemName}</div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {serviceGroupLabel}
              </Text>
            </div>
          );
        },
      },
      {
        title: "SL",
        dataIndex: "quantity",
        key: "quantity",
        width: 50,
        align: "center" as const,
      },
      {
        title: "Thao tác",
        key: "actions",
        width: 180,
        fixed: "right" as const,
        render: (_, record) => {
          const isReturned = record.returnDate !== null;
          const canEdit = isAdmin || !isReturned;

          // Calculate JSX elements first
          const receiveButton = !isReturned ? (
            <Tooltip title="Xác nhận đã nhận mẫu từ xưởng">
              <Popconfirm
                title="Bạn có chắc chắn đã nhận mẫu này từ xưởng?"
                onConfirm={() => onReceive(record.id)}
                okText="Có"
                cancelText="Không"
              >
                <Button
                  type="link"
                  size="small"
                  icon={<CheckOutlined />}
                  loading={actionLoading}
                >
                  Nhận mẫu
                </Button>
              </Popconfirm>
            </Tooltip>
          ) : null;

          const editButton = canEdit ? (
            <Tooltip title="Sửa đơn hàng">
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(record)}
              >
                Sửa
              </Button>
            </Tooltip>
          ) : (
            <Tooltip title="Chỉ admin mới sửa được đơn đã nhận mẫu">
              <Button type="link" size="small" icon={<EditOutlined />} disabled>
                Sửa
              </Button>
            </Tooltip>
          );

          const deleteButton = isAdmin ? (
            <Tooltip title="Xóa đơn hàng">
              <Popconfirm
                title="Bạn có chắc chắn muốn xóa đơn hàng này?"
                onConfirm={() => onDelete(record.id)}
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
              >
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  loading={actionLoading}
                >
                  Xóa
                </Button>
              </Popconfirm>
            </Tooltip>
          ) : null;

          // Filter out null values
          const actions = [receiveButton, editButton, deleteButton].filter(
            Boolean
          );

          return (
            <Space split={<Divider type="vertical" />} size={0}>
              {actions}
            </Space>
          );
        },
      },
    ];
  }, [isAdmin, onReceive, onEdit, onDelete, actionLoading]);

  return (
    <Table
      dataSource={data}
      columns={columns}
      rowKey="id"
      loading={loading}
      pagination={false}
      scroll={{ x: 950 }}
      locale={{
        emptyText: "Không có đơn hàng",
      }}
      size="middle"
    />
  );
}
