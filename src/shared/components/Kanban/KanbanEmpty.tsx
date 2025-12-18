// src/shared/components/Kanban/KanbanEmpty.tsx
import React from "react";
import { Empty } from "antd";

interface KanbanEmptyProps {
  message?: string;
}

/**
 * KanbanEmpty - Empty state for columns with no items
 */
export function KanbanEmpty({
  message = "Không có dữ liệu",
}: KanbanEmptyProps) {
  return (
    <div style={{ padding: "32px 16px", textAlign: "center" }}>
      <Empty description={message} image={Empty.PRESENTED_IMAGE_SIMPLE} />
    </div>
  );
}
