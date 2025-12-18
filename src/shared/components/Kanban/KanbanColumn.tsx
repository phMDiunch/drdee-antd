// src/shared/components/Kanban/KanbanColumn.tsx
"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Badge, Button, Space, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { KanbanCard } from "./KanbanCard";
import { KanbanEmpty } from "./KanbanEmpty";
import type { KanbanColumnProps } from "./types";
import styles from "./styles/kanban.module.css";

const { Text } = Typography;

/**
 * KanbanColumn - Single column in Kanban board
 * Provides droppable area and renders cards
 */
export function KanbanColumn<T extends { id: string }>({
  column,
  items,
  metadata,
  onLoadMore,
  onCardClick,
  canDrag,
  renderCard,
  getStats,
  isOver,
}: KanbanColumnProps<T>) {
  const { setNodeRef } = useDroppable({
    id: column.key,
  });

  const stats = getStats ? getStats(items) : { count: items.length };

  const columnClassName = `${styles["kanban-column"]} ${
    isOver ? styles["kanban-column--over"] : ""
  }`;

  return (
    <div ref={setNodeRef} className={columnClassName}>
      {/* Column Header */}
      <div
        className={styles["kanban-column-header"]}
        style={{
          borderTopColor: column.color,
          borderTopWidth: 4,
          borderTopStyle: "solid",
        }}
      >
        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <Space>
            {column.icon}
            <Text strong>{column.label}</Text>
            <Badge count={stats.count} showZero color={column.color} />
          </Space>
          {stats.label && <Text type="secondary">{stats.label}</Text>}
        </Space>
      </div>

      {/* Column Body */}
      <div className={styles["kanban-column-body"]}>
        {items.length === 0 ? (
          <KanbanEmpty />
        ) : (
          <SortableContext
            items={items.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <Space direction="vertical" style={{ width: "100%" }} size="small">
              {items.map((item) => {
                const validation = canDrag ? canDrag(item) : { allowed: true };
                return (
                  <KanbanCard
                    key={item.id}
                    id={item.id}
                    isDraggable={validation.allowed}
                    validationMessage={validation.reason}
                    onClick={onCardClick ? () => onCardClick(item) : undefined}
                  >
                    {renderCard(item)}
                  </KanbanCard>
                );
              })}
            </Space>
          </SortableContext>
        )}

        {/* Load More Button */}
        {metadata?.hasMore && (
          <div style={{ padding: "16px 8px", textAlign: "center" }}>
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={onLoadMore}
              loading={metadata.isLoadingMore}
              block
            >
              Load More ({metadata.totalCount - items.length} còn lại)
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
