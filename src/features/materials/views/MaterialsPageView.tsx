// src/features/materials/views/MaterialsPageView.tsx
"use client";

import React, { useCallback, useMemo, useState } from "react";
import { Button, Switch, Space, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import MaterialTable from "@/features/materials/components/MaterialTable";
import MaterialFormModal from "@/features/materials/components/MaterialFormModal";
import { useMaterials } from "@/features/materials/hooks/useMaterials";
import { useCreateMaterial } from "@/features/materials/hooks/useCreateMaterial";
import { useUpdateMaterial } from "@/features/materials/hooks/useUpdateMaterial";
import { useDeleteMaterial } from "@/features/materials/hooks/useDeleteMaterial";
import { useArchiveMaterial } from "@/features/materials/hooks/useArchiveMaterial";
import { useUnarchiveMaterial } from "@/features/materials/hooks/useUnarchiveMaterial";
import { useMasterData } from "@/features/master-data";
import { MATERIAL_MASTER_DATA_CATEGORIES } from "@/features/materials/constants";
import type {
  MaterialResponse,
  CreateMaterialRequest,
  UpdateMaterialRequest,
} from "@/shared/validation/material.schema";

const { Title, Text } = Typography;

type Props = { isAdmin?: boolean };

export default function MaterialsPageView({ isAdmin }: Props) {
  const [includeArchived, setIncludeArchived] = useState(false);
  const { data, isLoading } = useMaterials(includeArchived);
  const { data: masterData = [] } = useMasterData();

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<MaterialResponse | null>(null);

  const create = useCreateMaterial();
  const update = useUpdateMaterial(editing?.id || "");
  const del = useDeleteMaterial();
  const archive = useArchiveMaterial();
  const unarchive = useUnarchiveMaterial();

  const list = useMemo(() => data ?? [], [data]);

  // Get options from MasterData for each category
  const unitOptions = useMemo(() => {
    return masterData
      .filter((item) => item.category === MATERIAL_MASTER_DATA_CATEGORIES.UNIT)
      .map((item) => ({
        value: item.key,
        label: item.value,
      }));
  }, [masterData]);

  const materialTypeOptions = useMemo(() => {
    return masterData
      .filter((item) => item.category === MATERIAL_MASTER_DATA_CATEGORIES.TYPE)
      .map((item) => ({
        value: item.key,
        label: item.value,
      }));
  }, [masterData]);

  const departmentOptions = useMemo(() => {
    return masterData
      .filter(
        (item) => item.category === MATERIAL_MASTER_DATA_CATEGORIES.DEPARTMENT
      )
      .map((item) => ({
        value: item.key,
        label: item.value,
      }));
  }, [masterData]);

  const categoryOptions = useMemo(() => {
    return masterData
      .filter(
        (item) => item.category === MATERIAL_MASTER_DATA_CATEGORIES.CATEGORY
      )
      .map((item) => ({
        value: item.key,
        label: item.value,
      }));
  }, [masterData]);

  const subCategoryOptions = useMemo(() => {
    return masterData
      .filter(
        (item) => item.category === MATERIAL_MASTER_DATA_CATEGORIES.SUB_CATEGORY
      )
      .map((item) => ({
        value: item.key,
        label: item.value,
      }));
  }, [masterData]);

  const tagsOptions = useMemo(() => {
    return masterData
      .filter((item) => item.category === MATERIAL_MASTER_DATA_CATEGORIES.TAGS)
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

  const openEdit = useCallback((row: MaterialResponse) => {
    setMode("edit");
    setEditing(row);
    setModalOpen(true);
  }, []);

  const handleSubmit = useCallback(
    async (payload: CreateMaterialRequest | UpdateMaterialRequest) => {
      try {
        if (mode === "create") {
          await create.mutateAsync(payload as CreateMaterialRequest);
        } else if (mode === "edit" && editing) {
          await update.mutateAsync(payload as UpdateMaterialRequest);
        }
        closeModal();
      } catch {
        // Error already handled in hook's onError
      }
    },
    [mode, create, update, editing, closeModal]
  );

  const handleDelete = useCallback(
    (row: MaterialResponse) => {
      del.mutate(row.id);
    },
    [del]
  );

  const handleArchive = useCallback(
    (row: MaterialResponse) => {
      archive.mutate(row.id);
    },
    [archive]
  );

  const handleUnarchive = useCallback(
    (row: MaterialResponse) => {
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
            Danh mục vật tư
          </Title>
          <Text type="secondary">
            Quản lý danh mục hàng hóa/vật tư cho module Inventory.
          </Text>
        </div>

        <Space>
          <Text>Hiển thị đã lưu trữ</Text>
          <Switch checked={includeArchived} onChange={setIncludeArchived} />
          {isAdmin && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Thêm vật tư
            </Button>
          )}
        </Space>
      </Space>

      <MaterialTable
        data={list}
        loading={loadingAny}
        materialTypeOptions={materialTypeOptions}
        departmentOptions={departmentOptions}
        categoryOptions={categoryOptions}
        tagsOptions={tagsOptions}
        onEdit={openEdit}
        onDelete={handleDelete}
        onArchive={handleArchive}
        onUnarchive={handleUnarchive}
      />

      <MaterialFormModal
        open={modalOpen}
        mode={mode}
        isAdmin={isAdmin}
        initial={editing || undefined}
        unitOptions={unitOptions}
        materialTypeOptions={materialTypeOptions}
        departmentOptions={departmentOptions}
        categoryOptions={categoryOptions}
        subCategoryOptions={subCategoryOptions}
        tagsOptions={tagsOptions}
        confirmLoading={create.isPending || update.isPending}
        onCancel={closeModal}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
