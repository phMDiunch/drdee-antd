// src/features/treatment-logs/components/TreatmentLogTab.tsx
"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Space, Switch, Spin, Empty, Row, Col, Typography } from "antd";
import { CalendarOutlined, MedicineBoxOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  useCheckedInAppointments,
  useCreateTreatmentLog,
  useUpdateTreatmentLog,
  useDeleteTreatmentLog,
  TREATMENT_LOG_MESSAGES,
} from "@/features/treatment-logs";
import TreatmentLogsByAppointment from "./TreatmentLogsByAppointment";
import TreatmentLogsByService from "./TreatmentLogsByService";
import TreatmentLogModal from "./TreatmentLogModal";
import type {
  TreatmentLogResponse,
  CreateTreatmentLogFormData,
  UpdateTreatmentLogFormData,
  AppointmentForTreatmentResponse,
} from "@/shared/validation/treatment-log.schema";

type ViewMode = "by-date" | "by-service";

type ModalState = {
  open: boolean;
  mode: "add" | "edit";
  appointmentId?: string;
  appointmentDate?: string;
  consultedServices?: AppointmentForTreatmentResponse["customer"]["consultedServices"];
  initialData?: TreatmentLogResponse;
};

type ServiceGroup = {
  serviceId: string;
  serviceName: string;
  toothPositions: string[];
  serviceConfirmDate: string | null;
  treatingDoctorName: string | null;
  aggregateStatus: "Chưa điều trị" | "Đang điều trị" | "Hoàn thành";
  logs: TreatmentLogResponse[];
};

type TreatmentLogTabProps = {
  customerId: string;
};

export default function TreatmentLogTab({ customerId }: TreatmentLogTabProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("by-date");
  const [modal, setModal] = useState<ModalState>({
    open: false,
    mode: "add",
  });

  // Fetch data
  const { data: appointmentsData, isLoading } =
    useCheckedInAppointments(customerId);

  // Mutations
  const createMutation = useCreateTreatmentLog(customerId);
  const updateMutation = useUpdateTreatmentLog(customerId);
  const deleteMutation = useDeleteTreatmentLog(customerId);

  // Handlers - memoized to prevent unnecessary re-renders
  const handleAddTreatment = useCallback(
    (appointmentId: string) => {
      const appointment = appointmentsData?.items.find(
        (apt: AppointmentForTreatmentResponse) => apt.id === appointmentId
      );
      if (!appointment) return;

      setModal({
        open: true,
        mode: "add",
        appointmentId,
        appointmentDate: dayjs(appointment.appointmentDateTime).format(
          "DD/MM/YYYY"
        ),
        consultedServices: appointment.customer.consultedServices,
      });
    },
    [appointmentsData]
  );

  const handleEditTreatment = useCallback((log: TreatmentLogResponse) => {
    setModal({
      open: true,
      mode: "edit",
      appointmentDate: dayjs(log.appointment.appointmentDateTime).format(
        "DD/MM/YYYY"
      ),
      initialData: log,
    });
  }, []);

  const handleDeleteTreatment = useCallback(
    (log: TreatmentLogResponse) => {
      deleteMutation.mutate(log.id);
    },
    [deleteMutation]
  );

  const handleModalSubmit = useCallback(
    (data: CreateTreatmentLogFormData | UpdateTreatmentLogFormData) => {
      if (modal.mode === "add") {
        createMutation.mutate(data as CreateTreatmentLogFormData, {
          onSuccess: () => {
            setModal({ open: false, mode: "add" });
          },
        });
      } else if (modal.mode === "edit" && modal.initialData) {
        updateMutation.mutate(
          {
            id: modal.initialData.id,
            data: data as UpdateTreatmentLogFormData,
          },
          {
            onSuccess: () => {
              setModal({ open: false, mode: "add" });
            },
          }
        );
      }
    },
    [modal.mode, modal.initialData, createMutation, updateMutation]
  );

  const handleModalCancel = useCallback(() => {
    setModal({ open: false, mode: "add" });
  }, []);

  // Group by service for by-service view - memoized to avoid recalculation
  const serviceGroups = useMemo((): ServiceGroup[] => {
    if (!appointmentsData?.items.length) return [];

    const serviceMap = new Map<string, ServiceGroup>();

    // First, initialize all confirmed services
    const allServices =
      appointmentsData.items[0]?.customer.consultedServices || [];
    allServices.forEach(
      (
        service: AppointmentForTreatmentResponse["customer"]["consultedServices"][0]
      ) => {
        serviceMap.set(service.id, {
          serviceId: service.id,
          serviceName: service.consultedServiceName,
          toothPositions: service.toothPositions,
          serviceConfirmDate: service.serviceConfirmDate,
          treatingDoctorName: service.treatingDoctor?.fullName || null,
          aggregateStatus: "Chưa điều trị",
          logs: [],
        });
      }
    );

    // Then, add treatment logs
    appointmentsData.items.forEach(
      (appointment: AppointmentForTreatmentResponse) => {
        appointment.treatmentLogs.forEach((log: TreatmentLogResponse) => {
          const existing = serviceMap.get(log.consultedService.id);
          if (existing) {
            existing.logs.push(log);
          }
        });
      }
    );

    // Calculate aggregate status
    serviceMap.forEach((group) => {
      if (group.logs.length === 0) {
        group.aggregateStatus = "Chưa điều trị";
      } else if (
        group.logs.every((log) => log.treatmentStatus === "Hoàn thành")
      ) {
        group.aggregateStatus = "Hoàn thành";
      } else {
        group.aggregateStatus = "Đang điều trị";
      }

      // Sort logs by treatmentDate ASC (oldest first) for each service
      group.logs.sort(
        (a, b) =>
          new Date(a.treatmentDate).getTime() -
          new Date(b.treatmentDate).getTime()
      );
    });

    // Convert to array and sort by serviceConfirmDate DESC (newest first)
    return Array.from(serviceMap.values()).sort((a, b) => {
      const dateA = a.serviceConfirmDate
        ? new Date(a.serviceConfirmDate).getTime()
        : 0;
      const dateB = b.serviceConfirmDate
        ? new Date(b.serviceConfirmDate).getTime()
        : 0;
      return dateB - dateA; // DESC: newest first
    });
  }, [appointmentsData]);

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!appointmentsData?.items || appointmentsData.items.length === 0) {
    return (
      <Empty
        description={TREATMENT_LOG_MESSAGES.NO_CHECKED_IN_APPOINTMENTS}
        style={{ padding: "40px 0" }}
      />
    );
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      {/* Header */}
      <Row justify="space-between" align="middle">
        <Col>
          <Typography.Title level={5} style={{ margin: 0 }}>
            {viewMode === "by-date"
              ? `Lịch sử điều trị theo ngày (${appointmentsData.items.length} buổi)`
              : `Lịch sử điều trị theo dịch vụ (${serviceGroups.length} dịch vụ)`}
          </Typography.Title>
        </Col>
        <Col>
          <Space align="center">
            <Typography.Text>Theo ngày</Typography.Text>
            <Switch
              checked={viewMode === "by-service"}
              onChange={(checked) =>
                setViewMode(checked ? "by-service" : "by-date")
              }
              checkedChildren={<MedicineBoxOutlined />}
              unCheckedChildren={<CalendarOutlined />}
            />
            <Typography.Text>Theo dịch vụ</Typography.Text>
          </Space>
        </Col>
      </Row>

      {viewMode === "by-date" ? (
        <>
          {/* Backend already sorts by appointmentDateTime DESC (newest first) */}
          {appointmentsData.items.map(
            (appointment: AppointmentForTreatmentResponse) => (
              <TreatmentLogsByAppointment
                key={appointment.id}
                appointment={appointment}
                onAddTreatment={handleAddTreatment}
                onEditTreatment={handleEditTreatment}
                onDeleteTreatment={handleDeleteTreatment}
              />
            )
          )}
        </>
      ) : (
        <>
          {serviceGroups.map((serviceGroup) => (
            <TreatmentLogsByService
              key={serviceGroup.serviceId}
              serviceGroup={serviceGroup}
              onEditTreatment={handleEditTreatment}
              onDeleteTreatment={handleDeleteTreatment}
            />
          ))}
        </>
      )}

      <TreatmentLogModal
        open={modal.open}
        mode={modal.mode}
        appointmentId={modal.appointmentId}
        appointmentDate={modal.appointmentDate}
        consultedServices={modal.consultedServices}
        initialData={modal.initialData}
        onSubmit={handleModalSubmit}
        onCancel={handleModalCancel}
        loading={createMutation.isPending || updateMutation.isPending}
      />
    </Space>
  );
}
