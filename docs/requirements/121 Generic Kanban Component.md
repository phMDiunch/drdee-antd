# 🎨 Generic Kanban Component - Reusable UI System

> **Date**: 2025-12-15  
> **Status**: 📝 PROPOSAL - Design Document  
> **Scope**: Generic Kanban component for multiple modules

---

## 📊 OVERVIEW

Xây dựng **Generic Kanban Component** - một hệ thống UI tái sử dụng cho việc hiển thị dữ liệu theo dạng Kanban board.

### ✅ Key Principles

1. **Kanban là "View", không phải "Data"**: Chỉ là UI Layer để hiển thị dữ liệu có sẵn
2. **Dữ liệu gốc**: Vẫn nằm ở các bảng business entity (ConsultedService, LaboOrder, Task, etc.)
3. **⚠️ REQUIRED FIELD**: Tất cả bảng muốn dùng Kanban **PHẢI có trường `stage`** (String)
4. **Generic & Reusable**: Một component, nhiều use cases

### 🎯 Design Goals

- ✅ Reusable cho nhiều modules (Sales, Labo, Treatment, etc.)
- ✅ Type-safe với TypeScript Generics
- ✅ Drag & Drop functionality
- ✅ Responsive design (desktop → tablet → mobile)
- ✅ Performance optimized (pagination, not full dataset loading)
- ✅ Accessible (keyboard navigation, screen reader support)

---

## ⚡ DATA LOADING STRATEGY (Real-world Scale)

### Problem Statement

**Reality Check**: Với 26k Leads và 16k Customers:

- Một cột "NEW" có thể chứa **4,000-5,000 items**
- Một cột "LOST" có thể chứa **10,000+ items**
- **KHÔNG THỂ** load full dataset vào Kanban (browser sẽ crash)

### Solution: 2-Layer Approach

#### Layer 1: UX Strategy (Default Filtering) ✅ PRIORITY 1

**Principle**: Kanban là workspace cho "active work", không phải archive.

**Implementation**:

```typescript
// Sales Pipeline - Only show active stages by default
const ACTIVE_STAGES = ["NEW", "CONTACTED", "CONSULTING", "QUOTED", "WON"];
const ARCHIVE_STAGES = ["LOST"]; // Hidden by default

// Archive column: Render 1 special card
<Card hoverable onClick={() => router.push("/sales/deals?status=LOST")}>
  <Space direction="vertical" align="center">
    <Typography.Title level={2}>15,342</Typography.Title>
    <Typography.Text type="secondary">deals thất bại</Typography.Text>
    <Button type="link">Xem chi tiết →</Button>
  </Space>
</Card>;
```

**Benefits**:

- Board loads instantly (chỉ 5 cột active)
- Archive data accessible qua table view (with pagination)
- Clear mental model: Kanban = active, Table = archive

**Optional Filter**:

```typescript
// Top bar toggle
<Switch
  checkedChildren="Hiển thị Lost"
  unCheckedChildren="Ẩn Lost"
  onChange={setShowArchive}
/>
```

---

#### Layer 2: Load More Pattern (Pagination) ✅ PRIORITY 1

**Why "Load More Button" > Infinite Scroll?**

| Aspect           | Load More Button     | Infinite Scroll                  |
| ---------------- | -------------------- | -------------------------------- |
| **Complexity**   | Low (30 lines code)  | High (scroll tracking, debounce) |
| **User Control** | Explicit             | Automatic (surprise)             |
| **Guidelines**   | ✅ Simple & reliable | ❌ Complex                       |
| **Solo Dev**     | ✅ Dễ maintain       | ❌ Bug surface lớn               |

**Implementation Pattern**:

```typescript
// Backend: consulted-service.repo.ts
export const consultedServiceRepo = {
  async listByStage(params: {
    stage: string;
    clinicId?: string;
    page: number;
    limit: number;
  }) {
    const skip = (params.page - 1) * params.limit;

    const [items, count] = await Promise.all([
      prisma.consultedService.findMany({
        where: { stage: params.stage, clinicId: params.clinicId },
        skip,
        take: params.limit,
        orderBy: { createdAt: "desc" },
        include: { customer: true, dentalService: true },
      }),
      prisma.consultedService.count({
        where: { stage: params.stage, clinicId: params.clinicId },
      }),
    ]);

    return {
      items,
      count,
      hasMore: skip + items.length < count,
    };
  },
};

// Frontend: usePipeline.ts
export function usePipeline(clinicId: string) {
  const [pages, setPages] = useState<Record<string, number>>({
    NEW: 1,
    CONTACTED: 1,
    CONSULTING: 1,
    QUOTED: 1,
    WON: 1,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["pipeline", clinicId, pages],
    queryFn: async () => {
      const promises = ACTIVE_STAGES.map((stage) =>
        getPipelineByStageApi({
          stage,
          clinicId,
          page: pages[stage],
          limit: 20,
        })
      );
      return Promise.all(promises);
    },
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const loadMore = (stage: string) => {
    setPages((prev) => ({ ...prev, [stage]: prev[stage] + 1 }));
  };

  return { data, isLoading, loadMore };
}
```

**KanbanColumn with Load More**:

```typescript
<div className="kanban-column-body">
  {items.map((item) => (
    <KanbanCard key={item.id}>{renderCard(item)}</KanbanCard>
  ))}

  {hasMore && items.length < MAX_ITEMS_PER_COLUMN && (
    <Button
      block
      type="dashed"
      icon={<DownOutlined />}
      onClick={() => onLoadMore(column.key)}
      loading={isLoadingMore}
    >
      Tải thêm 20 deals ({totalCount - items.length} còn lại)
    </Button>
  )}

  {items.length >= MAX_ITEMS_PER_COLUMN && (
    <Alert
      type="warning"
      message="Quá nhiều dữ liệu"
      description="Vui lòng sử dụng bộ lọc để thu hẹp kết quả"
    />
  )}
</div>
```

**Limits**:

- **Initial load**: 20 items/column (5 cột × 20 = 100 items total)
- **Load more**: +20 items mỗi lần click
- **Max per column**: 200 items (sau đó hiện warning, force user dùng filter)

**Benefits**:

- Board luôn mượt (< 200 items/column)
- User control loading
- Backend pagination ready
- Simple implementation

---

#### Layer 3: Virtualization (Phase 2 - Optional) ⏸️

**Not in MVP** because:

- Complexity: @tanstack/react-virtual + @dnd-kit integration phức tạp
- Drag & Drop conflict: Virtualization có thể break drag behavior
- Premature optimization: Load More limit 200 items đã đủ

**When to consider?**

- User feedback: Thường xuyên load > 100 items/column
- Performance metrics: Framerate drops

---

## 🎨 USE CASES

### Use Case 1: Sales Pipeline (ConsultedService)

**Module**: Sales Management  
**Entity**: `ConsultedService`  
**Status Field**: `stage`  
**Columns**: NEW → CONTACTED → CONSULTING → QUOTED → WON / LOST

**Business Logic**:

- Sales team cần visualize deal pipeline
- Drag & drop để update stage
- Filter theo clinic, sale, source, date range
- Statistics: count deals, total revenue per stage

---

### Use Case 2: Labo Orders (Production Workflow)

**Module**: Labo Management  
**Entity**: `LaboOrder`  
**Status Field**: `stage`  
**Columns**: SENT → RECEIVED → IN_PROGRESS → QC → COMPLETED → DELIVERED

**Business Logic**:

- Production team cần track order status
- Drag & drop để update production stage
- Filter theo clinic, labo vendor, date range
- Statistics: count orders, overdue orders per stage

---

### Use Case 3: Treatment Care (Follow-up Workflow)

**Module**: Treatment Care  
**Entity**: `TreatmentLog` or `CustomerFollowUp`  
**Status Field**: `stage`  
**Columns**: SCHEDULED → IN_PROGRESS → COMPLETED → NEED_FOLLOWUP

**Business Logic**:

- Doctors cần track patient treatment progress
- Drag & drop để update treatment status
- Filter theo doctor, clinic, date range
- Statistics: count patients per stage

---

### Use Case 4: Tasks/To-dos (Future)

**Module**: Task Management  
**Entity**: `Task`  
**Status Field**: `stage`  
**Columns**: TODO → IN_PROGRESS → REVIEW → DONE

**Business Logic**:

- Team members cần track personal tasks
- Drag & drop để update task status
- Filter theo assignee, priority, date
- Statistics: count tasks per status

---

## 🏗️ COMPONENT ARCHITECTURE

### File Structure

```
src/shared/components/Kanban/
├── KanbanBoard.tsx           // Main container - handles layout, drag context
├── KanbanColumn.tsx          // Column component - displays items for one status
├── KanbanCard.tsx            // Card wrapper - provides drag & drop functionality
├── KanbanEmpty.tsx           // Empty state for columns with no items
├── KanbanSkeleton.tsx        // Loading skeleton
├── types.ts                  // TypeScript types & interfaces
├── hooks/
│   ├── useDragDrop.ts        // Drag & drop logic (using @dnd-kit)
│   ├── useKanbanLayout.ts    // Responsive layout calculations
│   └── useKanbanFilters.ts   // Generic filtering logic
├── styles/
│   └── kanban.module.css     // Kanban-specific styles
└── README.md                 // Usage documentation & examples
```

---

## 🔧 COMPONENT API

### KanbanBoard Component

**Props:**

```typescript
interface KanbanBoardProps<T extends { id: string }> {
  // Data (grouped by column for pagination support)
  data: Record<string, T[]>; // { 'NEW': [...], 'CONTACTED': [...] }
  isLoading?: boolean; // Initial loading state
  columnMetadata?: Record<
    string,
    {
      hasMore: boolean;
      totalCount: number;
      isLoadingMore?: boolean;
    }
  >; // Pagination metadata per column

  // Column Configuration
  columns: KanbanColumn[]; // Column definitions
  groupByField: keyof T; // Field to group items by (must be 'stage')

  // Card Rendering
  renderCard: (item: T, isDragging: boolean) => React.ReactNode; // Custom card renderer
  onCardClick?: (item: T) => void; // Handle card click (open detail modal)
  cardClassName?: string; // Additional card CSS classes

  // Drag & Drop
  onDragEnd: (
    itemId: string,
    oldStatus: string,
    newStatus: string
  ) => void | Promise<void>;
  canDrag?: (item: T) => boolean; // Permission check for dragging
  canDrop?: (
    item: T,
    fromColumn: string,
    toColumn: string
  ) => {
    allowed: boolean;
    reason?: string; // Error message if not allowed
  }; // Validation with reason

  // Pagination (Load More)
  onLoadMore?: (columnKey: string) => void; // Trigger load more for specific column
  maxItemsPerColumn?: number; // Max items before showing warning (default: 200)

  // Statistics
  showColumnStats?: boolean; // Show count/sum in column headers
  getColumnStats?: (
    items: T[],
    columnKey: string
  ) => {
    count: number;
    sum?: number;
    label?: string;
  };

  // Layout
  columnWidth?: number | "auto"; // Fixed width or auto
  columnMinWidth?: number; // Minimum width (default: 320px)
  columnMaxWidth?: number; // Maximum width (default: 400px)
  height?: number | string; // Board height (default: 'calc(100vh - 200px)')

  // UI Customization
  emptyMessage?: string; // Message when column is empty
  renderEmptyState?: (column: KanbanColumn) => React.ReactNode;
  renderColumnHeader?: (
    column: KanbanColumn,
    items: T[],
    metadata?: ColumnMetadata
  ) => React.ReactNode;

  // Accessibility
  ariaLabel?: string;
  ariaDescribedBy?: string;
}
```

**Column Definition:**

```typescript
interface KanbanColumn {
  key: string; // Unique identifier (matches status value)
  label: string; // Display label (Vietnamese)
  color?: string; // Column header color (Ant Design color)
  icon?: React.ReactNode; // Optional icon
  description?: string; // Tooltip description
  maxItems?: number; // WIP limit (optional)
  collapsible?: boolean; // Can collapse column (mobile)
  defaultCollapsed?: boolean; // Initial collapsed state
}
```

---

### Caching Strategy

**React Query Integration:**

Kanban data caching depends on entity type:

```typescript
// Transactional Data (ConsultedService, LaboOrder, etc.)
const { data, isLoading } = usePipeline();
// Inside hook:
staleTime: 60 * 1000,              // 1 phút
gcTime: 5 * 60 * 1000,             // 5 phút
refetchOnWindowFocus: true,
```

**Optimistic Updates:**

❌ **KHÔNG dùng optimistic updates** theo guidelines - đơn giản, đáng tin cậy:

```typescript
// ✅ Simple pattern - update → refetch
await updateStage(id, newStage);
queryClient.invalidateQueries({ queryKey: ["pipeline"] });
```

---

### Usage Examples

#### Example 1: Sales Pipeline

```typescript
import { KanbanBoard } from "@/shared/components/Kanban";
import { DealCard } from "@/features/consulted-services/components/DealCard";
import { usePipeline } from "@/features/consulted-services/hooks/usePipeline";

const STAGES: KanbanColumn[] = [
  { key: "NEW", label: "Mới", color: "blue", icon: <PlusOutlined /> },
  {
    key: "CONTACTED",
    label: "Đã liên hệ",
    color: "cyan",
    icon: <PhoneOutlined />,
  },
  {
    key: "CONSULTING",
    label: "Đang tư vấn",
    color: "orange",
    icon: <CommentOutlined />,
  },
  {
    key: "QUOTED",
    label: "Đã báo giá",
    color: "purple",
    icon: <DollarOutlined />,
  },
  {
    key: "WON",
    label: "Thành công",
    color: "green",
    icon: <CheckCircleOutlined />,
  },
  {
    key: "LOST",
    label: "Thất bại",
    color: "red",
    icon: <CloseCircleOutlined />,
  },
];

export default function SalesPipelineView() {
  const { user } = useCurrentUser();
  const notify = useNotify();
  const [selectedClinicId, setSelectedClinicId] = useState(user?.clinicId);

  const { data, isLoading, metadata, updateStage, loadMore } = usePipeline({
    clinicId: selectedClinicId,
  });

  const canDragDeal = (deal: ConsultedService) => {
    // Only sales can drag their own deals, admin can drag all
    return user?.role === "admin" || deal.consultingSaleId === user?.employeeId;
  };

  const canDropDeal = (
    deal: ConsultedService,
    fromStage: string,
    toStage: string
  ) => {
    // Rule 1: Cannot move from terminal stages
    if (["WON", "LOST"].includes(fromStage)) {
      return {
        allowed: false,
        reason: "Không thể chuyển từ trạng thái đã kết thúc",
      };
    }

    // Rule 2: Permission check
    const isAdmin = user?.role === "admin";
    const isOwner = deal.consultingSaleId === user?.employeeId;
    if (!isAdmin && !isOwner) {
      return {
        allowed: false,
        reason: "Chỉ sale phụ trách hoặc admin mới được chuyển",
      };
    }

    return { allowed: true };
  };

  const handleDragEnd = async (
    dealId: string,
    oldStage: string,
    newStage: string
  ) => {
    try {
      await updateStage(dealId, newStage);
      notify.success(
        `Deal đã chuyển sang ${STAGES.find((s) => s.key === newStage)?.label}`
      );

      // Simple pattern: refetch after success (no optimistic updates)
      queryClient.invalidateQueries({ queryKey: ["pipeline"] });
    } catch (error) {
      notify.error(error, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR });
    }
  };

  const getStats = (deals: ConsultedService[]) => ({
    count: deals.length,
    sum: deals.reduce((sum, d) => sum + (d.totalAmount || 0), 0),
    label: `${deals.length} deals - ${formatCurrency(sum)}`,
  });

  return (
    <div>
      {/* Clinic Tabs (Admin only) */}
      {user?.role === "admin" && (
        <ClinicTabs value={selectedClinicId} onChange={setSelectedClinicId} />
      )}

      <KanbanBoard
        data={data} // Already grouped: { NEW: [...], CONTACTED: [...] }
        isLoading={isLoading}
        columnMetadata={metadata} // { NEW: { hasMore, totalCount, isLoadingMore } }
        columns={STAGES}
        groupByField="stage"
        renderCard={(deal, isDragging) => (
          <DealCard deal={deal} loading={isDragging} />
        )}
        onCardClick={(deal) => router.push(`/sales/deals/${deal.id}`)}
        onDragEnd={handleDragEnd}
        canDrag={canDragDeal}
        canDrop={canDropDeal}
        onLoadMore={loadMore} // Load more handler
        maxItemsPerColumn={200} // Show warning after 200 items
        showColumnStats
        getColumnStats={getStats}
        columnMinWidth={320}
        ariaLabel="Sales Pipeline Kanban Board"
      />
    </div>
  );
}
```

---

#### Example 2: Labo Orders

```typescript
const LABO_STAGES: KanbanColumn[] = [
  { key: "SENT", label: "Đã gửi mẫu", color: "blue" },
  { key: "RECEIVED", label: "Labo đã nhận", color: "cyan" },
  { key: "IN_PROGRESS", label: "Đang sản xuất", color: "orange" },
  { key: "QC", label: "Kiểm tra chất lượng", color: "purple" },
  { key: "COMPLETED", label: "Hoàn thành", color: "green" },
  { key: "DELIVERED", label: "Đã giao", color: "lime" },
];

export default function LaboOrdersKanbanView() {
  const { data, isLoading, updateStage } = useLaboOrders();

  return (
    <KanbanBoard
      data={data}
      isLoading={isLoading}
      columns={LABO_STAGES}
      groupByField="stage"
      renderCard={(order) => <LaboOrderCard order={order} />}
      onDragEnd={(orderId, oldStage, newStage) =>
        updateStage(orderId, newStage)
      }
      showColumnStats
      getColumnStats={(orders) => ({
        count: orders.length,
        label: `${orders.length} đơn hàng`,
      })}
    />
  );
}
```

---

## 🎯 DETAILED SPECIFICATIONS

### 1. KanbanBoard.tsx

**Responsibilities:**

- Render column layout (horizontal scroll on desktop, collapse on mobile)
- Provide drag & drop context (@dnd-kit/core)
- Handle drag end event and call `onDragEnd` prop
- Display loading skeleton when `isLoading=true`
- Manage column statistics display

**Implementation Details:**

```typescript
import { DndContext, DragEndEvent, DragOverlay } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";

export function KanbanBoard<T extends { id: string }>({
  data,
  columns,
  groupByField,
  renderCard,
  onDragEnd,
  canDrag = () => true,
  canDrop = () => true,
  showColumnStats = false,
  getColumnStats,
  ...otherProps
}: KanbanBoardProps<T>) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  // Group data by stage field
  const groupedData = useMemo(() => {
    const groups: Record<string, T[]> = {};
    columns.forEach((col) => {
      groups[col.key] = data.filter((item) => item[groupByField] === col.key);
    });
    return groups;
  }, [data, columns, groupByField]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Find item across all columns
    const item = Object.values(data)
      .flat()
      .find((d) => d.id === active.id);
    if (!item) return;

    const oldStage = item[groupByField] as string;
    const newStage = over.id as string;

    // Validation with reason
    if (canDrop) {
      const validation = canDrop(item, oldStage, newStage);
      if (!validation.allowed) {
        // Notify user why drop was rejected
        message.warning(validation.reason || "Không thể chuyển");
        return;
      }
    }

    onDragEnd(active.id as string, oldStage, newStage);
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="kanban-board">
        {columns.map((column) => {
          const items = data[column.key] || [];
          const metadata = columnMetadata?.[column.key];

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
              getStats={getColumnStats}
            />
          );
        })}
      </div>

      <DragOverlay>
        {activeId
          ? renderCard(
              Object.values(data)
                .flat()
                .find((d) => d.id === activeId)!,
              true // isDragging
            )
          : null}
      </DragOverlay>
    </DndContext>
  );
}
```

**Styling:**

- Horizontal scroll with snap behavior
- Fixed column widths with minimum 280px
- Sticky column headers
- Smooth drag transitions
- Responsive: Stack columns vertically on mobile (<768px)

---

### 2. KanbanColumn.tsx

**Responsibilities:**

- Render column header with title, icon, stats
- Provide droppable area for @dnd-kit
- Render cards in scrollable container
- Display empty state when no items
- Handle column collapse on mobile

**Implementation:**

```typescript
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

interface KanbanColumnProps<T> {
  column: KanbanColumn;
  items: T[];
  metadata?: {
    hasMore: boolean;
    totalCount: number;
    isLoadingMore?: boolean;
  };
  renderCard: (item: T, isDragging: boolean) => React.ReactNode;
  onCardClick?: (item: T) => void;
  canDrag: (item: T) => boolean;
  onLoadMore?: (columnKey: string) => void;
  maxItems?: number;
  showStats?: boolean;
  getStats?: (
    items: T[],
    columnKey: string
  ) => { count: number; sum?: number; label?: string };
}

export function KanbanColumn<T extends { id: string }>({
  column,
  items,
  renderCard,
  canDrag,
  showStats,
  getStats,
}: KanbanColumnProps<T>) {
  const { setNodeRef, isOver } = useDroppable({ id: column.key });
  const stats = showStats && getStats ? getStats(items) : null;

  return (
    <div
      ref={setNodeRef}
      className={`kanban-column ${isOver ? "kanban-column--over" : ""}`}
      style={{ borderTopColor: column.color }}
    >
      {/* Header */}
      <div className="kanban-column-header">
        <div className="kanban-column-title">
          {column.icon && (
            <span className="kanban-column-icon">{column.icon}</span>
          )}
          <span>{column.label}</span>
        </div>
        {stats && (
          <div className="kanban-column-stats">
            <span className="kanban-column-count">{stats.count}</span>
            {stats.sum !== undefined && (
              <span className="kanban-column-sum">
                {formatCurrency(stats.sum)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Cards */}
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="kanban-column-body">
          {items.length === 0 ? (
            <KanbanEmpty message={`Chưa có ${column.label.toLowerCase()}`} />
          ) : (
            <>
              {items.map((item) => (
                <KanbanCard
                  key={item.id}
                  id={item.id}
                  isDraggable={canDrag(item)}
                  onClick={() => onCardClick?.(item)}
                >
                  {renderCard(item, false)}
                </KanbanCard>
              ))}

              {/* Load More Button */}
              {metadata?.hasMore && items.length < (maxItems || 200) && (
                <Button
                  block
                  type="dashed"
                  icon={<DownOutlined />}
                  onClick={() => onLoadMore?.(column.key)}
                  loading={metadata.isLoadingMore}
                  style={{ marginTop: 8 }}
                >
                  Tải thêm 20 ({metadata.totalCount - items.length} còn lại)
                </Button>
              )}

              {/* Warning when max items reached */}
              {items.length >= (maxItems || 200) && (
                <Alert
                  type="warning"
                  message="Quá nhiều dữ liệu"
                  description="Vui lòng sử dụng bộ lọc để thu hẹp kết quả"
                  style={{ marginTop: 8 }}
                  showIcon
                />
              )}
            </>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
```

**Styling:**

- Fixed width: 320px (configurable)
- Max height: calc(100vh - header - padding)
- Scrollable body with custom scrollbar
- Header sticky on scroll
- Border-top with column color (4px)
- Drop indicator when dragging over

---

### 3. KanbanCard.tsx

**Responsibilities:**

- Wrap custom card content
- Provide draggable functionality
- Show drag handle
- Highlight when being dragged

**Implementation:**

```typescript
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface KanbanCardProps {
  id: string;
  isDraggable: boolean;
  children: React.ReactNode;
}

export function KanbanCard({ id, isDraggable, children }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isDraggable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`kanban-card ${isDragging ? "kanban-card--dragging" : ""}`}
    >
      {isDraggable && (
        <div className="kanban-card-drag-handle" {...attributes} {...listeners}>
          <DragOutlined />
        </div>
      )}
      <div className="kanban-card-content">{children}</div>
    </div>
  );
}
```

**Styling:**

- Card shadow on hover
- Drag handle always visible (small icon)
- Cursor: grab when draggable
- Smooth transform animation
- Margin between cards: 8px

---

## 📦 DEPENDENCIES

### Required Packages

```json
{
  "@dnd-kit/core": "^6.1.0",
  "@dnd-kit/sortable": "^8.0.0",
  "@dnd-kit/utilities": "^3.2.2"
}
```

**Why @dnd-kit?**

- Modern, performant, accessible
- Built for React
- TypeScript support
- Keyboard navigation out of the box
- Better than react-beautiful-dnd (no longer maintained)

**⚠️ APPROVAL REQUIRED:**

- [ ] **Dependency approval needed** - @dnd-kit packages chưa có trong guidelines
- [ ] Review bundle size impact (~50KB minified + gzipped)
- [ ] Test compatibility với Next.js 15 + React 18
- [ ] Confirm no conflicts with existing dependencies

---

## 🎨 STYLING SYSTEM

### CSS Modules

**Note**: Theo GUIDELINES.md, ưu tiên dùng Ant Design tokens trong `ConfigProvider`. CSS Modules chỉ dùng cho styling đặc thù của Kanban (layout, drag states) mà tokens không cover được.

```css
/* kanban.module.css */
/* Chỉ dùng cho Kanban-specific styles: layout, drag animations, scroll behavior */

.kanban-board {
  display: flex;
  gap: 16px;
  padding: 16px;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  min-height: 500px;
}

.kanban-column {
  flex: 0 0 320px;
  min-width: 320px;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  border-radius: 8px;
  border-top: 4px solid var(--column-color, #1890ff);
  scroll-snap-align: start;
}

.kanban-column-header {
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #d9d9d9;
  border-radius: 8px 8px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 10;
}

.kanban-column-body {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.kanban-card {
  position: relative;
  background: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s, transform 0.2s;
}

.kanban-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.kanban-card--dragging {
  opacity: 0.5;
  transform: rotate(3deg);
}

.kanban-card-drag-handle {
  position: absolute;
  top: 8px;
  right: 8px;
  cursor: grab;
  color: #8c8c8c;
  padding: 4px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.05);
  opacity: 0;
  transition: opacity 0.2s;
}

.kanban-card:hover .kanban-card-drag-handle {
  opacity: 1;
}

.kanban-card-drag-handle:active {
  cursor: grabbing;
}

/* Responsive */
@media (max-width: 768px) {
  .kanban-board {
    flex-direction: column;
    overflow-x: hidden;
    overflow-y: auto;
  }

  .kanban-column {
    flex: 0 0 auto;
    max-width: 100%;
  }
}
```

---

## 🧪 TESTING STRATEGY

### Unit Tests

**Files:**

- `KanbanBoard.test.tsx`
- `KanbanColumn.test.tsx`
- `KanbanCard.test.tsx`
- `useDragDrop.test.ts`

**Test Cases:**

```typescript
describe('KanbanBoard', () => {
  it('should render all columns', () => {
    render(<KanbanBoard data={mockData} columns={mockColumns} ... />);
    expect(screen.getByText('Mới')).toBeInTheDocument();
    expect(screen.getByText('Đã liên hệ')).toBeInTheDocument();
  });

  it('should group items by status field', () => {
    const { container } = render(<KanbanBoard ... />);
    const newColumn = container.querySelector('[data-column="NEW"]');
    expect(within(newColumn).getAllByRole('article')).toHaveLength(3);
  });

  it('should call onDragEnd when item is dropped', async () => {
    const onDragEnd = jest.fn();
    render(<KanbanBoard onDragEnd={onDragEnd} ... />);

    // Simulate drag & drop
    const card = screen.getByText('Deal #1');
    fireEvent.dragStart(card);
    fireEvent.drop(screen.getByText('Đã liên hệ'));

    expect(onDragEnd).toHaveBeenCalledWith('deal-1', 'NEW', 'CONTACTED');
  });

  it('should respect canDrag permission', () => {
    const canDrag = jest.fn(() => false);
    render(<KanbanBoard canDrag={canDrag} ... />);

    const card = screen.getByTestId('card-deal-1');
    expect(card).not.toHaveAttribute('draggable');
  });

  it('should show column statistics', () => {
    render(<KanbanBoard showColumnStats getColumnStats={...} />);
    expect(screen.getByText('5 deals - 150,000,000đ')).toBeInTheDocument();
  });
});
```

### Integration Tests

- Test with real data from API
- Test drag & drop updates backend
- Test permission checks
- Test responsive behavior

### Accessibility Tests

- Keyboard navigation (Tab, Arrow keys, Enter, Escape)
- Screen reader announcements
- Focus management
- ARIA labels

---

## ⚠️ KNOWN LIMITATIONS & TRADE-OFFS

### 1. No Optimistic Updates

**Decision**: Follow GUIDELINES.md - Simple & reliable pattern

**Trade-off**:

- ✅ **Pro**: Data always consistent with server, no rollback logic, easier debugging
- ⚠️ **Con**: User sees ~200-500ms delay when dragging (waiting for API response)

**Mitigation**: Show loading spinner on dragged card during API call

**Why acceptable**: Reliability > Speed for business data. False positives (optimistic update succeeds but API fails) would be worse.

---

### 2. Max 200 Items Per Column

**Decision**: Hard limit to prevent performance degradation

**Trade-off**:

- ✅ **Pro**: Board always performs well, forces users to use filters
- ⚠️ **Con**: Cannot see all items in one view

**Mitigation**:

- Archive columns (LOST/JUNK) hidden by default with link to table view
- "Load More" button shows remaining count
- Warning message after 200 items encourages filtering

**Why acceptable**: Kanban is for "active work" visualization, not data warehouse browsing.

---

### 3. No Drag Between Pages

**Decision**: Items only draggable within currently loaded set

**Trade-off**:

- ✅ **Pro**: Simple implementation, no complex state management
- ⚠️ **Con**: Cannot drag item from page 1 to a column showing page 2

**Mitigation**: User can click card → open detail modal → change status manually

**Why acceptable**: Rare use case. Most drag operations happen between adjacent stages with visible items.

---

### 4. No Real-time Updates

**Decision**: React Query refetch on window focus, no WebSocket

**Trade-off**:

- ✅ **Pro**: Simple, no server infrastructure for real-time
- ⚠️ **Con**: User A won't see changes made by User B instantly

**Mitigation**:

- `refetchOnWindowFocus: true` - Auto-refresh when user returns to tab
- Manual refresh button available
- Conflict detection: If User A drags item that User B just updated, show warning

**Why acceptable**: CRM workflows typically not collaborative in real-time. Sales work on their own deals.

---

### 5. Mobile Experience Limited

**Decision**: Responsive design collapses columns vertically, but UX not optimal

**Trade-off**:

- ✅ **Pro**: Works on mobile, no separate implementation
- ⚠️ **Con**: Vertical scrolling + horizontal dragging awkward on small screens

**Mitigation**: Show message "Dùng desktop để trải nghiệm tốt nhất" on mobile

**Why acceptable**: Kanban is primarily desktop workflow. Mobile users can use table view.

---

## 📋 IMPLEMENTATION CHECKLIST (Following GUIDELINES.md)

### Prerequisites

- [ ] **Dependency Approval**: Get approval for @dnd-kit packages
- [ ] **Design Review**: Confirm Kanban UI/UX with stakeholders
- [ ] **Architecture Review**: Confirm generic component approach

### Backend (N/A for this component)

- N/A - Kanban is pure frontend view layer
- Data APIs already handled by feature modules (ConsultedService, LaboOrder, etc.)

### Frontend

**Shared Components:**

- [ ] `src/shared/components/Kanban/types.ts` - TypeScript types
- [ ] `src/shared/components/Kanban/KanbanBoard.tsx` - Main container
- [ ] `src/shared/components/Kanban/KanbanColumn.tsx` - Column component
- [ ] `src/shared/components/Kanban/KanbanCard.tsx` - Card wrapper
- [ ] `src/shared/components/Kanban/KanbanEmpty.tsx` - Empty state
- [ ] `src/shared/components/Kanban/KanbanSkeleton.tsx` - Loading skeleton
- [ ] `src/shared/components/Kanban/styles/kanban.module.css` - Styles
- [ ] `src/shared/components/Kanban/README.md` - Usage docs
- [ ] `src/shared/components/Kanban/index.ts` - Barrel export

**Quality Checks:**

- [ ] TypeScript strict mode (no `any`)
- [ ] Memoize columns with `useMemo`
- [ ] Use `useNotify()` for all notifications (NOT `message.success()`)
- [ ] Error handling with try/catch + `notify.error()`
- [ ] Responsive design (mobile collapse)
- [ ] Accessibility (keyboard navigation, ARIA labels)
- [ ] No console.log/console.error in production code

**Testing:**

- [ ] Unit tests for all components
- [ ] Test drag & drop functionality
- [ ] Test permission checks (canDrag, canDrop)
- [ ] Test responsive behavior
- [ ] Accessibility audit

**Integration (First Use Case):**

- [ ] Create DealCard component in `src/features/consulted-services/components/`
- [ ] Create PipelineView in `src/features/consulted-services/views/`
- [ ] Create usePipeline hook (React Query with proper caching)
- [ ] Add route `/sales/pipeline` in `src/app/(private)/sales/pipeline/`
- [ ] Test with real data
- [ ] Performance testing (100+ cards)

---

## 📋 IMPLEMENTATION PLAN

### Phase 1: Core Components (2 days)

**Day 1: Setup & Base Structure**

- [ ] Install @dnd-kit dependencies
- [ ] Create folder structure
- [ ] Define TypeScript types (`types.ts`)
- [ ] Create KanbanBoard skeleton (no drag & drop yet)
- [ ] Create KanbanColumn skeleton
- [ ] Create KanbanCard skeleton
- [ ] Add basic CSS styling

**Day 2: Drag & Drop + Validation**

- [ ] Integrate @dnd-kit in KanbanBoard
- [ ] Make KanbanCard draggable
- [ ] Make KanbanColumn droppable
- [ ] Add drag overlay
- [ ] Implement canDrop validation with reason
- [ ] Show validation feedback (warning message)
- [ ] Test drag & drop with validation rules

---

### Phase 2: Features & Polish (1 day)

**Day 3: Load More + Polish**

- [ ] Add column statistics display
- [ ] Implement Load More button in KanbanColumn
- [ ] Add columnMetadata support (hasMore, totalCount, isLoadingMore)
- [ ] Add max items warning (Alert component)
- [ ] Add empty state component
- [ ] Add loading skeleton
- [ ] Implement responsive design (mobile collapse)
- [ ] Write unit tests
- [ ] Document usage in README.md

---

### Phase 3: Integration & Examples (1 day)

**Day 4: Backend Integration + Testing**

- [ ] Implement backend pagination API (consultedServiceRepo.listByStage)
- [ ] Create usePipeline hook with page state management
- [ ] Create DealCard component for Sales Pipeline
- [ ] Create PipelineView with Kanban integration
- [ ] Implement validation rules (PIPELINE_RULES)
- [ ] Test with real data (26k leads, 16k customers)
- [ ] Test load more functionality
- [ ] Test max items limit (200/column)
- [ ] Performance testing (measure render time)
- [ ] Accessibility audit
- [ ] Code review & refinements

---

## 🚀 ROLLOUT PLAN

### Milestone 1: Generic Component Ready

- ✅ Core components built and tested
- ✅ Documentation complete with examples
- ✅ Unit tests pass
- 📍 **Deliverable**: Reusable Kanban component in `src/shared/components/Kanban/`

### Milestone 2: First Use Case (Sales Pipeline)

- ✅ Sales Pipeline view using Kanban
- ✅ Drag & drop updates ConsultedService.stage
- ✅ Filters and statistics working
- 📍 **Deliverable**: `/sales/pipeline` route functional

### Milestone 3: Second Use Case (Labo Orders)

- ✅ Labo Orders Kanban view
- ✅ Production workflow visualization
- 📍 **Deliverable**: `/labo/kanban` route functional

### Milestone 4: Documentation & Training

- ✅ Developer guide for adding Kanban to new modules
- ✅ User training materials
- 📍 **Deliverable**: Complete documentation package

---

## 📚 DEVELOPER GUIDE

### How to Add Kanban to a New Module

**Step 1: ⚠️ REQUIRED - Ensure your entity has a `stage` field**

```prisma
model YourEntity {
  id    String @id
  stage String // MUST be named "stage" (not status, state, etc.)
  // ... other fields
}
```

**Step 2: Define your columns**

```typescript
const YOUR_STAGES: KanbanColumn[] = [
  { key: "TODO", label: "Cần làm", color: "blue" },
  { key: "DOING", label: "Đang làm", color: "orange" },
  { key: "DONE", label: "Hoàn thành", color: "green" },
];
```

**Step 3: Create a card component**

```typescript
// YourEntityCard.tsx
export function YourEntityCard({ entity }: { entity: YourEntity }) {
  return (
    <Card size="small">
      <h4>{entity.name}</h4>
      <p>{entity.description}</p>
      <Tag>{entity.stage}</Tag>
    </Card>
  );
}
```

**Step 4: Use KanbanBoard**

```typescript
import { KanbanBoard } from "@/shared/components/Kanban";

export default function YourKanbanView() {
  const { data, updateStage } = useYourEntities();

  return (
    <KanbanBoard
      data={data}
      columns={YOUR_STAGES}
      groupByField="stage"
      renderCard={(entity) => <YourEntityCard entity={entity} />}
      onDragEnd={(id, oldStage, newStage) => updateStage(id, newStage)}
    />
  );
}
```

That's it! ✅

---

## 🎯 SUCCESS CRITERIA

### Guidelines Compliance

- ✅ Follow GUIDELINES.md naming conventions
- ✅ Use `useNotify()` for all notifications (NOT `message.success()`)
- ✅ TypeScript strict mode (no `any`)
- ✅ Proper error handling with try/catch
- ✅ Memoize expensive computations (columns, grouped data)
- ✅ No console.log/console.error
- ✅ Barrel exports (`index.ts`)
- ✅ CSS Modules for styling (prefer Ant Design tokens)

### Functional Requirements

- ✅ Can display any entity type with status field
- ✅ Drag & drop works smoothly (no lag, no glitches)
- ✅ Permissions respected (canDrag, canDrop)
- ✅ Column statistics accurate
- ✅ Responsive on all devices
- ✅ Keyboard accessible

### Non-Functional Requirements

- ✅ Performance: Handle 500+ cards without lag
- ✅ Bundle size: < 50KB (minified + gzipped)
- ✅ Lighthouse score: 90+ (Performance, Accessibility)
- ✅ Test coverage: 80%+
- ✅ Zero TypeScript errors

### User Experience

- ✅ Intuitive drag & drop
- ✅ Visual feedback (hover, drag, drop indicators)
- ✅ Smooth animations
- ✅ Clear empty states
- ✅ Helpful error messages

---

## 🔮 FUTURE ENHANCEMENTS (Phase 2)

### Nice-to-Have Features

1. **Virtualization**: Use @tanstack/react-virtual for 1000+ cards
2. **Column Customization**: Let users reorder, hide/show columns
3. **WIP Limits**: Prevent dropping if column reaches max items
4. **Swimlanes**: Group cards by additional dimension (e.g., by clinic)
5. **Card Templates**: Predefined card layouts for common use cases
6. **Export**: Export board as image (PNG) or PDF
7. **Undo/Redo**: History stack for drag & drop actions
8. **Multi-select**: Drag multiple cards at once
9. **Card Search**: Inline search within board
10. **Auto-scroll**: When dragging near edges

### Configuration UI (Future)

- Admin panel to define custom workflows
- Store pipeline definitions in database
- Allow users to create their own board templates

---

## 📞 READY TO START?

**Estimated Time**: 4-5 days full-time

**Dependencies**:

- ⚠️ @dnd-kit packages approval required
- Backend pagination API ready (consultedServiceRepo)
- Validation rules defined per feature

**Team**: 1 frontend developer

**Priority**: 🔥 HIGH - Needed for Sales Pipeline (Phase 3 of main plan)

**Deliverables**:

- Generic Kanban component with load more
- Sales Pipeline implementation with real data
- Documentation & usage examples
- Known limitations documented

---

**Confirm to proceed with Phase 1?** 🚀
