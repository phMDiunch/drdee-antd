// src/features/consulted-services/views/ConsultedServiceDailyView.tsx
"use client";

import React, { useCallback, useState } from "react";
import PageHeaderWithDateNav from "@/shared/components/PageHeaderWithDateNav";
import ClinicTabs from "@/shared/components/ClinicTabs";
import {
  ConsultedServiceStatistics,
  ConsultedServiceFilters,
  ConsultedServiceTable,
  UpdateConsultedServiceModal,
  useConsultedServicesDaily,
  useConfirmConsultedService,
  useDeleteConsultedService,
  useUpdateConsultedService,
  exportConsultedServicesToExcel,
} from "@/features/consulted-services";
import { useDateNavigation } from "@/shared/hooks/useDateNavigation";
import { useCurrentUser } from "@/shared/providers";
import { useNotify } from "@/shared/hooks/useNotify";
import type {
  ConsultedServiceResponse,
  UpdateConsultedServiceRequest,
} from "@/shared/validation/consulted-service.schema";

export default function ConsultedServiceDailyView() {
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

  const { data, isLoading } = useConsultedServicesDaily({
    date: selectedDate.format("YYYY-MM-DD"),
    clinicId: selectedClinicId!,
  });

  const services = React.useMemo(() => data?.items ?? [], [data?.items]);

  // Modal state
  const [editingService, setEditingService] =
    useState<ConsultedServiceResponse | null>(null);

  // Mutations
  const confirmMutation = useConfirmConsultedService();
  const deleteMutation = useDeleteConsultedService();
  const updateMutation = useUpdateConsultedService();

  // Handlers
  const handleConfirm = useCallback(
    (id: string) => {
      confirmMutation.mutate(id);
    },
    [confirmMutation]
  );

  const handleEdit = useCallback((service: ConsultedServiceResponse) => {
    setEditingService(service);
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      deleteMutation.mutate(id);
    },
    [deleteMutation]
  );

  const handleUpdateSubmit = useCallback(
    (id: string, data: UpdateConsultedServiceRequest) => {
      updateMutation.mutate(
        { id, data },
        {
          onSuccess: () => {
            setEditingService(null);
          },
        }
      );
    },
    [updateMutation]
  );

  const handleCloseEditModal = useCallback(() => {
    setEditingService(null);
  }, []);

  const handleExportExcel = useCallback(async () => {
    if (!services.length) {
      notify.warning("Không có dữ liệu để xuất");
      return;
    }

    try {
      const filename = `dich-vu-tu-van-${selectedDate.format(
        "YYYY-MM-DD"
      )}.xlsx`;
      await exportConsultedServicesToExcel(services, filename);
      notify.success(`Đã xuất ${services.length} dịch vụ tư vấn`);
    } catch (error) {
      console.error("Export error:", error);
      notify.error(error, { fallback: "Có lỗi xảy ra khi xuất file Excel" });
    }
  }, [services, selectedDate, notify]);

  return (
    <div>
      <PageHeaderWithDateNav
        title="Dịch vụ tư vấn"
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

      <ConsultedServiceStatistics
        statistics={data?.statistics}
        loading={isLoading}
      />

      {/* Filters & Actions */}
      <ConsultedServiceFilters
        dailyCount={services.length}
        loading={isLoading}
        onExport={handleExportExcel}
      />

      {/* Table */}
      <ConsultedServiceTable
        data={services}
        loading={isLoading}
        onConfirm={handleConfirm}
        onEdit={handleEdit}
        onDelete={handleDelete}
        actionLoading={confirmMutation.isPending || deleteMutation.isPending}
      />

      {/* Edit Modal */}
      {editingService && (
        <UpdateConsultedServiceModal
          service={editingService}
          open={!!editingService}
          onCancel={handleCloseEditModal}
          onSubmit={handleUpdateSubmit}
          confirmLoading={updateMutation.isPending}
        />
      )}
    </div>
  );
}
