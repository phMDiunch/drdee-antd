"use client";

import { useState, useEffect } from "react";
import { Spin, Alert } from "antd";
import dayjs from "dayjs";
import { useCurrentUser } from "@/shared/providers/user-provider";
import { useClinics } from "@/features/clinics";
import PageHeaderWithMonthNav from "@/shared/components/PageHeaderWithMonthNav";
import { useMonthNavigation } from "@/shared/hooks/useMonthNavigation";
import { useLaboReportSummary } from "../hooks/useLaboReportSummary";
import {
  useLaboReportDetail,
  type TabType,
} from "../hooks/useLaboReportDetail";
import LaboReportStats from "../components/LaboReportStats";
import SummaryTabs from "../components/SummaryTabs";
import DetailPanel from "../components/DetailPanel";

export default function LaboReportView() {
  const { user } = useCurrentUser();
  const { data: clinics } = useClinics(true);

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

  const { data, isLoading, error } = useLaboReportSummary(filters);
  const { data: detailData, isLoading: detailLoading } = useLaboReportDetail(
    selectedRow.tab,
    selectedRow.key,
    filters
  );

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
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
    let label = rowId;
    if (data) {
      switch (tab) {
        case "daily": {
          const daily = data.summaryTabs.byDate.find((d) => d.id === rowId);
          label = daily?.date || rowId;
          break;
        }
        case "supplier": {
          const supplier = data.summaryTabs.bySupplier.find(
            (s) => s.supplierId === rowId
          );
          label = supplier?.supplierShortName || rowId;
          break;
        }
        case "doctor": {
          const doctor = data.summaryTabs.byDoctor.find(
            (d) => d.doctorId === rowId
          );
          label = doctor?.doctorName || rowId;
          break;
        }
        case "service": {
          const service = data.summaryTabs.byService.find(
            (s) => s.serviceId === rowId
          );
          label = service?.serviceName || rowId;
          break;
        }
      }
    }

    setSelectedRow({ tab, key: rowId, label });
  };

  const filteredClinics =
    user?.role === "admin"
      ? clinics || []
      : clinics?.filter((c) => c.id === user?.clinicId) || [];

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
        title="Báo cáo Labo"
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
          <LaboReportStats data={data.kpi} loading={isLoading} />

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
