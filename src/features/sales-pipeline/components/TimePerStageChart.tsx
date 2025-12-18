// src/features/sales-pipeline/components/TimePerStageChart.tsx
"use client";

import React from "react";
import { Card, Empty, Spin, Space, Typography, Progress } from "antd";
import { STAGE_LABELS } from "@/shared/validation/consulted-service.schema";

const { Text } = Typography;

interface TimePerStage {
  stage: string;
  avgDays: number;
  count: number;
}

interface TimePerStageChartProps {
  data: TimePerStage[];
  loading?: boolean;
}

/**
 * Time Per Stage Chart
 * Shows average time spent in each pipeline stage
 */
export default function TimePerStageChart({
  data,
  loading,
}: TimePerStageChartProps) {
  if (loading) {
    return (
      <Card title="Thời gian trung bình theo Stage">
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card title="Thời gian trung bình theo Stage">
        <Empty description="Không có dữ liệu" />
      </Card>
    );
  }

  const maxDays = Math.max(...data.map((d) => d.avgDays));

  return (
    <Card title="Thời gian trung bình theo Stage">
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {data.map((stage) => {
          const percentage = (stage.avgDays / maxDays) * 100;
          const color =
            stage.avgDays <= 3
              ? "#52c41a"
              : stage.avgDays <= 7
              ? "#faad14"
              : "#ff4d4f";

          return (
            <div key={stage.stage}>
              <Space
                direction="vertical"
                size={4}
                style={{ width: "100%", marginBottom: 8 }}
              >
                <Space
                  style={{ justifyContent: "space-between", width: "100%" }}
                >
                  <Text strong>
                    {STAGE_LABELS[stage.stage as keyof typeof STAGE_LABELS]}
                  </Text>
                  <Space>
                    <Text type="secondary">({stage.count} lần chuyển đổi)</Text>
                    <Text strong style={{ color }}>
                      {stage.avgDays.toFixed(1)} ngày
                    </Text>
                  </Space>
                </Space>
                <Progress
                  percent={percentage}
                  strokeColor={color}
                  showInfo={false}
                  size="small"
                />
              </Space>
            </div>
          );
        })}
      </Space>
    </Card>
  );
}
