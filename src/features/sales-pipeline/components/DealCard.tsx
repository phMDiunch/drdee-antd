// src/features/sales-pipeline/components/DealCard.tsx
"use client";

import React from "react";
import { Card, Space, Typography, Tag, Tooltip, Avatar } from "antd";
import {
  UserOutlined,
  PhoneOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  FireOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";

dayjs.extend(relativeTime);
dayjs.locale("vi");

const { Text } = Typography;

/**
 * Priority levels for deals
 */
const PRIORITY_CONFIG = {
  HIGH: { label: "Cao", color: "red", icon: <FireOutlined /> },
  MEDIUM: { label: "TB", color: "orange", icon: null },
  LOW: { label: "Thấp", color: "default", icon: null },
} as const;

/**
 * Deal data structure for Kanban card
 */
export interface DealCardData {
  id: string;
  customerName: string;
  customerPhone: string | null;
  serviceName: string;
  value: number; // Total value (price * quantity)
  consultingSaleName: string | null;
  serviceConfirmDate: string | null;
  lastContactDate: string | null;
  lastContactType: string | null;
  priority?: "HIGH" | "MEDIUM" | "LOW";
}

interface DealCardProps {
  deal: DealCardData;
}

/**
 * DealCard - Displays ConsultedService in Kanban format
 * Shows customer info, service, value, and activity status
 */
export default function DealCard({ deal }: DealCardProps) {
  const priority = deal.priority || "LOW";
  const priorityConfig = PRIORITY_CONFIG[priority];

  // Format currency
  const formattedValue = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(deal.value);

  // Determine if deal is urgent (no contact in 7+ days)
  const isUrgent = deal.lastContactDate
    ? dayjs().diff(dayjs(deal.lastContactDate), "day") >= 7
    : false;

  return (
    <Card
      size="small"
      style={{
        borderLeft: priority === "HIGH" ? "3px solid #ff4d4f" : undefined,
      }}
      styles={{ body: { padding: "12px" } }}
    >
      <Space direction="vertical" size={8} style={{ width: "100%" }}>
        {/* Customer Info */}
        <div>
          <Space>
            <Avatar size="small" icon={<UserOutlined />} />
            <div>
              <Text strong style={{ fontSize: 14 }}>
                {deal.customerName}
              </Text>
              {deal.customerPhone && (
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    <PhoneOutlined style={{ marginRight: 4 }} />
                    {deal.customerPhone}
                  </Text>
                </div>
              )}
            </div>
          </Space>
        </div>

        {/* Service Name */}
        <Tooltip title={deal.serviceName}>
          <Text
            ellipsis
            style={{ fontSize: 13, display: "block", color: "#595959" }}
          >
            {deal.serviceName}
          </Text>
        </Tooltip>

        {/* Value & Priority */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text strong style={{ color: "#1890ff" }}>
            <DollarOutlined /> {formattedValue}
          </Text>
          {priority !== "LOW" && (
            <Tag
              color={priorityConfig.color}
              icon={priorityConfig.icon}
              style={{ margin: 0 }}
            >
              {priorityConfig.label}
            </Tag>
          )}
        </div>

        {/* Sales Owner */}
        {deal.consultingSaleName && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            Sale: {deal.consultingSaleName}
          </Text>
        )}

        {/* Last Activity */}
        {deal.lastContactDate && (
          <div
            style={{
              paddingTop: 8,
              borderTop: "1px solid #f0f0f0",
            }}
          >
            <Space size={4}>
              <ClockCircleOutlined
                style={{
                  fontSize: 12,
                  color: isUrgent ? "#ff4d4f" : "#8c8c8c",
                }}
              />
              <Text
                type={isUrgent ? "danger" : "secondary"}
                style={{ fontSize: 11 }}
              >
                {deal.lastContactType || "Liên hệ"} •{" "}
                {dayjs(deal.lastContactDate).fromNow()}
              </Text>
            </Space>
          </div>
        )}

        {/* Confirm Date (for WON stage) */}
        {deal.serviceConfirmDate && (
          <Text type="success" style={{ fontSize: 12 }}>
            Chốt: {dayjs(deal.serviceConfirmDate).format("DD/MM/YYYY")}
          </Text>
        )}
      </Space>
    </Card>
  );
}
