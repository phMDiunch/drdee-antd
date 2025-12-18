// src/shared/components/Kanban/KanbanBoard.tsx
"use client";

import React, { useState, useMemo } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Card } from "antd";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanSkeleton } from "./KanbanSkeleton";
import type { KanbanBoardProps } from "./types";
import styles from "./styles/kanban.module.css";

/**
 * KanbanBoard - Main Kanban board container
 * Generic component for drag & drop board views
 * Following doc: 121 Generic Kanban Component
 */
export function KanbanBoard<T extends { id: string }>({
  data,
  columns,
  columnMetadata,
  onDragEnd,
  onLoadMore,
  onCardClick,
  canDrag,
  canDrop,
  renderCard,
  getColumnStats,
  isLoading,
  isUpdating,
  ariaLabel = "Kanban Board",
  ariaDescribedBy,
}: KanbanBoardProps<T>) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag
      },
    })
  );

  // Find active item being dragged
  const activeItem = useMemo(() => {
    if (!activeId) return null;
    for (const columnKey in data) {
      const item = data[columnKey].find((item) => item.id === activeId);
      if (item) return item;
    }
    return null;
  }, [activeId, data]);

  // Find source column of active item
  const sourceColumn = useMemo(() => {
    if (!activeItem) return null;
    for (const columnKey in data) {
      if (data[columnKey].some((item) => item.id === activeItem.id)) {
        return columnKey;
      }
    }
    return null;
  }, [activeItem, data]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: { over: { id: string | number } | null }) => {
    setOverId(event.over?.id.toString() || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);
    setOverId(null);

    if (!over || !onDragEnd) return;

    const itemId = active.id as string;
    const toColumn = over.id as string;

    // Skip if dropped on same column
    if (sourceColumn === toColumn) return;

    // Validate drop
    if (canDrop && activeItem) {
      const validation = canDrop(activeItem, toColumn);
      if (!validation.allowed) {
        // Show validation error (handled by parent component)
        return;
      }
    }

    // Call parent handler
    if (sourceColumn) {
      onDragEnd(itemId, sourceColumn, toColumn);
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setOverId(null);
  };

  if (isLoading) {
    return <KanbanSkeleton columnCount={columns.length} />;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div
        className={styles["kanban-board"]}
        role="region"
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        style={{ opacity: isUpdating ? 0.6 : 1 }}
      >
        {columns.map((column) => {
          const items = data[column.key] || [];
          const metadata = columnMetadata?.[column.key];

          return (
            <KanbanColumn
              key={column.key}
              column={column}
              items={items}
              metadata={metadata}
              onLoadMore={onLoadMore ? () => onLoadMore(column.key) : undefined}
              onCardClick={onCardClick}
              canDrag={canDrag}
              renderCard={renderCard}
              getStats={
                getColumnStats
                  ? (items) => getColumnStats(items, column.key)
                  : undefined
              }
              isOver={overId === column.key}
            />
          );
        })}
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeItem ? (
          <Card style={{ width: 280, cursor: "grabbing" }}>
            {renderCard(activeItem)}
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
