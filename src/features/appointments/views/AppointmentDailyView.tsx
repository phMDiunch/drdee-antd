"use client";

import React, { useCallback, useMemo, useState } from "react";
import PageHeaderWithDateNav from "@/shared/components/PageHeaderWithDateNav";
import ClinicTabs from "@/shared/components/ClinicTabs";
import {
  AppointmentStatistics,
  AppointmentFilters,
  AppointmentTable,
  CreateAppointmentModal,
  UpdateAppointmentModal,
  useAppointmentsDaily,
  useUpdateAppointment,
  useDeleteAppointment,
  useCreateAppointment,
  exportAppointmentsToExcel,
} from "@/features/appointments";
import { useDateNavigation } from "@/shared/hooks/useDateNavigation";
import { useCurrentUser } from "@/shared/providers";
import { useNotify } from "@/shared/hooks/useNotify";
import type {
  AppointmentResponse,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
} from "@/shared/validation/appointment.schema";

export default function AppointmentDailyView() {
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

  const [searchValue, setSearchValue] = useState("");

  const { data, isLoading } = useAppointmentsDaily({
    date: selectedDate.format("YYYY-MM-DD"),
    clinicId: selectedClinicId,
  });

  const appointments = data?.items ?? [];

  // Search handler with useCallback
  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
  }, []);

  // Filter appointments based on search
  const filteredAppointments = useMemo(() => {
    const items = data?.items ?? [];
    if (!searchValue.trim()) return items;

    const searchLower = searchValue.toLowerCase().trim();
    return items.filter((apt) => {
      const customerName = apt.customer.fullName.toLowerCase();
      const customerCode = apt.customer.customerCode?.toLowerCase() || "";

      return (
        customerName.includes(searchLower) || customerCode.includes(searchLower)
      );
    });
  }, [data?.items, searchValue]);

  const [openCreate, setOpenCreate] = useState(false);
  const [editingAppointment, setEditingAppointment] =
    useState<AppointmentResponse | null>(null);

  // Mutations
  const createMutation = useCreateAppointment();
  const updateMutation = useUpdateAppointment();
  const deleteMutation = useDeleteAppointment();

  // Create handler
  const handleCreateSubmit = useCallback(
    async (payload: CreateAppointmentRequest) => {
      try {
        await createMutation.mutateAsync(payload);
        setOpenCreate(false);
      } catch {
        // Hook handles error notification
      }
    },
    [createMutation]
  );

  // Update handler
  const handleUpdateSubmit = useCallback(
    async (payload: UpdateAppointmentRequest, id: string) => {
      try {
        await updateMutation.mutateAsync({ id, body: payload });
        setEditingAppointment(null);
      } catch {
        // Hook handles error notification
      }
    },
    [updateMutation]
  );

  // Quick actions
  const handleCheckIn = useCallback(
    (id: string) => {
      updateMutation.mutate({
        id,
        body: {
          checkInTime: new Date(),
          status: "Đã đến" as const,
        },
      });
    },
    [updateMutation]
  );

  const handleCheckOut = useCallback(
    (id: string) => {
      updateMutation.mutate({
        id,
        body: { checkOutTime: new Date() },
      });
    },
    [updateMutation]
  );

  const handleConfirm = useCallback(
    (id: string) => {
      updateMutation.mutate({
        id,
        body: { status: "Đã xác nhận" },
      });
    },
    [updateMutation]
  );

  const handleMarkNoShow = useCallback(
    (id: string) => {
      updateMutation.mutate({
        id,
        body: { status: "Không đến" },
      });
    },
    [updateMutation]
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteMutation.mutate(id);
    },
    [deleteMutation]
  );

  const handleExportExcel = useCallback(async () => {
    if (!filteredAppointments.length) {
      notify.warning("Không có dữ liệu để xuất");
      return;
    }

    try {
      notify.info("Đang xuất Excel...");
      await exportAppointmentsToExcel(filteredAppointments, selectedDate);
      notify.success("Xuất Excel thành công");
    } catch (error) {
      console.error("Excel export error:", error);
      notify.error(error, { fallback: "Xuất Excel thất bại" });
    }
  }, [filteredAppointments, selectedDate, notify]);

  const totalCount = appointments.length;

  return (
    <div>
      <PageHeaderWithDateNav
        title="Lịch hẹn"
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        onPreviousDay={goToPreviousDay}
        onToday={goToToday}
        onNextDay={goToNextDay}
        loading={isLoading}
      />

      <ClinicTabs
        value={selectedClinicId}
        onChange={(id) => setSelectedClinicId(id)}
      />

      <AppointmentStatistics data={appointments} loading={isLoading} />

      <AppointmentFilters
        loading={isLoading}
        onCreate={() => setOpenCreate(true)}
        onExportExcel={handleExportExcel}
        dailyCount={totalCount}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
      />

      <AppointmentTable
        data={filteredAppointments}
        loading={isLoading}
        onCheckIn={handleCheckIn}
        onCheckOut={handleCheckOut}
        onConfirm={handleConfirm}
        onMarkNoShow={handleMarkNoShow}
        onEdit={setEditingAppointment}
        onDelete={handleDelete}
        actionLoading={updateMutation.isPending || deleteMutation.isPending}
      />

      <CreateAppointmentModal
        open={openCreate}
        selectedClinicId={selectedClinicId}
        confirmLoading={createMutation.isPending}
        onCancel={() => setOpenCreate(false)}
        onSubmit={handleCreateSubmit}
      />

      {editingAppointment && (
        <UpdateAppointmentModal
          open={!!editingAppointment}
          appointment={editingAppointment}
          confirmLoading={updateMutation.isPending}
          onCancel={() => setEditingAppointment(null)}
          onSubmit={handleUpdateSubmit}
        />
      )}
    </div>
  );
}
