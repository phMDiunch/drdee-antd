// src/features/suppliers/views/SuppliersPageView.tsx
"use client";

import React, { useCallback, useMemo, useState } from "react";
import { Button, Switch, Space, Typography, Input } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import SupplierTable from "@/features/suppliers/components/SupplierTable";
import SupplierFormModal from "@/features/suppliers/components/SupplierFormModal";
import { useSuppliers } from "@/features/suppliers/hooks/useSuppliers";
import { useCreateSupplier } from "@/features/suppliers/hooks/useCreateSupplier";
import { useUpdateSupplier } from "@/features/suppliers/hooks/useUpdateSupplier";
import { useDeleteSupplier } from "@/features/suppliers/hooks/useDeleteSupplier";
import { useArchiveSupplier } from "@/features/suppliers/hooks/useArchiveSupplier";
import { useUnarchiveSupplier } from "@/features/suppliers/hooks/useUnarchiveSupplier";
import { useMasterData } from "@/features/master-data";
import type {
  SupplierResponse,
  CreateSupplierRequest,
  UpdateSupplierRequest,
} from "@/shared/validation/supplier.schema";

const { Title, Text } = Typography;
const { Search } = Input;

type Props = { isAdmin?: boolean };

export default function SuppliersPageView({ isAdmin }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const { data, isLoading } = useSuppliers(includeArchived);
  const { data: masterData = [] } = useMasterData();

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<SupplierResponse | null>(null);

  const create = useCreateSupplier();
  const update = useUpdateSupplier(editing?.id || "");
  const del = useDeleteSupplier();
  const archive = useArchiveSupplier();
  const unarchive = useUnarchiveSupplier();

  const list = useMemo(() => {
    if (!data) return [];
    if (!searchTerm) return data;

    const term = searchTerm.toLowerCase();
    return data.filter(
      (item) =>
        item.name?.toLowerCase().includes(term) ||
        item.shortName?.toLowerCase().includes(term)
    );
  }, [data, searchTerm]);

  // Get supplier group options from MasterData (category='nhom-nha-cung-cap')
  const supplierGroupOptions = useMemo(() => {
    return masterData
      .filter((item) => item.category === "nhom-nha-cung-cap")
      .map((item) => ({
        value: item.key,
        label: item.value,
      }));
  }, [masterData]);

  const closeModal = useCallback(() => setModalOpen(false), []);

  const openCreate = useCallback(() => {
    setMode("create");
    setEditing(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((row: SupplierResponse) => {
    setMode("edit");
    setEditing(row);
    setModalOpen(true);
  }, []);

  const handleSubmit = useCallback(
    async (payload: CreateSupplierRequest | UpdateSupplierRequest) => {
      try {
        if (mode === "create") {
          await create.mutateAsync(payload as CreateSupplierRequest);
        } else if (mode === "edit" && editing) {
          await update.mutateAsync(payload as UpdateSupplierRequest);
        }
        closeModal();
      } catch {
        // Error already handled in hook's onError
      }
    },
    [mode, create, update, editing, closeModal]
  );

  const handleDelete = useCallback(
    (row: SupplierResponse) => {
      del.mutate(row.id);
    },
    [del]
  );

  const handleArchive = useCallback(
    (row: SupplierResponse) => {
      archive.mutate(row.id);
    },
    [archive]
  );

  const handleUnarchive = useCallback(
    (row: SupplierResponse) => {
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
            Nhà cung cấp
          </Title>
          <Text type="secondary">
            Quản lý danh sách nhà cung cấp cho module Inventory.
          </Text>
        </div>

        <Space wrap>
          <Search
            placeholder="Tìm theo tên, tên viết tắt..."
            allowClear
            style={{ width: 300 }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Text>Hiển thị đã lưu trữ</Text>
          <Switch checked={includeArchived} onChange={setIncludeArchived} />
          {isAdmin && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Thêm nhà cung cấp
            </Button>
          )}
        </Space>
      </Space>

      <SupplierTable
        data={list}
        loading={loadingAny}
        supplierGroupOptions={supplierGroupOptions}
        onEdit={openEdit}
        onDelete={handleDelete}
        onArchive={handleArchive}
        onUnarchive={handleUnarchive}
      />

      <SupplierFormModal
        open={modalOpen}
        mode={mode}
        isAdmin={isAdmin}
        initial={editing || undefined}
        supplierGroupOptions={supplierGroupOptions}
        confirmLoading={create.isPending || update.isPending}
        onCancel={closeModal}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
