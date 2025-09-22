// src/features/clinic/views/ClinicsPageView.tsx
"use client";

import React, { useMemo, useState } from "react";
import { Card, Typography, Switch, Space, Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useClinics } from "@/features/clinic/hooks/useClinics";
import { useCreateClinic } from "@/features/clinic/hooks/useCreateClinic";
import { useUpdateClinic } from "@/features/clinic/hooks/useUpdateClinic";
import { useDeleteClinic } from "@/features/clinic/hooks/useDeleteClinic";
import { useArchiveClinic } from "@/features/clinic/hooks/useArchiveClinic";
import { useUnarchiveClinic } from "@/features/clinic/hooks/useUnarchiveClinic";
import ClinicTable from "@/features/clinic/components/ClinicTable";
import ClinicFormModal from "@/features/clinic/components/ClinicFormModal";
import type { ClinicResponse, CreateClinicRequest, UpdateClinicRequest } from "@/features/clinic/types";

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

  const openCreate = () => {
    setMode("create");
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (row: ClinicResponse) => {
    setMode("edit");
    setEditing(row);
    setModalOpen(true);
  };

  const handleSubmit = (payload: CreateClinicRequest | UpdateClinicRequest) => {
    if (mode === "create") {
      create.mutate(payload as CreateClinicRequest, {
        onSuccess: () => setModalOpen(false),
      });
    } else if (mode === "edit" && editing) {
      update.mutate(payload as UpdateClinicRequest, {
        onSuccess: () => setModalOpen(false),
      });
    }
  };

  const loadingAny = isLoading || create.isPending || update.isPending || del.isPending || archive.isPending || unarchive.isPending;

  return (
    <Card>
      <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <Title level={4} style={{ marginBottom: 0 }}>
            Phòng khám
          </Title>
          <Text type="secondary">Danh sách các chi nhánh.</Text>
        </div>

        <Space>
          <Text>Hiện cả archived</Text>
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
        onDelete={(row) => del.mutate(row.id)}
        onArchive={(row) => archive.mutate(row.id)}
        onUnarchive={(row) => unarchive.mutate(row.id)}
      />

      {/* Chỉ mount modal khi mở để tránh cảnh báo useForm/Modal */}
      {modalOpen && (
        <ClinicFormModal
          open
          mode={mode}
          isAdmin={isAdmin}
          initial={editing || undefined}
          confirmLoading={create.isPending || update.isPending}
          onCancel={() => setModalOpen(false)}
          onSubmit={handleSubmit}
        />
      )}
    </Card>
  );
}
