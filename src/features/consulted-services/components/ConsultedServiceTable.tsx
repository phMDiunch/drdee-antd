// src/features/consulted-services/components/ConsultedServiceTable.tsx
"use client";

import React from "react";
import {
  Button,
  Popconfirm,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { CheckOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import Link from "next/link";
import {
  SERVICE_STATUS_TAGS,
  TREATMENT_STATUS_TAGS,
  CONSULTED_SERVICE_MESSAGES,
} from "../constants";
import type { ConsultedServiceResponse } from "@/shared/validation/consulted-service.schema";
import { useCurrentUser } from "@/shared/providers";
import { consultedServicePermissions } from "@/shared/permissions/consulted-service.permissions";

const { Text } = Typography;

type Props = {
  data: ConsultedServiceResponse[];
  loading?: boolean;
  isCustomerDetailView?: boolean; // Customer Detail context: hide customer column
  view?: "daily" | "pending" | "customer"; // View type to determine which columns to show
  onConfirm: (id: string) => void;
  onEdit: (service: ConsultedServiceResponse) => void;
  onDelete: (id: string) => void;
  onAssignSale: (id: string) => void; // New: Auto-assign sale action
  actionLoading?: boolean;
  expandable?: {
    expandedRowRender: (record: ConsultedServiceResponse) => React.ReactNode;
  }; // Optional: Enable expandable rows (for pending view)
};

/**
 * Format number to VND currency
 */
function formatVND(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(value);
}

export default function ConsultedServiceTable({
  data,
  loading,
  isCustomerDetailView = false,
  view = "daily",
  onConfirm,
  onEdit,
  onDelete,
  onAssignSale,
  actionLoading,
  expandable,
}: Props) {
  const { user: currentUser } = useCurrentUser();

  const columns = React.useMemo<ColumnsType<ConsultedServiceResponse>>(() => {
    // Calculate unique values for filters
    const serviceNames = Array.from(
      new Set(data.map((s) => s.consultedServiceName))
    ).sort();

    const baseColumns: ColumnsType<ConsultedServiceResponse> = [
      ...(!isCustomerDetailView
        ? [
            {
              title: "Khách hàng",
              dataIndex: "customer",
              key: "customer",
              width: 160,
              fixed: "left" as const,
              render: (customer: {
                id: string;
                fullName: string;
                customerCode: string | null;
                dob: string | null;
              }) => {
                const age = customer.dob
                  ? `${dayjs().diff(dayjs(customer.dob), "year")} tuổi`
                  : "—";
                return (
                  <div>
                    <Space size={4}>
                      <Link
                        href={`/customers/${customer.id}`}
                        style={{ fontWeight: 600 }}
                      >
                        {customer.fullName}
                      </Link>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        ({age})
                      </Text>
                    </Space>
                    <br />
                    <Space size={4} style={{ marginTop: 4 }}>
                      {customer.customerCode && (
                        <Tag color="blue" style={{ fontSize: 11, margin: 0 }}>
                          {customer.customerCode}
                        </Tag>
                      )}
                    </Space>
                  </div>
                );
              },
            },
          ]
        : []),
      // Customer Detail View: Add "Ngày tư vấn" column
      ...((isCustomerDetailView
        ? [
            {
              title: "Ngày tư vấn",
              dataIndex: "consultationDate",
              key: "consultationDate",
              width: 110,
              sorter: (
                a: ConsultedServiceResponse,
                b: ConsultedServiceResponse
              ) => {
                const aDate = a.consultationDate
                  ? dayjs(a.consultationDate).valueOf()
                  : 0;
                const bDate = b.consultationDate
                  ? dayjs(b.consultationDate).valueOf()
                  : 0;
                return aDate - bDate;
              },
              render: (date: string | null) =>
                date ? dayjs(date).format("DD/MM/YYYY") : "Chưa đến",
            },
          ]
        : []) as ColumnsType<ConsultedServiceResponse>),
      {
        title: "Dịch vụ",
        dataIndex: "consultedServiceName",
        key: "service",
        width: 180,
        filters: serviceNames.map((name) => ({ text: name, value: name })),
        onFilter: (value, record) => record.consultedServiceName === value,
        ellipsis: true,
      },
      {
        title: "SL",
        dataIndex: "quantity",
        key: "quantity",
        width: 50,
        align: "center",
      },
      {
        title: "Giá ưu đãi",
        dataIndex: "preferentialPrice",
        key: "preferentialPrice",
        width: 105,
        align: "right",
        render: (price) => <Text>{formatVND(price)}</Text>,
      },
      {
        title: "Thành tiền",
        dataIndex: "finalPrice",
        key: "finalPrice",
        width: 115,
        align: "right",
        sorter: (a, b) => a.finalPrice - b.finalPrice,
        render: (price) => <Text strong>{formatVND(price)}</Text>,
      },
      // Customer Detail View: Add "Công nợ" column
      ...((isCustomerDetailView
        ? [
            {
              title: "Công nợ",
              dataIndex: "debt",
              key: "debt",
              width: 105,
              align: "right" as const,
              sorter: (
                a: ConsultedServiceResponse,
                b: ConsultedServiceResponse
              ) => a.debt - b.debt,
              render: (debt: number) => (
                <Text
                  strong
                  style={{ color: debt > 0 ? "#ff4d4f" : undefined }}
                >
                  {formatVND(debt)}
                </Text>
              ),
            },
          ]
        : []) as ColumnsType<ConsultedServiceResponse>),
      {
        title: "Sale online",
        dataIndex: ["saleOnline", "fullName"],
        key: "saleOnline",
        width: 120,
        render: (name) => name || <Text type="secondary">—</Text>,
      },
      {
        title: "Bác sĩ tư vấn",
        dataIndex: ["consultingDoctor", "fullName"],
        key: "consultingDoctor",
        width: 120,
        render: (name) => name || <Text type="secondary">—</Text>,
      },
      {
        title: "Sale offline",
        dataIndex: ["consultingSale", "fullName"],
        key: "consultingSale",
        width: 120,
        render: (name, record) => {
          // Legacy data: requiresFollowUp=false but has consultingSaleId
          if (
            !record.dentalService?.requiresFollowUp &&
            record.consultingSaleId
          ) {
            return name || <Text type="secondary">—</Text>;
          }

          // Case 1: Service doesn't require follow-up
          if (!record.dentalService?.requiresFollowUp) {
            return <Text type="secondary">—</Text>;
          }

          // Case 2: Requires follow-up but no sale assigned yet
          if (!record.consultingSaleId) {
            return (
              <Button
                type="primary"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onAssignSale(record.id);
                }}
                loading={actionLoading}
              >
                Follow up
              </Button>
            );
          }

          // Case 3: Has sale assigned
          return name || <Text type="secondary">—</Text>;
        },
      },
      // Hide "Bác sĩ điều trị" in pending view
      ...((view !== "pending"
        ? [
            {
              title: "Bác sĩ điều trị",
              dataIndex: ["treatingDoctor", "fullName"],
              key: "treatingDoctor",
              width: 120,
              render: (name: string | undefined) =>
                name || <Text type="secondary">—</Text>,
            },
          ]
        : []) as ColumnsType<ConsultedServiceResponse>),
      // Hide "Ngày chốt" in pending view
      ...((view !== "pending"
        ? [
            {
              title: "Ngày chốt",
              dataIndex: "serviceConfirmDate",
              key: "serviceConfirmDate",
              width: 130,
              sorter: (a, b) => {
                if (!a.serviceConfirmDate) return 1;
                if (!b.serviceConfirmDate) return -1;
                return (
                  dayjs(a.serviceConfirmDate).valueOf() -
                  dayjs(b.serviceConfirmDate).valueOf()
                );
              },
              render: (date, record) => {
                if (record.serviceStatus === "Đã chốt" && date) {
                  return dayjs(date).format("DD/MM/YYYY HH:mm");
                }
                // Show inline confirm button
                const canConfirm = consultedServicePermissions.canConfirm(
                  currentUser,
                  record
                );
                return (
                  <Popconfirm
                    title={CONSULTED_SERVICE_MESSAGES.CONFIRM_SERVICE}
                    onConfirm={() => onConfirm(record.id)}
                    disabled={!canConfirm.allowed}
                  >
                    <Button
                      type="primary"
                      size="small"
                      icon={<CheckOutlined />}
                      disabled={!canConfirm.allowed}
                      loading={actionLoading}
                    >
                      Chốt
                    </Button>
                  </Popconfirm>
                );
              },
            },
          ]
        : []) as ColumnsType<ConsultedServiceResponse>),
      {
        title: "Trạng thái dịch vụ",
        dataIndex: "serviceStatus",
        key: "serviceStatus",
        width: 110,
        render: (status) => {
          const tag =
            SERVICE_STATUS_TAGS[status as keyof typeof SERVICE_STATUS_TAGS];
          return <Tag color={tag.color}>{tag.text}</Tag>;
        },
      },
      // Customer Detail View: Add "Trạng thái điều trị" column
      ...((isCustomerDetailView
        ? [
            {
              title: "Trạng thái điều trị",
              dataIndex: "treatmentStatus",
              key: "treatmentStatus",
              width: 110,
              render: (status: string) => {
                const tag =
                  TREATMENT_STATUS_TAGS[
                    status as keyof typeof TREATMENT_STATUS_TAGS
                  ];
                return <Tag color={tag.color}>{tag.text}</Tag>;
              },
            },
          ]
        : []) as ColumnsType<ConsultedServiceResponse>),
      {
        title: "Thao tác",
        key: "actions",
        width: 110,
        fixed: "right",
        render: (_, record) => {
          const deletePermission = consultedServicePermissions.canDelete(
            currentUser,
            record
          );

          const deleteMessage =
            record.serviceStatus === "Đã chốt"
              ? CONSULTED_SERVICE_MESSAGES.DELETE_CONFIRM_CONFIRMED
              : CONSULTED_SERVICE_MESSAGES.DELETE_CONFIRM_UNCONFIRMED;

          // Remove unused editPermission variable since button is always enabled
          return (
            <Space size="small">
              <Tooltip title="Sửa">
                <Button
                  icon={<EditOutlined />}
                  onClick={() => onEdit(record)}
                />
              </Tooltip>
              <Popconfirm
                title={deleteMessage}
                onConfirm={() => onDelete(record.id)}
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
                disabled={!deletePermission.allowed}
              >
                <Tooltip
                  title={
                    deletePermission.allowed ? "Xóa" : deletePermission.reason
                  }
                >
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    disabled={!deletePermission.allowed}
                  />
                </Tooltip>
              </Popconfirm>
            </Space>
          );
        },
      },
    ];

    return baseColumns;
  }, [
    data,
    currentUser,
    onConfirm,
    onEdit,
    onDelete,
    onAssignSale,
    actionLoading,
    isCustomerDetailView,
    view,
  ]);

  return (
    <Table
      columns={columns}
      dataSource={data}
      loading={loading}
      rowKey="id"
      scroll={{ x: 1300 }}
      pagination={false}
      expandable={expandable}
    />
  );
}
