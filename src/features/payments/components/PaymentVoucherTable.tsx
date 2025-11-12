// src/features/payments/components/PaymentVoucherTable.tsx
"use client";

import React, { useMemo } from "react";
import {
  Button,
  Popconfirm,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import Link from "next/link";
import { PAYMENT_MESSAGES, getPaymentMethodConfig } from "../constants";
import type {
  PaymentVoucherResponse,
  PaymentVoucherDetailResponse,
} from "@/shared/validation/payment-voucher.schema";
import { useCurrentUser } from "@/shared/providers";
import { paymentVoucherPermissions } from "@/shared/permissions/payment-voucher.permissions";

const { Text } = Typography;

type Props = {
  data: PaymentVoucherResponse[];
  loading?: boolean;
  isCustomerDetailView?: boolean; // Customer Detail context: hide customer column
  onEdit: (voucher: PaymentVoucherResponse) => void;
  onDelete: (id: string) => void;
  onPrint: (voucher: PaymentVoucherResponse) => void;
  actionLoading?: boolean;
};

/**
 * Format number to VND currency
 */
function formatVND(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(value);
}

export default function PaymentVoucherTable({
  data,
  loading,
  isCustomerDetailView = false,
  onEdit,
  onDelete,
  onPrint,
}: Props) {
  const { user: currentUser } = useCurrentUser();

  // Expandable details table
  const expandedRowRender = (record: PaymentVoucherResponse) => {
    const detailColumns: ColumnsType<PaymentVoucherDetailResponse> = [
      {
        title: "Dịch vụ",
        dataIndex: "consultedServiceName",
        key: "service",
      },
      {
        title: "Giá dịch vụ",
        dataIndex: "consultedServiceFinalPrice",
        key: "finalPrice",
        align: "right",
        render: (value: number) => formatVND(value),
      },
      {
        title: "Số tiền",
        dataIndex: "amount",
        key: "amount",
        align: "right",
        render: (value: number) => (
          <Text strong type="success">
            {formatVND(value)}
          </Text>
        ),
      },
      {
        title: "Phương thức",
        dataIndex: "paymentMethod",
        key: "paymentMethod",
        render: (value: string) => {
          const config = getPaymentMethodConfig(value);
          return (
            <Tag color={config.color}>
              {config.icon} {config.label}
            </Tag>
          );
        },
      },
    ];

    return (
      <Table
        columns={detailColumns}
        dataSource={record.details}
        pagination={false}
        rowKey="id"
        size="small"
      />
    );
  };

  const columns = useMemo<ColumnsType<PaymentVoucherResponse>>(() => {
    const baseColumns: ColumnsType<PaymentVoucherResponse> = [
      ...(!isCustomerDetailView
        ? [
            {
              title: "Khách hàng",
              dataIndex: "customer",
              key: "customer",
              width: 160,
              fixed: "left" as const,
              render: (_: unknown, record: PaymentVoucherResponse) => (
                <div>
                  <Link href={`/customers/${record.customer.id}`}>
                    <Text strong style={{ color: "#1890ff" }}>
                      {record.customer.fullName}
                    </Text>
                  </Link>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {record.customer.code || "N/A"}
                  </Text>
                </div>
              ),
            },
          ]
        : []),
      {
        title: "Số phiếu",
        dataIndex: "paymentNumber",
        key: "paymentNumber",
        width: 130,
        fixed: isCustomerDetailView ? ("left" as const) : undefined,
        sorter: (a, b) => a.paymentNumber.localeCompare(b.paymentNumber),
      },
      ...(isCustomerDetailView
        ? [
            {
              title: "Ngày thu",
              dataIndex: "paymentDate",
              key: "paymentDate",
              width: 140,
              render: (value: string) =>
                dayjs(value).format("DD/MM/YYYY HH:mm"),
              sorter: (a: PaymentVoucherResponse, b: PaymentVoucherResponse) =>
                dayjs(a.paymentDate).unix() - dayjs(b.paymentDate).unix(),
            },
          ]
        : []),
      {
        title: "Tổng tiền",
        dataIndex: "totalAmount",
        key: "totalAmount",
        width: 110,
        align: "right",
        render: (value: number) => (
          <Text strong type="success">
            {formatVND(value)}
          </Text>
        ),
        sorter: (a, b) => a.totalAmount - b.totalAmount,
      },
      {
        title: "Thu ngân",
        dataIndex: ["cashier", "fullName"],
        key: "cashierName",
        width: 120,
      },
      {
        title: "Số DV",
        key: "detailsCount",
        width: 60,
        align: "center",
        render: (_: unknown, record: PaymentVoucherResponse) => (
          <Tag>{record.details.length}</Tag>
        ),
      },
      {
        title: "Thao tác",
        key: "actions",
        width: 110,
        fixed: "right" as const,
        render: (_: unknown, record: PaymentVoucherResponse) => {
          // Calculate permissions outside JSX
          const canEdit = paymentVoucherPermissions.canEdit(
            currentUser,
            record
          );
          const canDelete = paymentVoucherPermissions.canDelete(currentUser);
          const canPrint = paymentVoucherPermissions.canPrint(
            currentUser,
            record
          );

          // Pre-calculate tooltip titles
          const printTooltip = canPrint.allowed ? "In phiếu" : canPrint.reason;
          const editTooltip = canEdit.allowed ? "Sửa" : canEdit.reason;
          const deleteTooltip = canDelete.allowed ? "Xóa" : canDelete.reason;

          return (
            <Space size="small">
              <Tooltip title={printTooltip}>
                <Button
                  icon={<PrinterOutlined />}
                  onClick={() => onPrint(record)}
                  disabled={!canPrint.allowed}
                />
              </Tooltip>

              <Tooltip title={editTooltip}>
                <Button
                  icon={<EditOutlined />}
                  onClick={() => onEdit(record)}
                  disabled={!canEdit.allowed}
                />
              </Tooltip>

              <Popconfirm
                title={PAYMENT_MESSAGES.DELETE_CONFIRM_TITLE}
                description={PAYMENT_MESSAGES.DELETE_CONFIRM_MESSAGE}
                onConfirm={() => onDelete(record.id)}
                okText="Xóa"
                cancelText="Hủy"
                disabled={!canDelete.allowed}
              >
                <Tooltip title={deleteTooltip}>
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    disabled={!canDelete.allowed}
                  />
                </Tooltip>
              </Popconfirm>
            </Space>
          );
        },
      },
    ];

    return baseColumns;
  }, [isCustomerDetailView, currentUser, onEdit, onDelete, onPrint]);

  return (
    <Table
      columns={columns}
      dataSource={data}
      loading={loading}
      rowKey="id"
      size="small"
      expandable={{
        expandedRowRender,
        rowExpandable: (record) => record.details.length > 0,
      }}
      scroll={{ x: 900 }}
      pagination={false}
    />
  );
}
