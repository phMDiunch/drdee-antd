"use client";

import React from "react";
import { Card } from "antd";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import type { RevenueBySourceData } from "../types";

ChartJS.register(ArcElement, Tooltip, Legend);

interface RevenueBySourceChartProps {
  data: RevenueBySourceData[];
}

const sourceColors: Record<string, string> = {
  "Facebook Ads": "#1877f2",
  TikTok: "#000000",
  Referral: "#52c41a",
  "Walk-in": "#fa8c16",
  "Sale Online": "#722ed1",
};

export default function RevenueBySourceChart({
  data,
}: RevenueBySourceChartProps) {
  const chartData = {
    labels: data.map((item) => item.source),
    datasets: [
      {
        label: "Doanh số",
        data: data.map((item) => item.revenue),
        backgroundColor: data.map(
          (item) => sourceColors[item.source] || "#8c8c8c"
        ),
        borderColor: "#fff",
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: { label?: string; parsed: number }) {
            let label = context.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed !== null) {
              label += new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(context.parsed);
            }
            return label;
          },
        },
      },
    },
  };

  return (
    <Card
      title={
        <span style={{ fontSize: "16px", fontWeight: 600 }}>
          Cơ cấu doanh số theo nguồn
        </span>
      }
      variant="borderless"
      style={{
        borderRadius: "12px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
      }}
    >
      <div style={{ height: "350px" }}>
        <Pie data={chartData} options={options} />
      </div>
    </Card>
  );
}
