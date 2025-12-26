// src/features/sales-activities/components/SalesActivityTable.tsx
"use client";

import React from "react";
import {
  Table,
  Space,
  Button,
  Tooltip,
  Typography,
  Tag,
  Popconfirm,
} from "antd";
import { EditOutlined, DeleteOutlined, PhoneOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import Link from "next/link";
import type { SalesActivityResponse } from "@/shared/validation/sales-activity.schema";
import { useCurrentUser } from "@/shared/providers";
import {
  CONTACT_TYPE_LABELS,
  CONTACT_TYPE_ICONS,
  SALES_ACTIVITY_MESSAGES,
} from "../constants";

type Props = {
  data: SalesActivityResponse[];
  loading?: boolean;
  onEdit: (activity: SalesActivityResponse) => void;
  onDelete: (activity: SalesActivityResponse) => void;
  showCustomerColumn?: boolean; // Show customer column for Daily View
};

export default function SalesActivityTable({
  data,
  loading = false,
  onEdit,
  onDelete,
  showCustomerColumn = false,
}: Props) {
  const { user: currentUser } = useCurrentUser();

  const calculateAge = (dob: string | null) => {
    if (!dob) return "—";
    const age = dayjs().diff(dayjs(dob), "year");
    return `${age} tuổi`;
  };

  const columns = React.useMemo<ColumnsType<SalesActivityResponse>>(
    () => [
      {
        title: "Khách hàng",
        key: "customer",
        width: 180,
        render: (_, record) => {
          const customer = record.consultedService.customer;
          return (
            <div>
              <Space size={4}>
                <Link
                  href={`/customers/${customer.id}?tab=sales-activities`}
                  style={{ fontWeight: 600 }}
                >
                  {customer.fullName}
                </Link>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  ({calculateAge(customer.dob)})
                </Typography.Text>
              </Space>
              <br />
              <Space size={4} style={{ marginTop: 4 }}>
                {customer.customerCode && (
                  <Tag color="blue" style={{ fontSize: 11, margin: 0 }}>
                    {customer.customerCode}
                  </Tag>
                )}
                {customer.phone && (
                  <Tooltip title={customer.phone}>
                    <PhoneOutlined style={{ color: "#1890ff", fontSize: 14 }} />
                  </Tooltip>
                )}
              </Space>
            </div>
          );
        },
      },
      {
        title: "Ngày giờ",
        dataIndex: "contactDate",
        key: "contactDate",
        width: 140,
        sorter: (a, b) =>
          new Date(a.contactDate).getTime() - new Date(b.contactDate).getTime(),
        render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm"),
      },
      {
        title: "Dịch vụ",
        key: "service",
        width: 200,
        render: (_, record) => (
          <div>
            <div>{record.consultedService.consultedServiceName}</div>
            {record.consultedService.stage && (
              <Tag color="blue" style={{ marginTop: 4 }}>
                {record.consultedService.stage}
              </Tag>
            )}
          </div>
        ),
      },
      {
        title: "Hình thức",
        dataIndex: "contactType",
        key: "contactType",
        width: 120,
        filters: [
          { text: CONTACT_TYPE_LABELS.call, value: "call" },
          { text: CONTACT_TYPE_LABELS.message, value: "message" },
          { text: CONTACT_TYPE_LABELS.meet, value: "meet" },
        ],
        onFilter: (value, record) => record.contactType === value,
        render: (type: "call" | "message" | "meet") => (
          <span>
            {CONTACT_TYPE_ICONS[type]} {CONTACT_TYPE_LABELS[type]}
          </span>
        ),
      },
      {
        title: "Nội dung",
        dataIndex: "content",
        key: "content",
        ellipsis: { showTitle: false },
        render: (content: string) => (
          <Tooltip title={content}>
            <Typography.Text ellipsis style={{ maxWidth: 300 }}>
              {content}
            </Typography.Text>
          </Tooltip>
        ),
      },
      {
        title: "Follow-up",
        dataIndex: "nextContactDate",
        key: "nextContactDate",
        width: 110,
        render: (date: string | null) =>
          date ? dayjs(date).format("DD/MM/YYYY") : "-",
      },
      {
        title: "Nhân viên",
        key: "sale",
        width: 180,
        render: (_, record) => record.sale.fullName,
      },
      {
        title: "Thao tác",
        key: "actions",
        width: 110,
        fixed: "right",
        render: (_, record) => {
          // Calculate permissions outside JSX
          const isAdmin = currentUser?.role === "admin";
          const isOwner = currentUser?.employeeId === record.saleId;
          const daysSinceCreation =
            (new Date().getTime() - new Date(record.createdAt).getTime()) /
            (1000 * 60 * 60 * 24);
          const withinEditWindow = daysSinceCreation <= 7;
          const withinDeleteWindow = daysSinceCreation <= 1;

          const canEdit = isAdmin || (isOwner && withinEditWindow);
          const canDelete = isAdmin || (isOwner && withinDeleteWindow);

          const editTooltip = !isOwner
            ? "Bạn chỉ có thể sửa hoạt động của mình"
            : !withinEditWindow
            ? "Chỉ có thể sửa trong vòng 7 ngày"
            : "Sửa";

          const deleteTooltip = !isOwner
            ? "Bạn chỉ có thể xóa hoạt động của mình"
            : !withinDeleteWindow
            ? "Chỉ có thể xóa trong vòng 24h"
            : "Xóa";

          return (
            <Space size="small">
              <Tooltip title={editTooltip}>
                <Button
                  icon={<EditOutlined />}
                  disabled={!canEdit}
                  onClick={() => onEdit(record)}
                />
              </Tooltip>
              <Popconfirm
                title={SALES_ACTIVITY_MESSAGES.DELETE_CONFIRM_TITLE}
                description={SALES_ACTIVITY_MESSAGES.DELETE_CONFIRM_MESSAGE}
                onConfirm={() => onDelete(record)}
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
                disabled={!canDelete}
              >
                <Tooltip title={deleteTooltip}>
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    disabled={!canDelete}
                  />
                </Tooltip>
              </Popconfirm>
            </Space>
          );
        },
      },
    ],
    [onEdit, onDelete, currentUser]
  );

  // Filter columns based on context
  const visibleColumns = React.useMemo(() => {
    if (!showCustomerColumn) {
      // Customer Detail view: Hide customer column
      return columns.filter((col) => col.key !== "customer");
    }
    // Daily View: Show all columns including customer
    return columns;
  }, [columns, showCustomerColumn]);

  return (
    <Table
      columns={visibleColumns}
      dataSource={data}
      rowKey="id"
      loading={loading}
      pagination={{
        showSizeChanger: true,
        pageSizeOptions: [10, 20, 50, 100],
        showTotal: (total) => `Tổng ${total} hoạt động`,
      }}
      scroll={{ x: showCustomerColumn ? 1380 : 1200 }}
    />
  );
}
