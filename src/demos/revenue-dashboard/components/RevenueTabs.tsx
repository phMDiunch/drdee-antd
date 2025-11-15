"use client";

import { Card, Tabs, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import type {
  DailyRevenue,
  SourceRevenue,
  ServiceRevenue,
  DoctorRevenue,
} from "../types";
import { formatCurrency, formatPercentage, formatDate } from "../utils";
import DailyRevenueLine from "./DailyRevenueLine";
import DailyRevenueStacked from "./DailyRevenueStacked";
import { Bar } from "react-chartjs-2";

interface RevenueTabsProps {
  dailyData: DailyRevenue[];
  sourceData: SourceRevenue[];
  serviceData: ServiceRevenue[];
  doctorData: DoctorRevenue[];
  activeTab?: string;
  onTabChange?: (key: string) => void;
}

export default function RevenueTabs({
  dailyData,
  sourceData,
  serviceData,
  doctorData,
  activeTab = "daily",
  onTabChange,
}: RevenueTabsProps) {
  // Tab A - Daily Details
  const dailyColumns: ColumnsType<DailyRevenue> = [
    {
      title: "Ngày",
      dataIndex: "date",
      key: "date",
      fixed: "left",
      width: 120,
      render: (value: string) => formatDate(value),
    },
    {
      title: "Số GD",
      dataIndex: "transactionCount",
      key: "transactionCount",
      align: "right",
      width: 80,
    },
    {
      title: "Tổng DT",
      dataIndex: "total",
      key: "total",
      align: "right",
      width: 150,
      render: (value: number) => formatCurrency(value),
    },
    {
      title: "Tiền mặt",
      dataIndex: "cash",
      key: "cash",
      align: "right",
      width: 150,
      render: (value: number) => formatCurrency(value),
    },
    {
      title: "Quẹt thẻ",
      dataIndex: "card",
      key: "card",
      align: "right",
      width: 150,
      render: (value: number) => formatCurrency(value),
    },
    {
      title: "Visa",
      dataIndex: "visa",
      key: "visa",
      align: "right",
      width: 150,
      render: (value: number) => formatCurrency(value),
    },
    {
      title: "Chuyển khoản",
      dataIndex: "transfer",
      key: "transfer",
      align: "right",
      width: 150,
      render: (value: number) => formatCurrency(value),
    },
    {
      title: "DV hàng đầu",
      dataIndex: "topService",
      key: "topService",
      width: 200,
    },
    {
      title: "BS hàng đầu",
      dataIndex: "topDoctor",
      key: "topDoctor",
      width: 150,
    },
  ];

  // Tab B - Source Details
  const sourceColumns: ColumnsType<SourceRevenue> = [
    {
      title: "Nguồn",
      dataIndex: "label",
      key: "label",
      fixed: "left",
      width: 150,
    },
    {
      title: "Số GD",
      dataIndex: "transactionCount",
      key: "transactionCount",
      align: "right",
      width: 100,
      sorter: (a, b) => a.transactionCount - b.transactionCount,
    },
    {
      title: "Doanh thu",
      dataIndex: "revenue",
      key: "revenue",
      align: "right",
      width: 180,
      render: (value: number) => formatCurrency(value),
      sorter: (a, b) => a.revenue - b.revenue,
    },
    {
      title: "Tỷ lệ %",
      dataIndex: "percentage",
      key: "percentage",
      align: "right",
      width: 100,
      render: (value: number) => formatPercentage(value),
    },
    {
      title: "Giá trị TB",
      dataIndex: "avgValue",
      key: "avgValue",
      align: "right",
      width: 180,
      render: (value: number) => formatCurrency(value),
    },
  ];

  // Tab C - Service Details
  const serviceColumns: ColumnsType<ServiceRevenue> = [
    {
      title: "Nhóm dịch vụ",
      dataIndex: "serviceGroup",
      key: "serviceGroup",
      width: 150,
    },
    {
      title: "Dịch vụ",
      dataIndex: "serviceName",
      key: "serviceName",
      width: 200,
    },
    {
      title: "Số GD",
      dataIndex: "transactionCount",
      key: "transactionCount",
      align: "right",
      width: 100,
      sorter: (a, b) => a.transactionCount - b.transactionCount,
    },
    {
      title: "Doanh thu",
      dataIndex: "revenue",
      key: "revenue",
      align: "right",
      width: 180,
      render: (value: number) => formatCurrency(value),
      sorter: (a, b) => a.revenue - b.revenue,
    },
    {
      title: "% Đóng góp",
      dataIndex: "percentage",
      key: "percentage",
      align: "right",
      width: 120,
      render: (value: number) => formatPercentage(value),
    },
    {
      title: "Giá trị TB",
      dataIndex: "avgValue",
      key: "avgValue",
      align: "right",
      width: 180,
      render: (value: number) => formatCurrency(value),
    },
  ];

  // Tab D - Doctor Details
  const doctorColumns: ColumnsType<DoctorRevenue> = [
    {
      title: "Bác sĩ",
      dataIndex: "doctorName",
      key: "doctorName",
      fixed: "left",
      width: 180,
    },
    {
      title: "Số ca điều trị",
      dataIndex: "caseCount",
      key: "caseCount",
      align: "right",
      width: 140,
      sorter: (a, b) => a.caseCount - b.caseCount,
    },
    {
      title: "Doanh thu",
      dataIndex: "revenue",
      key: "revenue",
      align: "right",
      width: 180,
      render: (value: number) => formatCurrency(value),
      sorter: (a, b) => a.revenue - b.revenue,
    },
    {
      title: "Giá trị TB",
      dataIndex: "avgValue",
      key: "avgValue",
      align: "right",
      width: 180,
      render: (value: number) => formatCurrency(value),
    },
  ];

  // Source chart for Tab B
  const sourceChartData = {
    labels: sourceData.map((d) => d.label),
    datasets: [
      {
        label: "Doanh thu",
        data: sourceData.map((d) => d.revenue),
        backgroundColor: "#1890ff",
      },
    ],
  };

  const items = [
    {
      key: "daily",
      label: "Theo ngày",
      children: (
        <div style={{ marginTop: 16 }}>
          <DailyRevenueLine data={dailyData} />
          <div style={{ marginTop: 16 }}>
            <DailyRevenueStacked data={dailyData} />
          </div>
          <Card title="Chi tiết theo ngày" style={{ marginTop: 16 }}>
            <Table
              columns={dailyColumns}
              dataSource={dailyData}
              rowKey="date"
              scroll={{ x: 1200 }}
              pagination={{ pageSize: 31 }}
            />
          </Card>
        </div>
      ),
    },
    {
      key: "source",
      label: "Theo nguồn khách hàng",
      children: (
        <div style={{ marginTop: 16 }}>
          <Card title="Doanh thu theo nguồn">
            <div style={{ height: 400 }}>
              <Bar
                data={sourceChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: (value) => formatCurrency(Number(value)),
                      },
                    },
                  },
                }}
              />
            </div>
          </Card>
          <Card title="Chi tiết theo nguồn" style={{ marginTop: 16 }}>
            <Table
              columns={sourceColumns}
              dataSource={sourceData}
              rowKey="source"
              pagination={false}
            />
          </Card>
        </div>
      ),
    },
    {
      key: "service",
      label: "Theo dịch vụ",
      children: (
        <div style={{ marginTop: 16 }}>
          <Card title="Chi tiết theo dịch vụ">
            <Table
              columns={serviceColumns}
              dataSource={serviceData}
              rowKey="serviceId"
              scroll={{ x: 1000 }}
              pagination={{ pageSize: 20 }}
            />
          </Card>
        </div>
      ),
    },
    {
      key: "doctor",
      label: "Theo bác sĩ",
      children: (
        <div style={{ marginTop: 16 }}>
          <Card title="Chi tiết theo bác sĩ điều trị">
            <Table
              columns={doctorColumns}
              dataSource={doctorData}
              rowKey="doctorId"
              pagination={false}
            />
          </Card>
        </div>
      ),
    },
  ];

  return (
    <Card>
      <Tabs
        activeKey={activeTab}
        onChange={onTabChange}
        items={items}
        size="large"
      />
    </Card>
  );
}
