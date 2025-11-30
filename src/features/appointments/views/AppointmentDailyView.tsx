"use client";

import React, { useCallback, useMemo, useState } from "react";
import { Collapse } from "antd";
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
import dayjs from "dayjs";
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

  // Group appointments by check-in status
  const { checkedInAppointments, notCheckedInAppointments } = useMemo(() => {
    const checkedIn = filteredAppointments
      .filter((apt) => apt.checkInTime !== null)
      .sort((a, b) => {
        // Sort checked-in appointments by checkInTime (earliest first)
        const timeA = a.checkInTime ? dayjs(a.checkInTime).valueOf() : Infinity;
        const timeB = b.checkInTime ? dayjs(b.checkInTime).valueOf() : Infinity;
        return timeA - timeB;
      });

    const notCheckedIn = filteredAppointments
      .filter((apt) => apt.checkInTime === null)
      .sort((a, b) => {
        // Sort not-checked-in appointments by appointmentDateTime (earliest first)
        return (
          dayjs(a.appointmentDateTime).valueOf() -
          dayjs(b.appointmentDateTime).valueOf()
        );
      });

    return {
      checkedInAppointments: checkedIn,
      notCheckedInAppointments: notCheckedIn,
    };
  }, [filteredAppointments]);

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
      await exportAppointmentsToExcel(filteredAppointments, selectedDate);
      notify.success("Xuất Excel thành công");
    } catch (error) {
      console.error("Excel export error:", error);
      notify.error(error, { fallback: "Xuất Excel thất bại" });
    }
  }, [filteredAppointments, selectedDate, notify]);

  const totalCount = appointments.length;

  // Memoize collapse items to prevent unnecessary re-renders
  const collapseItems = useMemo(
    () => [
      {
        key: "checked-in",
        label: (
          <span style={{ fontSize: "15px", fontWeight: 500 }}>
            ✅ Đã đến ({checkedInAppointments.length})
          </span>
        ),
        children: (
          <AppointmentTable
            data={checkedInAppointments}
            loading={isLoading}
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
            onConfirm={handleConfirm}
            onMarkNoShow={handleMarkNoShow}
            onEdit={setEditingAppointment}
            onDelete={handleDelete}
            actionLoading={updateMutation.isPending || deleteMutation.isPending}
          />
        ),
      },
      {
        key: "not-checked-in",
        label: (
          <span style={{ fontSize: "15px", fontWeight: 500 }}>
            ⏰ Chưa đến ({notCheckedInAppointments.length})
          </span>
        ),
        children: (
          <AppointmentTable
            data={notCheckedInAppointments}
            loading={isLoading}
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
            onConfirm={handleConfirm}
            onMarkNoShow={handleMarkNoShow}
            onEdit={setEditingAppointment}
            onDelete={handleDelete}
            actionLoading={updateMutation.isPending || deleteMutation.isPending}
          />
        ),
      },
    ],
    [
      notCheckedInAppointments,
      checkedInAppointments,
      isLoading,
      handleCheckIn,
      handleCheckOut,
      handleConfirm,
      handleMarkNoShow,
      handleDelete,
      updateMutation.isPending,
      deleteMutation.isPending,
    ]
  );

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

      {/* Grouped Appointments by Check-in Status */}
      <Collapse
        defaultActiveKey={["checked-in", "not-checked-in"]}
        items={collapseItems}
        style={{ marginBottom: 16 }}
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
