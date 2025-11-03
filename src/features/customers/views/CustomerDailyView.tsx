"use client";
import React, { useCallback, useState } from "react";
import PageHeaderWithDateNav from "@/shared/components/PageHeaderWithDateNav";
import ClinicTabs from "@/shared/components/ClinicTabs";
import CustomerStatistics from "../components/CustomerStatistics";
import CustomerFilters from "../components/CustomerFilters";
import CustomerTable from "../components/CustomerTable";
import CustomerFormModal from "../components/CustomerFormModal";
import { useCreateCustomer, useCustomersDaily } from "@/features/customers";
import { useDateNavigation } from "@/shared/hooks/useDateNavigation";
import { useCurrentUser } from "@/shared/providers/user-provider";
import type { CreateCustomerRequest } from "@/shared/validation/customer.schema";

export default function CustomerDailyView() {
  const { user: currentUser } = useCurrentUser();

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
  const { data, isLoading } = useCustomersDaily({
    date: selectedDate.format("YYYY-MM-DD"),
    clinicId: selectedClinicId,
    includeAppointments: true, // Enable check-in feature
  });
  const [openCreate, setOpenCreate] = useState(false);
  const createMutation = useCreateCustomer();

  const handleCreateSubmit = useCallback(
    async (payload: CreateCustomerRequest) => {
      try {
        await createMutation.mutateAsync(payload);
        setOpenCreate(false);
      } catch {
        // Hook handles error notification
      }
    },
    [createMutation]
  );

  const items = data?.items ?? [];
  const totalCount = items.length;
  return (
    <div>
      <PageHeaderWithDateNav
        title="Danh sách khách hàng"
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

      <CustomerStatistics loading={isLoading} data={items} />

      <CustomerFilters
        loading={isLoading}
        onCreate={() => setOpenCreate(true)}
        dailyCount={totalCount}
      />

      <CustomerTable
        data={items}
        loading={isLoading}
        showCheckIn={true}
        selectedDate={selectedDate.format("YYYY-MM-DD")}
      />

      <CustomerFormModal
        open={openCreate}
        onCancel={() => setOpenCreate(false)}
        selectedClinicId={selectedClinicId}
        onSubmit={handleCreateSubmit}
        confirmLoading={createMutation.isPending}
      />
    </div>
  );
}
