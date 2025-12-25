// src/features/consulted-services/components/SalesActivityExpandedContent.tsx
"use client";

import React from "react";
import { Button, Empty, Space, Spin, Tag, Typography } from "antd";
import {
  PlusOutlined,
  PhoneOutlined,
  MessageOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import dayjs from "dayjs";
import { useSalesActivities } from "@/features/sales-activities";

const { Text } = Typography;

const CONTACT_TYPE_CONFIG = {
  call: { icon: <PhoneOutlined />, label: "Gọi điện", color: "blue" },
  message: { icon: <MessageOutlined />, label: "Nhắn tin", color: "green" },
  meet: { icon: <TeamOutlined />, label: "Gặp mặt", color: "purple" },
} as const;

type Props = {
  consultedServiceId: string;
  customerId: string;
  onAddActivity: () => void;
};

export default function SalesActivityExpandedContent({
  consultedServiceId,
  customerId,
  onAddActivity,
}: Props) {
  const { data, isLoading } = useSalesActivities({
    consultedServiceId,
    pageSize: 5, // Chỉ lấy 5 activities gần nhất
    sortField: "contactDate",
    sortDirection: "desc",
  });

  if (isLoading) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <Spin />
      </div>
    );
  }

  const activities = data?.items || [];
  const hasActivities = activities.length > 0;

  return (
    <div style={{ padding: "16px 24px", background: "#fafafa" }}>
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text strong>📝 Lịch sử liên hệ</Text>
          {hasActivities && (
            <Link href={`/customers/${customerId}?tab=sales-activity`}>
              <Text type="secondary" style={{ fontSize: "13px" }}>
                Xem tất cả →
              </Text>
            </Link>
          )}
        </div>

        {/* Activities List */}
        {hasActivities ? (
          <div
            style={{
              background: "white",
              borderRadius: "6px",
              padding: "12px",
            }}
          >
            <Space direction="vertical" style={{ width: "100%" }} size="small">
              {activities.map((activity) => {
                const config =
                  CONTACT_TYPE_CONFIG[
                    activity.contactType as keyof typeof CONTACT_TYPE_CONFIG
                  ];
                return (
                  <div
                    key={activity.id}
                    style={{
                      padding: "8px 0",
                      borderBottom: "1px solid #f0f0f0",
                    }}
                  >
                    <Space size="small" style={{ width: "100%" }}>
                      <Text
                        type="secondary"
                        style={{ fontSize: "13px", minWidth: "110px" }}
                      >
                        {dayjs(activity.contactDate).format("DD/MM HH:mm")}
                      </Text>
                      <Tag icon={config.icon} color={config.color}>
                        {config.label}
                      </Tag>
                      <Text
                        ellipsis={{ tooltip: activity.content }}
                        style={{ flex: 1, fontSize: "13px" }}
                      >
                        {activity.content}
                      </Text>
                      {activity.nextContactDate && (
                        <Text type="warning" style={{ fontSize: "12px" }}>
                          Follow-up:{" "}
                          {dayjs(activity.nextContactDate).format("DD/MM")}
                        </Text>
                      )}
                    </Space>
                  </div>
                );
              })}
            </Space>
          </div>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Chưa có hoạt động liên hệ nào"
            style={{ margin: "16px 0" }}
          />
        )}

        {/* Add Activity Button */}
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={onAddActivity}
          block
        >
          Thêm hoạt động
        </Button>
      </Space>
    </div>
  );
}
