// src/features/sales-pipeline/components/LostAnalysisCard.tsx
"use client";

import React from "react";
import {
  Card,
  Empty,
  Spin,
  Space,
  Statistic,
  Table,
  Tag,
  Collapse,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { STAGE_LABELS } from "@/shared/validation/consulted-service.schema";
import dayjs from "dayjs";

const { Panel } = Collapse;

interface LostByStage {
  stage: string;
  count: number;
  reasons: Record<string, number>;
}

interface LostDetail {
  id: string;
  fromStage: string | null;
  reason: string | null;
  changedAt: Date;
  serviceName: string;
  customerName: string;
}

interface LostAnalysisCardProps {
  byStage: LostByStage[];
  details: LostDetail[];
  loading?: boolean;
}

/**
 * Lost Analysis Card
 * Shows breakdown of lost customers by stage and reasons
 */
export default function LostAnalysisCard({
  byStage,
  details,
  loading,
}: LostAnalysisCardProps) {
  if (loading) {
    return (
      <Card title="Phân tích khách hàng thất bại">
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!byStage || byStage.length === 0) {
    return (
      <Card title="Phân tích khách hàng thất bại">
        <Empty description="Không có dữ liệu" />
      </Card>
    );
  }

  const totalLost = byStage.reduce((sum, stage) => sum + stage.count, 0);

  const columns: ColumnsType<LostDetail> = [
    {
      title: "Ngày",
      dataIndex: "changedAt",
      key: "changedAt",
      width: 100,
      render: (date: Date) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Khách hàng",
      dataIndex: "customerName",
      key: "customerName",
      width: 150,
    },
    {
      title: "Dịch vụ",
      dataIndex: "serviceName",
      key: "serviceName",
      width: 200,
      ellipsis: true,
    },
    {
      title: "Từ Stage",
      dataIndex: "fromStage",
      key: "fromStage",
      width: 120,
      render: (stage: string | null) =>
        stage ? (
          <Tag color="orange">
            {STAGE_LABELS[stage as keyof typeof STAGE_LABELS]}
          </Tag>
        ) : (
          "-"
        ),
    },
    {
      title: "Lý do",
      dataIndex: "reason",
      key: "reason",
      ellipsis: true,
      render: (reason: string | null) => reason || "Không có lý do",
    },
  ];

  return (
    <Card title="Phân tích khách hàng thất bại">
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Summary Stats */}
        <Card size="small" style={{ background: "#fff2f0" }}>
          <Space
            size="large"
            style={{ width: "100%", justifyContent: "space-around" }}
          >
            <Statistic
              title="Tổng khách thất bại"
              value={totalLost}
              valueStyle={{ color: "#ff4d4f" }}
            />
            <Statistic
              title="Stages có mất khách"
              value={byStage.length}
              valueStyle={{ color: "#faad14" }}
            />
          </Space>
        </Card>

        {/* By Stage Breakdown */}
        <Collapse>
          {byStage.map((stage) => {
            const percentage = ((stage.count / totalLost) * 100).toFixed(1);
            return (
              <Panel
                header={
                  <Space
                    style={{ width: "100%", justifyContent: "space-between" }}
                  >
                    <span>
                      <Tag color="red">
                        {STAGE_LABELS[
                          stage.stage as keyof typeof STAGE_LABELS
                        ] || stage.stage}
                      </Tag>
                      <strong>{stage.count} khách</strong>
                    </span>
                    <Tag color="orange">{percentage}%</Tag>
                  </Space>
                }
                key={stage.stage}
              >
                <Space
                  direction="vertical"
                  size="small"
                  style={{ width: "100%" }}
                >
                  <strong>Lý do thất bại:</strong>
                  {Object.entries(stage.reasons)
                    .sort(([, a], [, b]) => b - a)
                    .map(([reason, count]) => (
                      <div
                        key={reason}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "4px 8px",
                          background: "#fafafa",
                          borderRadius: 4,
                        }}
                      >
                        <span>{reason}</span>
                        <Tag>{count}</Tag>
                      </div>
                    ))}
                </Space>
              </Panel>
            );
          })}
        </Collapse>

        {/* Detailed Table */}
        <Table
          columns={columns}
          dataSource={details}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: 800 }}
          size="small"
        />
      </Space>
    </Card>
  );
}
