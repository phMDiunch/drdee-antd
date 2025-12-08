// src/features/dental-services/views/DentalServicesPageView.tsx
"use client";

import React, { useCallback, useMemo, useState } from "react";
import { Button, Switch, Space, Typography, Input } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import DentalServiceTable from "@/features/dental-services/components/DentalServiceTable";
import DentalServiceFormModal from "@/features/dental-services/components/DentalServiceFormModal";
import { useDentalServices } from "@/features/dental-services//hooks/useDentalServices";
import { useCreateDentalService } from "@/features/dental-services//hooks/useCreateDentalService";
import { useUpdateDentalService } from "@/features/dental-services//hooks/useUpdateDentalService";
import { useDeleteDentalService } from "@/features/dental-services//hooks/useDeleteDentalService";
import { useArchiveDentalService } from "@/features/dental-services//hooks/useArchiveDentalService";
import { useUnarchiveDentalService } from "@/features/dental-services//hooks/useUnarchiveDentalService";
import type {
  DentalServiceResponse,
  CreateDentalServiceRequest,
  UpdateDentalServiceRequest,
} from "@/shared/validation/dental-service.schema";

const { Title, Text } = Typography;
const { Search } = Input;

type Props = { isAdmin?: boolean };

export default function DentalServicesPageView({ isAdmin }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const { data, isLoading } = useDentalServices(includeArchived);

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<DentalServiceResponse | null>(null);

  const create = useCreateDentalService();
  const update = useUpdateDentalService(editing?.id || "");
  const del = useDeleteDentalService();
  const archive = useArchiveDentalService();
  const unarchive = useUnarchiveDentalService();

  const list = useMemo(() => {
    if (!data) return [];
    if (!searchTerm) return data;

    const term = searchTerm.toLowerCase();
    return data.filter(
      (item) =>
        item.name?.toLowerCase().includes(term) ||
        item.serviceGroup?.toLowerCase().includes(term) ||
        item.department?.toLowerCase().includes(term)
    );
  }, [data, searchTerm]);

  const closeModal = useCallback(() => setModalOpen(false), []);

  const openCreate = useCallback(() => {
    setMode("create");
    setEditing(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((row: DentalServiceResponse) => {
    setMode("edit");
    setEditing(row);
    setModalOpen(true);
  }, []);

  const handleSubmit = useCallback(
    async (
      payload: CreateDentalServiceRequest | UpdateDentalServiceRequest
    ) => {
      try {
        if (mode === "create") {
          await create.mutateAsync(payload as CreateDentalServiceRequest);
        } else if (mode === "edit" && editing) {
          await update.mutateAsync(payload as UpdateDentalServiceRequest);
        }
        closeModal();
      } catch {
        // Error already handled in hook's onError
      }
    },
    [mode, create, update, editing, closeModal]
  );

  const handleDelete = useCallback(
    (row: DentalServiceResponse) => {
      del.mutate(row.id);
    },
    [del]
  );

  const handleArchive = useCallback(
    (row: DentalServiceResponse) => {
      archive.mutate(row.id);
    },
    [archive]
  );

  const handleUnarchive = useCallback(
    (row: DentalServiceResponse) => {
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
            Dịch vụ nha khoa
          </Title>
          <Text type="secondary">Danh sách dịch vụ áp dụng toàn hệ thống.</Text>
        </div>

        <Space wrap>
          <Search
            placeholder="Tìm theo tên, nhóm DV, bộ môn..."
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

      <DentalServiceTable
        data={list}
        loading={loadingAny}
        onEdit={openEdit}
        onDelete={handleDelete}
        onArchive={handleArchive}
        onUnarchive={handleUnarchive}
      />

      <DentalServiceFormModal
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
