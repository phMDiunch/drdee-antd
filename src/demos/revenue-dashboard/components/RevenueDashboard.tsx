"use client";

import { useState, useMemo } from "react";
import { Space, Row, Col, Skeleton } from "antd";
import type { DashboardFilters } from "../types";
import { getMockTransactionsForMonth, getPreviousMonthData } from "../mockData";
import {
  calculateKPI,
  groupByDay,
  calculatePaymentMethodStats,
  calculateSourceRevenue,
  calculateServiceRevenue,
  calculateDoctorRevenue,
} from "../utils";
import FilterBar from "./FilterBar";
import RevenueKpiCards from "./RevenueKpiCards";
import PaymentMethodTable from "./PaymentMethodTable";
import RevenueBySourceDonut from "./RevenueBySourceDonut";
import RevenueByServiceBar from "./RevenueByServiceBar";
import RevenueTabs from "./RevenueTabs";
import dayjs from "dayjs";

export default function RevenueDashboard() {
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<DashboardFilters>({
    month: dayjs().format("YYYY-MM"),
  });
  const [activeTab, setActiveTab] = useState("daily");

  // Get mock data based on filters
  const transactions = useMemo(() => {
    let data = getMockTransactionsForMonth(filters.month);

    // Apply filters
    if (filters.clinicId) {
      // In real app, filter by clinic
    }
    if (filters.sources && filters.sources.length > 0) {
      data = data.filter((tx) => filters.sources!.includes(tx.source));
    }
    if (filters.saleId) {
      data = data.filter((tx) => tx.saleId === filters.saleId);
    }
    if (filters.doctorId) {
      data = data.filter((tx) => tx.doctorId === filters.doctorId);
    }

    return data;
  }, [filters]);

  const previousTransactions = useMemo(() => {
    return getPreviousMonthData(filters.month);
  }, [filters.month]);

  // Calculate all statistics
  const kpi = useMemo(
    () => calculateKPI(transactions, previousTransactions),
    [transactions, previousTransactions]
  );

  const dailyData = useMemo(() => groupByDay(transactions), [transactions]);

  const paymentMethodStats = useMemo(
    () => calculatePaymentMethodStats(transactions),
    [transactions]
  );

  const sourceRevenue = useMemo(
    () => calculateSourceRevenue(transactions),
    [transactions]
  );

  const serviceRevenue = useMemo(
    () => calculateServiceRevenue(transactions),
    [transactions]
  );

  const doctorRevenue = useMemo(
    () => calculateDoctorRevenue(transactions),
    [transactions]
  );

  const handleRefresh = () => {
    setLoading(true);
    // Simulate refresh
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  const handleExport = () => {
    // Will implement in exportUtils
    alert("Export functionality - see exportUtils.ts");
  };

  const handleServiceClick = () => {
    setActiveTab("service");
  };

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: "#f0f2f5", minHeight: "100vh" }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Filter Bar */}
        <FilterBar
          filters={filters}
          onFilterChange={setFilters}
          onRefresh={handleRefresh}
          onExport={handleExport}
        />

        {/* KPI Cards */}
        <RevenueKpiCards kpi={kpi} />

        {/* Charts Row 1 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <PaymentMethodTable data={paymentMethodStats} />
          </Col>
          <Col xs={24} lg={8}>
            <RevenueBySourceDonut data={sourceRevenue} />
          </Col>
        </Row>

        {/* Service Bar Chart */}
        <RevenueByServiceBar
          data={serviceRevenue}
          onServiceClick={handleServiceClick}
        />

        {/* Detailed Tabs */}
        <RevenueTabs
          dailyData={dailyData}
          sourceData={sourceRevenue}
          serviceData={serviceRevenue}
          doctorData={doctorRevenue}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </Space>
    </div>
  );
}
