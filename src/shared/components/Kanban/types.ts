// src/shared/components/Kanban/types.ts
import { ReactNode } from "react";

/**
 * Generic Kanban Board Types
 * Following doc: 121 Generic Kanban Component
 */

/**
 * Validation result for drag operations
 */
export interface ValidationResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Column definition in Kanban board
 */
export interface KanbanColumn {
  key: string; // Unique identifier (matches stage value)
  label: string; // Display name
  color?: string; // Ant Design color token or hex
  icon?: ReactNode; // Optional icon
  maxItems?: number; // Max items to show (default: 200)
  defaultCollapsed?: boolean; // Initial collapsed state (mobile)
}

/**
 * Column metadata for pagination support
 */
export interface ColumnMetadata {
  hasMore: boolean; // Are there more items to load?
  totalCount: number; // Total items in this column
  isLoadingMore?: boolean; // Loading state for "Load More" button
}

/**
 * Main Kanban Board Props
 * Generic type T must extend { id: string }
 */
export interface KanbanBoardProps<T extends { id: string }> {
  // Data (grouped by column for pagination support)
  data: Record<string, T[]>;

  // Column definitions
  columns: KanbanColumn[];

  // Column metadata (pagination, counts)
  columnMetadata?: Record<string, ColumnMetadata>;

  // Callbacks
  onDragEnd?: (itemId: string, fromColumn: string, toColumn: string) => void;
  onLoadMore?: (columnKey: string) => void;
  onCardClick?: (item: T) => void;

  // Validation
  canDrag?: (item: T) => ValidationResult;
  canDrop?: (item: T, toColumn: string) => ValidationResult;

  // Custom renderers
  renderCard: (item: T) => ReactNode;
  getColumnStats?: (
    items: T[],
    columnKey: string
  ) => { count: number; sum?: number; label?: string };

  // Loading states
  isLoading?: boolean;
  isUpdating?: boolean;

  // Accessibility
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

/**
 * Props for KanbanColumn component
 */
export interface KanbanColumnProps<T extends { id: string }> {
  column: KanbanColumn;
  items: T[];
  metadata?: ColumnMetadata;
  onLoadMore?: () => void;
  onCardClick?: (item: T) => void;
  canDrag?: (item: T) => ValidationResult;
  renderCard: (item: T) => ReactNode;
  getStats?: (items: T[]) => { count: number; sum?: number; label?: string };
  isOver?: boolean;
}

/**
 * Props for KanbanCard component
 */
export interface KanbanCardProps {
  id: string;
  isDraggable: boolean;
  isDragging?: boolean;
  validationMessage?: string;
  children: ReactNode;
  onClick?: () => void;
}
