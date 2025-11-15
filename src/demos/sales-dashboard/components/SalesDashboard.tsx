"use client";

import React, { useState } from "react";
import { Row, Col, Space, Button } from "antd";
import { FileExcelOutlined, FilePdfOutlined } from "@ant-design/icons";
import FilterBar from "./FilterBar";
import KpiCards from "./KpiCards";
import DailyRevenueChart from "./DailyRevenueChart";
import RevenueBySourceChart from "./RevenueBySourceChart";
import RevenueByServiceBar from "./RevenueByServiceBar";
import SaleTable from "./SaleTable";
import TabsDetail from "./TabsDetail";
import { mockDashboardData } from "../mockData";
import type { DashboardFilters } from "../types";

export default function SalesDashboard() {
  const [filters, setFilters] = useState<DashboardFilters>({
    month: "2024-11",
    clinicId: null,
    saleId: null,
    doctorId: null,
  });

  const handleFilterChange = (newFilters: Partial<DashboardFilters>) => {
    setFilters((prev: DashboardFilters) => ({ ...prev, ...newFilters }));
  };

  const handleExport = (type: "excel" | "pdf") => {
    console.log(`Exporting to ${type}...`);
    // TODO: Implement export logic
  };

  return (
    <>
      {/* Header Filter Bar */}
      <div
        style={{
          background: "#fff",
          padding: "16px 24px",
          borderRadius: "8px",
          marginBottom: "24px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        <Row gutter={[16, 16]} align="middle" justify="space-between">
          <Col xs={24} lg={18}>
            <FilterBar filters={filters} onChange={handleFilterChange} />
          </Col>
          <Col xs={24} lg={6}>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button
                icon={<FileExcelOutlined />}
                onClick={() => handleExport("excel")}
                type="default"
              >
                Excel
              </Button>
              <Button
                icon={<FilePdfOutlined />}
                onClick={() => handleExport("pdf")}
                type="primary"
              >
                PDF
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* KPI Cards */}
      <KpiCards data={mockDashboardData.kpi} />

      {/* Charts Section */}
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Daily Revenue Line Chart */}
        <DailyRevenueChart data={mockDashboardData.dailyRevenue} />

        {/* Pie & Bar Charts */}
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={10}>
            <RevenueBySourceChart data={mockDashboardData.revenueBySource} />
          </Col>
          <Col xs={24} lg={14}>
            <RevenueByServiceBar data={mockDashboardData.revenueByService} />
          </Col>
        </Row>

        {/* Sales Performance Table */}
        <SaleTable data={mockDashboardData.salesPerformance} />

        {/* Detail Tabs */}
        <TabsDetail data={mockDashboardData.detailTabs} />
      </Space>
    </>
  );
}
