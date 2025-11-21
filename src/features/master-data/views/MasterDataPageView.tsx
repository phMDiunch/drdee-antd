// src/features/master-data/views/MasterDataPageView.tsx
"use client";

import React, { useCallback, useMemo, useState } from "react";
import { Button, Space, Typography, Switch } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import MasterDataTable from "@/features/master-data/components/MasterDataTable";
import MasterDataFormModal from "@/features/master-data/components/MasterDataFormModal";
import { useMasterDataList } from "@/features/master-data/hooks/useMasterDataList";
import { useCreateMasterData } from "@/features/master-data/hooks/useCreateMasterData";
import { useUpdateMasterData } from "@/features/master-data/hooks/useUpdateMasterData";
import { useDeleteMasterData } from "@/features/master-data/hooks/useDeleteMasterData";
import type {
  MasterDataResponse,
  CreateMasterDataRequest,
  UpdateMasterDataRequest,
} from "@/shared/validation/master-data.schema";

const { Title, Text } = Typography;

type Props = { isAdmin?: boolean };

export default function MasterDataPageView({ isAdmin }: Props) {
  const [includeInactive, setIncludeInactive] = useState(false);

  const { data, isLoading } = useMasterDataList(undefined, includeInactive);

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<MasterDataResponse | null>(null);

  const create = useCreateMasterData();
  const update = useUpdateMasterData();
  const del = useDeleteMasterData();

  const list = useMemo(() => data ?? [], [data]);

  const closeModal = useCallback(() => setModalOpen(false), []);

  const openCreate = useCallback(() => {
    setMode("create");
    setEditing(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((row: MasterDataResponse) => {
    setMode("edit");
    setEditing(row);
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

  const loadingAny = useMemo(
    () => isLoading || create.isPending || update.isPending || del.isPending,
    [isLoading, create.isPending, update.isPending, del.isPending]
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
            Quản lý dữ liệu chủ: nhóm NCC, phòng ban, đơn vị tính...
          </Text>
        </div>

        <Space>
          <span>Hiển thị đã tắt</span>
          <Switch checked={includeInactive} onChange={setIncludeInactive} />
          {isAdmin && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Thêm mới
            </Button>
          )}
        </Space>
      </Space>

      <MasterDataTable
        data={list}
        loading={loadingAny}
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      <MasterDataFormModal
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
