// src/shared/components/Kanban/KanbanCard.tsx
"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Tooltip } from "antd";
import { HolderOutlined } from "@ant-design/icons";
import type { KanbanCardProps } from "./types";
import styles from "./styles/kanban.module.css";

/**
 * KanbanCard - Draggable card wrapper
 * Provides drag & drop functionality using @dnd-kit
 */
export function KanbanCard({
  id,
  isDraggable,
  isDragging,
  validationMessage,
  children,
  onClick,
}: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id,
    disabled: !isDraggable,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const cardClassName = `${styles["kanban-card"]} ${
    isDragging || isSortableDragging ? styles["kanban-card--dragging"] : ""
  }`;

  const dragHandle = isDraggable ? (
    <div
      className={styles["kanban-card-drag-handle"]}
      {...listeners}
      {...attributes}
    >
      <HolderOutlined style={{ cursor: "grab" }} />
    </div>
  ) : null;

  const content = (
    <div ref={setNodeRef} style={style} className={cardClassName}>
      {dragHandle}
      <div
        onClick={onClick}
        style={{ cursor: onClick ? "pointer" : "default" }}
      >
        {children}
      </div>
    </div>
  );

  // Show validation message as tooltip if card is not draggable
  if (!isDraggable && validationMessage) {
    return (
      <Tooltip title={validationMessage} placement="top">
        {content}
      </Tooltip>
    );
  }

  return content;
}
