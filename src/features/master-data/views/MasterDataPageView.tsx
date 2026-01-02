// src/features/master-data/views/MasterDataPageView.tsx
"use client";

import React, { useCallback, useState } from "react";
import { Typography, Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import MasterDataList from "@/features/master-data/components/MasterDataList";
import MasterDataFormModal from "@/features/master-data/components/MasterDataFormModal";
import {
  useCreateMasterData,
  useUpdateMasterData,
} from "@/features/master-data/hooks/mutations";
import type {
  MasterDataResponse,
  CreateMasterDataRequest,
  UpdateMasterDataRequest,
} from "@/shared/validation/master-data.schema";

const { Title, Text } = Typography;

type Props = { isAdmin?: boolean };

export default function MasterDataPageView({ isAdmin }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<MasterDataResponse | null>(null);
  const [categoryPrefill, setCategoryPrefill] = useState<string | undefined>(
    undefined
  );

  const create = useCreateMasterData();
  const update = useUpdateMasterData();

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setCategoryPrefill(undefined);
    setEditing(null);
  }, []);

  const openAdd = useCallback((category?: string) => {
    setMode("create");
    setEditing(null);
    setCategoryPrefill(category);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((row: MasterDataResponse) => {
    setMode("edit");
    setEditing(row);
    setCategoryPrefill(undefined);
    setModalOpen(true);
  }, []);

  const handleSubmit = useCallback(
    async (payload: CreateMasterDataRequest | UpdateMasterDataRequest) => {
      try {
        if (mode === "create") {
          await create.mutateAsync(payload as CreateMasterDataRequest);
        } else if (mode === "edit") {
          await update.mutateAsync(payload as UpdateMasterDataRequest);
        }
        closeModal();
      } catch {
        // Error already handled in hook's onError
      }
    },
    [mode, create, update, closeModal]
  );

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 16,
        }}
      >
        <div>
          <Title level={4} style={{ marginBottom: 0 }}>
            Danh mục hệ thống
          </Title>
          <Text type="secondary">
            Quản lý dữ liệu chủ với cấu trúc category đơn giản
          </Text>
        </div>

        {isAdmin && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openAdd()}
          >
            Thêm Category Mới
          </Button>
        )}
      </div>

      <MasterDataList isAdmin={isAdmin} onAdd={openAdd} onEdit={openEdit} />

      <MasterDataFormModal
        open={modalOpen}
        mode={mode}
        initial={editing || undefined}
        categoryPrefill={categoryPrefill}
        confirmLoading={create.isPending || update.isPending}
        onCancel={closeModal}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
