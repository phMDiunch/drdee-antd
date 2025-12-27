import { ReactNode } from "react";

export interface KanbanColumnDef {
  key: string;
  label: string;
  color?: string;
  icon?: ReactNode;
  description?: string;
  collapsible?: boolean;
}

export interface ColumnMetadata {
  hasMore: boolean;
  totalCount: number;
  isLoadingMore?: boolean;
}

export interface DragDropValidation {
  allowed: boolean;
  reason?: string;
}

export interface KanbanBoardProps<T extends { id: string }> {
  /**
   * Data grouped by column key.
   * Example: { 'NEW': [...], 'WON': [...] }
   */
  data: Record<string, T[]>;
  isLoading?: boolean;
  
  /**
   * Column definitions.
   */
  columns: KanbanColumnDef[];
  
  /**
   * Field to group items by. Usually 'stage'.
   */
  groupByField: keyof T;

  /**
   * Custom card renderer.
   */
  renderCard: (item: T, isDragging: boolean) => ReactNode;
  onCardClick?: (item: T) => void;
  cardClassName?: string;

  /**
   * Drag & Drop handlers.
   */
  onDragEnd: (itemId: string, oldStatus: string, newStatus: string) => void | Promise<void>;
  canDrag?: (item: T) => boolean;
  canDrop?: (item: T, fromColumn: string, toColumn: string) => DragDropValidation;

  /**
   * Pagination (Load More)
   */
  onLoadMore?: (columnKey: string) => void;
  columnMetadata?: Record<string, ColumnMetadata>;
  maxItemsPerColumn?: number;

  /**
   * Statistics
   */
  showColumnStats?: boolean;
  getColumnStats?: (items: T[], columnKey: string) => {
    count: number;
    sum?: number;
    label?: string;
  };

  /**
   * Layout & UI
   */
  columnMinWidth?: number;
  height?: string | number;
  emptyMessage?: string;
  renderEmptyState?: (column: KanbanColumnDef) => ReactNode;
}
