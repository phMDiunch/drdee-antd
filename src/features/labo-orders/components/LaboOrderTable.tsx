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
import dayjs from "dayjs";
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
        width: 150,
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
        title: "Ngày điều trị",
        dataIndex: "treatmentDate",
        key: "treatmentDate",
        width: 120,
        render: (treatmentDate: string) =>
          dayjs(treatmentDate).format("DD/MM/YYYY"),
      },
      {
        title: "Loại đơn hàng",
        dataIndex: "orderType",
        key: "orderType",
        width: 100,
      },
      {
        title: "Xưởng",
        dataIndex: "supplier",
        key: "supplier",
        width: 120,
        render: (_, record) =>
          record.supplier.shortName || record.supplier.name,
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
        title: "Ngày gửi mẫu",
        dataIndex: "sendDate",
        key: "sendDate",
        width: 140,
        render: (sendDate: string) =>
          dayjs(sendDate).format("DD/MM/YYYY HH:mm"),
      },
      {
        title: "Ngày hẹn lắp",
        dataIndex: "expectedFitDate",
        key: "expectedFitDate",
        width: 100,
        render: (expectedFitDate: string | null) =>
          expectedFitDate ? dayjs(expectedFitDate).format("DD/MM/YYYY") : "-",
      },
      {
        title: "Yêu cầu",
        dataIndex: "detailRequirement",
        key: "detailRequirement",
        width: 150,
        ellipsis: {
          showTitle: false,
        },
        render: (detailRequirement: string | null) =>
          detailRequirement ? (
            <Tooltip title={detailRequirement}>
              <Text>{detailRequirement}</Text>
            </Tooltip>
          ) : (
            "-"
          ),
      },
      {
        title: "Ngày nhận mẫu",
        dataIndex: "returnDate",
        key: "returnDate",
        width: 140,
        align: "center" as const,
        render: (returnDate: string | null, record) => {
          if (returnDate) {
            return <Text>{dayjs(returnDate).format("DD/MM/YYYY HH:mm")}</Text>;
          }

          // Chưa nhận mẫu - hiển thị button
          return (
            <Tooltip title="Xác nhận đã nhận mẫu từ xưởng">
              <Popconfirm
                title="Bạn có chắc chắn đã nhận mẫu này từ xưởng?"
                onConfirm={() => onReceive(record.id)}
                okText="Có"
                cancelText="Không"
              >
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckOutlined />}
                  loading={actionLoading}
                >
                  Nhận mẫu
                </Button>
              </Popconfirm>
            </Tooltip>
          );
        },
      },
      {
        title: "Thao tác",
        key: "actions",
        width: 100,
        fixed: "right" as const,
        render: (_, record) => {
          const isReturned = record.returnDate !== null;
          const canEdit = isAdmin || !isReturned;
          const editTooltip = canEdit
            ? "Sửa đơn hàng"
            : "Chỉ admin mới sửa được đơn đã nhận mẫu";

          return (
            <Space split={<Divider type="vertical" />} size={0}>
              <Tooltip title={editTooltip}>
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  disabled={!canEdit}
                  onClick={() => onEdit(record)}
                />
              </Tooltip>
              {isAdmin && (
                <Tooltip title="Xóa đơn hàng">
                  <Popconfirm
                    title="Bạn có chắc chắn muốn xóa đơn hàng này?"
                    onConfirm={() => onDelete(record.id)}
                    okText="Xóa"
                    cancelText="Hủy"
                    okButtonProps={{ danger: true }}
                  >
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      loading={actionLoading}
                    />
                  </Popconfirm>
                </Tooltip>
              )}
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
      scroll={{ x: 1350 }}
      locale={{
        emptyText: "Không có đơn hàng",
      }}
      size="middle"
    />
  );
}
