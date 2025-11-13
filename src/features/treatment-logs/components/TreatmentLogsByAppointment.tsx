// src/features/treatment-logs/components/TreatmentLogsByAppointment.tsx
"use client";

import React from "react";
import { Card, Button, Typography, Space } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type {
  AppointmentForTreatmentResponse,
  TreatmentLogResponse,
} from "@/shared/validation/treatment-log.schema";
import TreatmentLogTable from "./TreatmentLogTable";

const { Text } = Typography;

type TreatmentLogsByAppointmentProps = {
  appointment: AppointmentForTreatmentResponse;
  onAddTreatment: (appointmentId: string) => void;
  onEditTreatment: (log: TreatmentLogResponse) => void;
  onDeleteTreatment: (log: TreatmentLogResponse) => void;
};

export default function TreatmentLogsByAppointment({
  appointment,
  onAddTreatment,
  onEditTreatment,
  onDeleteTreatment,
}: TreatmentLogsByAppointmentProps) {
  return (
    <Card
      style={{ marginBottom: 16 }}
      size="small"
      title={
        <Space>
          <Text strong>
            📅{" "}
            {dayjs(appointment.appointmentDateTime).format("DD/MM/YYYY HH:mm")}
          </Text>
          <Text type="secondary">|</Text>
          <Text type="secondary">
            👨‍⚕️ BS. {appointment.primaryDentist.fullName}
          </Text>
        </Space>
      }
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => onAddTreatment(appointment.id)}
        >
          Thêm điều trị
        </Button>
      }
    >
      <TreatmentLogTable
        data={appointment.treatmentLogs}
        onEdit={onEditTreatment}
        onDelete={onDeleteTreatment}
        hideDateColumn={true}
      />
    </Card>
  );
}
