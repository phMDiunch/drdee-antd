// src/features/consulted-services/components/StageHistoryTimeline.tsx
"use client";

import React from "react";
import { Timeline, Tag, Avatar, Space, Typography, Spin, Empty } from "antd";
import { ClockCircleOutlined, UserOutlined } from "@ant-design/icons";
import {
  STAGE_LABELS,
  STAGE_COLORS,
  type SalesStage,
} from "@/shared/validation/consulted-service.schema";
import { useStageHistory } from "../hooks/useStageHistory";
import dayjs from "dayjs";

const { Text } = Typography;

interface StageHistoryTimelineProps {
  consultedServiceId: string;
}

/**
 * Display stage transition history as a timeline
 */
export default function StageHistoryTimeline({
  consultedServiceId,
}: StageHistoryTimelineProps) {
  const { data, isLoading } = useStageHistory(consultedServiceId);

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <Spin />
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return <Empty description="Chưa có lịch sử thay đổi stage" />;
  }

  return (
    <Timeline
      items={data.items.map((history) => {
        const fromStageLabel = history.fromStage
          ? STAGE_LABELS[history.fromStage as SalesStage]
          : "Chưa có";
        const toStageLabel = STAGE_LABELS[history.toStage as SalesStage];
        const toStageColor = STAGE_COLORS[history.toStage as SalesStage];

        return {
          dot: <ClockCircleOutlined style={{ fontSize: "16px" }} />,
          children: (
            <Space direction="vertical" size={4}>
              <Space>
                <Text strong>
                  {fromStageLabel} →{" "}
                  <Tag color={toStageColor}>{toStageLabel}</Tag>
                </Text>
              </Space>
              {history.reason && (
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  Lý do: {history.reason}
                </Text>
              )}
              <Space size={8}>
                <Space size={4}>
                  <Avatar
                    size="small"
                    src={history.changedBy.avatarUrl}
                    icon={<UserOutlined />}
                  />
                  <Text type="secondary" style={{ fontSize: "12px" }}>
                    {history.changedBy.fullName}
                  </Text>
                </Space>
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  {dayjs(history.changedAt).format("DD/MM/YYYY HH:mm")}
                </Text>
              </Space>
            </Space>
          ),
        };
      })}
    />
  );
}
