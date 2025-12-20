// src/features/customers/components/detail-tabs/ConsultedServicesTab.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Col, Row, Tooltip, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import {
  useConsultedServicesByCustomer,
  useCreateConsultedService,
  useUpdateConsultedService,
  useDeleteConsultedService,
  useConfirmConsultedService,
  ConsultedServiceTable,
  CreateConsultedServiceModal,
  UpdateConsultedServiceModal,
  useAssignConsultingSale,
} from "@/features/consulted-services";
import type {
  ConsultedServiceResponse,
  CreateConsultedServiceRequest,
  UpdateConsultedServiceRequest,
} from "@/shared/validation/consulted-service.schema";

interface ConsultedServicesTabProps {
  customerId: string;
  customerCode: string;
  customerName: string;
  clinicId: string;
  todayCheckIn?: {
    appointmentId: string;
    checkInTime: string;
  } | null;
  onDataChange?: () => void;
}

/**
 * Consulted Services Tab - Display customer's consulted services
 * Features:
 * - View all consulted services for this customer
 * - Create new consulted service (requires check-in today)
 * - Edit/Delete services (permission-based)
 * - Uses shared ConsultedServiceTable component
 */
export default function ConsultedServicesTab({
  customerId,
  customerCode,
  customerName,
  clinicId,
  todayCheckIn,
  onDataChange,
}: ConsultedServicesTabProps) {
  // Data fetching
  const { data, isLoading } = useConsultedServicesByCustomer(customerId);
  const services = useMemo(() => data?.items ?? [], [data?.items]);

  // Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingService, setEditingService] =
    useState<ConsultedServiceResponse | null>(null);

  // Mutations
  const createMutation = useCreateConsultedService();
  const updateMutation = useUpdateConsultedService();
  const deleteMutation = useDeleteConsultedService();
  const confirmMutation = useConfirmConsultedService();
  const assignSaleMutation = useAssignConsultingSale();

  // Check if user can add service (checked-in today)
  const canAddService = !!todayCheckIn;

  // Handlers
  const handleCreate = useCallback(() => {
    setCreateModalOpen(true);
  }, []);

  const handleCreateSubmit = useCallback(
    (data: CreateConsultedServiceRequest) => {
      createMutation.mutate(data);
    },
    [createMutation]
  );

  // Close modal and trigger data change on successful create
  useEffect(() => {
    if (createMutation.isSuccess) {
      setCreateModalOpen(false);
      onDataChange?.();
    }
  }, [createMutation.isSuccess, onDataChange]);

  const handleEdit = useCallback((service: ConsultedServiceResponse) => {
    setEditingService(service);
  }, []);

  const handleUpdateSubmit = useCallback(
    (_id: string, payload: UpdateConsultedServiceRequest) => {
      if (!editingService) return;

      updateMutation.mutate({ id: editingService.id, data: payload });
    },
    [editingService, updateMutation]
  );

  // Close modal and trigger data change on successful update
  useEffect(() => {
    if (updateMutation.isSuccess) {
      setEditingService(null);
      onDataChange?.();
    }
  }, [updateMutation.isSuccess, onDataChange]);

  const handleDelete = useCallback(
    (id: string) => {
      deleteMutation.mutate(id);
    },
    [deleteMutation]
  );

  const handleConfirm = useCallback(
    (id: string) => {
      confirmMutation.mutate(id);
    },
    [confirmMutation]
  );

  const handleAssignSale = useCallback(
    (id: string) => {
      assignSaleMutation.mutate(id);
    },
    [assignSaleMutation]
  );

  // Trigger data change on successful delete or confirm
  useEffect(() => {
    if (
      deleteMutation.isSuccess ||
      confirmMutation.isSuccess ||
      assignSaleMutation.isSuccess
    ) {
      onDataChange?.();
    }
  }, [
    deleteMutation.isSuccess,
    confirmMutation.isSuccess,
    assignSaleMutation.isSuccess,
    onDataChange,
  ]);

  return (
    <div>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Typography.Title level={5} style={{ margin: 0 }}>
            Danh sách dịch vụ tư vấn ({services.length})
          </Typography.Title>
        </Col>
        <Col>
          <Tooltip
            title={
              !canAddService
                ? "Khách chưa check-in hôm nay"
                : "Thêm dịch vụ tư vấn"
            }
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
              disabled={!canAddService}
            >
              Thêm dịch vụ tư vấn
            </Button>
          </Tooltip>
        </Col>
      </Row>

      {/* Table - Using shared ConsultedServiceTable component */}
      <ConsultedServiceTable
        data={services}
        loading={
          isLoading || deleteMutation.isPending || confirmMutation.isPending
        }
        isCustomerDetailView={true}
        onConfirm={handleConfirm}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAssignSale={handleAssignSale}
        actionLoading={
          confirmMutation.isPending || assignSaleMutation.isPending
        }
      />

      {/* Create Modal */}
      {createModalOpen && todayCheckIn && (
        <CreateConsultedServiceModal
          open={createModalOpen}
          customer={{
            id: customerId,
            customerCode,
            fullName: customerName,
          }}
          clinicId={clinicId}
          onCancel={() => setCreateModalOpen(false)}
          onSubmit={handleCreateSubmit}
          confirmLoading={createMutation.isPending}
        />
      )}

      {/* Update Modal */}
      {editingService && (
        <UpdateConsultedServiceModal
          open={!!editingService}
          service={editingService}
          onCancel={() => setEditingService(null)}
          onSubmit={handleUpdateSubmit}
          confirmLoading={updateMutation.isPending}
        />
      )}
    </div>
  );
}
