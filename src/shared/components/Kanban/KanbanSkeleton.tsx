// src/shared/components/Kanban/KanbanSkeleton.tsx
import React from "react";
import { Card, Skeleton, Space } from "antd";
import styles from "./styles/kanban.module.css";

interface KanbanSkeletonProps {
  columnCount?: number;
  cardsPerColumn?: number;
}

/**
 * KanbanSkeleton - Loading skeleton for Kanban board
 */
export function KanbanSkeleton({
  columnCount = 5,
  cardsPerColumn = 3,
}: KanbanSkeletonProps) {
  return (
    <div className={styles["kanban-board"]}>
      {Array.from({ length: columnCount }).map((_, colIndex) => (
        <div key={colIndex} className={styles["kanban-column"]}>
          <div className={styles["kanban-column-header"]}>
            <Skeleton.Input active size="small" style={{ width: 120 }} />
          </div>
          <div className={styles["kanban-column-body"]}>
            <Space direction="vertical" style={{ width: "100%" }}>
              {Array.from({ length: cardsPerColumn }).map((_, cardIndex) => (
                <Card key={cardIndex} size="small">
                  <Skeleton active paragraph={{ rows: 2 }} />
                </Card>
              ))}
            </Space>
          </div>
        </div>
      ))}
    </div>
  );
}
