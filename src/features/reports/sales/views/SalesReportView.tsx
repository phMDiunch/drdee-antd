"use client";

import { useState, useEffect } from "react";
import { Spin, Alert } from "antd";
import dayjs from "dayjs";
import { useCurrentUser } from "@/shared/providers/user-provider";
import { useClinics } from "@/features/clinics";
import PageHeaderWithMonthNav from "@/shared/components/PageHeaderWithMonthNav";
import { useMonthNavigation } from "@/shared/hooks/useMonthNavigation";
import { useSalesSummary } from "../hooks/useSalesSummary";
import { useSalesDetail, type TabType } from "../hooks/useSalesDetail";
import SalesReportStats from "../components/SalesReportStats";
import SummaryTabs from "../components/SummaryTabs";
import DetailPanel from "../components/DetailPanel";

export default function SalesReportView() {
  const { user } = useCurrentUser();
  const { data: clinics } = useClinics(true); // Get active clinics

  const {
    selectedMonth,
    goToPreviousMonth,
    goToCurrentMonth,
    goToNextMonth,
    handleMonthChange,
  } = useMonthNavigation();

  const [filters, setFilters] = useState<{
    month: string;
    clinicId?: string;
  }>({
    month: selectedMonth.format("YYYY-MM"),
    clinicId: user?.clinicId || undefined,
  });

  const [selectedRow, setSelectedRow] = useState<{
    tab: TabType | null;
    key: string | null;
    label: string;
  }>({
    tab: null,
    key: null,
    label: "",
  });

  const { data, isLoading, error } = useSalesSummary(filters);
  const { data: detailData, isLoading: detailLoading } = useSalesDetail(
    selectedRow.tab,
    selectedRow.key,
    filters
  );

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    // Clear selected row when filter changes
    setSelectedRow({
      tab: null,
      key: null,
      label: "",
    });
  };

  const handleMonthChangeWithFilter = (date: dayjs.Dayjs | null) => {
    if (date) {
      handleMonthChange(date);
      handleFilterChange({ month: date.format("YYYY-MM") });
    }
  };

  // Sync filter when month changes via navigation buttons
  useEffect(() => {
    handleFilterChange({ month: selectedMonth.format("YYYY-MM") });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  const handleClinicChange = (clinicId: string | undefined) => {
    handleFilterChange({ clinicId });
  };

  const handleRowSelect = (tab: TabType, rowId: string) => {
    // Get label from data
    let label = rowId;
    if (data) {
      switch (tab) {
        case "daily":
          const daily = data.summaryTabs.byDate.find((d) => d.id === rowId);
          label = daily?.date || rowId;
          break;
        case "source":
          const source = data.summaryTabs.bySource.find((s) => s.id === rowId);
          label = source?.source || rowId;
          break;
        case "service":
          const service = data.summaryTabs.byService.find(
            (s) => s.id === rowId
          );
          label = service?.service || rowId;
          break;
        case "sale":
          const sale = data.summaryTabs.bySale.find((s) => s.id === rowId);
          label = sale?.saleName || rowId;
          break;
        case "doctor":
          const doctor = data.summaryTabs.byDoctor.find((d) => d.id === rowId);
          label = doctor?.doctorName || rowId;
          break;
      }
    }

    setSelectedRow({ tab, key: rowId, label });
  };

  // Filter clinics based on user role
  const filteredClinics =
    user?.role === "admin"
      ? clinics || []
      : clinics?.filter((c) => c.id === user?.clinicId) || [];

  // Show clinic filter only for admin with multiple clinics
  const showClinicFilter = user?.role === "admin" && filteredClinics.length > 1;

  if (error) {
    return (
      <Alert
        message="Lỗi tải dữ liệu"
        description={error instanceof Error ? error.message : "Đã xảy ra lỗi"}
        type="error"
        showIcon
      />
    );
  }

  return (
    <>
      <PageHeaderWithMonthNav
        title="Báo cáo Doanh Số"
        selectedMonth={selectedMonth}
        onMonthChange={handleMonthChangeWithFilter}
        onPreviousMonth={goToPreviousMonth}
        onCurrentMonth={goToCurrentMonth}
        onNextMonth={goToNextMonth}
        clinics={filteredClinics}
        selectedClinicId={filters.clinicId}
        onClinicChange={handleClinicChange}
        showClinicFilter={showClinicFilter}
        loading={isLoading}
      />

      {isLoading ? (
        <div style={{ textAlign: "center", padding: 48 }}>
          <Spin size="large" />
        </div>
      ) : data ? (
        <>
          <SalesReportStats data={data.kpi} loading={isLoading} />

          <SummaryTabs
            data={data.summaryTabs}
            loading={isLoading}
            onRowSelect={handleRowSelect}
          />

          <DetailPanel
            activeTab={selectedRow.tab}
            selectedRowLabel={selectedRow.label}
            data={detailData}
            loading={detailLoading}
            filters={filters}
          />
        </>
      ) : null}
    </>
  );
}
