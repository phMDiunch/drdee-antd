// src/features/labo-services/views/LaboServicesView.tsx
"use client";

import React, { useCallback, useMemo, useState } from "react";
import { Button, Space, Typography, Input } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import LaboPriceTable from "@/features/labo-services/components/LaboPriceTable";
import LaboPriceFormModal from "@/features/labo-services/components/LaboPriceFormModal";
import { useLaboServices } from "@/features/labo-services/hooks/useLaboServices";
import { useCreateLaboService } from "@/features/labo-services/hooks/useCreateLaboService";
import { useUpdateLaboService } from "@/features/labo-services/hooks/useUpdateLaboService";
import { useDeleteLaboService } from "@/features/labo-services/hooks/useDeleteLaboService";
import type {
  LaboServiceResponse,
  CreateLaboServiceRequest,
  UpdateLaboServiceRequest,
} from "@/shared/validation/labo-service.schema";

const { Title, Text } = Typography;
const { Search } = Input;

export default function LaboServicesView() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data, isLoading } = useLaboServices();

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<LaboServiceResponse | null>(null);

  const create = useCreateLaboService();
  const update = useUpdateLaboService(editing?.id || "");
  const del = useDeleteLaboService();

  // Filter data by search term (frontend search)
  const filteredList = useMemo(() => {
    if (!data) return [];
    if (!searchTerm) return data;

    const term = searchTerm.toLowerCase();
    return data.filter(
      (item) =>
        item.supplier?.name.toLowerCase().includes(term) ||
        item.laboItem?.name.toLowerCase().includes(term)
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
          marginBottom: 16,
        }}
      >
        <div>
          <Title level={4} style={{ marginBottom: 0 }}>
            Dịch Vụ Labo
          </Title>
          <Text type="secondary">
            Quản lý giá và bảo hành dịch vụ labo của từng xưởng (chỉ Admin).
          </Text>
        </div>

        <Space>
          <Search
            placeholder="Tìm theo xưởng hoặc tên dịch vụ..."
            allowClear
            style={{ width: 300 }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Thêm dịch vụ
          </Button>
        </Space>
      </Space>

      <LaboPriceTable
        data={filteredList}
        loading={loadingAny}
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      <LaboPriceFormModal
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
