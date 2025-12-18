// src/features/sales-pipeline/views/SalesPipelineView.tsx
"use client";

import React, { useState } from "react";
import { Tabs } from "antd";
import { useCurrentUser } from "@/shared/providers";
import { useMonthNavigation } from "@/shared/hooks/useMonthNavigation";
import PageHeaderWithMonthNav from "@/shared/components/PageHeaderWithMonthNav";
import ClinicTabs from "@/shared/components/ClinicTabs";
import PipelineStatistics from "../components/PipelineStatistics";
import PipelineTable from "../components/PipelineTable";
import PipelineKanbanView from "../components/PipelineKanbanView";
import AnalyticsDashboard from "../components/AnalyticsDashboard";
import { usePipelineServices } from "../hooks/usePipelineServices";

export default function SalesPipelineView() {
  const { user } = useCurrentUser();
  const isAdmin = user?.role === "admin";

  // Tab selection
  const [activeTab, setActiveTab] = useState<string>("pipeline");

  // Month navigation
  const {
    selectedMonth,
    goToPreviousMonth,
    goToCurrentMonth,
    goToNextMonth,
    handleMonthChange,
  } = useMonthNavigation();

  // Clinic selection (admin only)
  const [selectedClinicId, setSelectedClinicId] = useState<string | undefined>(
    isAdmin ? undefined : user?.clinicId || undefined
  );

  // Fetch pipeline data
  const { data, isLoading } = usePipelineServices({
    month: selectedMonth.format("YYYY-MM"),
    clinicId: selectedClinicId,
  });

  const services = data?.items ?? [];
  const stats = data?.stats ?? {
    totalCustomers: 0,
    totalServices: 0,
    unconfirmedServices: 0,
    confirmedServices: 0,
  };

  const tabItems = [
    {
      key: "pipeline",
      label: "Pipeline Table",
      children: (
        <>
          {/* Statistics Cards */}
          <PipelineStatistics stats={stats} loading={isLoading} />

          {/* Pipeline Table */}
          <PipelineTable data={services} loading={isLoading} />
        </>
      ),
    },
    {
      key: "kanban",
      label: "Kanban View",
      children: <PipelineKanbanView clinicId={selectedClinicId} />,
    },
    {
      key: "analytics",
      label: "Analytics & Reports",
      children: user ? <AnalyticsDashboard user={user} /> : null,
    },
  ];

  return (
    <div>
      {/* Page Header with Month Navigation */}
      <PageHeaderWithMonthNav
        title="Sales Pipeline"
        selectedMonth={selectedMonth}
        onMonthChange={handleMonthChange}
      />

      {/* Clinic Tabs (Admin only) */}
      {isAdmin && (
        <div style={{ marginBottom: 16 }}>
          <ClinicTabs value={selectedClinicId} onChange={setSelectedClinicId} />
        </div>
      )}

      {/* Main Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size="large"
      />
    </div>
  );
}
