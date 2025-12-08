"use client";

import React, { useState, useCallback } from "react";
import { Alert } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { useCurrentUser } from "@/shared/providers/user-provider";
import { useClinics } from "@/features/clinics";
import PageHeaderWithMonthNav from "@/shared/components/PageHeaderWithMonthNav";
import LaboReportStats from "../components/LaboReportStats";
import SummaryTabs from "../components/SummaryTabs";
import DetailPanel from "../components/DetailPanel";
import { useLaboReportSummary } from "../hooks/useLaboReportSummary";
import { useLaboReportDetail } from "../hooks/useLaboReportDetail";
import type {
  DailyLaboData,
  SupplierLaboData,
  DoctorLaboData,
  ServiceLaboData,
} from "@/shared/validation/labo-report.schema";

type DimensionData =
  | DailyLaboData
  | SupplierLaboData
  | DoctorLaboData
  | ServiceLaboData;

export default function LaboReportView() {
  const { user } = useCurrentUser();
  const { data: clinics } = useClinics(true); // Get active clinics

  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs());
  const [filters, setFilters] = useState<{
    month: string;
    clinicId?: string;
  }>({
    month: dayjs().format("YYYY-MM"),
    clinicId: user?.clinicId || undefined,
  });

  const [activeTab, setActiveTab] = useState<
    "supplier" | "doctor" | "service" | "daily"
  >("daily");
  const [selectedRow, setSelectedRow] = useState<{
    key: string;
    label: string;
  } | null>(null);
  const [detailPage, setDetailPage] = useState(1);

  // Query summary data
  const { data, isLoading, error } = useLaboReportSummary(filters);

  // Query detail data when row is selected
  const { data: detailData, isLoading: isLoadingDetail } = useLaboReportDetail({
    ...filters,
    tab: activeTab,
    key: selectedRow?.key ?? "",
    page: detailPage,
    pageSize: 20,
  });

  // Handler for filter changes
  const handleFilterChange = useCallback(
    (newFilters: Partial<typeof filters>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
      setSelectedRow(null);
      setDetailPage(1);
    },
    []
  );

  const handleMonthChange = useCallback(
    (date: Dayjs | null) => {
      if (date) {
        setSelectedMonth(date);
        handleFilterChange({ month: date.format("YYYY-MM") });
      }
    },
    [handleFilterChange]
  );

  const handleClinicChange = useCallback(
    (clinicId: string | undefined) => {
      handleFilterChange({ clinicId });
    },
    [handleFilterChange]
  );

  // Handler for tab change
  const handleTabChange = useCallback(
    (key: "supplier" | "doctor" | "service" | "daily") => {
      setActiveTab(key);
      setSelectedRow(null); // Clear selection on tab change
      setDetailPage(1);
    },
    []
  );

  // Handler for row click to select and trigger detail query
  const handleRowClick = useCallback(
    (record: DimensionData) => {
      let key: string;
      let label: string;

      if (activeTab === "daily") {
        const dailyRecord = record as DailyLaboData;
        key = dailyRecord.id;
        label = dailyRecord.date;
      } else if (activeTab === "supplier") {
        const supplierRecord = record as SupplierLaboData;
        key = supplierRecord.supplierId;
        label = supplierRecord.supplierShortName || "N/A";
      } else if (activeTab === "doctor") {
        const doctorRecord = record as DoctorLaboData;
        key = doctorRecord.doctorId;
        label = doctorRecord.doctorName;
      } else {
        const serviceRecord = record as ServiceLaboData;
        key = serviceRecord.serviceId;
        label = serviceRecord.serviceName;
      }

      setSelectedRow({ key, label });
      setDetailPage(1); // Reset to first page on new selection
    },
    [activeTab]
  );

  // Handler for detail pagination
  const handleDetailPageChange = useCallback((page: number) => {
    setDetailPage(page);
  }, []);

  // Filter clinics based on user role
  const filteredClinics =
    user?.role === "admin"
      ? clinics || []
      : clinics?.filter((c) => c.id === user?.clinicId) || [];

  // Show clinic filter only for admin with multiple clinics
  const showClinicFilter = user?.role === "admin" && filteredClinics.length > 1;

  // Determine which data to show based on active tab
  const summaryTabsData = data
    ? {
        byDate: data.summaryTabs.byDate,
        bySupplier: data.summaryTabs.bySupplier,
        byDoctor: data.summaryTabs.byDoctor,
        byService: data.summaryTabs.byService,
      }
    : {
        byDate: [],
        bySupplier: [],
        byDoctor: [],
        byService: [],
      };

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
        onMonthChange={handleMonthChange}
        clinics={filteredClinics}
        selectedClinicId={filters.clinicId}
        onClinicChange={handleClinicChange}
        showClinicFilter={showClinicFilter}
        loading={isLoading}
      />

      <LaboReportStats data={data?.kpi} loading={isLoading} />

      <SummaryTabs
        activeTab={activeTab}
        onChange={handleTabChange}
        data={summaryTabsData}
        loading={isLoading}
        onRowClick={handleRowClick}
      />

      <DetailPanel
        activeTab={activeTab}
        selectedRowLabel={selectedRow?.label}
        data={detailData}
        loading={isLoadingDetail}
        currentPage={detailPage}
        pageSize={20}
        onPageChange={handleDetailPageChange}
      />
    </>
  );
}
