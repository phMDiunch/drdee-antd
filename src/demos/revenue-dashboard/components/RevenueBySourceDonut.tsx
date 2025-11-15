"use client";

import { Card } from "antd";
import { Doughnut } from "react-chartjs-2";
import type { SourceRevenue } from "../types";
import { formatCurrency, formatPercentage } from "../utils";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

interface RevenueBySourceDonutProps {
  data: SourceRevenue[];
}

export default function RevenueBySourceDonut({
  data,
}: RevenueBySourceDonutProps) {
  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        data: data.map((d) => d.revenue),
        backgroundColor: [
          "#1890ff",
          "#52c41a",
          "#722ed1",
          "#fa8c16",
          "#eb2f96",
        ],
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
        position: "right" as const,
      },
      title: {
        display: true,
        text: "Cơ cấu doanh thu theo nguồn khách hàng",
        font: { size: 16, weight: "bold" as const },
      },
      tooltip: {
        callbacks: {
          label: function (context: {
            label?: string;
            parsed: number;
            dataset: { data: number[] };
          }) {
            const label = context.label || "";
            const value = context.parsed;
            const total = context.dataset.data.reduce(
              (sum: number, val: number) => sum + val,
              0
            );
            const percentage = total > 0 ? (value / total) * 100 : 0;
            return `${label}: ${formatCurrency(value)} (${formatPercentage(
              percentage
            )})`;
          },
        },
      },
    },
  };

  return (
    <Card title="Doanh thu theo nguồn khách hàng">
      <div style={{ height: 400 }}>
        <Doughnut data={chartData} options={options} />
      </div>
    </Card>
  );
}
