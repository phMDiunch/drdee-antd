// src/features/sales-pipeline/components/PipelineTable.tsx
"use client";

import React, { useMemo, useState } from "react";
import { Table, Button, Space, Typography, Tag, Tooltip, Divider } from "antd";
import { EditOutlined, SwapOutlined, UserAddOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import { useCurrentUser } from "@/shared/providers";
import SalesActivityModal from "./SalesActivityModal";
import ReassignSaleModal from "./ReassignSaleModal";
import { useCreateSalesActivity } from "../hooks/useCreateSalesActivity";
import { useReassignSale } from "../hooks/useReassignSale";
import { useClaimPipeline } from "../hooks/useClaimPipeline";
import type { CreateSalesActivityFormData } from "@/shared/validation/sales-activity.schema";
import type { ReassignSaleRequest } from "@/shared/validation/sales-activity.schema";

dayjs.extend(relativeTime);
dayjs.locale("vi");

const { Text, Link } = Typography;

interface PipelineService {
  id: string;
  consultedServiceName: string;
  serviceConfirmDate: string | null;
  serviceStatus: string;
  specificStatus: string | null;
  consultingSaleId: string | null;
  customer: {
    id: string;
    fullName: string;
    phone: string | null;
  };
  dentalService: {
    id: string;
    name: string;
    requiresFollowUp: boolean;
  };
  consultingSale: {
    id: string;
    fullName: string;
  } | null;
}

interface PipelineTableProps {
  data: PipelineService[];
  loading?: boolean;
}

export default function PipelineTable({ data, loading }: PipelineTableProps) {
  const { user } = useCurrentUser();
  const isAdmin = user?.role === "admin";

  const [activityModal, setActivityModal] = useState<{
    open: boolean;
    service: PipelineService | null;
  }>({ open: false, service: null });

  const [reassignModal, setReassignModal] = useState<{
    open: boolean;
    service: PipelineService | null;
  }>({ open: false, service: null });

  const createActivityMutation = useCreateSalesActivity(
    activityModal.service?.id || ""
  );
  const reassignMutation = useReassignSale();
  const claimPipelineMutation = useClaimPipeline();

  const handleActivitySubmit = (values: CreateSalesActivityFormData) => {
    createActivityMutation.mutate(
      {
        ...values,
        nextContactDate: values.nextContactDate
          ? new Date(values.nextContactDate)
          : undefined,
      },
      {
        onSuccess: () => {
          setActivityModal({ open: false, service: null });
        },
      }
    );
  };

  const handleReassignSubmit = (values: ReassignSaleRequest) => {
    reassignMutation.mutate(values, {
      onSuccess: () => {
        setReassignModal({ open: false, service: null });
      },
    });
  };

  const handleClaimPipeline = (consultedServiceId: string) => {
    claimPipelineMutation.mutate({ consultedServiceId });
  };

  const columns = useMemo<ColumnsType<PipelineService>>(
    () => [
      {
        title: "Khách hàng",
        key: "customer",
        width: 200,
        render: (_, record) => (
          <div>
            <Link href={`/customers/${record.customer.id}`} strong>
              {record.customer.fullName}
            </Link>
            {record.customer.phone && (
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {record.customer.phone}
                </Text>
              </div>
            )}
          </div>
        ),
      },
      {
        title: "Dịch vụ",
        dataIndex: "consultedServiceName",
        key: "service",
        width: 250,
        ellipsis: { showTitle: false },
        render: (text: string) => (
          <Tooltip title={text}>
            <Text>{text}</Text>
          </Tooltip>
        ),
      },
      {
        title: "Ngày chốt",
        dataIndex: "serviceConfirmDate",
        key: "confirmDate",
        width: 120,
        render: (date: string | null) =>
          date ? dayjs(date).format("DD/MM/YYYY") : "-",
      },
      {
        title: "Trạng thái DV",
        dataIndex: "serviceStatus",
        key: "status",
        width: 110,
        render: (status: string) => (
          <Tag color={status === "Đã chốt" ? "green" : "orange"}>{status}</Tag>
        ),
      },
      {
        title: "Sale",
        key: "sale",
        width: 150,
        render: (_, record) => {
          const hasSale = !!record.consultingSale;

          // Case 1: No sale assigned yet - show claim button
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

          // Case 2: Sale already assigned - show name
          return (
            <div>
              <Text strong>{record.consultingSale.fullName}</Text>
            </div>
          );
        },
      },
      {
        title: "Lần tiếp xúc cuối",
        key: "lastContact",
        width: 150,
        render: (_, record: any) => {
          const latestActivity = record.latestActivity;
          if (!latestActivity) return <Text type="secondary">-</Text>;

          const contactDate = dayjs(latestActivity.contactDate);
          const daysAgo = dayjs().diff(contactDate, "day");
          const timeText =
            daysAgo === 0
              ? "Hôm nay"
              : daysAgo === 1
              ? "Hôm qua"
              : `${daysAgo} ngày trước`;

          const iconMap = {
            call: "📞",
            message: "💬",
            meet: "🤝",
          };
          const icon =
            iconMap[latestActivity.contactType as keyof typeof iconMap] || "";

          return (
            <Space size={4}>
              <span>{icon}</span>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {timeText}
              </Text>
            </Space>
          );
        },
      },
      {
        title: "Ghi chú",
        dataIndex: "specificStatus",
        key: "notes",
        width: 200,
        ellipsis: { showTitle: false },
        render: (text: string | null) =>
          text ? (
            <Tooltip title={text}>
              <Text type="secondary">
                {text.length > 50 ? `${text.substring(0, 50)}...` : text}
              </Text>
            </Tooltip>
          ) : (
            "-"
          ),
      },
      {
        title: "Thao tác",
        key: "actions",
        fixed: "right",
        width: 80,
        render: (_, record) => {
          const hasSale = !!record.consultingSale;
          const canAddActivity =
            hasSale &&
            (isAdmin || record.consultingSaleId === user?.employeeId);

          return (
            <Space split={<Divider type="vertical" />} size={0}>
              {canAddActivity && (
                <Tooltip title="Ghi nhận hoạt động">
                  <Button
                    type="link"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() =>
                      setActivityModal({ open: true, service: record })
                    }
                  />
                </Tooltip>
              )}
              {isAdmin && hasSale && (
                <Tooltip title="Chuyển sale">
                  <Button
                    type="link"
                    size="small"
                    icon={<SwapOutlined />}
                    onClick={() =>
                      setReassignModal({ open: true, service: record })
                    }
                  />
                </Tooltip>
              )}
            </Space>
          );
        },
      },
    ],
    [isAdmin, user]
  );

  return (
    <>
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="id"
        scroll={{ x: 1200 }}
        pagination={false}
        size="small"
      />

      {/* Sales Activity Modal */}
      {activityModal.service && (
        <SalesActivityModal
          open={activityModal.open}
          consultedServiceId={activityModal.service.id}
          customerName={activityModal.service.customer.fullName}
          customerPhone={activityModal.service.customer.phone || undefined}
          serviceName={activityModal.service.consultedServiceName}
          confirmLoading={createActivityMutation.isPending}
          onCancel={() => setActivityModal({ open: false, service: null })}
          onSubmit={handleActivitySubmit}
        />
      )}

      {/* Reassign Sale Modal */}
      {reassignModal.service && (
        <ReassignSaleModal
          open={reassignModal.open}
          consultedServiceId={reassignModal.service.id}
          currentSaleName={reassignModal.service.consultingSale?.fullName}
          customerName={reassignModal.service.customer.fullName}
          serviceName={reassignModal.service.consultedServiceName}
          confirmLoading={reassignMutation.isPending}
          onCancel={() => setReassignModal({ open: false, service: null })}
          onSubmit={handleReassignSubmit}
        />
      )}
    </>
  );
}
