// src/features/labo-items/views/LaboItemsPageView.tsx
"use client";

import React, { useCallback, useMemo, useState } from "react";
import { Button, Switch, Space, Typography, Input } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import LaboItemTable from "@/features/labo-items/components/LaboItemTable";
import LaboItemFormModal from "@/features/labo-items/components/LaboItemFormModal";
import { useLaboItems } from "@/features/labo-items/hooks/useLaboItems";
import { useCreateLaboItem } from "@/features/labo-items/hooks/useCreateLaboItem";
import { useUpdateLaboItem } from "@/features/labo-items/hooks/useUpdateLaboItem";
import { useDeleteLaboItem } from "@/features/labo-items/hooks/useDeleteLaboItem";
import { useArchiveLaboItem } from "@/features/labo-items/hooks/useArchiveLaboItem";
import { useUnarchiveLaboItem } from "@/features/labo-items/hooks/useUnarchiveLaboItem";
import type {
  LaboItemResponse,
  CreateLaboItemRequest,
  UpdateLaboItemRequest,
} from "@/shared/validation/labo-item.schema";

const { Title, Text } = Typography;
const { Search } = Input;

export default function LaboItemsPageView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const { data, isLoading } = useLaboItems(includeArchived);

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<LaboItemResponse | null>(null);

  const create = useCreateLaboItem();
  const update = useUpdateLaboItem(editing?.id || "");
  const del = useDeleteLaboItem();
  const archive = useArchiveLaboItem();
  const unarchive = useUnarchiveLaboItem();

  const list = useMemo(() => {
    if (!data) return [];
    if (!searchTerm) return data;

    const term = searchTerm.toLowerCase();
    return data.filter(
      (item) =>
        item.name?.toLowerCase().includes(term) ||
        item.serviceGroup?.toLowerCase().includes(term)
    );
  }, [data, searchTerm]);

  const closeModal = useCallback(() => setModalOpen(false), []);

  const openCreate = useCallback(() => {
    setMode("create");
    setEditing(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((row: LaboItemResponse) => {
    setMode("edit");
    setEditing(row);
    setModalOpen(true);
  }, []);

  const handleSubmit = useCallback(
    async (payload: CreateLaboItemRequest | UpdateLaboItemRequest) => {
      try {
        if (mode === "create") {
          await create.mutateAsync(payload as CreateLaboItemRequest);
        } else if (mode === "edit" && editing) {
          await update.mutateAsync(payload as UpdateLaboItemRequest);
        }
        closeModal();
      } catch {
        // Error already handled in hook's onError
      }
    },
    [mode, create, update, editing, closeModal]
  );

  const handleDelete = useCallback(
    (row: LaboItemResponse) => {
      del.mutate(row.id);
    },
    [del]
  );

  const handleArchive = useCallback(
    (row: LaboItemResponse) => {
      archive.mutate(row.id);
    },
    [archive]
  );

  const handleUnarchive = useCallback(
    (row: LaboItemResponse) => {
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
            Danh mục hàng Labo
          </Title>
          <Text type="secondary">
            Quản lý danh mục hàng labo áp dụng toàn hệ thống (chỉ Admin).
          </Text>
        </div>

        <Space wrap>
          <Search
            placeholder="Tìm theo tên, nhóm dịch vụ..."
            allowClear
            style={{ width: 300 }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Text>Hiển thị đã lưu trữ</Text>
          <Switch checked={includeArchived} onChange={setIncludeArchived} />
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Thêm hàng labo
          </Button>
        </Space>
      </Space>

      <LaboItemTable
        data={list}
        loading={loadingAny}
        onEdit={openEdit}
        onDelete={handleDelete}
        onArchive={handleArchive}
        onUnarchive={handleUnarchive}
      />

      <LaboItemFormModal
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
