// src/features/customers/components/detail-tabs/AppointmentsTab.tsx
"use client";

import { useState, useEffect } from "react";
import { Button, Col, Empty, Row, Space, Spin, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import {
  AppointmentTable,
  CreateAppointmentModal,
  UpdateAppointmentModal,
  useAppointments,
  useCreateAppointment,
  useUpdateAppointment,
  useDeleteAppointment,
} from "@/features/appointments";
import type { AppointmentResponse } from "@/shared/validation/appointment.schema";

interface AppointmentsTabProps {
  customerId: string; // Customer ID để filter appointments
  customerName: string; // Customer name for display
  customerCode: string | null; // Customer code for display
  customerPhone: string | null; // Customer phone for display
  clinicId: string; // Default clinic cho new appointments
  onAppointmentChange?: () => void; // Callback để refetch customer
}

/**
 * Appointments Tab - Display customer's appointments (cross-clinic view)
 * Features:
 * - View all appointments across all clinics
 * - Create new appointment for this customer
 * - Edit/Delete appointments (own clinic only for Employee)
 * - Quick actions: Check-in, Check-out, Confirm, Mark No-show
 */
export default function AppointmentsTab({
  customerId,
  customerName,
  customerCode,
  customerPhone,
  clinicId,
  onAppointmentChange,
}: AppointmentsTabProps) {
  // States
  const [openCreate, setOpenCreate] = useState(false);
  const [editingAppointment, setEditingAppointment] =
    useState<AppointmentResponse | null>(null);

  // Queries - Load ALL appointments for this customer (cross-clinic)
  const {
    data: appointmentsData,
    isLoading,
    error,
  } = useAppointments({
    customerId, // Trigger cross-clinic view in backend
    page: 1,
    pageSize: 100, // Load all for customer detail
    sortField: "appointmentDateTime",
    sortDirection: "desc", // Newest first
  });

  // Mutations
  const createMutation = useCreateAppointment();
  const updateMutation = useUpdateAppointment();
  const deleteMutation = useDeleteAppointment();

  // Side effects: Close modals and refetch when mutations succeed
  useEffect(() => {
    if (createMutation.isSuccess) {
      setOpenCreate(false);
      onAppointmentChange?.();
    }
  }, [createMutation.isSuccess, onAppointmentChange]);

  useEffect(() => {
    if (updateMutation.isSuccess) {
      setEditingAppointment(null);
      onAppointmentChange?.();
    }
  }, [updateMutation.isSuccess, onAppointmentChange]);

  useEffect(() => {
    if (deleteMutation.isSuccess) {
      onAppointmentChange?.();
    }
  }, [deleteMutation.isSuccess, onAppointmentChange]);

  // Quick actions - Let hooks handle notifications
  const handleCheckIn = (id: string) => {
    updateMutation.mutate({
      id,
      body: {
        checkInTime: new Date(),
        status: "Đã đến" as const,
      },
    });
  };

  const handleCheckOut = (id: string) => {
    updateMutation.mutate({
      id,
      body: {
        checkOutTime: new Date(),
      },
    });
  };

  const handleConfirm = (id: string) => {
    updateMutation.mutate({
      id,
      body: { status: "Đã xác nhận" },
    });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  // Loading state
  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "50px 0" }}>
        <Spin size="large">
          <div style={{ paddingTop: 50 }}>Đang tải danh sách lịch hẹn...</div>
        </Spin>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Empty
        description={
          <Typography.Text type="danger">
            {error instanceof Error
              ? error.message
              : "Không thể tải danh sách lịch hẹn"}
          </Typography.Text>
        }
      />
    );
  }

  const appointments = appointmentsData?.items || [];
  const appointmentCount = appointmentsData?.count || 0;

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      {/* Header */}
      <Row justify="space-between" align="middle">
        <Col>
          <Typography.Title level={5} style={{ margin: 0 }}>
            Danh sách lịch hẹn ({appointmentCount})
          </Typography.Title>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setOpenCreate(true)}
          >
            Thêm lịch hẹn
          </Button>
        </Col>
      </Row>

      {/* Empty State */}
      {appointments.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <>
              <Typography.Text type="secondary">
                Khách hàng chưa có lịch hẹn nào
              </Typography.Text>
              <br />
              <Button type="link" onClick={() => setOpenCreate(true)}>
                Tạo lịch hẹn đầu tiên
              </Button>
            </>
          }
        />
      ) : (
        /* Table */
        <AppointmentTable
          data={appointments}
          loading={isLoading}
          isCustomerDetailView={true} // Customer Detail context: hide customer + show full datetime
          onEdit={(apt) => setEditingAppointment(apt)}
          onDelete={handleDelete}
          onCheckIn={handleCheckIn}
          onCheckOut={handleCheckOut}
          onConfirm={handleConfirm}
          actionLoading={updateMutation.isPending || deleteMutation.isPending}
        />
      )}

      {/* Create Modal */}
      <CreateAppointmentModal
        open={openCreate}
        selectedClinicId={clinicId} // Pre-fill clinic
        prefilledCustomer={{
          // Pre-fill customer (disabled)
          id: customerId,
          customerCode,
          fullName: customerName,
          phone: customerPhone,
        }}
        onCancel={() => setOpenCreate(false)}
        onSubmit={(payload) => createMutation.mutate(payload)}
        confirmLoading={createMutation.isPending}
      />

      {/* Edit Modal */}
      {editingAppointment && (
        <UpdateAppointmentModal
          open={!!editingAppointment}
          appointment={editingAppointment}
          onCancel={() => setEditingAppointment(null)}
          onSubmit={(payload, id) =>
            updateMutation.mutate({
              id,
              body: payload,
            })
          }
          confirmLoading={updateMutation.isPending}
        />
      )}
    </Space>
  );
}
