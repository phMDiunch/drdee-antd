// src/features/consulted-services/components/ConsultedServiceDetailDrawer.tsx
"use client";

import React, { useState } from "react";
import {
  Drawer,
  Tabs,
  Space,
  Typography,
  Descriptions,
  Tag,
  Button,
  Modal,
} from "antd";
import {
  PlusOutlined,
  HistoryOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import type {
  ConsultedServiceResponse,
  SalesStage,
} from "@/shared/validation/consulted-service.schema";
import type { CreateActivityLogFormData } from "@/shared/validation/sales-activity-log.schema";
import { SERVICE_STATUS_TAGS, TREATMENT_STATUS_TAGS } from "../constants";
import StageTag from "./StageTag";
import StageHistoryTimeline from "./StageHistoryTimeline";
import ActivityLogList from "./ActivityLogList";
import ActivityLogForm from "./ActivityLogForm";
import { useCreateActivityLog } from "../hooks/useCreateActivityLog";
import { useCurrentUser } from "@/shared/providers";
import dayjs from "dayjs";

const { Title, Text } = Typography;

interface ConsultedServiceDetailDrawerProps {
  open: boolean;
  service: ConsultedServiceResponse | null;
  onClose: () => void;
}

/**
 * Drawer hiển thị chi tiết consulted service với:
 * - Tab 1: Thông tin chi tiết
 * - Tab 2: Activity Logs
 * - Tab 3: Stage History
 */
export default function ConsultedServiceDetailDrawer({
  open,
  service,
  onClose,
}: ConsultedServiceDetailDrawerProps) {
  const { user } = useCurrentUser();
  const [activeTab, setActiveTab] = useState("info");
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const createActivityMutation = useCreateActivityLog();

  if (!service) return null;

  const serviceStatusTag =
    SERVICE_STATUS_TAGS[
      service.serviceStatus as keyof typeof SERVICE_STATUS_TAGS
    ];
  const treatmentStatusTag =
    TREATMENT_STATUS_TAGS[
      service.treatmentStatus as keyof typeof TREATMENT_STATUS_TAGS
    ];

  const canAddActivity =
    user?.role === "admin" || service.consultingSale?.id === user?.employeeId;

  const handleActivitySubmit = (data: CreateActivityLogFormData) => {
    if (!service) return;

    createActivityMutation.mutate(
      {
        consultedServiceId: service.id,
        contactType: data.contactType,
        contactDate: dayjs(data.contactDate).toDate(),
        content: data.content,
        nextContactDate: data.nextContactDate
          ? dayjs(data.nextContactDate).toDate()
          : null,
      },
      {
        onSuccess: () => {
          setActivityModalOpen(false);
        },
      }
    );
  };

  const tabItems = [
    {
      key: "info",
      label: "Thông tin",
      children: (
        <Descriptions column={1} bordered size="small">
          {service.customer && (
            <>
              <Descriptions.Item label="Khách hàng">
                <Space>
                  <Text strong>{service.customer.fullName}</Text>
                  {service.customer.customerCode && (
                    <Text type="secondary">
                      ({service.customer.customerCode})
                    </Text>
                  )}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Điện thoại">
                {service.customer.phone || "—"}
              </Descriptions.Item>
            </>
          )}
          <Descriptions.Item label="Dịch vụ">
            <Text strong>{service.consultedServiceName}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Số lượng">
            {service.quantity} {service.consultedServiceUnit}
          </Descriptions.Item>
          <Descriptions.Item label="Giá ưu đãi">
            {new Intl.NumberFormat("vi-VN").format(service.preferentialPrice)}đ
          </Descriptions.Item>
          <Descriptions.Item label="Thành tiền">
            <Text strong>
              {new Intl.NumberFormat("vi-VN").format(service.finalPrice)}đ
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Đã trả">
            {new Intl.NumberFormat("vi-VN").format(service.amountPaid)}đ
          </Descriptions.Item>
          <Descriptions.Item label="Công nợ">
            <Text strong type={service.debt > 0 ? "danger" : undefined}>
              {new Intl.NumberFormat("vi-VN").format(service.debt)}đ
            </Text>
          </Descriptions.Item>
          {service.stage && (
            <Descriptions.Item label="Stage">
              <StageTag stage={service.stage as SalesStage} />
            </Descriptions.Item>
          )}
          <Descriptions.Item label="Trạng thái DV">
            <Tag color={serviceStatusTag.color}>{serviceStatusTag.text}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái ĐT">
            <Tag color={treatmentStatusTag.color}>
              {treatmentStatusTag.text}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Ngày tư vấn">
            {dayjs(service.consultationDate).format("DD/MM/YYYY HH:mm")}
          </Descriptions.Item>
          {service.serviceConfirmDate && (
            <Descriptions.Item label="Ngày chốt">
              {dayjs(service.serviceConfirmDate).format("DD/MM/YYYY HH:mm")}
            </Descriptions.Item>
          )}
          {service.consultingDoctor && (
            <Descriptions.Item label="BS tư vấn">
              {service.consultingDoctor.fullName}
            </Descriptions.Item>
          )}
          {service.treatingDoctor && (
            <Descriptions.Item label="BS điều trị">
              {service.treatingDoctor.fullName}
            </Descriptions.Item>
          )}
          {service.consultingSale && (
            <Descriptions.Item label="Sale">
              {service.consultingSale.fullName}
            </Descriptions.Item>
          )}
          {service.source && (
            <Descriptions.Item label="Nguồn khách">
              {service.source}
              {service.sourceNote && (
                <Text type="secondary"> ({service.sourceNote})</Text>
              )}
            </Descriptions.Item>
          )}
          {service.specificStatus && (
            <Descriptions.Item label="Tình trạng">
              {service.specificStatus}
            </Descriptions.Item>
          )}
          {service.toothPositions && service.toothPositions.length > 0 && (
            <Descriptions.Item label="Vị trí răng">
              {service.toothPositions.join(", ")}
            </Descriptions.Item>
          )}
        </Descriptions>
      ),
    },
    {
      key: "activities",
      label: (
        <Space>
          <PhoneOutlined />
          Activity Logs
        </Space>
      ),
      children: (
        <div>
          <Space
            style={{
              width: "100%",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <Title level={5} style={{ margin: 0 }}>
              Lịch sử tiếp xúc
            </Title>
            {canAddActivity && (
              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => setActivityModalOpen(true)}
              >
                Thêm
              </Button>
            )}
          </Space>
          <ActivityLogList consultedServiceId={service.id} />
        </div>
      ),
    },
    {
      key: "history",
      label: (
        <Space>
          <HistoryOutlined />
          Stage History
        </Space>
      ),
      children: (
        <div>
          <Title level={5} style={{ marginBottom: 16 }}>
            Lịch sử thay đổi stage
          </Title>
          <StageHistoryTimeline consultedServiceId={service.id} />
        </div>
      ),
    },
  ];

  return (
    <>
      <Drawer
        title={
          <Space direction="vertical" size={0}>
            <Text>Chi tiết dịch vụ tư vấn</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              #{service.id.slice(0, 8)}
            </Text>
          </Space>
        }
        width={600}
        open={open}
        onClose={onClose}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Drawer>

      <Modal
        title="Thêm Activity Log"
        open={activityModalOpen}
        onCancel={() => setActivityModalOpen(false)}
        footer={null}
      >
        <ActivityLogForm
          onSubmit={handleActivitySubmit}
          onCancel={() => setActivityModalOpen(false)}
          isSubmitting={createActivityMutation.isPending}
        />
      </Modal>
    </>
  );
}
