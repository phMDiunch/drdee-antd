"use client";

import React, { useMemo, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Typography } from "antd";
import { useNotify } from "@/shared/hooks/useNotify";
import EmployeeFilters from "@/features/employees/components/EmployeeFilters";
import EmployeeStats from "@/features/employees/components/EmployeeStats";
import EmployeeTable from "@/features/employees/components/EmployeeTable";
import EmployeeFormModal from "@/features/employees/components/CreateEmployeeModal";
import { useClinics } from "@/features/clinics/hooks/useClinics";
import {
  useEmployees,
  useCreateEmployee,
  useSetEmployeeStatus,
  useResendEmployeeInvite,
  useDeleteEmployee,
} from "@/features/employees";
import type {
  EmployeeResponse,
  CreateEmployeeRequest,
} from "@/shared/validation/employee.schema";

const { Title, Paragraph } = Typography;

export default function EmployeesListView() {
  const router = useRouter();
  const notify = useNotify();

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [statusTargetId, setStatusTargetId] = useState<string | null>(null);
  const [inviteTargetId, setInviteTargetId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const employeesQuery = useEmployees({ search: search || undefined });

  const clinicsQuery = useClinics(false);

  const createMutation = useCreateEmployee();
  const statusMutation = useSetEmployeeStatus();
  const resendMutation = useResendEmployeeInvite();
  const deleteMutation = useDeleteEmployee();

  const data = useMemo(() => employeesQuery.data ?? [], [employeesQuery.data]);

  const clinicOptions = useMemo(
    () =>
      (clinicsQuery.data ?? []).map((clinic) => ({
        label: clinic.name,
        value: clinic.id,
      })),
    [clinicsQuery.data]
  );

  const stats = useMemo(() => {
    let pending = 0,
      working = 0,
      resigned = 0;
    data.forEach((item) => {
      const s = item.employeeStatus?.toUpperCase();
      if (s === "PENDING") pending += 1;
      else if (s === "WORKING") working += 1;
      else if (s === "RESIGNED") resigned += 1;
    });
    return { total: data.length, pending, working, resigned };
  }, [data]);

  useEffect(() => {
    if (employeesQuery.error) {
      notify.error(employeesQuery.error, {
        fallback: "Không thể tải danh sách nhân viên.",
      });
    }
  }, [employeesQuery.error, notify]);

  useEffect(() => {
    if (statusMutation.error) {
      notify.error(statusMutation.error, {
        fallback: "Không thể cập nhật trạng thái nhân viên.",
      });
    }
  }, [statusMutation.error, notify]);

  useEffect(() => {
    if (deleteMutation.error) {
      notify.error(deleteMutation.error, {
        fallback: "Không thể xoá nhân viên.",
      });
    }
  }, [deleteMutation.error, notify]);

  const openCreateModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  const handleSubmitForm = useCallback(
    async (payload: CreateEmployeeRequest) => {
      try {
        await createMutation.mutateAsync(payload);
        closeModal();
      } catch {
        // Error already handled in hook's onError
      }
    },
    [createMutation, closeModal]
  );

  const handleToggleStatus = useCallback(
    async (row: EmployeeResponse) => {
      const nextStatus =
        row.employeeStatus === "RESIGNED" ? "WORKING" : "RESIGNED";
      setStatusTargetId(row.id);
      try {
        await statusMutation.mutateAsync({ id: row.id, status: nextStatus });
      } finally {
        setStatusTargetId(null);
      }
    },
    [statusMutation]
  );

  const handleResendInvite = useCallback(
    async (row: EmployeeResponse) => {
      if (!row.email) {
        notify.warning("Nhân viên này chưa có email để gửi lại lời mời.");
        return;
      }
      setInviteTargetId(row.id);
      try {
        await resendMutation.mutateAsync(row.id);
      } finally {
        setInviteTargetId(null);
      }
    },
    [notify, resendMutation]
  );

  const handleOpenEdit = useCallback(
    (row: EmployeeResponse) => router.push(`/employees/${row.id}/edit`),
    [router]
  );

  const handleDelete = useCallback(
    async (row: EmployeeResponse) => {
      setDeleteTargetId(row.id);
      try {
        await deleteMutation.mutateAsync(row.id);
      } finally {
        setDeleteTargetId(null);
      }
    },
    [deleteMutation]
  );

  return (
    <div>
      <Title level={4} style={{ marginBottom: 4 }}>
        Nhân viên
      </Title>
      <Paragraph type="secondary" style={{ marginBottom: 24 }}>
        Quản lý danh sách nhân viên, trạng thái làm việc và lời mời tham gia hệ
        thống.
      </Paragraph>

      <EmployeeStats
        total={stats.total}
        pending={stats.pending}
        working={stats.working}
        resigned={stats.resigned}
      />

      <EmployeeFilters
        defaultSearch={search}
        onSearchChange={setSearch}
        onCreateClick={openCreateModal}
      />

      <EmployeeTable
        data={data}
        loading={employeesQuery.isLoading}
        disabled={createMutation.isPending}
        statusLoadingId={statusMutation.isPending ? statusTargetId : null}
        inviteLoadingId={resendMutation.isPending ? inviteTargetId : null}
        deleteLoadingId={deleteMutation.isPending ? deleteTargetId : null}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        onResendInvite={handleResendInvite}
      />

      <EmployeeFormModal
        open={modalOpen}
        clinics={clinicOptions}
        confirmLoading={createMutation.isPending}
        onCancel={closeModal}
        onSubmit={handleSubmitForm}
      />
    </div>
  );
}
