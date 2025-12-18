// src/features/consulted-services/components/ConsultedServiceTable.tsx
"use client";

import React, { useState } from "react";
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
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  UserAddOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useClaimPipeline } from "@/features/sales-pipeline";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import Link from "next/link";
import {
  SERVICE_STATUS_TAGS,
  TREATMENT_STATUS_TAGS,
  CONSULTED_SERVICE_MESSAGES,
} from "../constants";
import type { ConsultedServiceResponse } from "@/shared/validation/consulted-service.schema";
import {
  SALES_STAGES,
  STAGE_LABELS,
  type SalesStage,
} from "@/shared/validation/consulted-service.schema";
import { useCurrentUser } from "@/shared/providers";
import { consultedServicePermissions } from "@/shared/permissions/consulted-service.permissions";
import StageSelect from "./StageSelect";
import StageTag from "./StageTag";
import ConsultedServiceDetailDrawer from "./ConsultedServiceDetailDrawer";

const { Text } = Typography;

type Props = {
  data: ConsultedServiceResponse[];
  loading?: boolean;
  isCustomerDetailView?: boolean; // Customer Detail context: hide customer column
  onConfirm: (id: string) => void;
  onEdit: (service: ConsultedServiceResponse) => void;
  onDelete: (id: string) => void;
  actionLoading?: boolean;
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
  onConfirm,
  onEdit,
  onDelete,
  actionLoading,
}: Props) {
  const { user: currentUser } = useCurrentUser();
  const claimPipelineMutation = useClaimPipeline();
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedService, setSelectedService] =
    useState<ConsultedServiceResponse | null>(null);

  const handleClaimPipeline = (consultedServiceId: string) => {
    claimPipelineMutation.mutate(consultedServiceId);
  };

  const handleViewDetail = (service: ConsultedServiceResponse) => {
    setSelectedService(service);
    setDetailDrawerOpen(true);
  };

  const columns = React.useMemo<ColumnsType<ConsultedServiceResponse>>(() => {
    // Calculate unique values for filters
    const serviceNames = Array.from(
      new Set(data.map((s) => s.consultedServiceName))
    ).sort();

    const consultingDoctors = Array.from(
      new Set(
        data
          .map((s) => s.consultingDoctor?.fullName)
          .filter((name): name is string => !!name)
      )
    ).sort();

    const treatingDoctors = Array.from(
      new Set(
        data
          .map((s) => s.treatingDoctor?.fullName)
          .filter((name): name is string => !!name)
      )
    ).sort();

    const sales = Array.from(
      new Set(
        data
          .map((s) => s.consultingSale?.fullName)
          .filter((name): name is string => !!name)
      )
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
                return (
                  dayjs(a.consultationDate).valueOf() -
                  dayjs(b.consultationDate).valueOf()
                );
              },
              render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
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
        title: "Bác sĩ tư vấn",
        dataIndex: ["consultingDoctor", "fullName"],
        key: "consultingDoctor",
        width: 120,
        filters: [
          { text: "Chưa chọn", value: "NONE" },
          ...consultingDoctors.map((name) => ({ text: name, value: name })),
        ],
        onFilter: (value, record) => {
          if (value === "NONE") return !record.consultingDoctor;
          return record.consultingDoctor?.fullName === value;
        },
        render: (name) => name || <Text type="secondary">—</Text>,
      },
      {
        title: "Bác sĩ điều trị",
        dataIndex: ["treatingDoctor", "fullName"],
        key: "treatingDoctor",
        width: 120,
        filters: [
          { text: "Chưa chọn", value: "NONE" },
          ...treatingDoctors.map((name) => ({ text: name, value: name })),
        ],
        onFilter: (value, record) => {
          if (value === "NONE") return !record.treatingDoctor;
          return record.treatingDoctor?.fullName === value;
        },
        render: (name) => name || <Text type="secondary">—</Text>,
      },
      {
        title: "Sale",
        key: "consultingSale",
        width: 140,
        filters: [
          { text: "Chưa chọn", value: "NONE" },
          ...sales.map((name) => ({ text: name, value: name })),
        ],
        onFilter: (value, record) => {
          if (value === "NONE") return !record.consultingSale;
          return record.consultingSale?.fullName === value;
        },
        render: (_, record) => {
          const requiresFollowUp = record.dentalService?.requiresFollowUp;
          const hasSale = !!record.consultingSale;

          // Case 1: Service doesn't require follow-up
          if (!requiresFollowUp) {
            return <Text type="secondary">—</Text>;
          }

          // Case 2: Requires follow-up but not yet claimed
          if (!hasSale) {
            return (
              <Button
                type="link"
                size="small"
                icon={<UserAddOutlined />}
                loading={claimPipelineMutation.isPending}
                onClick={() => handleClaimPipeline(record.id)}
              >
                Nhận quản lý
              </Button>
            );
          }

          // Case 3: Already claimed - show sale name
          return (
            <div>
              <Text strong>{record.consultingSale?.fullName}</Text>
            </div>
          );
        },
      },
      {
        title: "Stage",
        dataIndex: "stage",
        key: "stage",
        width: 160,
        filters: SALES_STAGES.map((stage) => ({
          text: STAGE_LABELS[stage],
          value: stage,
        })),
        onFilter: (value, record) => record.stage === value,
        render: (stage: SalesStage | null, record) => {
          // Only show stage management for services that require follow-up and are claimed
          const requiresFollowUp = record.dentalService?.requiresFollowUp;
          const hasSale = !!record.consultingSale;

          if (!requiresFollowUp || !hasSale) {
            return stage ? (
              <StageTag stage={stage} />
            ) : (
              <Text type="secondary">—</Text>
            );
          }

          // Show editable stage select
          const canEdit =
            currentUser?.role === "admin" ||
            record.consultingSale?.id === currentUser?.employeeId;

          if (!canEdit) {
            return stage ? (
              <StageTag stage={stage} />
            ) : (
              <Text type="secondary">—</Text>
            );
          }

          return (
            <StageSelect
              consultedServiceId={record.id}
              currentStage={stage}
              disabled={false}
            />
          );
        },
      },
      {
        title: "Trạng thái dịch vụ",
        dataIndex: "serviceStatus",
        key: "serviceStatus",
        width: 110,
        filters: [
          { text: "Chưa chốt", value: "Chưa chốt" },
          { text: "Đã chốt", value: "Đã chốt" },
        ],
        onFilter: (value, record) => record.serviceStatus === value,
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
              filters: [
                { text: "Chưa điều trị", value: "Chưa điều trị" },
                { text: "Đang điều trị", value: "Đang điều trị" },
                { text: "Hoàn thành", value: "Hoàn thành" },
              ],
              onFilter: (value, record) => record.treatmentStatus === value,
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
              <Tooltip title="Xem chi tiết">
                <Button
                  icon={<EyeOutlined />}
                  onClick={() => handleViewDetail(record)}
                />
              </Tooltip>
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
    actionLoading,
    isCustomerDetailView,
    claimPipelineMutation.isPending,
    handleClaimPipeline,
    handleViewDetail,
  ]);

  return (
    <>
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="id"
        scroll={{ x: 1500 }}
        pagination={false}
      />
      <ConsultedServiceDetailDrawer
        open={detailDrawerOpen}
        service={selectedService}
        onClose={() => {
          setDetailDrawerOpen(false);
          setSelectedService(null);
        }}
      />
    </>
  );
}
