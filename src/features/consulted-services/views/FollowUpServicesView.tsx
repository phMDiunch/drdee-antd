// src/features/consulted-services/views/FollowUpServicesView.tsx
"use client";

import React, { useCallback, useState, useEffect } from "react";
import dayjs from "dayjs";
import PageHeaderWithMonthNav from "@/shared/components/PageHeaderWithMonthNav";
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
import { useClinics } from "@/features/clinics";
import { useNotify } from "@/shared/hooks/useNotify";
import type {
  ConsultedServiceResponse,
  UpdateConsultedServiceRequest,
} from "@/shared/validation/consulted-service.schema";
import type { CreateSalesActivityFormData } from "@/shared/validation/sales-activity.schema";

export default function FollowUpServicesView() {
  const { user: currentUser } = useCurrentUser();
  const notify = useNotify();
  const { data: clinics } = useClinics(true); // Get active clinics

  const {
    selectedMonth,
    goToPreviousMonth,
    goToCurrentMonth,
    goToNextMonth,
    handleMonthChange,
  } = useMonthNavigation();

  // Determine if user can view all clinics
  const isSaleOnline = currentUser?.jobTitle
    ?.toLowerCase()
    .includes("sale online");
  const canViewAllClinics = currentUser?.role === "admin" || isSaleOnline;

  const [filters, setFilters] = useState<{
    month: string;
    clinicId?: string;
  }>({
    month: selectedMonth.format("YYYY-MM"),
    clinicId: canViewAllClinics
      ? undefined
      : currentUser?.clinicId || undefined,
  });

  const { data, isLoading } = useConsultedServicesPending({
    month: filters.month,
    clinicId: filters.clinicId,
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
  const handleFilterChange = useCallback(
    (newFilters: Partial<typeof filters>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
    []
  );

  const handleMonthChangeWithFilter = useCallback(
    (date: dayjs.Dayjs | null) => {
      if (date) {
        handleMonthChange(date);
        handleFilterChange({ month: date.format("YYYY-MM") });
      }
    },
    [handleMonthChange, handleFilterChange]
  );

  // Sync filter when month changes via navigation buttons
  useEffect(() => {
    handleFilterChange({ month: selectedMonth.format("YYYY-MM") });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  const handleClinicChange = useCallback(
    (clinicId: string | undefined) => {
      handleFilterChange({ clinicId });
    },
    [handleFilterChange]
  );

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

  // Filter clinics based on user role
  const filteredClinics = canViewAllClinics
    ? clinics || []
    : clinics?.filter((c) => c.id === currentUser?.clinicId) || [];

  // Show clinic filter only for users who can view all clinics with multiple clinics
  const showClinicFilter = canViewAllClinics && filteredClinics.length > 1;

  return (
    <div>
      <PageHeaderWithMonthNav
        title="Dịch vụ chưa chốt"
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
