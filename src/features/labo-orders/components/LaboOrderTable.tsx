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
import type { LaboOrderResponse } from "@/shared/validation/labo-order.schema";
import { laboOrderPermissions } from "@/shared/permissions/labo-order.permissions";
import { useCurrentUser } from "@/shared/providers";

const { Text } = Typography;

type Props = {
  data: LaboOrderResponse[];
  loading?: boolean;
  onReceive: (id: string) => void;
  onEdit: (order: LaboOrderResponse) => void;
  onDelete: (id: string) => void;
  actionLoading?: boolean;
  isCustomerDetailView?: boolean;
};

export function LaboOrderTable({
  data,
  loading,
  onReceive,
  onEdit,
  onDelete,
  actionLoading,
  isCustomerDetailView = false,
}: Props) {
  const { user: currentUser } = useCurrentUser();

  const columns = useMemo<ColumnsType<LaboOrderResponse>>(() => {
    const allColumns: ColumnsType<LaboOrderResponse> = [
      // 1. Khách hàng (hidden in customer detail view)
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
      // 2. Ngày điều trị
      {
        title: "Ngày điều trị",
        dataIndex: "treatmentDate",
        key: "treatmentDate",
        width: 120,
        render: (treatmentDate: string) =>
          dayjs(treatmentDate).format("DD/MM/YYYY"),
      },
      // 3. Bác sĩ
      {
        title: "Bác sĩ",
        dataIndex: "doctor",
        key: "doctor",
        width: 120,
        render: (_, record) => record.doctor.fullName,
      },
      // 4. Xưởng
      {
        title: "Xưởng",
        dataIndex: "supplier",
        key: "supplier",
        width: 120,
        render: (_, record) =>
          record.supplier.shortName || record.supplier.name,
      },
      // 5. Loại răng
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
      // 6. Số lượng
      {
        title: "SL",
        dataIndex: "quantity",
        key: "quantity",
        width: 50,
        align: "center" as const,
      },
      // 7. Yêu cầu
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
      // 8. Loại đơn hàng
      {
        title: "Loại đơn hàng",
        dataIndex: "orderType",
        key: "orderType",
        width: 100,
      },
      // 9. Ngày gửi mẫu
      {
        title: "Ngày gửi mẫu",
        dataIndex: "sentDate",
        key: "sentDate",
        width: 140,
        render: (sentDate: string) =>
          dayjs(sentDate).format("DD/MM/YYYY HH:mm"),
      },
      // 10. Ngày hẹn lắp
      {
        title: "Ngày hẹn lắp",
        dataIndex: "expectedFitDate",
        key: "expectedFitDate",
        width: 100,
        render: (expectedFitDate: string | null) =>
          expectedFitDate ? dayjs(expectedFitDate).format("DD/MM/YYYY") : "-",
      },
      // 11. Ngày nhận mẫu
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
          const editPermission = laboOrderPermissions.canEdit(
            currentUser,
            record
          );
          const deletePermission = laboOrderPermissions.canDelete(currentUser);

          return (
            <Space split={<Divider type="vertical" />} size={0}>
              <Tooltip title={editPermission.reason || "Sửa đơn hàng"}>
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  disabled={!editPermission.allowed}
                  onClick={() => onEdit(record)}
                />
              </Tooltip>
              {deletePermission.allowed && (
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

    // Filter out customer column when in customer detail view
    if (isCustomerDetailView) {
      return allColumns.filter((col) => col.key !== "customer");
    }

    return allColumns;
  }, [
    onReceive,
    onEdit,
    onDelete,
    actionLoading,
    isCustomerDetailView,
    currentUser,
  ]);

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
