// src/features/customers/components/detail-tabs/ConsultedServicesTab.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button, Col, Row, Tooltip, Typography } from "antd";
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
  clinicId: string | null; // nullable for LEAD, or from appointment when checked-in
  todayCheckIn?: {
    appointmentId: string;
    checkInTime: string;
    clinicId: string; // Clinic nơi check-in (appointment.clinicId)
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

  // Filter services chưa chốt (pending services) for warning banner
  const pendingServices = useMemo(() => {
    return services.filter((service) => service.serviceStatus === "Chưa chốt");
  }, [services]);

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

  // Check-in status for dynamic button UI
  const isCheckedIn = !!todayCheckIn;

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
              isCheckedIn
                ? "Dịch vụ sẽ gắn với lịch hẹn hôm nay"
                : "Dịch vụ tạo online (chưa có lịch hẹn)"
            }
          >
            <Button
              type={isCheckedIn ? "primary" : "default"}
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              {isCheckedIn
                ? "Thêm dịch vụ tư vấn tại phòng khám"
                : "Thêm dịch vụ tư vấn online"}
            </Button>
          </Tooltip>
        </Col>
      </Row>

      {/* Warning Banner - Pending Services */}
      {pendingServices.length > 0 && (
        <Alert
          type="error"
          showIcon
          closable
          style={{ marginBottom: 16 }}
          message={
            <strong>
              Khách hàng đang có {pendingServices.length} dịch vụ chưa chốt
            </strong>
          }
          description={
            <div>
              {pendingServices.map((service) => (
                <div key={service.id} style={{ marginBottom: 4 }}>
                  • {service.consultedServiceName}
                  {service.toothPositions?.length > 0 &&
                    ` (${service.toothPositions.join(", ")})`}
                </div>
              ))}
              <div style={{ marginTop: 8 }}>
                <strong>Vui lòng kiểm tra kỹ trước khi tạo dịch vụ mới</strong>
              </div>
            </div>
          }
        />
      )}

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
      {createModalOpen && (
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
