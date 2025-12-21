# 019 Stage History - Sales Pipeline Management

## 📋 Tổng Quan

**Module**: Stage History - Quản lý Giai đoạn Sales Funnel

**Mục đích**: Theo dõi lifecycle của ConsultedService qua các giai đoạn trong sales funnel, phân tích conversion rate, stage velocity, và lý do lost deals để tối ưu sales process.

**Phạm vi**:

- Track stage transitions (ARRIVED → CONSULTING → QUOTED → DEPOSIT → TREATING → COMPLETED)
- Kanban board visualization cho pipeline management
- Conversion funnel analytics
- Lost deals analysis với reason tracking
- Stage duration metrics
- Auto-generated stage changes dựa trên system events

---

## 🎯 Business Goals

### Primary Objectives

1. **Pipeline Visibility**: Visualize tất cả deals đang ở stage nào trong funnel
2. **Conversion Optimization**: Identify bottlenecks và tối ưu conversion rate
3. **Forecasting**: Dự đoán revenue dựa trên pipeline value
4. **Lost Deal Prevention**: Analyze lý do lost để improve strategy
5. **Performance Tracking**: Đo stage velocity và sales efficiency

### Key Metrics

- Conversion rate giữa các stages
- Average time in each stage (stage velocity)
- Win rate (COMPLETED / Total deals)
- Lost rate by stage và reason
- Pipeline value by stage

### Differences vs Sales Activity

| Aspect              | Sales Activity (018)           | Stage History (019)               |
| ------------------- | ------------------------------ | --------------------------------- |
| **Purpose**         | Track contacts/interactions    | Track deal lifecycle              |
| **Frequency**       | High (mỗi contact)             | Low (chỉ khi stage change)        |
| **Who creates**     | Sales staff (manual)           | System auto + Manual              |
| **Typical count**   | 5-20 per service               | 3-7 per service                   |
| **Analytics focus** | Activity volume, response time | Conversion funnel, stage duration |
| **Required reason** | No                             | Yes (for LOST only)               |
| **Editable**        | Yes (with permissions)         | No (immutable audit trail)        |

---

## 🎲 Decision Log

### Architecture Decisions

#### ✅ **Separated from Sales Activity**

- **Rationale**:
  - Different data access patterns (analytics vs operational)
  - Different retention policies (stage history kept forever for compliance)
  - Different write patterns (few writes, many reads for reports)
- **References**: Salesforce OpportunityHistory, HubSpot Property History
- **Trade-off**: More complex schema but better separation of concerns

#### ✅ **Immutable Audit Trail**

- Stage history records CANNOT be edited or deleted (except by DB admin)
- **Rationale**:
  - Compliance (GDPR audit trail for business transactions)
  - Accurate analytics (cannot game the numbers)
  - Trust in reports
- **Exception**: Admin can add "correction" records nếu có sai sót

#### ✅ **Linear Funnel with LOST Side Branch**

```
ARRIVED → CONSULTING → QUOTED → DEPOSIT → TREATING → COMPLETED
    ↓         ↓          ↓         ↓          ↓
  LOST      LOST       LOST      LOST       LOST
```

- Cannot skip stages (must go sequential)
- LOST can happen from any stage
- COMPLETED and LOST are terminal states
- **Rationale**: Enforce process discipline, cleaner analytics

#### ✅ **Denormalized Current Stage**

- `ConsultedService.stage`: String (current stage)
- Auto-updated when StageHistory created
- **Rationale**:
  - Faster Kanban board queries (no JOIN needed)
  - Simpler filters in main table
- **Trade-off**: Potential inconsistency if update fails (mitigated by transaction)

#### ✅ **System vs Manual Stage Changes**

- System auto-creates stages on key events:
  - ConsultedService created → ARRIVED
  - ServiceStatus confirmed → DEPOSIT
  - First TreatmentLog → TREATING
  - Treatment completed → COMPLETED
- Manual changes by sales/admin for other transitions
- **Rationale**: Reduce manual work, ensure consistency

### Database Design

```prisma
model ConsultedService {
  // ... existing fields
  stage String? // Current stage (denormalized)
  // Values: ARRIVED | CONSULTING | QUOTED | DEPOSIT | TREATING | COMPLETED | LOST

  stageHistory StageHistory[]

  @@index([clinicId, stage])
  @@index([stage, consultationDate(sort: Desc)])
}

model StageHistory {
  id String @id @default(uuid())

  // Liên kết
  consultedServiceId String
  consultedService   ConsultedService @relation(...)

  changedById String
  changedBy   Employee @relation(...)

  // Stage Transition
  fromStage String? // null nếu lần đầu set stage
  toStage   String  // Target stage (required)

  // Metadata
  reason    String? // Lý do chuyển stage (bắt buộc khi toStage = LOST)
  changedAt DateTime @default(now()) @db.Timestamptz

  // Indexes cho analytics
  @@index([consultedServiceId, changedAt(sort: Desc)])
  @@index([toStage, changedAt])
  @@index([fromStage, toStage]) // For conversion funnel
}
```

### Stage Definitions

```typescript
// Stage enum
enum Stage {
  ARRIVED = "ARRIVED", // KH đã đến, service được tạo
  CONSULTING = "CONSULTING", // Đang tư vấn với BS/Sale
  QUOTED = "QUOTED", // Đã báo giá, chờ KH quyết định
  DEPOSIT = "DEPOSIT", // KH đã đặt cọc/chốt dịch vụ
  TREATING = "TREATING", // Đang thực hiện điều trị
  COMPLETED = "COMPLETED", // Hoàn thành điều trị
  LOST = "LOST", // KH không chốt/hủy
}

// Allowed transitions
const ALLOWED_TRANSITIONS: Record<Stage, Stage[]> = {
  ARRIVED: ["CONSULTING", "LOST"],
  CONSULTING: ["QUOTED", "LOST"],
  QUOTED: ["DEPOSIT", "LOST"],
  DEPOSIT: ["TREATING", "LOST"],
  TREATING: ["COMPLETED", "LOST"],
  COMPLETED: [], // Terminal state
  LOST: [], // Terminal state
};

// Stage display config
const STAGE_CONFIG = {
  ARRIVED: { label: "Mới đến", color: "default" },
  CONSULTING: { label: "Đang tư vấn", color: "processing" },
  QUOTED: { label: "Đã báo giá", color: "warning" },
  DEPOSIT: { label: "Đã cọc", color: "purple" },
  TREATING: { label: "Điều trị", color: "cyan" },
  COMPLETED: { label: "Hoàn thành", color: "success" },
  LOST: { label: "Đã mất", color: "error" },
};
```

### Permission Rules

**Quyền dựa trên: Role + Service Ownership + Stage Transition Type**

**Roles**: Employee, Admin (2 roles only)

#### CREATE (Stage Transition)

| Transition           | Employee         | Admin | System                     |
| -------------------- | ---------------- | ----- | -------------------------- |
| ARRIVED → CONSULTING | ✅ (own service) | ✅    | ✅ Auto on check-in        |
| CONSULTING → QUOTED  | ✅ (own service) | ✅    | ❌                         |
| QUOTED → DEPOSIT     | ✅ (own service) | ✅    | ✅ Auto on confirm         |
| DEPOSIT → TREATING   | ❌               | ✅    | ✅ Auto on first treatment |
| TREATING → COMPLETED | ❌               | ✅    | ✅ Auto on complete        |
| Any stage → LOST     | ✅ (own service) | ✅    | ❌                         |

**Business Rules**:

- Own service = `consultingSaleId` or `saleOnlineId` = currentUser.id
- Admin can override any transition
- System transitions use `changedById = 'SYSTEM'`

**Validation**:

- Must be valid transition (check ALLOWED_TRANSITIONS)
- Cannot transition from terminal states (COMPLETED, LOST)
- Reason required when toStage = LOST (min 10 chars)
- Reason optional for other transitions

#### UPDATE / DELETE

- ❌ **NO UPDATE OR DELETE** - Immutable audit trail
- Exception: Admin can use DB console để fix critical errors
- Workaround: Create correction record với reason

#### VIEW

| Role     | Permission                                     |
| -------- | ---------------------------------------------- |
| Employee | ✅ View history của services mình phụ trách    |
| Admin    | ✅ View all history (cross-clinic, cross-sale) |

---

## 🖥️ View Structure

### 1. Kanban Board - Sales Pipeline ⭐ PRIMARY VIEW

**Route**: `/consulted-services/kanban` (NEW PAGE)

**Access**: Sales staff + Admin

**Layout**:

```
┌────────────────────────────────────────────────────────────────────────┐
│  🎯 Sales Pipeline - Kanban Board                                      │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ Clinic: [Cơ sở 1▼]  Period: [Tháng này▼]  Sale: [Tất cả▼]      │ │
│  │ View: [○ All Stages]  [○ Active Only]  [○ Show Lost]            │ │
│  └──────────────────────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  Pipeline Summary: 60 deals │ 900M value │ 38% win rate              │
│                                                                        │
│  ┌────────┬─────────┬─────────┬─────────┬─────────┬──────────┬─────┐ │
│  │ARRIVED │CONSULT  │QUOTED   │DEPOSIT  │TREATING │COMPLETED │LOST │ │
│  │   12   │    8    │   15    │   5     │   20    │    45    │  8  │ │
│  │ 180M   │  120M   │  225M   │  75M    │  300M   │   675M   │120M │ │
│  ├────────┼─────────┼─────────┼─────────┼─────────┼──────────┼─────┤ │
│  │┌──────┐│┌──────┐│┌──────┐│┌──────┐│┌──────┐│┌──────┐   │[+]  │ │
│  ││Nguyễn│││Trần  │││Lê Văn│││Phạm  │││Hoàng │││Mai   │   │View │ │
│  ││Văn A │││Thị B │││C     │││Thị D │││Văn E │││Thu F │   │Lost │ │
│  │├──────┤│├──────┤│├──────┤│├──────┤│├──────┤│├──────┤   │     │ │
│  ││Niềng │││Implt │││Bọc sứ│││Tẩy t.│││Cạo v │││Niềng │   │     │ │
│  ││15M   │││20M   │││8M    │││3M    │││1M    │││25M   │   │     │ │
│  │├──────┤│├──────┤│├──────┤│├──────┤│├──────┤│├──────┤   │     │ │
│  ││📅 0d │││📅 3d │││📅 5d │││📅 2d │││📅15d │││✅ Done│   │     │ │
│  ││Mai   │││Hùng  │││Mai   │││Lan   │││Hùng  │││Hùng  │   │     │ │
│  │└──────┘│└──────┘│└──────┘│└──────┘│└──────┘│└──────┘   │     │ │
│  │        │        │        │        │        │          │     │ │
│  │┌──────┐│┌──────┐│┌──────┐│        │  ...   │  ...     │     │ │
│  ││...   │││...   │││...   │││        │        │          │     │ │
│  │└──────┘│└──────┘│└──────┘│        │        │          │     │ │
│  │        │        │        │        │        │          │     │ │
│  │  [+]   │  [+]   │  [+]   │  [+]   │  [+]   │  [+]     │     │ │
│  └────────┴─────────┴─────────┴─────────┴─────────┴──────────┴─────┘ │
│                                                                        │
│  💡 Tips: Kéo card sang cột bên để chuyển giai đoạn                   │
└────────────────────────────────────────────────────────────────────────┘
```

**Features**:

- **Drag & Drop**: Kéo card giữa cột → Open confirm modal → Auto-create StageHistory
- **Column Headers**: Count + Total value + % of pipeline
- **Service Cards**:
  - Customer name
  - Service name + value
  - Days in current stage (📅 icon with color: <3d green, 3-7d yellow, >7d red)
  - Sale staff name
- **Column Actions**: [+] Create new service vào stage đó
- **Filters**:
  - Clinic (multi-select)
  - Period (This week, This month, This quarter, Custom range)
  - Sale staff (multi-select or "My pipeline")
  - View mode: All / Active only (exclude COMPLETED) / Show LOST
- **LOST Column**: Collapsed by default, click [View Lost] to expand
- **Sticky headers**: Fixed khi scroll

**Interactions**:

- Click card → Open ConsultedService detail modal
- Drag card → Open stage transition confirm dialog
- Click [+] → Open CreateConsultedServiceModal với stage pre-filled

**Components**:

- `KanbanBoardView.tsx`: Main page
- `KanbanColumn.tsx`: Individual column
- `KanbanCard.tsx`: Service card (draggable)
- `StageTransitionDialog.tsx`: Confirm modal khi drag

---

### 2. ConsultedServiceTable - Add Stage Column

**Enhancement**: Thêm cột "Stage" vào existing table

**Location**: `/consulted-services` (existing page)

**New Column**:

```
┌────────────────────────────────────────────────────────────────┐
│ Filters: [Dịch vụ▼] [🆕 Stage▼] [Sale▼]           [+ Thêm]   │
├────────────────────────────────────────────────────────────────┤
│ Khách  │Dịch vụ│🆕Stage   │Sale│Ngày TV│Thành tiền│Thao tác│  │
├────────────────────────────────────────────────────────────────┤
│ Nguyễn A│Niềng │[QUOTED]  │Mai │15/12  │15,000,000│ 🔄 ⚙️   │  │
│ Trần B  │Implant│[DEPOSIT] │Hùng│18/12  │20,000,000│ 🔄 ⚙️   │  │
│ Lê C    │Bọc sứ │[TREATING]│Mai │10/12  │8,000,000 │ 🔄 ⚙️   │  │
│ Phạm D  │Tẩy tr │[LOST]    │Lan │05/12  │3,000,000 │ 👁️      │  │
└────────────────────────────────────────────────────────────────┘
```

**Stage Column Details**:

- Display: Tag with color (theo STAGE_CONFIG)
- Width: 120px
- Filter: Multi-select dropdown với all stages
- Sort: By stage order (ARRIVED → COMPLETED, LOST last)
- Click: Open StageHistoryModal (view timeline)
- Icon indicators:
  - 🔄 Can change stage (permission allowed)
  - 👁️ Read-only (terminal state hoặc no permission)

**Actions Column Enhancement**:

- Add "Change Stage" icon (🔄) nếu có permission
- Click → Open StageTransitionModal

---

### 3. Stage Transition Modal

**Trigger**:

- Drag card trong Kanban
- Click stage tag trong table
- Click "Change Stage" action

**Layout**:

```
┌────────────────────────────────────────────────────────────┐
│  Chuyển giai đoạn                                    [✕]  │
├────────────────────────────────────────────────────────────┤
│  Dịch vụ: Niềng Răng Invisalign - 15,000,000đ             │
│  Khách hàng: Nguyễn Văn A - 0912345678                    │
│                                                            │
│  Giai đoạn hiện tại                                        │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  [QUOTED] Đã báo giá                                 │ │
│  │  🕐 Started: 19/12/2025 (2 days ago)                 │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  Chuyển sang *                                             │
│  [○ DEPOSIT - Đã cọc]  [○ LOST - Đã mất]                 │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Lý do chuyển giai đoạn                               │ │
│  │ (Bắt buộc khi chuyển sang LOST)                      │ │
│  │ ┌─────────────────────────────────────────────────┐ │ │
│  │ │ KH đã đặt cọc 50% hôm nay, hẹn bắt đầu điều     │ │ │
│  │ │ trị vào 25/12...                                 │ │ │
│  │ │                                                   │ │ │
│  │ └─────────────────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ──────────────────────────────────────────────────────── │
│                                                            │
│  📜 Lịch sử chuyển giai đoạn                               │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ 🕐 19/12/2025 10:30 - Nguyễn Sale                    │ │
│  │ CONSULTING → QUOTED                                   │ │
│  │ "Đã báo giá chi tiết, KH cân nhắc"                   │ │
│  │ Duration in CONSULTING: 4 days                        │ │
│  ├──────────────────────────────────────────────────────┤ │
│  │ 🕐 15/12/2025 14:00 - 🤖 System                      │ │
│  │ ARRIVED → CONSULTING                                  │ │
│  │ "Customer checked in, started consultation"          │ │
│  │ Duration in ARRIVED: 0 days                           │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│                                  [Hủy]  [Xác nhận]        │
└────────────────────────────────────────────────────────────┘
```

**Validation Rules**:

- Show only allowed transitions (from ALLOWED_TRANSITIONS)
- Disable terminal states options
- Reason required if toStage = LOST
- Reason max 500 chars
- Cannot transition if current user doesn't have permission

**After Submit**:

- Create StageHistory record
- Update ConsultedService.stage
- Refresh Kanban board / Table
- Show success notification with stage name

**Components**:

- `StageTransitionModal.tsx`: Modal container
- `StageTransitionForm.tsx`: Form with validation
- `StageHistoryTimeline.tsx`: History display (reusable)

---

### 4. Customer Detail → Stage History Tab

**Location**: Customer Detail Page → New Tab

**Tab Label**: "Lịch sử giai đoạn" hoặc "Pipeline"

**Layout**:

```
┌────────────────────────────────────────────────────────────┐
│  👤 Nguyễn Văn A - 0912345678                              │
│  ┌────────────────────────────────────────────────────┐   │
│  │ [Thông tin] [Lịch hẹn] [Dịch vụ tư vấn]           │   │
│  │ [Hoạt động sale] [🆕 Lịch sử giai đoạn] [Phiếu thu]│   │
│  └────────────────────────────────────────────────────┘   │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Overview: 3 services tracked │ 2 in progress │ 1 completed│
│                                                            │
│  🦷 Niềng Răng Invisalign - 15,000,000đ                    │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Current: [QUOTED] (2 days)                          │ │
│  │                                                       │ │
│  │  Progress:                                            │ │
│  │  ✅──────▶ ✅──────▶ 🔵──────▶ ⬜──────▶ ⬜──────▶ ⬜ │ │
│  │  ARRIVED   CONSULT   QUOTED    DEPOSIT   TREATING  DONE│ │
│  │  15/12     15/12     19/12                            │ │
│  │  (0d)      (4d)      (current)                        │ │
│  │                                                       │ │
│  │  [Change Stage]  [View Full History]                 │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  🦷 Bọc Răng Sứ - 8,000,000đ                               │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Current: [TREATING] (15 days)                        │ │
│  │                                                       │ │
│  │  Progress:                                            │ │
│  │  ✅──────▶ ✅──────▶ ✅──────▶ ✅──────▶ 🟢──────▶ ⬜ │ │
│  │  ARRIVED   CONSULT   QUOTED    DEPOSIT   TREATING  DONE│ │
│  │  01/11     01/11     05/11     10/11     10/12       │ │
│  │  (0d)      (4d)      (5d)      (30d)     (current)   │ │
│  │                                                       │ │
│  │  [Change Stage]  [View Full History]                 │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  🦷 Cạo Vôi Răng - 500,000đ                                │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Completed: [COMPLETED] ✅                            │ │
│  │  Total time: 7 days (01/12 → 08/12)                  │ │
│  │  [View Full History]                                  │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

**Features**:

- **Overview Stats**: Count by status
- **Per Service Card**:
  - Visual progress bar (horizontal stages)
  - Color-coded: ✅ Done, 🔵 Current, ⬜ Not yet
  - Duration in each stage shown
  - Quick action: Change stage, View full history
- **Expandable History**: Click "View Full History" → Expand inline hoặc modal
- **Empty State**: Nếu chưa có services tracked

**Components**:

- `StageHistoryTab.tsx`: Tab container
- `ServiceStageCard.tsx`: Individual service card
- `StageProgressBar.tsx`: Visual progress indicator
- `StageHistoryDetail.tsx`: Expanded history view

---

### 5. Conversion Funnel Report ⭐ ANALYTICS

**Route**: `/reports/conversion-funnel`

**Access**: Manager + Admin only

**Layout**:

```
┌────────────────────────────────────────────────────────────────┐
│  📊 Conversion Funnel Analysis                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Period: [Tháng 12/2025▼]  Clinic: [Tất cả▼]             │ │
│  │ Compare: [Tháng 11▼]                                     │ │
│  └──────────────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Overall Metrics:                                              │
│  ┌───────────┬───────────┬────────────┬──────────────────┐   │
│  │ Win Rate  │ Avg Time  │ Total Value│ Conversion to   │   │
│  │   38%     │  25 days  │   900M     │ DEPOSIT: 40%    │   │
│  │ ↑ 5%      │ ↓ 3 days  │ ↑ 15%      │ ↑ 8%            │   │
│  └───────────┴───────────┴────────────┴──────────────────┘   │
│                                                                │
│  Funnel Visualization:                                         │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ ARRIVED         100 deals │████████████████████│ 100%   │ │
│  │                  150M      │                    │ 15M avg│ │
│  │                            │  Avg: 0.5 days     │        │ │
│  └──────────────────────────────────────────────────────────┘ │
│         ↓ 90% conversion (10 lost)                             │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ CONSULTING       90 deals │█████████████████  │ 90%    │ │
│  │                  135M      │                    │ 15M avg│ │
│  │                            │  Avg: 3 days       │        │ │
│  └──────────────────────────────────────────────────────────┘ │
│         ↓ 78% conversion (20 lost)                             │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ QUOTED           70 deals │██████████████    │ 70%     │ │
│  │                  105M      │                    │ 15M avg│ │
│  │                            │  Avg: 5 days       │        │ │
│  └──────────────────────────────────────────────────────────┘ │
│         ↓ 57% conversion (30 lost - High drop!)                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ DEPOSIT          40 deals │███████████       │ 40%     │ │
│  │                   60M      │                    │ 15M avg│ │
│  │                            │  Avg: 2 days       │        │ │
│  └──────────────────────────────────────────────────────────┘ │
│         ↓ 95% conversion (2 lost)                              │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ TREATING         38 deals │██████████▌       │ 38%     │ │
│  │                   57M      │                    │ 15M avg│ │
│  │                            │  Avg: 15 days      │        │ │
│  └──────────────────────────────────────────────────────────┘ │
│         ↓ 100% conversion (0 lost)                             │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ COMPLETED        38 deals │██████████▌       │ 38%     │ │
│  │                   57M      │                    │ 15M avg│ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ⚠️ Bottleneck Alert: QUOTED → DEPOSIT conversion thấp (57%)  │
│  💡 Suggestion: Review pricing strategy, improve follow-up     │
│                                                                │
│  [Export Excel] [Drill Down by Sale] [Drill Down by Service]  │
│  [Email Report] [Schedule Report]                              │
└────────────────────────────────────────────────────────────────┘
```

**Features**:

- **Visual Funnel**: Width proportional to count/value
- **Conversion Rates**: Between each stage
- **Average Duration**: Time in each stage
- **Period Comparison**: Compare với period khác (arrows show trend)
- **Bottleneck Detection**: Auto-highlight stage với conversion thấp
- **Drill-down**: Click stage → View deals detail
- **Export**: Excel, PDF
- **Schedule**: Auto-send report weekly/monthly

**Components**:

- `ConversionFunnelView.tsx`: Main page
- `FunnelChart.tsx`: Funnel visualization (Canvas/SVG)
- `FunnelStage.tsx`: Individual stage bar
- `FunnelMetrics.tsx`: Summary metrics cards

---

### 6. Lost Deals Analysis Report

**Route**: `/reports/lost-deals`

**Access**: Manager + Admin only

**Layout**:

```
┌────────────────────────────────────────────────────────────┐
│  📉 Lost Deals Analysis                                    │
│  ┌────────────────────────────────────────────────────┐   │
│  │ Period: [Q4 2025▼]  Clinic: [Tất cả▼]             │   │
│  └────────────────────────────────────────────────────┘   │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Summary:                                                  │
│  ┌──────────────┬───────────────┬──────────────────────┐  │
│  │ Total Lost   │ Lost Value    │ Lost Rate            │  │
│  │    50 deals  │    750M       │    45% (50/110)      │  │
│  │    ↑ 15%     │    ↑ 20%      │    ↑ 5%              │  │
│  └──────────────┴───────────────┴──────────────────────┘  │
│                                                            │
│  By Stage (Where did we lose them?):                       │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Stage      │Count│ %   │Value │Avg Deal│[Actions]   │ │
│  ├──────────────────────────────────────────────────────┤ │
│  │ QUOTED     │ 30  │ 60% │ 450M │ 15M    │[Details]   │ │
│  │ CONSULTING │ 10  │ 20% │ 150M │ 15M    │[Details]   │ │
│  │ DEPOSIT    │  5  │ 10% │  75M │ 15M    │[Details]   │ │
│  │ TREATING   │  5  │ 10% │  75M │ 15M    │[Details]   │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  Top Loss Reasons:                                         │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ 1. Giá cao                                            │ │
│  │    35 deals (70%) - 525M lost                         │ │
│  │    💡 Action: Review pricing, offer installments     │ │
│  │    [View Deals] [Win-back Campaign]                  │ │
│  ├──────────────────────────────────────────────────────┤ │
│  │ 2. Chuyển phòng khám khác                            │ │
│  │    10 deals (20%) - 150M lost                         │ │
│  │    💡 Action: Improve service quality & trust        │ │
│  │    [View Deals] [Request Feedback]                   │ │
│  ├──────────────────────────────────────────────────────┤ │
│  │ 3. Không liên lạc được                               │ │
│  │     5 deals (10%) - 75M lost                          │ │
│  │    💡 Action: Improve contact tracking               │ │
│  │    [View Deals] [Try Alternative Contact]            │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  Recent Lost Deals (Last 30 days):                         │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Date│Customer│Service│Stage  │Reason        │Value  │ │
│  ├──────────────────────────────────────────────────────┤ │
│  │18/12│Nguyễn A│Niềng  │QUOTED │Giá cao       │15M    │ │
│  │15/12│Trần B  │Implant│DEPOSIT│Chuyển PK khác│20M    │ │
│  │10/12│Lê C    │Bọc sứ │CONSULT│Không phù hợp │8M     │ │
│  │ ... │   ...  │  ...  │  ...  │    ...       │ ...   │ │
│  └──────────────────────────────────────────────────────┘ │
│  [Show All (50)]                                           │
│                                                            │
│  [Export Excel] [Create Win-back List] [Email Report]     │
└────────────────────────────────────────────────────────────┘
```

**Features**:

- **Summary Metrics**: Total lost, value, rate
- **Loss by Stage**: Where deals are lost most
- **Reason Analysis**: Top reasons ranked
- **Actionable Insights**: AI suggestions dựa trên patterns
- **Recent Lost**: Detailed list
- **Win-back Tools**: Export contact list, create campaign
- **Trend Comparison**: Compare với previous period

**Components**:

- `LostDealsView.tsx`: Main page
- `LostDealsSummary.tsx`: Metrics cards
- `ReasonChart.tsx`: Pie/bar chart
- `LostDealsTable.tsx`: Detailed table
- `WinBackActions.tsx`: Action buttons

---

## 🔄 System Integration

### Auto-Generated Stage Changes

```typescript
// 1. When ConsultedService is created
// Trigger: POST /api/consulted-services
await createStageHistory({
  consultedServiceId: newService.id,
  fromStage: null,
  toStage: "ARRIVED",
  reason: "Service created - Customer checked in",
  changedById: "SYSTEM",
});

// 2. When ServiceStatus: "Chưa chốt" → "Đã chốt"
// Trigger: Service confirmation
await createStageHistory({
  consultedServiceId: service.id,
  fromStage: service.stage, // Usually QUOTED
  toStage: "DEPOSIT",
  reason: "Service confirmed by customer",
  changedById: "SYSTEM",
});

// 3. When first TreatmentLog is created
// Trigger: POST /api/treatment-logs (if first for this service)
await createStageHistory({
  consultedServiceId: service.id,
  fromStage: "DEPOSIT",
  toStage: "TREATING",
  reason: "First treatment session started",
  changedById: "SYSTEM",
});

// 4. When TreatmentStatus becomes "Hoàn thành"
// Trigger: Last treatment log with status completed
await createStageHistory({
  consultedServiceId: service.id,
  fromStage: "TREATING",
  toStage: "COMPLETED",
  reason: "All treatment sessions completed",
  changedById: "SYSTEM",
});
```

### Integration with Sales Activity

**Relationship**:

```
Timeline View (Combined):
─────────────────────────────────────────────────────
[Stage History - Fewer, milestone events]
│
├─ 20/12 - QUOTED → DEPOSIT (System)
│  └─ "Customer confirmed service"
│
[Sales Activity - Many, daily interactions]
│
├─ 19/12 - Call 15min (Nguyễn Sale)
│  └─ "Customer agreed to deposit"
├─ 18/12 - Zalo (Nguyễn Sale)
│  └─ "Sent detailed quote"
├─ 17/12 - Meet (Nguyễn Sale)
│  └─ "First consultation"
│
[Stage History]
│
├─ 15/12 - ARRIVED → CONSULTING (System)
│  └─ "Customer checked in"
```

**Combined Timeline** (Phase 2 enhancement):

- Merge SalesActivityLog + StageHistory
- Sort by date descending
- Different visual styling (stage changes highlighted)
- Filter: All / Activities only / Stages only

---

## 📡 API Endpoints

### GET /api/stage-history

**Query params**:

- `consultedServiceId`: Filter by service
- `customerId`: Filter by customer (gets all services)
- `fromStage`: Filter by source stage
- `toStage`: Filter by target stage
- `from`, `to`: Date range
- `page`, `pageSize`: Pagination

**Response**:

```typescript
{
  items: StageHistory[],
  total: number,
  page: number,
  pageSize: number
}
```

---

### GET /api/consulted-services/pipeline

**Query params**:

- `clinicId`: Filter by clinic (multi-select)
- `stage`: Filter by stage (multi-select)
- `saleId`: Filter by sale staff
- `from`, `to`: Date range
- `excludeTerminal`: Boolean (exclude COMPLETED/LOST)

**Response**:

```typescript
{
  stages: {
    [stage: string]: {
      count: number,
      totalValue: number,
      deals: ConsultedServiceResponse[]
    }
  },
  summary: {
    totalDeals: number,
    totalValue: number,
    winRate: number
  }
}
```

**Use case**: Kanban board data

---

### POST /api/stage-history

**Body**:

```typescript
{
  consultedServiceId: string,
  fromStage: string, // Current stage from ConsultedService
  toStage: string,   // Target stage (must be valid transition)
  reason?: string,   // Required if toStage = LOST
  changedById: string // Auto-filled from currentUser or 'SYSTEM'
}
```

**Validation**:

- Check ALLOWED_TRANSITIONS
- Check permissions (own service or admin)
- Validate reason if LOST
- Cannot transition from terminal states

**Side effects**:

- Update `ConsultedService.stage = toStage`
- Return created StageHistory

---

### GET /api/reports/conversion-funnel

**Query params**:

- `from`, `to`: Date range (required)
- `clinicId`: Filter by clinic
- `saleId`: Filter by sale staff
- `compareFrom`, `compareTo`: Comparison period

**Response**:

```typescript
{
  period: {
    from: string,
    to: string,
    stages: {
      [stage: string]: {
        count: number,
        totalValue: number,
        avgDuration: number, // days
        conversionFromPrevious: number, // %
        lostCount: number
      }
    },
    overall: {
      totalDeals: number,
      totalValue: number,
      winRate: number,
      avgTimeToClose: number
    }
  },
  comparison?: { /* Same structure */ }
}
```

---

### GET /api/reports/lost-deals

**Query params**:

- `from`, `to`: Date range
- `clinicId`, `saleId`: Filters
- `groupBy`: 'stage' | 'reason' | 'date'

**Response**:

```typescript
{
  summary: {
    totalLost: number,
    totalValue: number,
    lostRate: number
  },
  byStage: {
    [stage: string]: {
      count: number,
      value: number,
      percentage: number
    }
  },
  byReason: {
    reason: string,
    count: number,
    value: number,
    percentage: number,
    topStage: string
  }[],
  recentLost: ConsultedServiceWithStage[]
}
```

---

## 🗄️ Database Queries

### Query 1: Kanban Board Data

```typescript
// Get all services grouped by stage
const pipeline = await prisma.consultedService.groupBy({
  by: ["stage"],
  where: {
    clinicId: { in: selectedClinics },
    consultationDate: { gte: from, lte: to },
    stage: { notIn: excludeTerminal ? ["COMPLETED", "LOST"] : [] },
  },
  _count: true,
  _sum: { finalPrice: true },
});

// Get detailed services for each stage
const services = await prisma.consultedService.findMany({
  where: {
    /* same filters */
  },
  include: {
    customer: { select: { fullName, phone } },
    dentalService: { select: { name } },
    consultingSale: { select: { fullName } },
    saleOnline: { select: { fullName } },
    stageHistory: {
      where: { toStage: consultedService.stage },
      orderBy: { changedAt: "desc" },
      take: 1,
    },
  },
});
```

---

### Query 2: Conversion Funnel Analytics

```typescript
// Get stage transitions count
const transitions = await prisma.$queryRaw`
  SELECT 
    from_stage,
    to_stage,
    COUNT(*) as transition_count,
    SUM(cs.final_price) as total_value,
    AVG(EXTRACT(EPOCH FROM (
      next.changed_at - current.changed_at
    )) / 86400) as avg_duration_days
  FROM stage_history current
  JOIN consulted_service cs ON current.consulted_service_id = cs.id
  LEFT JOIN stage_history next ON (
    next.consulted_service_id = current.consulted_service_id
    AND next.changed_at > current.changed_at
  )
  WHERE current.changed_at >= ${from}
    AND current.changed_at <= ${to}
  GROUP BY from_stage, to_stage
  ORDER BY from_stage, to_stage
`;

// Calculate conversion rates in application code
const funnel = calculateFunnelMetrics(transitions);
```

---

### Query 3: Lost Deals Analysis

```typescript
// Get lost deals with reason
const lostDeals = await prisma.stageHistory.findMany({
  where: {
    toStage: "LOST",
    changedAt: { gte: from, lte: to },
  },
  include: {
    consultedService: {
      include: {
        customer: { select: { fullName, phone } },
        dentalService: { select: { name } },
      },
    },
  },
});

// Group by reason and fromStage
const byReason = groupBy(lostDeals, "reason");
const byStage = groupBy(lostDeals, "fromStage");
```

---

## 🧪 Testing Scenarios

### Manual Testing Checklist

#### Stage Transitions

- [ ] Create service → Auto stage = ARRIVED
- [ ] Manual transition: ARRIVED → CONSULTING (own service)
- [ ] Manual transition: CONSULTING → QUOTED (own service)
- [ ] Confirm service → Auto stage = DEPOSIT
- [ ] Create first treatment log → Auto stage = TREATING
- [ ] Complete treatment → Auto stage = COMPLETED
- [ ] Manual transition to LOST (với reason required)

#### Validation

- [ ] Cannot skip stages (ARRIVED → QUOTED blocked)
- [ ] Cannot transition from COMPLETED
- [ ] Cannot transition from LOST
- [ ] Reason required for LOST
- [ ] Permission denied cho services không phụ trách

#### Kanban Board

- [ ] Display all stages với correct counts
- [ ] Drag & drop opens confirm modal
- [ ] Filters work correctly (clinic, period, sale)
- [ ] Stage column totals accurate
- [ ] LOST column collapsed by default

#### Reports

- [ ] Conversion funnel shows correct %
- [ ] Lost deals grouped by reason correctly
- [ ] Period comparison shows trends
- [ ] Export Excel works

#### Integration

- [ ] Stage changes reflected immediately in table
- [ ] Timeline shows both stages and activities
- [ ] Customer detail tab shows all services

---

## 🚀 Implementation Plan

### Phase 1: Core Functionality (Week 1-2)

- [ ] Database: StageHistory model + migrations
- [ ] Add `stage` column to ConsultedService
- [ ] Backend: CRUD APIs for stage history
- [ ] Stage Transition Modal
- [ ] Add stage column to ConsultedServiceTable
- [ ] Auto-stage changes on key events
- [ ] Permission logic
- [ ] Basic testing

### Phase 2: Kanban Board (Week 3)

- [ ] Kanban Board layout
- [ ] Drag & drop functionality
- [ ] Stage columns with counts
- [ ] Service cards design
- [ ] Filters (clinic, period, sale)
- [ ] LOST column with expand/collapse

### Phase 3: Customer View (Week 3-4)

- [ ] Stage History Tab in Customer Detail
- [ ] Service progress bars
- [ ] Stage timeline display
- [ ] Quick actions (change stage)

### Phase 4: Analytics (Week 4-5)

- [ ] Conversion Funnel Report
- [ ] Lost Deals Analysis
- [ ] Charts and visualizations
- [ ] Export functionality
- [ ] Period comparison

### Phase 5: Polish (Week 5-6)

- [ ] Combined timeline (stages + activities)
- [ ] AI insights for bottlenecks
- [ ] Win-back campaign tools
- [ ] Scheduled reports
- [ ] Mobile responsive

---

## 📝 Notes

### Known Limitations

- Phase 1: Cannot edit/delete stage history (immutable)
- No undo functionality for stage transitions
- No bulk stage updates
- No stage-based notifications (Phase 2)

### Future Enhancements

- **Stage Automation Rules**: Auto-move based on conditions
  - Example: Auto LOST nếu no activity trong 30 days
- **Stage Templates**: Pre-defined stage flows cho từng service type
- **Stage-based Pricing**: Giá thay đổi theo stage
- **Stage SLA**: Alert nếu deal stuck quá lâu ở 1 stage
- **Predictive Analytics**: ML predict likelihood of conversion
- **Integration**: Sync stages với external CRM

### Business Impact

- **Improved Visibility**: Manager biết rõ pipeline status
- **Better Forecasting**: Predict revenue dựa trên stage distribution
- **Faster Decision**: Identify bottlenecks và take action
- **Higher Conversion**: Optimize process dựa trên data
- **Reduced Lost Deals**: Understand và prevent common reasons

### Related Modules

- **Sales Activity** (018): Companion feature for contact tracking
- **Consulted Service** (009): Core entity being tracked
- **Reports** (011): Analytics integration
- **Dashboard** (014): Pipeline metrics overview

---

## 🔗 References

- Prisma Model: `prisma/schema.prisma` → StageHistory, ConsultedService.stage
- Salesforce: Opportunity + OpportunityHistory pattern
- HubSpot: Deal stages + Property history API
- Related Docs:
  - `018 Sale Activity.md` - Companion feature
  - `009 Consulted-Service.md` - Core entity
  - `011 Reports.md` - Analytics framework

---

**Status**: 📝 DRAFT - Ready for implementation  
**Last Updated**: 2025-12-20  
**Author**: AI Assistant  
**Approved By**: _Pending review_
