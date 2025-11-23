// src/features/master-data/views/MasterDataPageView.tsx
"use client";

import React, { useCallback, useMemo, useState } from "react";
import { Button, Space, Typography, Switch } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import MasterDataTree from "@/features/master-data/components/MasterDataTree";
import MasterDataFormModal from "@/features/master-data/components/MasterDataFormModal";
import { useMasterData } from "@/features/master-data/hooks/useMasterDataList";
import { useCreateMasterData } from "@/features/master-data/hooks/useCreateMasterData";
import { useUpdateMasterData } from "@/features/master-data/hooks/useUpdateMasterData";
import { useDeleteMasterData } from "@/features/master-data/hooks/useDeleteMasterData";
import { useToggleMasterDataActive } from "@/features/master-data/hooks/useToggleMasterDataActive";
import type {
  MasterDataResponse,
  CreateMasterDataRequest,
  UpdateMasterDataRequest,
} from "@/shared/validation/master-data.schema";

const { Title, Text } = Typography;

type Props = { isAdmin?: boolean };

export default function MasterDataPageView({ isAdmin }: Props) {
  const [includeInactive, setIncludeInactive] = useState(false);

  // Get ALL master data items (roots and children) for tree display
  // Pass undefined to get all items, not null (which means roots only)
  const { data, isLoading } = useMasterData(undefined, includeInactive);

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<MasterDataResponse | null>(null);

  const [parentForNewChild, setParentForNewChild] =
    useState<MasterDataResponse | null>(null);

  const create = useCreateMasterData();
  const update = useUpdateMasterData();
  const del = useDeleteMasterData();
  const toggleActive = useToggleMasterDataActive();

  const list = useMemo(() => data ?? [], [data]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setParentForNewChild(null);
  }, []);

  const openCreate = useCallback(() => {
    setMode("create");
    setEditing(null);
    setParentForNewChild(null);
    setModalOpen(true);
  }, []);

  const openCreateChild = useCallback((parent: MasterDataResponse) => {
    setMode("create");
    setEditing(null);
    setParentForNewChild(parent);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((row: MasterDataResponse) => {
    setMode("edit");
    setEditing(row);
    setParentForNewChild(null);
    setModalOpen(true);
  }, []);

  const handleSubmit = useCallback(
    async (payload: CreateMasterDataRequest | UpdateMasterDataRequest) => {
      try {
        if (mode === "create") {
          await create.mutateAsync(payload as CreateMasterDataRequest);
        } else if (mode === "edit" && editing) {
          await update.mutateAsync(payload as UpdateMasterDataRequest);
        }
        closeModal();
      } catch {
        // Error already handled in hook's onError
      }
    },
    [mode, create, update, editing, closeModal]
  );

  const handleDelete = useCallback(
    (row: MasterDataResponse) => {
      del.mutate(row.id);
    },
    [del]
  );

  const handleToggleActive = useCallback(
    (row: MasterDataResponse) => {
      toggleActive.mutate({ id: row.id, isActive: !row.isActive });
    },
    [toggleActive]
  );

  const loadingAny = useMemo(
    () =>
      isLoading ||
      create.isPending ||
      update.isPending ||
      del.isPending ||
      toggleActive.isPending,
    [
      isLoading,
      create.isPending,
      update.isPending,
      del.isPending,
      toggleActive.isPending,
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
            Danh mục hệ thống
          </Title>
          <Text type="secondary">
            Quản lý danh mục dữ liệu chủ với cấu trúc phân cấp linh hoạt
          </Text>
        </div>

        <Space>
          <span>Hiển thị đã tắt</span>
          <Switch checked={includeInactive} onChange={setIncludeInactive} />
          {isAdmin && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Thêm danh mục gốc
            </Button>
          )}
        </Space>
      </Space>

      <MasterDataTree
        data={list}
        loading={loadingAny}
        isAdmin={isAdmin}
        onEdit={openEdit}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
        onAddChild={openCreateChild}
      />

      <MasterDataFormModal
        open={modalOpen}
        mode={mode}
        isAdmin={isAdmin}
        initial={editing || undefined}
        parentId={parentForNewChild?.id}
        confirmLoading={create.isPending || update.isPending}
        onCancel={closeModal}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
