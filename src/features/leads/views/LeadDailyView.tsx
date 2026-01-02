"use client";
import React, { useCallback, useState } from "react";
import PageHeaderWithDateNav from "@/shared/components/PageHeaderWithDateNav";
import LeadStatistics from "../components/LeadStatistics";
import LeadFilters from "../components/LeadFilters";
import LeadTable from "../components/LeadTable";
import LeadFormModal from "../components/LeadFormModal";
import {
  useLeadsDaily,
  useCreateLead,
  useUpdateLead,
  useDeleteLead,
} from "@/features/leads";
import { useDateNavigation } from "@/shared/hooks/useDateNavigation";
import type {
  CreateLeadRequest,
  LeadResponse,
} from "@/shared/validation/lead.schema";

export default function LeadDailyView() {
  const {
    selectedDate,
    goToPreviousDay,
    goToToday,
    goToNextDay,
    handleDateChange,
  } = useDateNavigation();

  const { data, isLoading } = useLeadsDaily({
    date: selectedDate.format("YYYY-MM-DD"),
  });

  const [openModal, setOpenModal] = useState(false);
  const [editingLead, setEditingLead] = useState<LeadResponse | undefined>();

  const createMutation = useCreateLead();
  const updateMutation = useUpdateLead();
  const deleteMutation = useDeleteLead();

  const handleCreateSubmit = useCallback(
    async (payload: CreateLeadRequest) => {
      try {
        await createMutation.mutateAsync(payload);
        setOpenModal(false);
      } catch {
        // Hook handles error notification
      }
    },
    [createMutation]
  );

  const handleUpdateSubmit = useCallback(
    async (payload: CreateLeadRequest, leadId?: string) => {
      if (!leadId) return;
      try {
        await updateMutation.mutateAsync({ id: leadId, data: payload });
        setOpenModal(false);
        setEditingLead(undefined);
      } catch {
        // Hook handles error notification
      }
    },
    [updateMutation]
  );

  const handleOpenCreate = () => {
    setEditingLead(undefined);
    setOpenModal(true);
  };

  const handleEdit = useCallback((lead: LeadResponse) => {
    setEditingLead(lead);
    setOpenModal(true);
  }, []);

  const handleDelete = useCallback(
    async (lead: LeadResponse) => {
      try {
        await deleteMutation.mutateAsync(lead.id);
      } catch {
        // Hook handles error notification
      }
    },
    [deleteMutation]
  );

  const handleModalCancel = () => {
    setOpenModal(false);
    setEditingLead(undefined);
  };

  const items = data?.items ?? [];
  const totalCount = data?.count ?? 0;

  return (
    <div>
      <PageHeaderWithDateNav
        title="Quản lý Lead"
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        onPreviousDay={goToPreviousDay}
        onToday={goToToday}
        onNextDay={goToNextDay}
        loading={isLoading}
      />

      <LeadStatistics loading={isLoading} data={items} />

      <LeadFilters
        loading={isLoading}
        onCreate={handleOpenCreate}
        dailyCount={totalCount}
      />

      <LeadTable
        data={items}
        loading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <LeadFormModal
        open={openModal}
        mode={editingLead ? "edit" : "create"}
        initialData={editingLead}
        onCancel={handleModalCancel}
        onSubmit={editingLead ? handleUpdateSubmit : handleCreateSubmit}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
