// src/features/clinics/views/ClinicsPageView.tsx
"use client";

import React, { useMemo, useState, useCallback } from "react";
import { Typography, Switch, Space, Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useClinics } from "@/features/clinics/hooks/useClinics";
import { useCreateClinic } from "@/features/clinics/hooks/useCreateClinic";
import { useUpdateClinic } from "@/features/clinics/hooks/useUpdateClinic";
import { useDeleteClinic } from "@/features/clinics/hooks/useDeleteClinic";
import { useArchiveClinic } from "@/features/clinics/hooks/useArchiveClinic";
import { useUnarchiveClinic } from "@/features/clinics/hooks/useUnarchiveClinic";
import ClinicTable from "@/features/clinics/components/ClinicTable";
import ClinicFormModal from "@/features/clinics/components/ClinicFormModal";
import type {
  ClinicResponse,
  CreateClinicRequest,
  UpdateClinicRequest,
} from "@/shared/validation/clinic.schema";

const { Title, Text } = Typography;

type Props = { isAdmin?: boolean };

export default function ClinicsPageView({ isAdmin }: Props) {
  const [includeArchived, setIncludeArchived] = useState(false);
  const { data, isLoading } = useClinics(includeArchived);

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<ClinicResponse | null>(null);

  const create = useCreateClinic();
  const update = useUpdateClinic(editing?.id || "");
  const del = useDeleteClinic();
  const archive = useArchiveClinic();
  const unarchive = useUnarchiveClinic();

  const list = useMemo(() => data ?? [], [data]);

  const closeModal = useCallback(() => setModalOpen(false), []);

  const openCreate = useCallback(() => {
    setMode("create");
    setEditing(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((row: ClinicResponse) => {
    setMode("edit");
    setEditing(row);
    setModalOpen(true);
  }, []);

  const handleSubmit = useCallback(
    (payload: CreateClinicRequest | UpdateClinicRequest) => {
      if (mode === "create") {
        create.mutate(payload as CreateClinicRequest, {
          onSuccess: closeModal,
        });
      } else if (mode === "edit" && editing) {
        update.mutate(payload as UpdateClinicRequest, {
          onSuccess: closeModal,
        });
      }
    },
    [mode, create, update, editing, closeModal]
  );

  const handleDelete = useCallback(
    (row: ClinicResponse) => {
      del.mutate(row.id);
    },
    [del]
  );

  const handleArchive = useCallback(
    (row: ClinicResponse) => {
      archive.mutate(row.id);
    },
    [archive]
  );

  const handleUnarchive = useCallback(
    (row: ClinicResponse) => {
      unarchive.mutate(row.id);
    },
    [unarchive]
  );

  const loadingAny = useMemo(
    () =>
      isLoading ||
      create.isPending ||
      update.isPending ||
      del.isPending ||
      archive.isPending ||
      unarchive.isPending,
    [
      isLoading,
      create.isPending,
      update.isPending,
      del.isPending,
      archive.isPending,
      unarchive.isPending,
    ]
  );

  return (
    <div>
      <Space
        style={{
          width: "100%",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div>
          <Title level={4} style={{ marginBottom: 0 }}>
            Phòng khám
          </Title>
          <Text type="secondary">Danh sách các chi nhánh.</Text>
        </div>

        <Space>
          <Text>Hiển thị đã lưu trữ</Text>
          <Switch checked={includeArchived} onChange={setIncludeArchived} />
          {isAdmin && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Tạo phòng khám
            </Button>
          )}
        </Space>
      </Space>

      <ClinicTable
        data={list}
        loading={loadingAny}
        onEdit={openEdit}
        onDelete={handleDelete}
        onArchive={handleArchive}
        onUnarchive={handleUnarchive}
      />

      <ClinicFormModal
        open={modalOpen}
        mode={mode}
        isAdmin={isAdmin}
        initial={editing || undefined}
        confirmLoading={create.isPending || update.isPending}
        onCancel={closeModal}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
