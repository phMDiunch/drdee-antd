"use client";

import React from "react";
import { Card, Tabs, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import type {
  DetailTabsData,
  DailyDetailData,
  SourceDetailData,
  ServiceDetailData,
  SaleDetailData,
  DoctorDetailData,
} from "../types";

interface TabsDetailProps {
  data: DetailTabsData;
}

export default function TabsDetail({ data }: TabsDetailProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      notation: "compact",
      compactDisplay: "short",
    }).format(value);
  };

  // Tab 1: Theo ngày
  const dailyColumns: ColumnsType<DailyDetailData> = [
    { title: "Ngày", dataIndex: "date", key: "date", width: 100 },
    {
      title: "Ca đến",
      dataIndex: "arrivals",
      key: "arrivals",
      width: 80,
      align: "center",
    },
    {
      title: "Ca tư vấn",
      dataIndex: "consultations",
      key: "consultations",
      width: 90,
      align: "center",
    },
    {
      title: "Ca chốt",
      dataIndex: "closed",
      key: "closed",
      width: 80,
      align: "center",
    },
    {
      title: "Doanh số",
      dataIndex: "revenue",
      key: "revenue",
      width: 120,
      align: "right",
      render: (val: number) => (
        <strong style={{ color: "#1890ff" }}>{formatCurrency(val)}</strong>
      ),
    },
    {
      title: "Giá trị/ca",
      dataIndex: "avgPerCase",
      key: "avgPerCase",
      width: 110,
      align: "right",
      render: (val: number) => formatCurrency(val),
    },
    {
      title: "Dịch vụ top",
      dataIndex: "topService",
      key: "topService",
      width: 150,
    },
    { title: "Sale top", dataIndex: "topSale", key: "topSale", width: 130 },
    {
      title: "Bác sĩ top",
      dataIndex: "topDoctor",
      key: "topDoctor",
      width: 140,
    },
  ];

  // Tab 2: Theo nguồn
  const sourceColumns: ColumnsType<SourceDetailData> = [
    {
      title: "Nguồn",
      dataIndex: "source",
      key: "source",
      width: 150,
      fixed: "left",
    },
    {
      title: "Ca đến",
      dataIndex: "arrivals",
      key: "arrivals",
      width: 90,
      align: "center",
    },
    {
      title: "Ca tư vấn",
      dataIndex: "consultations",
      key: "consultations",
      width: 100,
      align: "center",
    },
    {
      title: "Ca chốt",
      dataIndex: "closed",
      key: "closed",
      width: 90,
      align: "center",
    },
    {
      title: "Doanh số",
      dataIndex: "revenue",
      key: "revenue",
      width: 130,
      align: "right",
      render: (val: number) => <strong>{formatCurrency(val)}</strong>,
    },
    {
      title: "ROI",
      dataIndex: "roi",
      key: "roi",
      width: 100,
      align: "center",
      render: (val: number) => {
        const color = val >= 200 ? "success" : val >= 100 ? "warning" : "error";
        return <Tag color={color}>{val}%</Tag>;
      },
    },
  ];

  // Tab 3: Theo dịch vụ
  const serviceColumns: ColumnsType<ServiceDetailData> = [
    {
      title: "Nhóm dịch vụ",
      dataIndex: "category",
      key: "category",
      width: 180,
      fixed: "left",
    },
    {
      title: "Doanh số",
      dataIndex: "revenue",
      key: "revenue",
      width: 140,
      align: "right",
      sorter: (a: ServiceDetailData, b: ServiceDetailData) =>
        a.revenue - b.revenue,
      render: (val: number) => <strong>{formatCurrency(val)}</strong>,
    },
    {
      title: "Ca chốt",
      dataIndex: "closed",
      key: "closed",
      width: 100,
      align: "center",
    },
    {
      title: "Giá trị TB",
      dataIndex: "avgValue",
      key: "avgValue",
      width: 130,
      align: "right",
      render: (val: number) => formatCurrency(val),
    },
    {
      title: "% Đóng góp",
      dataIndex: "contribution",
      key: "contribution",
      width: 120,
      align: "center",
      render: (val: number) => <Tag color="blue">{val.toFixed(1)}%</Tag>,
    },
  ];

  // Tab 4: Theo sale chi tiết
  const saleDetailColumns: ColumnsType<SaleDetailData> = [
    {
      title: "Sale",
      dataIndex: "name",
      key: "name",
      width: 150,
      fixed: "left",
    },
    {
      title: "Ca được phân",
      dataIndex: "assigned",
      key: "assigned",
      width: 110,
      align: "center",
    },
    {
      title: "Ca tư vấn",
      dataIndex: "consulted",
      key: "consulted",
      width: 100,
      align: "center",
    },
    {
      title: "Ca chốt",
      dataIndex: "closed",
      key: "closed",
      width: 90,
      align: "center",
    },
    {
      title: "Doanh số",
      dataIndex: "revenue",
      key: "revenue",
      width: 130,
      align: "right",
      render: (val: number) => <strong>{formatCurrency(val)}</strong>,
    },
    {
      title: "Tỷ lệ chốt",
      dataIndex: "closingRate",
      key: "closingRate",
      width: 100,
      align: "center",
      render: (val: number) => {
        const color = val >= 60 ? "success" : val >= 40 ? "warning" : "error";
        return <Tag color={color}>{val.toFixed(1)}%</Tag>;
      },
    },
    {
      title: "Dịch vụ chính",
      dataIndex: "mainService",
      key: "mainService",
      width: 160,
    },
  ];

  // Tab 5: Theo bác sĩ
  const doctorColumns: ColumnsType<DoctorDetailData> = [
    {
      title: "Bác sĩ",
      dataIndex: "name",
      key: "name",
      width: 160,
      fixed: "left",
    },
    {
      title: "Ca tư vấn",
      dataIndex: "consulted",
      key: "consulted",
      width: 100,
      align: "center",
    },
    {
      title: "Ca đồng ý",
      dataIndex: "agreed",
      key: "agreed",
      width: 100,
      align: "center",
    },
    {
      title: "Ca chốt",
      dataIndex: "closed",
      key: "closed",
      width: 90,
      align: "center",
    },
    {
      title: "Doanh số",
      dataIndex: "revenue",
      key: "revenue",
      width: 130,
      align: "right",
      render: (val: number) => <strong>{formatCurrency(val)}</strong>,
    },
    {
      title: "Tỷ lệ đồng ý",
      dataIndex: "agreementRate",
      key: "agreementRate",
      width: 120,
      align: "center",
      render: (val: number) => <Tag color="green">{val.toFixed(1)}%</Tag>,
    },
  ];

  return (
    <Card
      variant="borderless"
      style={{
        borderRadius: "12px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
      }}
    >
      <Tabs
        defaultActiveKey="1"
        type="card"
        items={[
          {
            key: "1",
            label: "Theo ngày",
            children: (
              <Table
                columns={dailyColumns}
                dataSource={data.byDate}
                rowKey="date"
                pagination={{ pageSize: 10 }}
                scroll={{ x: 1100 }}
                size="small"
              />
            ),
          },
          {
            key: "2",
            label: "Theo nguồn",
            children: (
              <Table
                columns={sourceColumns}
                dataSource={data.bySource}
                rowKey="source"
                pagination={false}
                scroll={{ x: 800 }}
                size="small"
              />
            ),
          },
          {
            key: "3",
            label: "Theo dịch vụ",
            children: (
              <Table
                columns={serviceColumns}
                dataSource={data.byService}
                rowKey="category"
                pagination={false}
                scroll={{ x: 800 }}
                size="small"
              />
            ),
          },
          {
            key: "4",
            label: "Theo sale tư vấn",
            children: (
              <Table
                columns={saleDetailColumns}
                dataSource={data.bySale}
                rowKey="name"
                pagination={false}
                scroll={{ x: 900 }}
                size="small"
              />
            ),
          },
          {
            key: "5",
            label: "Theo bác sĩ tư vấn",
            children: (
              <Table
                columns={doctorColumns}
                dataSource={data.byDoctor}
                rowKey="name"
                pagination={false}
                scroll={{ x: 850 }}
                size="small"
              />
            ),
          },
        ]}
      />
    </Card>
  );
}
