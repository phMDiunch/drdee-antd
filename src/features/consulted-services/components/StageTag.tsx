// src/features/consulted-services/components/StageTag.tsx
import { Tag } from "antd";
import {
  STAGE_LABELS,
  STAGE_COLORS,
  type SalesStage,
} from "@/shared/validation/consulted-service.schema";

interface StageTagProps {
  stage: SalesStage | null | undefined;
}

/**
 * Display stage as a colored tag
 */
export default function StageTag({ stage }: StageTagProps) {
  if (!stage) {
    return <Tag>Chưa xác định</Tag>;
  }

  return <Tag color={STAGE_COLORS[stage]}>{STAGE_LABELS[stage]}</Tag>;
}
