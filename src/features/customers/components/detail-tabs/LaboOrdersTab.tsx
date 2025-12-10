// src/features/customers/components/detail-tabs/LaboOrdersTab.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Col, Row, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import {
  useLaboOrdersByCustomer,
  useCreateLaboOrder,
  useUpdateLaboOrder,
  useDeleteLaboOrder,
  useReceiveLaboOrder,
  LaboOrderTable,
  CreateLaboOrderModal,
  UpdateLaboOrderModal,
} from "@/features/labo-orders";
import type {
  LaboOrderResponse,
  CreateLaboOrderRequest,
  UpdateLaboOrderRequest,
} from "@/shared/validation/labo-order.schema";

interface LaboOrdersTabProps {
  customerId: string;
  customerCode: string;
  customerName: string;
  clinicId: string;
  onDataChange?: () => void;
}

/**
 * Labo Orders Tab - Display customer's labo orders
 * Features:
 * - View all labo orders for this customer (cross-clinic)
 * - Create new labo order
 * - Edit/Delete/Receive orders (permission-based)
 * - Uses shared LaboOrdersTable component with isCustomerDetailView prop
 * Pattern: Match ConsultedServicesTab implementation
 */
export default function LaboOrdersTab({
  customerId,
  customerCode,
  customerName,
  clinicId,
  onDataChange,
}: LaboOrdersTabProps) {
  // Data fetching
  const { data, isLoading } = useLaboOrdersByCustomer(customerId);
  const orders = useMemo(() => data?.items ?? [], [data?.items]);

  // Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<LaboOrderResponse | null>(
    null
  );

  // Mutations
  const createMutation = useCreateLaboOrder();
  const updateMutation = useUpdateLaboOrder();
  const deleteMutation = useDeleteLaboOrder();
  const receiveMutation = useReceiveLaboOrder();

  // Handlers
  const handleCreate = useCallback(() => {
    setCreateModalOpen(true);
  }, []);

  const handleCreateSubmit = useCallback(
    (data: CreateLaboOrderRequest) => {
      createMutation.mutate(data);
    },
    [createMutation]
  );

  // Close modal on success
  useEffect(() => {
    if (createMutation.isSuccess) {
      setCreateModalOpen(false);
      onDataChange?.();
    }
  }, [createMutation.isSuccess, onDataChange]);

  const handleEdit = useCallback((order: LaboOrderResponse) => {
    setEditingOrder(order);
  }, []);

  const handleUpdateSubmit = useCallback(
    (_id: string, payload: UpdateLaboOrderRequest) => {
      if (!editingOrder) return;
      updateMutation.mutate({ orderId: editingOrder.id, data: payload });
    },
    [editingOrder, updateMutation]
  );

  // Close modal on success
  useEffect(() => {
    if (updateMutation.isSuccess) {
      setEditingOrder(null);
      onDataChange?.();
    }
  }, [updateMutation.isSuccess, onDataChange]);

  const handleDelete = useCallback(
    (id: string) => {
      deleteMutation.mutate(id);
    },
    [deleteMutation]
  );

  const handleReceive = useCallback(
    (id: string) => {
      receiveMutation.mutate(id);
    },
    [receiveMutation]
  );

  // Trigger data change on success
  useEffect(() => {
    if (deleteMutation.isSuccess || receiveMutation.isSuccess) {
      onDataChange?.();
    }
  }, [deleteMutation.isSuccess, receiveMutation.isSuccess, onDataChange]);

  return (
    <div>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Typography.Title level={5} style={{ margin: 0 }}>
            Danh sách đơn hàng labo ({orders.length})
          </Typography.Title>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Tạo đơn mới
          </Button>
        </Col>
      </Row>

      {/* Table */}
      <LaboOrderTable
        data={orders}
        loading={
          isLoading || deleteMutation.isPending || receiveMutation.isPending
        }
        isCustomerDetailView={true}
        onReceive={handleReceive}
        onEdit={handleEdit}
        onDelete={handleDelete}
        actionLoading={receiveMutation.isPending}
      />

      {/* Create Modal */}
      {createModalOpen && (
        <CreateLaboOrderModal
          open={createModalOpen}
          prefilledCustomer={{
            id: customerId,
            customerCode,
            fullName: customerName,
            phone: null,
          }}
          selectedClinicId={clinicId}
          onCancel={() => setCreateModalOpen(false)}
          onSubmit={handleCreateSubmit}
          confirmLoading={createMutation.isPending}
        />
      )}

      {/* Update Modal */}
      {editingOrder && (
        <UpdateLaboOrderModal
          open={!!editingOrder}
          order={editingOrder}
          onCancel={() => setEditingOrder(null)}
          onSubmit={handleUpdateSubmit}
          confirmLoading={updateMutation.isPending}
        />
      )}
    </div>
  );
}
