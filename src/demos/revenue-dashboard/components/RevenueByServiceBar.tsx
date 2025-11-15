"use client";

import { Card } from "antd";
import { Bar } from "react-chartjs-2";
import type { ServiceRevenue } from "../types";
import { formatCurrency, formatPercentage } from "../utils";
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

interface RevenueByServiceBarProps {
  data: ServiceRevenue[];
  onServiceClick?: (serviceId: string) => void;
}

export default function RevenueByServiceBar({
  data,
  onServiceClick,
}: RevenueByServiceBarProps) {
  // Take top 10 services
  const topServices = data.slice(0, 10);

  const chartData = {
    labels: topServices.map((d) => d.serviceName),
    datasets: [
      {
        label: "Doanh thu",
        data: topServices.map((d) => d.revenue),
        backgroundColor: "#1890ff",
        borderColor: "#096dd9",
        borderWidth: 1,
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
      title: {
        display: true,
        text: "Top 10 dịch vụ theo doanh thu",
        font: { size: 16, weight: "bold" as const },
      },
      tooltip: {
        callbacks: {
          label: function (context: { parsed: { x: number } }) {
            const value = context.parsed.x;
            const service = topServices[context.parsed.y];
            return [
              `Doanh thu: ${formatCurrency(value)}`,
              `Giao dịch: ${service.transactionCount}`,
              `Tỷ lệ: ${formatPercentage(service.percentage)}`,
            ];
          },
        },
      },
    },
    onClick: (event: unknown, elements: { index: number }[]) => {
      if (elements.length > 0 && onServiceClick) {
        const index = elements[0].index;
        onServiceClick(topServices[index].serviceId);
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          callback: function (value: string | number) {
            return formatCurrency(Number(value));
          },
        },
      },
    },
  };

  return (
    <Card title="Doanh thu theo dịch vụ">
      <div style={{ height: 500 }}>
        <Bar data={chartData} options={options} />
      </div>
    </Card>
  );
}
