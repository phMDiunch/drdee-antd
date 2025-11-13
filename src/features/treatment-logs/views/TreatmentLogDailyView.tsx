// src/features/treatment-logs/views/TreatmentLogDailyView.tsx
"use client";

import React, { useCallback, useState } from "react";
import PageHeaderWithDateNav from "@/shared/components/PageHeaderWithDateNav";
import ClinicTabs from "@/shared/components/ClinicTabs";
import {
  TreatmentLogStatistics,
  TreatmentLogFilters,
  TreatmentLogTable,
  TreatmentLogModal,
  useDailyTreatmentLogs,
  useUpdateTreatmentLog,
  useDeleteTreatmentLog,
} from "@/features/treatment-logs";
import { useDateNavigation } from "@/shared/hooks/useDateNavigation";
import { useCurrentUser } from "@/shared/providers";
import { useNotify } from "@/shared/hooks/useNotify";
import type {
  TreatmentLogResponse,
  UpdateTreatmentLogFormData,
} from "@/shared/validation/treatment-log.schema";

export default function TreatmentLogDailyView() {
  const { user: currentUser } = useCurrentUser();
  const notify = useNotify();

  const {
    selectedDate,
    goToPreviousDay,
    goToToday,
    goToNextDay,
    handleDateChange,
  } = useDateNavigation();

  const [selectedClinicId, setSelectedClinicId] = useState<string | undefined>(
    currentUser?.clinicId || undefined
  );

  const { data, isLoading } = useDailyTreatmentLogs({
    date: selectedDate.format("YYYY-MM-DD"),
    clinicId: selectedClinicId!,
  });

  const treatmentLogs = React.useMemo(() => data?.items ?? [], [data?.items]);

  // Modal state
  const [editingLog, setEditingLog] = useState<TreatmentLogResponse | null>(
    null
  );

  // Mutations
  const deleteMutation = useDeleteTreatmentLog();
  const updateMutation = useUpdateTreatmentLog();

  // Handlers
  const handleEdit = useCallback((log: TreatmentLogResponse) => {
    setEditingLog(log);
  }, []);

  const handleDelete = useCallback(
    (log: TreatmentLogResponse) => {
      deleteMutation.mutate(log.id);
    },
    [deleteMutation]
  );

  const handleUpdateSubmit = useCallback(
    (formData: UpdateTreatmentLogFormData) => {
      if (!editingLog) return;

      updateMutation.mutate(
        { id: editingLog.id, data: formData },
        {
          onSuccess: () => {
            setEditingLog(null);
          },
        }
      );
    },
    [editingLog, updateMutation]
  );

  const handleCloseEditModal = useCallback(() => {
    setEditingLog(null);
  }, []);

  const handleExportExcel = useCallback(async () => {
    if (!treatmentLogs.length) {
      notify.warning("Không có dữ liệu để xuất");
      return;
    }

    try {
      // TODO: Implement export logic
      notify.info("Chức năng xuất Excel đang được phát triển");
    } catch (error) {
      console.error("Export error:", error);
      notify.error(error, { fallback: "Có lỗi xảy ra khi xuất file Excel" });
    }
  }, [treatmentLogs, notify]);

  return (
    <div>
      <PageHeaderWithDateNav
        title="Lịch sử điều trị"
        selectedDate={selectedDate}
        onPreviousDay={goToPreviousDay}
        onToday={goToToday}
        onNextDay={goToNextDay}
        onDateChange={(date) => handleDateChange(date)}
      />

      <ClinicTabs
        value={selectedClinicId}
        onChange={(id) => setSelectedClinicId(id)}
      />

      <TreatmentLogStatistics
        statistics={data?.statistics}
        loading={isLoading}
      />

      {/* Filters & Actions */}
      <TreatmentLogFilters
        dailyCount={treatmentLogs.length}
        loading={isLoading}
        onExport={handleExportExcel}
      />

      {/* Table */}
      <TreatmentLogTable
        data={treatmentLogs}
        loading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        showCustomerColumn={true}
      />

      {/* Edit Modal */}
      {editingLog && (
        <TreatmentLogModal
          mode="edit"
          open={!!editingLog}
          initialData={editingLog}
          onCancel={handleCloseEditModal}
          onSubmit={handleUpdateSubmit}
          loading={updateMutation.isPending}
        />
      )}
    </div>
  );
}
