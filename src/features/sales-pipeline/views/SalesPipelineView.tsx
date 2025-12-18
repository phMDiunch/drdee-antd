// src/features/sales-pipeline/views/SalesPipelineView.tsx
"use client";

import React, { useState } from "react";
import { useCurrentUser } from "@/shared/providers";
import { useMonthNavigation } from "@/shared/hooks/useMonthNavigation";
import PageHeaderWithMonthNav from "@/shared/components/PageHeaderWithMonthNav";
import ClinicTabs from "@/shared/components/ClinicTabs";
import PipelineStatistics from "../components/PipelineStatistics";
import PipelineTable from "../components/PipelineTable";
import { usePipelineServices } from "../hooks/usePipelineServices";

export default function SalesPipelineView() {
  const { user } = useCurrentUser();
  const isAdmin = user?.role === "admin";

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

  return (
    <div>
      {/* Page Header with Month Navigation */}
      <PageHeaderWithMonthNav
        title="Sales Pipeline Dashboard"
        selectedMonth={selectedMonth}
        onMonthChange={handleMonthChange}
      />

      {/* Clinic Tabs (Admin only) */}
      {isAdmin && (
        <div style={{ marginBottom: 16 }}>
          <ClinicTabs value={selectedClinicId} onChange={setSelectedClinicId} />
        </div>
      )}

      {/* Statistics Cards */}
      <PipelineStatistics stats={stats} loading={isLoading} />

      {/* Pipeline Table */}
      <PipelineTable data={services} loading={isLoading} />
    </div>
  );
}
