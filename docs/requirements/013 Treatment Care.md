# 🩺 Requirements: Treatment Care (Aftercare) System

> **📋 STATUS: 📝 DRAFT** - Requirements specified, implementation needed  
> **🔗 Implementation**: `src/features/treatment-care/`  
> **🔧 Last Updated**: 2025-12-01 - Refactored version

## 📊 Tham khảo

- Prisma Model: `prisma/schema.prisma` → TreatmentCare
- Call Scripts: `docs/templates/treatment-care-call-scripts.md`
- Related: `012 Treatment Log.md`, `007 Customer.md`

---

## 🎯 Mục Tiêu

- Ghi nhận chăm sóc khách hàng sau điều trị (gọi điện, theo dõi tình trạng)
- Snapshot thông tin điều trị trong ngày (dịch vụ, bác sĩ) để tránh join queries
- Daily workflow: xem danh sách khách cần chăm sóc → gọi điện → ghi lại nội dung + trạng thái
- View lịch sử: grouped by day (35 ngày) hoặc per customer

---

## 🎲 Decision Log

### Database & Business Rules

- ✅ **TreatmentLog Dependency**: Tạo care record yêu cầu khách có TreatmentLog trong `treatmentDate`
- ✅ **Date Fields**:
  - `treatmentDate`: Ngày điều trị (Date-only) - ngày customer có TreatmentLog
  - `careDateTime`: Thời điểm chăm sóc thực tế (DateTime with TZ) - khi staff gọi điện
  - Validate: `careDateTime >= treatmentDate` (cùng ngày hoặc sau)
- ✅ **Snapshot Arrays**: Copy từ TreatmentLogs trong `treatmentDate`
  - `treatmentServiceNames`: Unique service names
  - `treatingDoctorNames`: Unique doctor names (for display)
  - `treatingDoctorIds`: Unique doctor IDs (for filtering)
  - `treatmentClinicIds`: Unique clinic IDs
  - Trade-off: Data có thể stale nếu TreatmentLog bị sửa/xóa sau
- ✅ **Clinic Scope**: `clinicId` determined by priority
  1. `x-clinic-id` header (nếu có)
  2. `careStaff.clinicId`
  3. Error nếu không xác định được
- ✅ **Multiple Records**: 1 customer có thể được chăm sóc nhiều lần trong 1 ngày điều trị
- ✅ **Status Enum**: `TreatmentCareStatus`
  - `STABLE`: Bệnh nhân đã ổn
  - `UNREACHABLE`: Không liên lạc được
  - `NEEDS_FOLLOW_UP`: Cần chăm sóc thêm

### Permission Rules

**Quyền dựa trên: Role + Ownership + Timeline (same VN day) + Clinic**

**Roles**: Employee, Admin (2 roles only)

#### CREATE

| Role     | Permission                  |
| -------- | --------------------------- |
| Employee | ✅ Tạo cho clinic của mình  |
| Admin    | ✅ Tạo cho clinic đang chọn |

**Ràng buộc**: Customer phải có TreatmentLog trong `treatmentDate` (backend 422)

#### UPDATE

- ❌ **NO UPDATE ENDPOINT** (Current implementation - immutable records)
- 💡 **Recommendation**: Add update for `careContent` và `careStatus`
  - Permission: Same as DELETE (own record + same day)

#### DELETE

| Role     | Permission                                                               |
| -------- | ------------------------------------------------------------------------ |
| Admin    | ✅ Xóa tất cả                                                            |
| Employee | ⚠️ Chỉ xóa bản ghi của mình (`careStaffId = employeeId`) trong cùng ngày |
|          | Same VN day check: `careDateTime.date === today.date` (VN TZ)            |

#### VIEW

| Role     | Permission                                  |
| -------- | ------------------------------------------- |
| Employee | ✅ Xem tất cả records trong clinic của mình |
| Admin    | ✅ Xem tất cả records (cross-clinic)        |

### Architecture

- ✅ **Hybrid**: GET qua API Routes + Mutations qua Server Actions
- ✅ **4 Query Modes**:
  1. By Customer: History view (customerId filter)
  2. By Date Range: Grouped by day (default 35 days)
  3. Customers Needing Care: TreatmentLog → TreatmentCare count (by specific date)
  4. Follow-Up Customers: Latest care status = UNREACHABLE or NEEDS_FOLLOW_UP
- ✅ **Filters**: `from`, `to`, `groupBy`, `onlyMine`, `clinicId`, `customerId`
- ✅ **Scope Logic**: Non-admin auto-scope to own clinic

---

## 🖥️ View Structure

### Route & Layout

**Route**: `/treatment-care` (TreatmentCareDailyView)

**Pattern**: Single page với tabs (giống Appointments, Consulted Services)

**Layout**:

```
┌─────────────────────────────────────────────────────────────┐
│  📞 CHĂM SÓC SAU ĐIỀU TRỊ                                  │
│  [< Prev] [📅 Ngày điều trị: DD/MM/YYYY] [Next >]          │
├─────────────────────────────────────────────────────────────┤
│  [Dashboard Stats Widget - 5 KPIs]                         │
├─────────────────────────────────────────────────────────────┤
│  [Tab: Cần gọi hôm nay] [Tab: Lịch sử chăm sóc]            │
├─────────────────────────────────────────────────────────────┤
│  [Filters: Search, Status...] (tab-specific)               │
│  [Table with actions]                                       │
└─────────────────────────────────────────────────────────────┘
```

### Dashboard Widget (5 KPIs)

```
┌─────────────────────────────────────────────────────────────┐
│  📞 CHĂM SÓC SAU ĐIỀU TRỊ - Hôm Nay                        │
├─────────────────────────────────────────────────────────────┤
│  Cần gọi: 45 khách                                         │
│  ├─ Điều trị [ngày chọn]: 32 khách (Table 1)              │
│  └─ Cần follow-up: 13 khách (Table 2 - UNREACHABLE/NEEDS) │
│                                                            │
│  Đã gọi hôm nay: 28 cuộc (62%)                            │
│  ├─ ✅ Ổn định: 22 (78%)                                  │
│  ├─ ⚠️ Cần theo dõi: 4 (14%)                              │
│  └─ ❌ Không liên lạc: 2 (7%)                             │
└─────────────────────────────────────────────────────────────┘
```

**5 KPIs** (Calculated from today's calls only):

1. **Total Needing Care**: Count khách trong Table 1 (ngày chọn) + Table 2 (follow-up)
2. **Called Today Progress**: (Số cuộc gọi hôm nay / Tổng cần gọi) × 100%
3. **STABLE Rate**: (STABLE hôm nay / Tổng gọi hôm nay) × 100%
4. **NEEDS_FOLLOW_UP Rate**: (NEEDS_FOLLOW_UP hôm nay / Tổng gọi hôm nay) × 100%
5. **UNREACHABLE Rate**: (UNREACHABLE hôm nay / Tổng gọi hôm nay) × 100%

**Notes**:

- "Đã gọi hôm nay": Count TreatmentCare records với `careDateTime` = today (VN TZ)
- "Tổng cần gọi": Table 1 customer count + Table 2 customer count (unique)
- Rate calculations: Based on today's call results only

### Tab 1: "Cần gọi hôm nay"

**2 Tables trong cùng 1 tab**:

#### Table 1: Khách điều trị theo ngày (TreatmentCareCustomerTable)

**Behavior**:

- Hiển thị khách điều trị trong ngày được chọn ở header nav (default: yesterday)
- Load data theo ngày được chọn (date navigation controls table data)

**Filters**:

```
[Tìm kiếm (Search: code/name/phone)]
```

**Table Columns**:

| Column           | Width | Description                       |
| ---------------- | ----- | --------------------------------- |
| Mã KH            | 100px | `customerCode`                    |
| Khách hàng       | 180px | `fullName` (Link to detail)       |
| Điện thoại       | 120px | `phone` với icon copy             |
| Dịch vụ điều trị | 280px | `treatmentServiceNames` (tags)    |
| Bác sĩ điều trị  | 200px | `treatingDoctorNames` (comma sep) |
| Số lần CS        | 80px  | `careCount` (Badge số)            |
| Actions          | 100px | Button "Gọi ngay"                 |

**Actions**: Button "Gọi ngay" → Mở `CreateTreatmentCareModal`

#### Table 2: Khách cần follow-up (TreatmentCareFollowUpTable)

**Behavior**:

- Hiển thị khách có lần gọi gần nhất là UNREACHABLE hoặc NEEDS_FOLLOW_UP
- Logic: Lấy record mới nhất per customer, chỉ hiển thị nếu status = UNREACHABLE hoặc NEEDS_FOLLOW_UP

**Example scenarios**:

- Khách A: 06/12 UNREACHABLE → 07/12 STABLE → **Không hiển thị** (lần gọi gần nhất đã ổn)
- Khách B: 09/12 NEEDS_FOLLOW_UP → 13/12 NEEDS_FOLLOW_UP → **Hiển thị** (vẫn cần follow-up)
- Khách C: 10/12 UNREACHABLE → **Hiển thị** (chưa liên lạc được)

**Table Columns**:

| Column           | Width | Description                        |
| ---------------- | ----- | ---------------------------------- |
| Ngày điều trị    | 120px | `treatmentDate` (DD/MM/YYYY)       |
| Khách hàng       | 200px | `{code} - {name}` (Link to detail) |
| Điện thoại       | 120px | `phone` với icon copy              |
| Lần gọi gần nhất | 150px | `lastCareAt` (DD/MM/YYYY HH:mm)    |
| Trạng thái       | 120px | `lastCareStatus` (Tag)             |
| Số lần đã gọi    | 80px  | `totalCareCount` (Badge)           |
| Dịch vụ điều trị | 250px | `treatmentServiceNames` (tags)     |
| Actions          | 100px | Button "Gọi lại"                   |

**Sorting**: `lastCareAt` ASC (cũ nhất trên cùng = ưu tiên cao nhất)

**Actions**: Button "Gọi lại" → Mở `CreateTreatmentCareModal` (với treatmentDate = ngày điều trị gốc)

### Tab 2: "Lịch sử chăm sóc"

**Component**: `TreatmentCareTable` (grouped by day)

**Filters**:

```
[Đến ngày (DatePicker, default: today)] [✓ Chỉ của tôi (Checkbox)]
```

**Table Columns**:

| Column           | Width | Description                        |
| ---------------- | ----- | ---------------------------------- |
| Ngày chăm sóc    | 150px | `careDateTime` (DD/MM/YYYY HH:mm)  |
| Khách hàng       | 200px | `{code} - {name}` (Link to detail) |
| Điện thoại       | 120px | `phone` với icon                   |
| Dịch vụ điều trị | 250px | `treatmentServiceNames` (tags)     |
| Bác sĩ điều trị  | 180px | `treatingDoctorNames` (comma sep)  |
| Nhân viên CS     | 150px | `careStaff.fullName`               |
| Trạng thái       | 120px | `careStatus` (Tag color-coded)     |
| Nội dung         | 200px | `careContent` (truncate 50 chars)  |
| Actions          | 80px  | View, Delete                       |

**Status Colors**:

- STABLE: Green (success) - "Bệnh nhân đã ổn"
- UNREACHABLE: Red (error) - "Không liên lạc được"
- NEEDS_FOLLOW_UP: Orange (warning) - "Cần chăm sóc thêm"

**Grouping**:

- Response grouped by day: `{ day: "YYYY-MM-DD", items: TreatmentCareRecord[] }[]`
- UI: Collapse panels per day
  - Header: `{day} (DD/MM/YYYY) - {count} bản ghi`
  - Content: Table with items
  - Default: Hôm nay expanded, cũ hơn collapsed

---

## 1. ➕ Tạo Bản Ghi Chăm Sóc

### Permissions

- Employee: Clinic của mình + customer có TreatmentLog trong `treatmentDate`
- Admin: Clinic đang chọn + customer có TreatmentLog
- Backend: Validate TreatmentLog exists → 422 với message "Không tìm thấy TreatmentLog cho ngày điều trị"

### UI/UX

**Component**: `CreateTreatmentCareModal` (85% mobile, 65% desktop)

**Context**: Modal mở từ button "Gọi ngay" / "Gọi lại" trong tables

**Form Layout**:

```
Hàng 1: [* Khách hàng (readonly, display)                                      ]
Hàng 2: [* Ngày điều trị (readonly, from table context)                        ]
Hàng 3: [* Thời gian chăm sóc (DatePicker, default: now, disabled)             ]
Hàng 4: [* Trạng thái (Radio Group - 3 options)                                ]
Hàng 5: [* Nội dung chăm sóc (Textarea)                                        ]
Hàng 6: [Kịch bản gọi (Collapse Panel) - See templates/treatment-care-call-scripts.md]
```

**Field Details**:

- "\* Khách hàng": readonly display `{customerCode} - {fullName} - {phone}`
- "\* Ngày điều trị": readonly display từ table context (YYYY-MM-DD)
- "\* Thời gian chăm sóc": DatePicker showTime, default now(), disabled (read-only)
- "\* Trạng thái": Radio vertical
  - "Bệnh nhân đã ổn" (STABLE)
  - "Không liên lạc được" (UNREACHABLE)
  - "Cần chăm sóc thêm" (NEEDS_FOLLOW_UP)
- "\* Nội dung chăm sóc": Textarea rows={4}, placeholder "Ghi chú tình trạng khách hàng sau điều trị..."
- "Kịch bản gọi": Collapse panel với 4 script templates (xem `docs/templates/treatment-care-call-scripts.md`)

### Validation

**Required**:

- `customerId`: UUID (auto-filled từ context, hidden)
- `treatmentDate`: YYYY-MM-DD (auto-filled từ table date selector)
- `careDateTime`: ISO DateTime (default now(), VN TZ)
  - Validate: `careDateTime >= treatmentDate` (backend)
- `careStatus`: Enum (STABLE | UNREACHABLE | NEEDS_FOLLOW_UP)
  - Backend: Coerce uppercase string to enum
- `careContent`: String, min 1 character

**Auto/Hidden**:

- `careStaffId`: from `x-employee-id` header
- `clinicId`: Priority logic (header → careStaff.clinicId)
- Snapshot arrays: Built from TreatmentLogs in `treatmentDate`
  - Query TreatmentLogs: `where: { customerId, treatmentDate: { gte: start, lt: end } }`
  - Collect unique: service names, doctor names/IDs, clinic IDs
  - Empty arrays OK (nếu TreatmentLog không có relation data)
- Audit: `createdById`, `updatedById` = `careStaffId`

### Error Handling

- 400: Missing required fields, `careDateTime < treatmentDate`
- 401: Missing `x-employee-id` header
- 422: No TreatmentLog found for `treatmentDate` - show message "Khách hàng chưa có lịch sử điều trị trong ngày này"

---

## 2. 🗑️ Xoá Bản Ghi

### UI/UX

- Button: Delete icon (actions column)
- Popconfirm:
  - Employee (own record, same day): "Xác nhận xoá?"
  - Employee (not own / old record): Button disabled với tooltip "Chỉ xóa được bản ghi của mình trong ngày"
  - Admin: "Xác nhận xoá bản ghi chăm sóc?"

### Rules

- Hard delete (no archive)
- **Employee**:
  - `careStaffId === employeeId` (ownership check)
  - `careDateTime.date === today.date` (VN TZ same day check)
  - Return 403 nếu vi phạm
- **Admin**: Delete all

---

## 3. 🔍 Xem Chi Tiết Bản Ghi

### UI/UX

**Component**: `TreatmentCareDetailModal` (Read-only)

**Layout**:

```
Thông tin chăm sóc
────────────────────────────────────────
Khách hàng:         {code} - {name} - {phone}
Ngày điều trị:      {treatmentDate}
Thời gian chăm sóc: {careDateTime}
Nhân viên CS:       {careStaff.fullName}
Trạng thái:         {careStatus Tag}

Chi tiết điều trị
────────────────────────────────────────
Dịch vụ điều trị:   {treatmentServiceNames Tags}
Bác sĩ điều trị:    {treatingDoctorNames comma-separated}

Nội dung chăm sóc
────────────────────────────────────────
{careContent full text}

Metadata
────────────────────────────────────────
Tạo bởi:    {createdBy.fullName}
Tạo lúc:    {createdAt}
Sửa bởi:    {updatedBy.fullName}
Sửa lúc:    {updatedAt}
```

**Footer**: Button "Đóng"

---

## 4. 👤 Customer Detail Integration

### Use Case

Trong Customer Detail page, xem toàn bộ lịch sử chăm sóc của khách

### UI/UX

**Component**: `CustomerTreatmentCareHistory` (trong Customer Detail tabs)

**Table Columns** (không cần cột Khách hàng):

| Column           | Width | Description                       |
| ---------------- | ----- | --------------------------------- |
| Ngày điều trị    | 120px | `treatmentDate` (DD/MM/YYYY)      |
| Ngày chăm sóc    | 150px | `careDateTime` (DD/MM/YYYY HH:mm) |
| Dịch vụ điều trị | 250px | `treatmentServiceNames` (tags)    |
| Bác sĩ điều trị  | 180px | `treatingDoctorNames`             |
| Nhân viên CS     | 150px | `careStaff.fullName`              |
| Trạng thái       | 120px | `careStatus` (Tag)                |
| Nội dung         | auto  | `careContent` (full text)         |
| Actions          | 80px  | View, Delete                      |

**Sorting**: `careDateTime` DESC (mới nhất trên cùng)

**No Grouping**: Flat list

---

## 🛠️ Technical Implementation

### API Endpoints

**API Routes (GET only)**:

- `GET /api/v1/treatment-cares?from&to&groupBy&onlyMine&clinicId&customerId` - List/grouped records
- `GET /api/v1/treatment-cares/customers?date&keyword&clinicId` - Customers needing care (Table 1)
- `GET /api/v1/treatment-cares/follow-ups?clinicId` - Customers needing follow-up (Table 2)

**Server Actions (Mutations)**:

- `createTreatmentCareAction(data)` - Tạo mới
- `deleteTreatmentCareAction(id)` - Xóa (hard delete)

### Zod Schemas

**Location**: `src/shared/validation/treatment-care.validation.ts`

**Key Schemas**:

- `CreateTreatmentCareRequestSchema` - Form data validation
- `GetTreatmentCaresQuerySchema` - List query params
- `GetTreatmentCareCustomersQuerySchema` - Table 1 query params
- `GetTreatmentCareFollowUpsQuerySchema` - Table 2 query params
- `TreatmentCareResponseSchema` - API response type
- `TreatmentCareCustomerResponseSchema` - Table 1 response type
- `TreatmentCareFollowUpResponseSchema` - Table 2 response type

### Repository Pattern

**Location**: `src/server/repos/treatment-care.repo.ts`

**Methods**:

- `create(data: TreatmentCareCreateInput)` - Include customer + careStaff relations
- `findById(id)` - Include full relations (+ createdBy, updatedBy)
- `list(where, orderBy)` - Query with filters
- `delete(id)` - Hard delete

**Complex Input Type**:

```typescript
type TreatmentCareCreateInput = CreateTreatmentCareRequest & {
  createdById: string;
  updatedById: string;
  careStaffId: string; // from session
  clinicId: string; // from header or careStaff
  // Snapshots from TreatmentLogs
  treatmentServiceNames: string[];
  treatingDoctorNames: string[];
  treatingDoctorIds: string[];
  treatmentClinicIds: string[];
};
```

### Service Layer

**Location**: `src/server/services/treatment-care.service.ts`

**Key Methods**:

- `create(user, data)` - Validate, build snapshots, create record
- `delete(id, user)` - Permission check, delete
- `list(query, user)` - Clinic scope, date range, groupBy day, onlyMine
- `getCustomersNeedingCare(query, user)` - Table 1 data (aggregate TreatmentLogs)
- `getFollowUpCustomers(query, user)` - Table 2 data (latest status = UNREACHABLE/NEEDS_FOLLOW_UP)
- `buildTreatmentSnapshots(customerId, treatmentDate)` - Helper
- `groupByDay(records)` - Helper

### React Query Hooks

**Location**: `src/features/treatment-care/hooks/`

- `useTreatmentCares(params)` - List/grouped view
- `useTreatmentCareCustomers(params)` - Table 1
- `useTreatmentCareFollowUps(params)` - Table 2
- `useCreateTreatmentCare()` - Create mutation
- `useDeleteTreatmentCare()` - Delete mutation

### Constants

**Location**: `src/features/treatment-care/constants.ts`

- `TREATMENT_CARE_STATUS_OPTIONS` - Radio group options
- `TREATMENT_CARE_STATUS_COLORS` - Tag colors mapping
- `TREATMENT_CARE_STATUS_LABELS` - Display labels
- `CALL_SCRIPTS` - 4 templates (imported from constants/callScripts.ts)

---

## ✅ Implementation Checklist

### Backend

- [ ] Zod schemas (validation types)
- [ ] Repository (create, list, findById, delete)
- [ ] Service (create, delete, list, getCustomersNeedingCare, getFollowUpCustomers, helpers)
- [ ] Server Actions (create, delete)
- [ ] API Routes (3 GET endpoints)

### Frontend

- [ ] Types & API Client
- [ ] React Query Hooks (5 hooks)
- [ ] Constants (status options, colors, labels, call scripts)
- [ ] Components:
  - [ ] CreateTreatmentCareModal (form with call scripts panel)
  - [ ] TreatmentCareCustomerTable (Table 1: date-driven)
  - [ ] TreatmentCareFollowUpTable (Table 2: follow-up customers)
  - [ ] TreatmentCareTable (grouped by day, collapse panels)
  - [ ] TreatmentCareDetailModal (read-only view)
  - [ ] CustomerTreatmentCareHistory (Customer Detail integration)

### Tests

- [ ] Validate TreatmentLog dependency (422 error)
- [ ] Validate careDateTime >= treatmentDate (400 error)
- [ ] Snapshot generation (unique services/doctors/clinics)
- [ ] Delete permission (admin vs employee, same day check)
- [ ] Clinic scope (non-admin auto-scope)
- [ ] Date range default (35 days)
- [ ] GroupBy day logic
- [ ] OnlyMine filter
- [ ] Customer aggregation with careCount
- [ ] Follow-up logic (latest status filtering)

---

## 📝 Notes

### Key Differences from Consulted Service

1. **No Appointment Dependency**: TreatmentCare links to TreatmentLog (via date), not Appointment
2. **Multiple Records**: Same customer can have multiple care records on same treatment date
3. **Immutable**: No update endpoint (current implementation)
4. **Snapshot Focus**: Denormalize treatment data to avoid complex joins
5. **Date Logic**: Two dates (`treatmentDate` vs `careDateTime`) with validation
6. **2-Table View**: Daily view có 2 tables (date-driven + follow-up)

### Future Enhancements

- [ ] Add UPDATE endpoint for editing careContent + careStatus
- [ ] Add bulk create (care for multiple customers at once)
- [ ] Add care reminder notifications
- [ ] Add care statistics/reports
- [ ] Move call scripts to database for UI-based editing

---

**End of Requirements** 📋
