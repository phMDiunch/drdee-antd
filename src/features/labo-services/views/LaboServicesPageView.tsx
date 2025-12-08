// src/features/labo-services/views/LaboServicesPageView.tsx
"use client";

import React, { useCallback, useMemo, useState } from "react";
import { Button, Space, Typography, Input, Switch } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import LaboServiceTable from "@/features/labo-services/components/LaboServiceTable";
import LaboServiceFormModal from "@/features/labo-services/components/LaboServiceFormModal";
import { useLaboServices } from "@/features/labo-services/hooks/useLaboServices";
import { useCreateLaboService } from "@/features/labo-services/hooks/useCreateLaboService";
import { useUpdateLaboService } from "@/features/labo-services/hooks/useUpdateLaboService";
import { useDeleteLaboService } from "@/features/labo-services/hooks/useDeleteLaboService";
import { useArchiveLaboService } from "@/features/labo-services/hooks/useArchiveLaboService";
import { useUnarchiveLaboService } from "@/features/labo-services/hooks/useUnarchiveLaboService";
import type {
  LaboServiceResponse,
  CreateLaboServiceRequest,
  UpdateLaboServiceRequest,
} from "@/shared/validation/labo-service.schema";

const { Title, Text } = Typography;
const { Search } = Input;

type Props = { isAdmin?: boolean };

export default function LaboServicesPageView({ isAdmin }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const { data, isLoading } = useLaboServices(includeArchived);

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<LaboServiceResponse | null>(null);

  const create = useCreateLaboService();
  const update = useUpdateLaboService(editing?.id || "");
  const del = useDeleteLaboService();
  const archive = useArchiveLaboService();
  const unarchive = useUnarchiveLaboService();

  // Filter data by search term (frontend search)
  const filteredList = useMemo(() => {
    if (!data) return [];
    if (!searchTerm) return data;

    const term = searchTerm.toLowerCase();
    return data.filter(
      (item) =>
        (item.supplier?.shortName || item.supplier?.name)
          ?.toLowerCase()
          .includes(term) || item.laboItem?.name.toLowerCase().includes(term)
    );
  }, [data, searchTerm]);

  const closeModal = useCallback(() => setModalOpen(false), []);

  const openCreate = useCallback(() => {
    setMode("create");
    setEditing(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((row: LaboServiceResponse) => {
    setMode("edit");
    setEditing(row);
    setModalOpen(true);
  }, []);

  const handleSubmit = useCallback(
    async (payload: CreateLaboServiceRequest | UpdateLaboServiceRequest) => {
      try {
        if (mode === "create") {
          await create.mutateAsync(payload as CreateLaboServiceRequest);
        } else if (mode === "edit" && editing) {
          await update.mutateAsync(payload as UpdateLaboServiceRequest);
        }
        closeModal();
      } catch {
        // Error already handled in hook's onError
      }
    },
    [mode, create, update, editing, closeModal]
  );

  const handleDelete = useCallback(
    (row: LaboServiceResponse) => {
      del.mutate(row.id);
    },
    [del]
  );

  const handleArchive = useCallback(
    (row: LaboServiceResponse) => {
      archive.mutate(row.id);
    },
    [archive]
  );

  const handleUnarchive = useCallback(
    (row: LaboServiceResponse) => {
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
        wrap
        style={{
          width: "100%",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div>
          <Title level={4} style={{ marginBottom: 0 }}>
            Dịch Vụ Labo
          </Title>
          <Text type="secondary">
            Quản lý giá và bảo hành dịch vụ labo của từng xưởng.
          </Text>
        </div>

        <Space wrap>
          <Search
            placeholder="Tìm theo xưởng hoặc tên dịch vụ..."
            allowClear
            style={{ width: 300 }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Text>Hiển thị đã lưu trữ</Text>
          <Switch checked={includeArchived} onChange={setIncludeArchived} />
          {isAdmin && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Thêm dịch vụ
            </Button>
          )}
        </Space>
      </Space>

      <LaboServiceTable
        data={filteredList}
        loading={loadingAny}
        onEdit={openEdit}
        onDelete={handleDelete}
        onArchive={handleArchive}
        onUnarchive={handleUnarchive}
      />

      <LaboServiceFormModal
        open={modalOpen}
        mode={mode}
        initial={editing || undefined}
        confirmLoading={create.isPending || update.isPending}
        onCancel={closeModal}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
