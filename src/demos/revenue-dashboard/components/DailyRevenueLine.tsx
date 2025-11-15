"use client";

import { Card } from "antd";
import { Line } from "react-chartjs-2";
import type { DailyRevenue } from "../types";
import { formatCurrency, formatDate } from "../utils";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DailyRevenueLineProps {
  data: DailyRevenue[];
}

export default function DailyRevenueLine({ data }: DailyRevenueLineProps) {
  const chartData = {
    labels: data.map((d) => formatDate(d.date, "DD/MM")),
    datasets: [
      {
        label: "Doanh thu",
        data: data.map((d) => d.total),
        borderColor: "#1890ff",
        backgroundColor: "rgba(24, 144, 255, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: "Doanh thu theo ngày trong tháng",
        font: { size: 16, weight: "bold" as const },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const dataIndex = context.dataIndex;
            const dayData = data[dataIndex];
            return [
              `Tổng: ${formatCurrency(dayData.total)}`,
              `💵 Tiền mặt: ${formatCurrency(dayData.cash)}`,
              `💳 Quẹt thẻ: ${formatCurrency(dayData.card)}`,
              `💎 Visa: ${formatCurrency(dayData.visa)}`,
              `🏦 Chuyển khoản: ${formatCurrency(dayData.transfer)}`,
              ``,
              `Giao dịch: ${dayData.transactionCount}`,
            ];
          },
        },
      },
    },
    scales: {
      y: {
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
    <Card title="Biểu đồ doanh thu theo ngày">
      <div style={{ height: 400 }}>
        <Line data={chartData} options={options} />
      </div>
    </Card>
  );
}
