// src/features/treatment-logs/components/TreatmentLogTable.tsx
"use client";

import React from "react";
import {
  Table,
  Tag,
  Button,
  Popconfirm,
  Space,
  Typography,
  Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type { TreatmentLogResponse } from "@/shared/validation/treatment-log.schema";
import { useCurrentUser } from "@/shared/providers";
import { treatmentLogPermissions } from "@/shared/permissions/treatment-log.permissions";

const { Text } = Typography;

type TreatmentLogTableProps = {
  data: TreatmentLogResponse[];
  loading?: boolean;
  onEdit: (record: TreatmentLogResponse) => void;
  onDelete: (record: TreatmentLogResponse) => void;
  hideServiceColumn?: boolean; // Ẩn cột "Dịch vụ điều trị" (cho by-service view)
  hideDateColumn?: boolean; // Ẩn cột "Ngày điều trị" (cho by-appointment view)
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "Chưa điều trị":
      return "default";
    case "Đang điều trị":
      return "processing";
    case "Hoàn thành":
      return "success";
    default:
      return "default";
  }
};

export default function TreatmentLogTable({
  data,
  loading = false,
  onEdit,
  onDelete,
  hideServiceColumn = false,
  hideDateColumn = false,
}: TreatmentLogTableProps) {
  const { user } = useCurrentUser();

  const canDelete = (log: TreatmentLogResponse) => {
    const permission = treatmentLogPermissions.canDelete(user, {
      id: log.id,
      createdById: log.createdBy.id,
      clinicId: log.clinic.id,
    });
    return permission.allowed;
  };

  const columns: ColumnsType<TreatmentLogResponse> = [
    // Ngày điều trị - ĐẦU TIÊN (ẩn trong by-appointment)
    ...(!hideDateColumn
      ? [
          {
            title: "Ngày điều trị",
            dataIndex: "treatmentDate" as const,
            key: "treatmentDate",
            width: 140,
            render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm"),
          },
        ]
      : []),
    // Dịch vụ điều trị (ẩn trong by-service)
    ...(!hideServiceColumn
      ? [
          {
            title: "Dịch vụ điều trị",
            key: "serviceName",
            width: 200,
            ellipsis: true,
            render: (_: unknown, record: TreatmentLogResponse) => (
              <div>
                <Text
                  strong
                  title={record.consultedService.consultedServiceName}
                >
                  {record.consultedService.consultedServiceName}
                </Text>
                {record.consultedService.toothPositions.length > 0 && (
                  <>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Răng: {record.consultedService.toothPositions.join(", ")}
                    </Text>
                  </>
                )}
              </div>
            ),
          },
        ]
      : []),
    {
      title: "Nội dung điều trị",
      dataIndex: "treatmentNotes",
      key: "treatmentNotes",
      ellipsis: true,
      render: (notes: string, record) => (
        <Tooltip
          styles={{ root: { maxWidth: 600 } }}
          title={
            <div style={{ whiteSpace: "pre-wrap" }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                Nội dung điều trị:
              </div>
              <div style={{ marginBottom: 8 }}>{notes || "-"}</div>
              {record.nextStepNotes && (
                <>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    Bước tiếp theo:
                  </div>
                  <div>{record.nextStepNotes}</div>
                </>
              )}
            </div>
          }
        >
          <Text style={{ cursor: "pointer" }}>{notes}</Text>
        </Tooltip>
      ),
    },
    {
      title: "Bác sĩ điều trị",
      key: "dentist",
      width: 140,
      render: (_, record) => record.dentist.fullName,
    },
    {
      title: "Điều dưỡng 1",
      key: "assistant1",
      width: 140,
      render: (_, record) => record.assistant1?.fullName || "-",
    },
    {
      title: "Điều dưỡng 2",
      key: "assistant2",
      width: 140,
      render: (_, record) => record.assistant2?.fullName || "-",
    },
    {
      title: "Trạng thái",
      dataIndex: "treatmentStatus",
      key: "treatmentStatus",
      width: 130,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 100,
      fixed: "right" as const,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            />
          </Tooltip>
          {canDelete(record) && (
            <Popconfirm
              title="Xóa lịch sử điều trị"
              description="Bạn có chắc chắn muốn xóa bản ghi này?"
              onConfirm={() => onDelete(record)}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Xóa">
                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  danger
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="id"
      loading={loading}
      pagination={false}
      size="small"
      bordered
      scroll={{ x: 1200 }}
      locale={{
        emptyText: "Chưa có lịch sử điều trị nào",
      }}
    />
  );
}
