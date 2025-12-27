"use client";

import React, { useState, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Spin } from "antd";
import { useNotify } from "@/shared/hooks/useNotify";
import { KanbanBoardProps } from "./types";
import { KanbanColumn } from "./KanbanColumn";
import styles from "./kanban.module.css";

export function KanbanBoard<T extends { id: string }>({
  data,
  isLoading,
  columns,
  groupByField,
  renderCard,
  onCardClick,
  onDragEnd,
  canDrag,
  canDrop,
  onLoadMore,
  columnMetadata,
  maxItemsPerColumn = 200,
  showColumnStats = false,
  getColumnStats,
  height,
}: KanbanBoardProps<T>) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const notify = useNotify();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeItem = useMemo(() => {
    if (!activeId) return null;
    return Object.values(data)
      .flat()
      .find((item) => item.id === activeId);
  }, [activeId, data]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const itemId = active.id as string;
    const overId = over.id as string;

    // Find current item to get its old status
    const item = Object.values(data)
      .flat()
      .find((d) => d.id === itemId);
    if (!item) return;

    const oldStatus = item[groupByField] as string;

    // The 'over.id' could be a column key OR a card ID
    let newStatus = overId;
    const isOverColumn = columns.some((c) => c.key === overId);

    if (!isOverColumn) {
      // If over a card, find that card's column
      const overItem = Object.values(data)
        .flat()
        .find((d) => d.id === overId);
      if (overItem) {
        newStatus = overItem[groupByField] as string;
      }
    }

    if (oldStatus === newStatus) return;

    // Validation
    if (canDrop) {
      const validation = canDrop(item, oldStatus, newStatus);
      if (!validation.allowed) {
        notify.warning(validation.reason || "Không thể chuyển trạng thái");
        return;
      }
    }

    onDragEnd(itemId, oldStatus, newStatus);
  };

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: "0.5",
        },
      },
    }),
  };

  if (isLoading && Object.values(data).every((arr) => arr.length === 0)) {
    return (
      <div
        className={styles.kanbanBoard}
        style={{ height, justifyContent: "center", alignItems: "center" }}
      >
        <Spin size="large" tip="Đang tải dữ liệu...">
          <div style={{ minHeight: "200px" }} />
        </Spin>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={styles.kanbanBoard} style={{ height }}>
        {columns.map((column) => {
          const items = data[column.key] || [];
          const metadata = columnMetadata?.[column.key];
          const stats =
            showColumnStats && getColumnStats
              ? getColumnStats(items, column.key)
              : undefined;

          return (
            <KanbanColumn
              key={column.key}
              column={column}
              items={items}
              metadata={metadata}
              renderCard={renderCard}
              onCardClick={onCardClick}
              canDrag={canDrag}
              onLoadMore={onLoadMore}
              maxItems={maxItemsPerColumn}
              showStats={showColumnStats}
              stats={stats}
            />
          );
        })}
      </div>

      <DragOverlay dropAnimation={dropAnimation}>
        {activeId && activeItem ? (
          <div className={styles.cardDragging}>
            {renderCard(activeItem as T, true)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
