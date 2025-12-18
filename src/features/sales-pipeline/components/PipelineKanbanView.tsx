// src/features/sales-pipeline/components/PipelineKanbanView.tsx
"use client";

import React, { useMemo, useState } from "react";
import {
  UserAddOutlined,
  MessageOutlined,
  DollarCircleOutlined,
  WalletOutlined,
  MedicineBoxOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { KanbanBoard } from "@/shared/components/Kanban";
import { useNotify } from "@/shared/hooks/useNotify";
import type { KanbanColumnType } from "@/shared/components/Kanban";
import DealCard, { type DealCardData } from "./DealCard";
import { StageChangeModal } from "./StageChangeModal";
import { usePipelineKanban } from "../hooks/usePipelineKanban";
import { useUpdateStage } from "../hooks/useUpdateStage";
import {
  SALES_STAGES,
  STAGE_LABELS,
  STAGE_COLORS,
  STAGE_FLOW,
  type SalesStage,
} from "@/shared/validation/consulted-service.schema";

interface PipelineKanbanViewProps {
  clinicId?: string;
}

/**
 * PipelineKanbanView - Kanban board for Sales Pipeline
 * Displays deals grouped by stage with drag & drop
 */
export default function PipelineKanbanView({
  clinicId,
}: PipelineKanbanViewProps) {
  const notify = useNotify();
  const { data, metadata, isLoading, loadMore, refetch } =
    usePipelineKanban(clinicId);
  const updateStageMutation = useUpdateStage();

  // Modal state for stage changes
  const [stageChangeModal, setStageChangeModal] = useState<{
    itemId: string;
    fromStage: SalesStage;
    toStage: SalesStage;
  } | null>(null);

  // Define columns
  const columns: KanbanColumnType[] = useMemo(() => {
    const stageIcons: Record<SalesStage, React.ReactNode> = {
      ARRIVED: <UserAddOutlined />,
      CONSULTING: <MessageOutlined />,
      QUOTED: <DollarCircleOutlined />,
      DEPOSIT: <WalletOutlined />,
      TREATING: <MedicineBoxOutlined />,
      LOST: <CloseCircleOutlined />,
    };

    return SALES_STAGES.map((stage) => ({
      key: stage,
      label: STAGE_LABELS[stage],
      color: STAGE_COLORS[stage],
      icon: stageIcons[stage],
      maxItems: 200,
    }));
  }, []);

  // Transform data to DealCardData format
  const transformedData = useMemo(() => {
    const result: Record<string, DealCardData[]> = {};

    SALES_STAGES.forEach((stage) => {
      const items = data[stage] || [];
      result[stage] = items.map((item) => {
        // Get latest activity
        const itemWithActivity = item as typeof item & {
          salesActivityLogs?: Array<{
            contactDate: Date | string;
            contactType: string;
            content: string;
          }>;
        };
        const latestActivity = itemWithActivity.salesActivityLogs?.[0];
        const lastContactDate = latestActivity?.contactDate
          ? typeof latestActivity.contactDate === "string"
            ? latestActivity.contactDate
            : latestActivity.contactDate.toISOString()
          : null;
        const lastContactType = latestActivity?.contactType || null;

        // Calculate priority based on business rules
        let priority: "HIGH" | "MEDIUM" | "LOW" = "LOW";
        if (lastContactDate) {
          const daysSinceContact = Math.floor(
            (Date.now() - new Date(lastContactDate).getTime()) /
              (1000 * 60 * 60 * 24)
          );
          if (daysSinceContact >= 7) {
            priority = "HIGH"; // No contact in 7+ days
          } else if (daysSinceContact >= 3) {
            priority = "MEDIUM"; // No contact in 3-6 days
          }
        } else if (item.consultationDate) {
          // No activity logs, check consultation date
          const daysSinceConsultation = Math.floor(
            (Date.now() - new Date(item.consultationDate).getTime()) /
              (1000 * 60 * 60 * 24)
          );
          if (daysSinceConsultation >= 7) {
            priority = "HIGH";
          } else if (daysSinceConsultation >= 3) {
            priority = "MEDIUM";
          }
        }

        return {
          id: item.id,
          customerName: item.customer.fullName,
          customerPhone: item.customer.phone,
          serviceName: item.consultedServiceName,
          value: item.finalPrice,
          consultingSaleName: item.consultingSale?.fullName || null,
          serviceConfirmDate: item.serviceConfirmDate,
          lastContactDate,
          lastContactType,
          priority,
        };
      });
    });

    return result;
  }, [data]);

  // Handle drag end - open modal for stage change
  const handleDragEnd = (
    itemId: string,
    fromColumn: string,
    toColumn: string
  ) => {
    setStageChangeModal({
      itemId,
      fromStage: fromColumn as SalesStage,
      toStage: toColumn as SalesStage,
    });
  };

  // Handle stage change confirmation from modal
  const handleStageChangeConfirm = (reason?: string) => {
    if (!stageChangeModal) return;

    updateStageMutation.mutate(
      {
        consultedServiceId: stageChangeModal.itemId,
        toStage: stageChangeModal.toStage,
        reason,
      },
      {
        onSuccess: () => {
          notify.success(
            `Đã chuyển sang ${STAGE_LABELS[stageChangeModal.toStage]}`
          );
          setStageChangeModal(null);
          refetch();
        },
        onError: (error) => {
          notify.error(error, { fallback: "Không thể chuyển giai đoạn" });
        },
      }
    );
  };

  // Handle modal cancel
  const handleModalCancel = () => {
    setStageChangeModal(null);
  };

  // Validate drag operations
  const canDrag = (item: DealCardData) => {
    // Find item's current stage
    let currentStage: SalesStage | null = null;
    for (const stage of SALES_STAGES) {
      if (transformedData[stage].some((i) => i.id === item.id)) {
        currentStage = stage as SalesStage;
        break;
      }
    }

    if (!currentStage) {
      return {
        allowed: false,
        reason: "Không xác định được giai đoạn hiện tại",
      };
    }

    // Cannot drag from terminal stages
    if (currentStage === "TREATING" || currentStage === "LOST") {
      return {
        allowed: false,
        reason: "Không thể di chuyển từ giai đoạn cuối",
      };
    }

    return { allowed: true };
  };

  const canDrop = (item: DealCardData, toColumn: string) => {
    // Find item's current stage
    let fromStage: SalesStage | null = null;
    for (const stage of SALES_STAGES) {
      if (transformedData[stage].some((i) => i.id === item.id)) {
        fromStage = stage as SalesStage;
        break;
      }
    }

    if (!fromStage) {
      return {
        allowed: false,
        reason: "Không xác định được giai đoạn hiện tại",
      };
    }

    const toStage = toColumn as SalesStage;

    // Check if transition is allowed
    const allowedStages = STAGE_FLOW[fromStage] || [];
    if (!allowedStages.includes(toStage)) {
      return {
        allowed: false,
        reason: `Không thể chuyển từ ${STAGE_LABELS[fromStage]} sang ${STAGE_LABELS[toStage]}`,
      };
    }

    return { allowed: true };
  };

  // Get column statistics
  const getColumnStats = (items: DealCardData[]) => {
    const totalValue = items.reduce((sum, item) => sum + item.value, 0);
    const formattedValue = new Intl.NumberFormat("vi-VN", {
      notation: "compact",
      compactDisplay: "short",
    }).format(totalValue);

    return {
      count: items.length,
      sum: totalValue,
      label: `${formattedValue} VND`,
    };
  };

  return (
    <>
      <KanbanBoard
        data={transformedData}
        columns={columns}
        columnMetadata={metadata}
        onDragEnd={handleDragEnd}
        onLoadMore={(columnKey) => loadMore(columnKey as SalesStage)}
        canDrag={canDrag}
        canDrop={canDrop}
        renderCard={(item) => <DealCard deal={item} />}
        getColumnStats={getColumnStats}
        isLoading={isLoading}
        isUpdating={updateStageMutation.isPending}
        ariaLabel="Sales Pipeline Kanban Board"
      />

      {/* Stage Change Modal */}
      {stageChangeModal && (
        <StageChangeModal
          open={true}
          onCancel={handleModalCancel}
          onSubmit={handleStageChangeConfirm}
          fromStage={stageChangeModal.fromStage}
          toStage={stageChangeModal.toStage}
          isLoading={updateStageMutation.isPending}
        />
      )}
    </>
  );
}
