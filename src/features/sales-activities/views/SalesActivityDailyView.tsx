// src/features/sales-activities/views/SalesActivityDailyView.tsx
"use client";

import React, { useCallback, useState } from "react";
import PageHeaderWithDateNav from "@/shared/components/PageHeaderWithDateNav";
import ClinicTabs from "@/shared/components/ClinicTabs";
import SalesActivityStatistics from "../components/SalesActivityStatistics";
import SalesActivityFilters from "../components/SalesActivityFilters";
import SalesActivityTable from "../components/SalesActivityTable";
import SalesActivityModal from "../components/SalesActivityModal";
import { useDailySalesActivities } from "../hooks/useDailySalesActivities";
import { useUpdateSalesActivity } from "../hooks/useUpdateSalesActivity";
import { useDeleteSalesActivity } from "../hooks/useDeleteSalesActivity";
import { useDateNavigation } from "@/shared/hooks/useDateNavigation";
import { useCurrentUser } from "@/shared/providers";
import type {
  SalesActivityResponse,
  UpdateSalesActivityFormData,
} from "@/shared/validation/sales-activity.schema";

export default function SalesActivityDailyView() {
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

  const { data, isLoading } = useDailySalesActivities(
    selectedDate.format("YYYY-MM-DD"),
    selectedClinicId!
  );

  const salesActivities = React.useMemo(() => data?.items ?? [], [data?.items]);

  // Modal state
  const [editingActivity, setEditingActivity] =
    useState<SalesActivityResponse | null>(null);

  // Mutations
  const deleteMutation = useDeleteSalesActivity();
  const updateMutation = useUpdateSalesActivity();

  // Handlers
  const handleEdit = useCallback((activity: SalesActivityResponse) => {
    setEditingActivity(activity);
  }, []);

  const handleDelete = useCallback(
    (activity: SalesActivityResponse) => {
      deleteMutation.mutate(activity.id);
    },
    [deleteMutation]
  );

  const handleUpdateSubmit = useCallback(
    (formData: UpdateSalesActivityFormData) => {
      if (!editingActivity) return;

      // Convert form data (string dates) to API request format (Date objects)
      const requestData = {
        ...formData,
        contactDate: new Date(formData.contactDate),
        nextContactDate: formData.nextContactDate
          ? new Date(formData.nextContactDate)
          : null,
      };

      updateMutation.mutate(
        { id: editingActivity.id, data: requestData },
        {
          onSuccess: () => {
            setEditingActivity(null);
          },
        }
      );
    },
    [editingActivity, updateMutation]
  );

  const handleCloseEditModal = useCallback(() => {
    setEditingActivity(null);
  }, []);

  return (
    <div>
      <PageHeaderWithDateNav
        title="Hoạt động Sale"
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

      <SalesActivityStatistics
        statistics={data?.statistics}
        loading={isLoading}
      />

      {/* Filters & Actions */}
      <SalesActivityFilters
        totalCount={salesActivities.length}
        loading={isLoading}
      />

      {/* Table */}
      <SalesActivityTable
        data={salesActivities}
        loading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        showCustomerColumn={true}
      />

      {/* Edit Modal */}
      {editingActivity && (
        <SalesActivityModal
          mode="edit"
          open={!!editingActivity}
          initialData={editingActivity}
          onCancel={handleCloseEditModal}
          onSubmit={handleUpdateSubmit}
          loading={updateMutation.isPending}
        />
      )}
    </div>
  );
}
