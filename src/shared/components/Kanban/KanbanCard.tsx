"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import styles from "./kanban.module.css";

interface KanbanCardProps {
  id: string;
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({
  id,
  children,
  disabled,
  onClick,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.cardWrapper} ${
        isDragging ? styles.cardDragging : ""
      }`}
      onClick={() => {
        if (!isDragging && onClick) {
          onClick();
        }
      }}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
};
