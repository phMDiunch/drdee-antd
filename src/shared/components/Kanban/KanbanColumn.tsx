"use client";

import React, { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Button, Alert, Tooltip } from "antd";
import { DownOutlined, VerticalLeftOutlined, VerticalRightOutlined } from "@ant-design/icons";
import { KanbanColumnDef, ColumnMetadata } from "./types";
import { KanbanCard } from "./KanbanCard";
import styles from "./kanban.module.css";

interface KanbanColumnProps<T> {
  column: KanbanColumnDef;
  items: T[];
  metadata?: ColumnMetadata;
  renderCard: (item: T, isDragging: boolean) => React.ReactNode;
  onCardClick?: (item: T) => void;
  canDrag?: (item: T) => boolean;
  onLoadMore?: (columnKey: string) => void;
  maxItems?: number;
  showStats?: boolean;
  stats?: { count: number; sum?: number; label?: string };
}

export function KanbanColumn<T extends { id: string }>({
  column,
  items,
  metadata,
  renderCard,
  onCardClick,
  canDrag,
  onLoadMore,
  maxItems = 200,
  showStats,
  stats,
}: KanbanColumnProps<T>) {
  const { setNodeRef, isOver } = useDroppable({ id: column.key });
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => {
    if (column.collapsible !== false) {
      setIsCollapsed(!isCollapsed);
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={`${styles.column} ${isOver ? styles.columnOver : ""} ${isCollapsed ? styles.collapsedColumn : ""}`}
      style={{ borderTopColor: column.color }}
    >
      <div className={styles.columnHeader} onClick={isCollapsed ? toggleCollapse : undefined}>
        <div className={styles.columnTitle}>
          {column.icon && <span>{column.icon}</span>}
          <span>{column.label}</span>
          {column.collapsible !== false && (
            <Tooltip title={isCollapsed ? "Mở rộng" : "Thu gọn"}>
              <Button 
                type="text" 
                size="small" 
                icon={isCollapsed ? <VerticalRightOutlined /> : <VerticalLeftOutlined />} 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCollapse();
                }}
              />
            </Tooltip>
          )}
        </div>
        {!isCollapsed && showStats && stats && (
          <div className={styles.columnStats}>
            {stats.label || `${stats.count} items`}
          </div>
        )}
      </div>

      {!isCollapsed && (
        <div className={styles.columnBody}>
          <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
            {items.map((item) => (
              <KanbanCard 
                key={item.id} 
                id={item.id} 
                disabled={canDrag ? !canDrag(item) : false}
                onClick={() => onCardClick?.(item)}
              >
                {renderCard(item, false)}
              </KanbanCard>
            ))}
          </SortableContext>

          {items.length === 0 && !metadata?.isLoadingMore && (
            <div className={styles.emptyState}>Trống</div>
          )}

          {metadata?.hasMore && items.length < maxItems && (
            <Button
              block
              type="dashed"
              icon={<DownOutlined />}
              onClick={() => onLoadMore?.(column.key)}
              loading={metadata.isLoadingMore}
              className={styles.loadMoreBtn}
            >
              Tải thêm
            </Button>
          )}

          {items.length >= maxItems && (
            <Alert
              type="warning"
              message="Quá nhiều dữ liệu"
              description="Vui lòng lọc để thu hẹp kết quả"
              className={styles.warningAlert}
              showIcon
            />
          )}
        </div>
      )}
    </div>
  );
}
