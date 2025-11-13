// src/features/treatment-logs/components/TreatmentLogsByService.tsx
"use client";

import React from "react";
import { Card, Space, Tag, Typography } from "antd";
import { MedicineBoxOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type { TreatmentLogResponse } from "@/shared/validation/treatment-log.schema";
import TreatmentLogTable from "./TreatmentLogTable";

const { Text } = Typography;

type ServiceGroup = {
  serviceId: string;
  serviceName: string;
  toothPositions: string[];
  serviceConfirmDate: string | null;
  treatingDoctorName: string | null;
  aggregateStatus: "Chưa điều trị" | "Đang điều trị" | "Hoàn thành";
  logs: TreatmentLogResponse[];
};

type TreatmentLogsByServiceProps = {
  serviceGroup: ServiceGroup;
  onEditTreatment: (log: TreatmentLogResponse) => void;
  onDeleteTreatment: (log: TreatmentLogResponse) => void;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "Chưa điều trị":
      return "default";
    case "Đang điều trị":
      return "processing";
    case "Hoàn thành":
      return "success";
    default:
      return "default";
  }
};

export default function TreatmentLogsByService({
  serviceGroup,
  onEditTreatment,
  onDeleteTreatment,
}: TreatmentLogsByServiceProps) {
  return (
    <Card
      style={{ marginBottom: 16 }}
      title={
        <Space>
          <MedicineBoxOutlined />
          <Text strong>
            {serviceGroup.serviceName}
            {serviceGroup.toothPositions.length > 0 &&
              ` - Răng: ${serviceGroup.toothPositions.join(", ")}`}
          </Text>
          {serviceGroup.serviceConfirmDate && (
            <>
              <Text type="secondary">|</Text>
              <Text type="secondary">
                Xác nhận:{" "}
                {dayjs(serviceGroup.serviceConfirmDate).format("DD/MM/YYYY")}
              </Text>
            </>
          )}
          {serviceGroup.treatingDoctorName && (
            <>
              <Text type="secondary">|</Text>
              <Text type="secondary">
                👨‍⚕️ BS. {serviceGroup.treatingDoctorName}
              </Text>
            </>
          )}
          <Text type="secondary">|</Text>
          <Tag color={getStatusColor(serviceGroup.aggregateStatus)}>
            {serviceGroup.aggregateStatus}
          </Tag>
        </Space>
      }
      size="small"
    >
      <TreatmentLogTable
        data={serviceGroup.logs}
        onEdit={onEditTreatment}
        onDelete={onDeleteTreatment}
        hideServiceColumn={true}
      />
    </Card>
  );
}
