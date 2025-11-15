"use client";

import { Card } from "antd";
import { Bar } from "react-chartjs-2";
import type { DailyRevenue } from "../types";
import { formatCurrency, formatDate } from "../utils";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface DailyRevenueStackedProps {
  data: DailyRevenue[];
}

export default function DailyRevenueStacked({
  data,
}: DailyRevenueStackedProps) {
  const chartData = {
    labels: data.map((d) => formatDate(d.date, "DD/MM")),
    datasets: [
      {
        label: "Tiền mặt",
        data: data.map((d) => d.cash),
        backgroundColor: "#52c41a",
      },
      {
        label: "Quẹt thẻ thường",
        data: data.map((d) => d.card),
        backgroundColor: "#1890ff",
      },
      {
        label: "Quẹt Visa",
        data: data.map((d) => d.visa),
        backgroundColor: "#722ed1",
      },
      {
        label: "Chuyển khoản",
        data: data.map((d) => d.transfer),
        backgroundColor: "#fa8c16",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: "Doanh thu phân theo phương thức thanh toán",
        font: { size: 16, weight: "bold" as const },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `${context.dataset.label}: ${formatCurrency(
              context.parsed.y
            )}`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          callback: function (value: any) {
            return formatCurrency(value);
          },
        },
      },
    },
  };

  return (
    <Card title="Doanh thu theo phương thức thanh toán (Stacked)">
      <div style={{ height: 400 }}>
        <Bar data={chartData} options={options} />
      </div>
    </Card>
  );
}
