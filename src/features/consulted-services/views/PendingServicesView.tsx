// src/features/consulted-services/views/PendingServicesView.tsx
"use client";

import React, { useCallback, useState } from "react";
import PageHeaderWithMonthNav from "@/shared/components/PageHeaderWithMonthNav";
import ClinicTabs from "@/shared/components/ClinicTabs";
import {
  ConsultedServiceStatistics,
  ConsultedServiceFilters,
  ConsultedServiceTable,
  UpdateConsultedServiceModal,
  useConsultedServicesPending,
  useConfirmConsultedService,
  useDeleteConsultedService,
  useUpdateConsultedService,
  exportConsultedServicesToExcel,
  useAssignConsultingSale,
} from "@/features/consulted-services";
import SalesActivityExpandedContent from "@/features/consulted-services/components/SalesActivityExpandedContent";
import {
  SalesActivityModal,
  useCreateSalesActivity,
} from "@/features/sales-activities";
import { useMonthNavigation } from "@/shared/hooks/useMonthNavigation";
import { useCurrentUser } from "@/shared/providers";
import { useNotify } from "@/shared/hooks/useNotify";
import type {
  ConsultedServiceResponse,
  UpdateConsultedServiceRequest,
} from "@/shared/validation/consulted-service.schema";
import type { CreateSalesActivityFormData } from "@/shared/validation/sales-activity.schema";

export default function PendingServicesView() {
  const { user: currentUser } = useCurrentUser();
  const notify = useNotify();

  const {
    selectedMonth,
    goToPreviousMonth,
    goToCurrentMonth,
    goToNextMonth,
    handleMonthChange,
  } = useMonthNavigation();

  const [selectedClinicId, setSelectedClinicId] = useState<string | undefined>(
    currentUser?.clinicId || undefined
  );

  const { data, isLoading } = useConsultedServicesPending({
    month: selectedMonth.format("YYYY-MM"),
    clinicId: selectedClinicId!,
  });

  const services = React.useMemo(() => data?.items ?? [], [data?.items]);

  // Modal state - separate for Update and Activity
  const [editingService, setEditingService] =
    useState<ConsultedServiceResponse | null>(null);

  // Sales Activity Modal state
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityService, setActivityService] =
    useState<ConsultedServiceResponse | null>(null);

  // Mutations
  const confirmMutation = useConfirmConsultedService();
  const deleteMutation = useDeleteConsultedService();
  const updateMutation = useUpdateConsultedService();
  const assignSaleMutation = useAssignConsultingSale();
  const createActivityMutation = useCreateSalesActivity();

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

  const handleAssignSale = useCallback(
    (id: string) => {
      assignSaleMutation.mutate(id);
    },
    [assignSaleMutation]
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

  // Sales Activity handlers
  const handleOpenActivityModal = useCallback(
    (service: ConsultedServiceResponse) => {
      setActivityService(service);
      setActivityModalOpen(true);
    },
    []
  );

  const handleCloseActivityModal = useCallback(() => {
    setActivityModalOpen(false);
    setActivityService(null);
  }, []);

  const handleCreateActivity = useCallback(
    (data: CreateSalesActivityFormData) => {
      // Transform form data (string dates) to request data (Date objects)
      const requestData = {
        consultedServiceId: data.consultedServiceId,
        contactType: data.contactType,
        content: data.content,
        contactDate: new Date(data.contactDate),
        nextContactDate: data.nextContactDate
          ? new Date(data.nextContactDate)
          : null,
      };

      createActivityMutation.mutate(requestData, {
        onSuccess: () => {
          handleCloseActivityModal();
        },
      });
    },
    [createActivityMutation, handleCloseActivityModal]
  );

  const handleExportExcel = useCallback(async () => {
    if (!services.length) {
      notify.warning("Không có dữ liệu để xuất");
      return;
    }

    try {
      const filename = `dich-vu-chua-chot-${selectedMonth.format(
        "YYYY-MM"
      )}.xlsx`;
      await exportConsultedServicesToExcel(services, filename);
      notify.success(`Đã xuất ${services.length} dịch vụ chưa chốt`);
    } catch (error) {
      notify.error(error, { fallback: "Có lỗi xảy ra khi xuất file Excel" });
    }
  }, [services, selectedMonth, notify]);

  return (
    <div>
      <PageHeaderWithMonthNav
        title="Dịch vụ chưa chốt"
        selectedMonth={selectedMonth}
        onMonthChange={(month) => handleMonthChange(month)}
        onPreviousMonth={goToPreviousMonth}
        onCurrentMonth={goToCurrentMonth}
        onNextMonth={goToNextMonth}
        loading={isLoading}
        showClinicFilter={false}
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
        view="follow-up"
        onConfirm={handleConfirm}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAssignSale={handleAssignSale}
        actionLoading={
          confirmMutation.isPending ||
          deleteMutation.isPending ||
          assignSaleMutation.isPending
        }
        expandable={{
          expandedRowRender: (record) => (
            <SalesActivityExpandedContent
              consultedServiceId={record.id}
              customerId={record.customer?.id || ""}
              onAddActivity={() => handleOpenActivityModal(record)}
            />
          ),
        }}
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

      {/* Sales Activity Modal */}
      {activityModalOpen && activityService && (
        <SalesActivityModal
          mode="add"
          open={activityModalOpen}
          consultedServices={[
            {
              id: activityService.id,
              consultedServiceName: activityService.consultedServiceName,
              consultationDate: activityService.consultationDate,
              toothPositions: activityService.toothPositions,
              serviceStatus: activityService.serviceStatus,
              stage: activityService.stage,
            },
          ]}
          customerName={activityService.customer?.fullName || ""}
          onSubmit={(data) => {
            if ("consultedServiceId" in data) {
              handleCreateActivity(data);
            }
          }}
          onCancel={handleCloseActivityModal}
          loading={createActivityMutation.isPending}
        />
      )}
    </div>
  );
}
