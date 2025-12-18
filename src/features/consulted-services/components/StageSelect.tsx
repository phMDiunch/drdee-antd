// src/features/consulted-services/components/StageSelect.tsx
"use client";

import React, { useState } from "react";
import { Select, Modal, Input, Space, Tag } from "antd";
import {
  SALES_STAGES,
  STAGE_LABELS,
  STAGE_COLORS,
  STAGE_FLOW,
  type SalesStage,
} from "@/shared/validation/consulted-service.schema";
import { useUpdateStage } from "../hooks/useUpdateStage";

interface StageSelectProps {
  consultedServiceId: string;
  currentStage: SalesStage | null | undefined;
  disabled?: boolean;
}

/**
 * Stage selector with validation and reason modal for LOST
 */
export default function StageSelect({
  consultedServiceId,
  currentStage,
  disabled,
}: StageSelectProps) {
  const [selectedStage, setSelectedStage] = useState<SalesStage | null>(null);
  const [reason, setReason] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { mutate: updateStage, isPending } = useUpdateStage(consultedServiceId);

  // Get allowed transitions
  const allowedStages = currentStage
    ? STAGE_FLOW[currentStage]
    : SALES_STAGES.filter((s) => s !== "LOST"); // Can set any stage except LOST if no current stage

  const handleStageChange = (newStage: SalesStage) => {
    if (newStage === "LOST") {
      // Show reason modal
      setSelectedStage(newStage);
      setIsModalOpen(true);
    } else {
      // Update directly
      updateStage({ toStage: newStage });
    }
  };

  const handleLostConfirm = () => {
    if (!selectedStage) return;

    updateStage(
      { toStage: selectedStage, reason },
      {
        onSuccess: () => {
          setIsModalOpen(false);
          setReason("");
          setSelectedStage(null);
        },
      }
    );
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
    setReason("");
    setSelectedStage(null);
  };

  return (
    <>
      <Select
        value={currentStage || undefined}
        onChange={handleStageChange}
        disabled={disabled || isPending || allowedStages.length === 0}
        placeholder="Chọn stage"
        style={{ minWidth: 150 }}
        options={allowedStages.map((stage) => ({
          value: stage,
          label: (
            <Space>
              <Tag color={STAGE_COLORS[stage]}>{STAGE_LABELS[stage]}</Tag>
            </Space>
          ),
        }))}
      />

      <Modal
        title="Lý do chuyển sang LOST"
        open={isModalOpen}
        onOk={handleLostConfirm}
        onCancel={handleModalCancel}
        okText="Xác nhận"
        cancelText="Hủy"
        confirmLoading={isPending}
        okButtonProps={{ disabled: !reason.trim() }}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <p>Vui lòng nhập lý do khách hàng không chốt:</p>
          <Input.TextArea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ví dụ: Giá cao, đã chọn nha khoa khác, không có nhu cầu..."
            rows={4}
            maxLength={500}
            showCount
          />
        </Space>
      </Modal>
    </>
  );
}
