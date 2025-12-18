// src/features/consulted-services/components/ActivityLogList.tsx
"use client";

import React from "react";
import {
  List,
  Tag,
  Avatar,
  Space,
  Typography,
  Spin,
  Empty,
  Button,
  Popconfirm,
} from "antd";
import { UserOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { CONTACT_TYPE_LABELS } from "@/shared/validation/sales-activity-log.schema";
import type { ActivityLogResponse } from "@/shared/validation/sales-activity-log.schema";
import { useActivityLogs } from "../hooks/useActivityLogs";
import { useDeleteActivityLog } from "../hooks/useDeleteActivityLog";
import { useCurrentUser } from "@/shared/providers";
import dayjs from "dayjs";

const { Text } = Typography;

interface ActivityLogListProps {
  consultedServiceId: string;
  onEdit?: (log: ActivityLogResponse) => void;
}

/**
 * Display list of sales activity logs
 */
export default function ActivityLogList({
  consultedServiceId,
  onEdit,
}: ActivityLogListProps) {
  const { user } = useCurrentUser();
  const { data, isLoading } = useActivityLogs(consultedServiceId);
  const { mutate: deleteLog } = useDeleteActivityLog(consultedServiceId);

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <Spin />
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return <Empty description="Chưa có activity log" />;
  }

  const canEdit = (log: ActivityLogResponse) => {
    return user?.role === "admin" || log.employee.id === user?.employeeId;
  };

  return (
    <List
      dataSource={data.items}
      renderItem={(log) => (
        <List.Item
          key={log.id}
          actions={
            canEdit(log)
              ? [
                  onEdit && (
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => onEdit(log)}
                    >
                      Sửa
                    </Button>
                  ),
                  <Popconfirm
                    key="delete"
                    title="Xóa activity log?"
                    description="Bạn có chắc chắn muốn xóa?"
                    onConfirm={() => deleteLog(log.id)}
                    okText="Xóa"
                    cancelText="Hủy"
                  >
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                    >
                      Xóa
                    </Button>
                  </Popconfirm>,
                ]
              : []
          }
        >
          <List.Item.Meta
            avatar={
              <Avatar src={log.employee.avatarUrl} icon={<UserOutlined />} />
            }
            title={
              <Space>
                <Tag color="blue">
                  {
                    CONTACT_TYPE_LABELS[
                      log.contactType as keyof typeof CONTACT_TYPE_LABELS
                    ]
                  }
                </Tag>
                <Text strong>{log.employee.fullName}</Text>
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  {dayjs(log.contactDate).format("DD/MM/YYYY HH:mm")}
                </Text>
              </Space>
            }
            description={
              <Space direction="vertical" size={4} style={{ width: "100%" }}>
                <Text>{log.content}</Text>
                {log.nextContactDate && (
                  <Text type="secondary" style={{ fontSize: "12px" }}>
                    📅 Liên hệ tiếp:{" "}
                    {dayjs(log.nextContactDate).format("DD/MM/YYYY")}
                  </Text>
                )}
              </Space>
            }
          />
        </List.Item>
      )}
    />
  );
}
