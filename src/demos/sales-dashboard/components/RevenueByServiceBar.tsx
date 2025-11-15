"use client";

import React from "react";
import { Card } from "antd";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import type { RevenueByServiceData } from "../types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface RevenueByServiceBarProps {
  data: RevenueByServiceData[];
}

export default function RevenueByServiceBar({
  data,
}: RevenueByServiceBarProps) {
  // Sort data by revenue descending
  const sortedData = [...data].sort((a, b) => b.revenue - a.revenue);

  const chartData = {
    labels: sortedData.map((item) => item.serviceName),
    datasets: [
      {
        label: "Doanh số",
        data: sortedData.map((item) => item.revenue),
        backgroundColor: "rgba(24, 144, 255, 0.8)",
        borderColor: "#1890ff",
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const options = {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context: { parsed: { x: number | null } }) {
            let label = "Doanh số: ";
            if (context.parsed.x !== null) {
              label += new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(context.parsed.x);
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          callback: function (value: string | number) {
            return (
              new Intl.NumberFormat("vi-VN", {
                notation: "compact",
                compactDisplay: "short",
              }).format(Number(value)) + "đ"
            );
          },
        },
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
      y: {
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <Card
      title={
        <span style={{ fontSize: "16px", fontWeight: 600 }}>
          Doanh số theo dịch vụ
        </span>
      }
      variant="borderless"
      style={{
        borderRadius: "12px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
      }}
    >
      <div style={{ height: "350px" }}>
        <Bar data={chartData} options={options} />
      </div>
    </Card>
  );
}
