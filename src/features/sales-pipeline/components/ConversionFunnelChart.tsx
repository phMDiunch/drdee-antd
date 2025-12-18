// src/features/sales-pipeline/components/ConversionFunnelChart.tsx
"use client";

import React from "react";
import { Card, Empty, Spin, Space, Statistic, Typography } from "antd";
import { STAGE_LABELS } from "@/shared/validation/consulted-service.schema";

const { Text } = Typography;

interface FunnelData {
  stage: string;
  count: number;
  conversionRate: number;
}

interface ConversionFunnelChartProps {
  data: FunnelData[];
  loading?: boolean;
}

/**
 * Conversion Funnel Chart
 * Visual representation of pipeline stages with conversion rates
 */
export default function ConversionFunnelChart({
  data,
  loading,
}: ConversionFunnelChartProps) {
  if (loading) {
    return (
      <Card title="Phễu chuyển đổi Pipeline">
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card title="Phễu chuyển đổi Pipeline">
        <Empty description="Không có dữ liệu" />
      </Card>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count));

  return (
    <Card title="Phễu chuyển đổi Pipeline">
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {data
          .filter((stage) => stage.stage !== "LOST")
          .map((stage, index) => {
            const widthPercent = (stage.count / maxCount) * 100;
            const isFirst = index === 0;

            return (
              <div key={stage.stage}>
                <Space direction="vertical" size={4} style={{ width: "100%" }}>
                  <Space
                    style={{ justifyContent: "space-between", width: "100%" }}
                  >
                    <Text strong>
                      {STAGE_LABELS[stage.stage as keyof typeof STAGE_LABELS]}
                    </Text>
                    <Space size="large">
                      <Statistic
                        value={stage.count}
                        suffix="dịch vụ"
                        valueStyle={{ fontSize: 16 }}
                      />
                      {!isFirst && (
                        <Statistic
                          value={stage.conversionRate}
                          suffix="%"
                          valueStyle={{
                            fontSize: 16,
                            color:
                              stage.conversionRate >= 50
                                ? "#52c41a"
                                : stage.conversionRate >= 30
                                ? "#faad14"
                                : "#ff4d4f",
                          }}
                          prefix="↓"
                        />
                      )}
                    </Space>
                  </Space>
                  <div
                    style={{
                      width: `${widthPercent}%`,
                      minWidth: "60px",
                      height: "40px",
                      background: `linear-gradient(90deg, #1890ff, #69c0ff)`,
                      borderRadius: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: "bold",
                      transition: "all 0.3s ease",
                    }}
                  >
                    {stage.count}
                  </div>
                </Space>
              </div>
            );
          })}

        {/* Lost Stage - separate display */}
        {data.find((s) => s.stage === "LOST") && (
          <div
            style={{
              marginTop: 16,
              padding: 16,
              background: "#fff2f0",
              borderRadius: 8,
              border: "1px solid #ffccc7",
            }}
          >
            <Space style={{ width: "100%", justifyContent: "space-between" }}>
              <Text strong type="danger">
                {STAGE_LABELS.LOST}
              </Text>
              <Statistic
                value={data.find((s) => s.stage === "LOST")?.count || 0}
                suffix="dịch vụ"
                valueStyle={{ fontSize: 16, color: "#ff4d4f" }}
              />
            </Space>
          </div>
        )}
      </Space>
    </Card>
  );
}
