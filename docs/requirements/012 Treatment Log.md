# 🧩 Requirements: Treatment Log Management System

> **📋 STATUS: ✅ IMPLEMENTED** - Backend + Frontend đã hoàn thành  
> **🔗 Implementation**: `src/features/treatment-logs/`  
> **🔧 Last Updated**: 2025-11-12 - Cập nhật theo implementation thực tế

## 📊 Tham khảo

- Prisma Model: `prisma/schema.prisma` → TreatmentLog
- Old Spec: `docs/Dự án cũ/12. treatment-log/treatment-log-refactor-requirements.md`, `treatment-log-spec.md`
- Related: `009 Consulted-Service.md`, `008 Appointment.md`, `007 Customer.md`
- Guidelines: `docs/GUIDELINES.md` → Response Schema Nested Structure

## 🎯 Mục Tiêu

- ✅ Ghi nhận buổi điều trị cho từng dịch vụ đã chốt (serviceStatus = "Đã chốt")
- ✅ Quản lý nội dung điều trị, kế hoạch bước tiếp theo, trạng thái điều trị
- ✅ Gắn nhân sự: bác sĩ điều trị (required), điều dưỡng 1/2 (optional)
- ✅ Hỗ trợ 2 chế độ xem: "Theo ngày hẹn" (by-date) và "Theo dịch vụ" (by-service)
- ✅ Permission system: Admin full access, Employee own records only
- ✅ Performance optimization: useMemo + useCallback patterns
- ❌ Tracking ảnh và X-quang (schema sẵn, UI tương lai - Phase 2)

---

## 🎲 Decision Log

### Database & Business Rules

- ✅ **Consulted Service Dependency**: Tạo treatment log yêu cầu service đã chốt (serviceStatus = "Đã chốt")
- ✅ **Appointment Required**: MUST gắn với appointment đã check-in (appointmentId required, not nullable)
  - Mỗi treatment log phải thuộc về một buổi hẹn cụ thể
  - Appointment phải có `status IN ("Đã đến", "Đến đột xuất")` và `checkInTime != null`
- ✅ **Customer Derivation**: Backend auto-derive `customerId` từ `consultedService.customerId`
- ✅ **Clinic Derivation**: Priority order
  1. `appointment.clinicId` (primary source - always available vì appointmentId required)
  2. Payload `clinicId` (override nếu có - rare case)
  3. Fallback: `consultedService.clinicId` (nếu 2 nguồn trên không có)
- ✅ **Treatment Status Flow**: "Chưa điều trị" → "Đang điều trị" → "Hoàn thành"
  - Không enforce strict flow: User có thể set bất kỳ status nào
  - Frontend suggest flow nhưng không validate
  - Default khi tạo mới: "Đang điều trị"
- ✅ **AUTO-SYNC ConsultedService.treatmentStatus** ⭐ NEW
  - **Logic**: Status của dịch vụ = Status của treatment log **MỚI NHẤT** (by treatmentDate DESC)
  - **No logs** → "Chưa điều trị"
  - **Has logs** → Lấy status từ log có `treatmentDate` lớn nhất
  - **Backend**: Tự động update sau create/update/delete treatment log
  - **Frontend**: Invalidate `["consulted-services"]` query → UI update ngay lập tức
  - **Single Source of Truth**: `TREATMENT_STATUSES` trong `treatment-log.schema.ts`
  - **UI**: ConsultedService.treatmentStatus hiển thị read-only (Tag), không thể edit thủ công
- ✅ **DateTime Storage**: `treatmentDate` sử dụng `@db.Timestamptz` (default now())
  - Format hiển thị: `DD/MM/YYYY HH:mm`
  - Backend: Store as Date object
- ✅ **Media Fields**: `imageUrls`, `xrayUrls` (String[]) sẵn trong schema
  - Default: `[]`
  - UI upload: Tương lai (phase 2)

### Repository Pattern

```typescript
// Complex + Server Fields pattern
type TreatmentLogCreateInput = CreateTreatmentLogRequest & {
  createdById: string;
  updatedById: string;
  customerId: string; // derived from consultedService
  appointmentId: string; // REQUIRED - must exist and be checked-in
  clinicId: string | null; // derived by priority order (appointment.clinicId primary)
  imageUrls: string[]; // default []
  xrayUrls: string[]; // default []
};
```

### Nested Structure Pattern

✅ **TreatmentLogResponseSchema** uses nested objects:

```typescript
export const TreatmentLogResponseSchema = z.object({
  customer: z.object({
    id: z.string(),
    fullName: z.string(),
    customerCode: z.string().nullable(),
  }),
  consultedService: z.object({
    id: z.string(),
    consultedServiceName: z.string(),
    toothPosition: z.string().nullable(),
    confirmedAt: z.string().datetime(),
    treatingDoctor: z
      .object({
        id: z.string(),
        fullName: z.string(),
      })
      .nullable(),
  }),
  appointment: z.object({
    id: z.string(),
    appointmentDateTime: z.string().datetime(),
    status: z.string(),
  }), // NOT nullable - appointment is REQUIRED
  dentist: z.object({
    id: z.string(),
    fullName: z.string(),
  }),
  assistant1: z
    .object({
      id: z.string(),
      fullName: z.string(),
    })
    .nullable(),
  assistant2: z
    .object({
      id: z.string(),
      fullName: z.string(),
    })
    .nullable(),
  createdBy: z.object({
    id: z.string(),
    fullName: z.string(),
  }),
  // ... other fields
});
```

### Permission Rules

**Quyền dựa trên: Role (Admin/Employee) + Clinic**

#### CREATE

- Employee/Admin: Tạo cho clinic của mình
- **Ràng buộc**:
  - Service phải đã chốt (serviceStatus = "Đã chốt")
  - **Appointment required**: Phải gắn với appointment đã check-in
- **Validation**: Appointment must have `checkInTime != null` và `status IN ("Đã đến", "Đến đột xuất")`

#### UPDATE

| User Type | Permission                                                     |
| --------- | -------------------------------------------------------------- |
| Admin     | ✅ Sửa tất cả                                                  |
| Employee  | ⚠️ Chỉ sửa records của chính mình (createdById = current user) |

**Validation Logic**:

- Employee: Backend check `treatmentLog.createdById === currentUser.id` → 403 nếu không match
- Admin: Không có restriction

#### DELETE

| User Type | Permission                                                     |
| --------- | -------------------------------------------------------------- |
| Admin     | ✅ Xóa tất cả                                                  |
| Employee  | ⚠️ Chỉ xóa records của chính mình (createdById = current user) |

**Validation Logic**:

- Employee: Backend check `treatmentLog.createdById === currentUser.id` → 403 nếu không match
- Admin: Không có restriction
- Popconfirm UI: Show different message based on role/ownership

#### VIEW

- Employee: Xem tất cả treatment logs của customer (trong Customer Detail)
- Admin: Xem tất cả treatment logs của customer (trong Customer Detail)

**Note**: VIEW permission không có clinic scope restriction vì:

- Treatment logs được view trong context của Customer Detail
- Khi user có quyền xem Customer Detail → có quyền xem tất cả treatment logs của customer đó
- Không cần filter theo clinic vì đây là customer-centric view (cross-clinic)

### Architecture

- ✅ **Hybrid**: GET qua API Routes + Mutations qua Server Actions
- ✅ **Modal Pattern**: 1 modal `TreatmentLogModal` với mode (add/edit)
- ✅ **View Modes**: 2 chế độ xem (by-date/by-service) với Switch toggle
- ✅ **Checked-in Appointments**: API `/api/v1/appointments/checked-in?customerId=`
- ✅ **Components**: Table-based view (không dùng Timeline)
- ✅ **Permission Module**: Centralized `treatment-log.permissions.ts`
- ✅ **Performance**: useMemo cho groupByService(), useCallback cho handlers
- ❌ **No Cross-Clinic**: Treatment log thuộc 1 clinic cố định

---

## 1. ➕ Tạo Treatment Log

### Permissions

- Employee: Clinic của mình + service đã chốt + appointment đã check-in
- Admin: Clinic đang chọn + service đã chốt + appointment đã check-in
- Frontend: Disable nếu không có service đã chốt hoặc không có appointment
- Backend:
  - Validate service đã chốt → 422 với `{ serviceNotConfirmed: true }`
  - Validate appointment exists và đã check-in → 422 với `{ appointmentNotCheckedIn: true }`

### UI/UX

**Component**: `TreatmentLogModal` (80% mobile, 70% desktop)

**Form Layout** (THỰC TẾ ĐÃ IMPLEMENT):

```
Hàng 1: [* Dịch vụ điều trị (Select)                                                   ]
Hàng 2: [* Nội dung điều trị (Textarea, 4 rows)                                        ]
Hàng 3: [Nội dung kế tiếp (Textarea, 3 rows, optional)                                 ]
Hàng 4: [* Bác sĩ điều trị (Select col-8)] [Điều dưỡng 1 (Select col-8)] [Điều dưỡng 2 (Select col-8)]
Hàng 5: [* Trạng thái điều trị (Radio Group col-12)] [* Chi nhánh (Select col-12)      ]
```

**Notes**:

- "\* Dịch vụ nha khoa": required với red asterisk, Select từ consultedServices đã chốt
  - Placeholder: "Chọn dịch vụ điều trị"
- "\* Nội dung điều trị": required, Textarea (full width, 4 rows)
  - Placeholder: "Mô tả chi tiết quá trình điều trị..."
- "Kế hoạch bước tiếp theo": optional, Textarea (full width, 3 rows)
  - Placeholder: "Ghi chú cho buổi hẹn tiếp theo (nếu có)..."
- "\* Bác sĩ điều trị": required, Select từ working employees (col-8)
  - Default: current employee
  - Display format: "Phạm Minh Đức"
- "Điều dưỡng 1": optional, Select từ working employees (col-8)
  - Placeholder: "Chọn điều dưỡng 1"
- "Điều dưỡng 2": optional, Select từ working employees (col-8)
  - Placeholder: "Chọn điều dưỡng 2"
- "\* Trạng thái điều trị": required, Radio Group với 3 options (col-12)
  - Options: "Chưa điều trị", "Đang điều trị" (default), "Hoàn thành"
  - Display format: Horizontal radio buttons
- "\* Chi nhánh": required, Select (col-12)
  - **Default**: Auto-filled từ `appointment.clinicId` (mặc định của appointment)
  - Display format: "450MK" (mã chi nhánh)
  - User có thể override nếu cần
- **appointmentId**: Hidden field, auto-filled từ context (by-date view Card header)
  - Modal CHỈ được mở từ by-date view (có appointmentId context)
  - by-service view KHÔNG có button "Thêm điều trị"

### Validation

**Required**:

- `consultedServiceId`: UUID (Select từ consultedServices đã chốt)
  - Filter: `serviceStatus = "Đã chốt"`
  - Display: `"{consultedServiceName} - {toothPosition} - {confirmedAt (DD/MM/YY)}"`
  - Note: Vị trí răng và ngày chốt cần thiết để phân biệt các dịch vụ giống nhau
- `appointmentId`: UUID (hidden, auto-filled từ context)
  - **REQUIRED** - Must be provided from by-date view Card
  - Validation: Appointment must exist, be checked-in, thuộc cùng customer
- `treatmentNotes`: String (textarea, 4 rows, min 1 character)
  - Placeholder: "Mô tả chi tiết quá trình điều trị..."
- `dentistId`: UUID (Select từ working employees)
  - Default: current employee ID
  - Display: `"{fullName}"`

**Optional**:

- `nextStepNotes`: String (textarea, 3 rows)
  - Placeholder: "Ghi chú cho buổi hẹn tiếp theo..."
- `treatmentStatus`: String (radio group)
  - Options: "Chưa điều trị", "Đang điều trị" (default), "Hoàn thành"
- `assistant1Id`, `assistant2Id`: UUID (Select từ working employees)
  - Placeholder: "Chọn điều dưỡng 1", "Chọn điều dưỡng 2"
  - Display: `"{fullName}"`

**Auto/Hidden**:

- `customerId`: Auto-derived từ consultedService.customerId (backend)
- `clinicId`: Auto-derived từ appointment.clinicId (primary source)
- `treatmentDate`: Auto-set = appointment.appointmentDateTime (hoặc now() nếu không có)
- `imageUrls`: [] (default)
- `xrayUrls`: [] (default)
- `createdById`: Current employee ID
- `updatedById`: Current employee ID

### Consulted Services Lookup Logic

**Frontend**:

- Query consulted services: `useConsultedServices({ customerId, serviceStatus: "Đã chốt" })`
- API: `GET /api/v1/consulted-services?customerId={customerId}&serviceStatus=Đã chốt`
- Lấy TẤT CẢ services đã chốt của customer, không phụ thuộc appointments
- Display dropdown: `"{consultedServiceName} - {toothPosition} - {confirmedAt (DD/MM/YY)}"`
  - Nếu toothPosition null: Hiển thị `"{consultedServiceName} - {confirmedAt (DD/MM/YY)}"`
- **Reuse**: `useWorkingEmployees()` hook từ employees feature (cho dentist/assistant selects)

**Backend**:

- Validate consultedService exists và serviceStatus = "Đã chốt"
- **Validate appointmentId required và valid**:
  - Appointment must exist
  - Appointment must have `checkInTime != null`
  - Appointment must have `status IN ("Đã đến", "Đến đột xuất")`
  - Appointment phải thuộc cùng customer với consultedService
- Derive customerId từ consultedService.customerId
- Derive clinicId từ appointment.clinicId (primary source)
- Set treatmentDate = appointment.appointmentDateTime (hoặc now())

---

## 2. ✏️ Cập Nhật Treatment Log

### UI/UX

**Component**: `UpdateTreatmentLogModal` (70% viewport width, scrollable)

**Base Form Layout** (giống Create):

```
Hàng 1: [consultedServiceId (disabled, full width)                                     ]
Hàng 2: [treatmentNotes (Textarea, full width)                                         ]
Hàng 3: [nextStepNotes (Textarea, full width, optional)                                ]
Hàng 4: [dentistId           ] [assistant1Id (optional)] [assistant2Id (optional)      ]
Hàng 5: [treatmentStatus                              ] [clinicId                      ]
```

**Metadata Section** (Ant Design Descriptions, 2 columns):

```
Hàng 6: [Metadata Descriptions: treatmentDate, appointment (link), createdBy, updatedBy, createdAt, updatedAt (2 cols)]
```

**Notes**:

- Descriptions component để hiển thị metadata readonly
- `treatmentDate`: Format "DD/MM/YYYY HH:mm"
- `appointment`: Link đến appointment detail (always có value - không nullable)
- `createdBy`, `updatedBy`: Tên người tạo/sửa
- `createdAt`, `updatedAt`: Format "DD/MM/YYYY HH:mm"

**Field Enable/Disable**:

- `consultedServiceId`: Always disabled (không thay đổi service)
- **Other fields**:
  - Employee: Enabled nếu `createdById === currentUser.id`, disabled nếu không phải creator
  - Admin: Always enabled
- **UI Indication**: Show Alert warning nếu Employee view record của người khác: "Bạn chỉ có thể xem, không thể chỉnh sửa lịch sử điều trị này"

**Scrollable**: Body max-height 60vh with overflow-y auto

### Validation

**Áp dụng validation rules từ Section 1 (Create)**, với điểm khác biệt:

- **consultedServiceId**: Disabled (không thể thay đổi)
- **appointmentId**: Không hiển thị trong form, không thể thay đổi
- **customerId**, **clinicId**: Không thể thay đổi (backend ignore nếu có trong payload)
- **updatedById**: Auto-set từ current employee

---

## 3. 🗑️ Xóa Treatment Log

### UI/UX

- Button: Delete icon (actions column)
- Popconfirm: "Xác nhận xoá lịch sử điều trị này?"

### Rules

- Hard delete (no archive)
- **Permission check**:
  - Employee: Chỉ xóa được treatment log của chính mình (createdById check)
  - Admin: Xóa được tất cả
- Không có cascade effects (appointment/consultedService không bị ảnh hưởng)

---

## 4. 📊 Daily View (Theo dõi điều trị hàng ngày)

### Structure

```
<PageHeaderWithDateNav />           // Shared component with date navigation
<ClinicTabs />                      // Admin chọn clinic
<TreatmentLogStatistics />          // 4 KPI cards
<TreatmentLogFilters />             // Search + Refresh
<TreatmentLogTable />               // Data table
```

### Statistics (4 Cards)

| Metric               | Logic                                           | Display Format  |
| -------------------- | ----------------------------------------------- | --------------- |
| Số khách đến         | Count unique customers checked-in hôm nay       | "45 khách"      |
| Số khách đã điều trị | Count unique customers có treatment log hôm nay | "38 khách"      |
| Số dịch vụ thực hiện | Count all treatment logs created hôm nay        | "67 dịch vụ"    |
| Tỷ lệ điều trị / Đến | (Số khách đã điều trị / Số khách đến) × 100     | "38/45 (84.4%)" |

**Query Logic**:

- **Số khách đến**: `SELECT COUNT(DISTINCT customerId) FROM Appointment WHERE DATE(checkInTime) = TODAY AND checkInTime IS NOT NULL`
- **Số khách đã điều trị**: `SELECT COUNT(DISTINCT customerId) FROM TreatmentLog WHERE DATE(treatmentDate) = TODAY`
- **Số dịch vụ thực hiện**: `SELECT COUNT(*) FROM TreatmentLog WHERE DATE(treatmentDate) = TODAY`
- **Tỷ lệ**: Frontend calculation từ 2 metrics trên

### Filters

- **Display**: "X dịch vụ điều trị hôm nay" (X = số treatment logs)
- **Actions**:
  - Button "Xuất Excel" (export daily data)
- **No Search, No Create, No Refresh button** (tạo từ Customer Detail; React Query auto-refetch)

### Table Columns

**Component**: Reuse `TreatmentLogTable` từ Customer Detail (same component, different props)

| Column            | Width | Sort/Filter | Description                                                                                 |
| ----------------- | ----- | ----------- | ------------------------------------------------------------------------------------------- |
| Khách hàng        | 180px | ✅ Sort     | Line 1: Tên (link)<br>Line 2: Mã + Tuổi (text-muted)<br>Sort by: customerCode A-Z (default) |
| Dịch vụ điều trị  | 200px | ✅ Filter   | `consultedService.consultedServiceName`                                                     |
| Vị trí răng       | 100px | -           | `consultedService.toothPositions` (join ", ")                                               |
| Nội dung điều trị | 300px | -           | `treatmentNotes` (truncate, tooltip on hover)                                               |
| Bác sĩ điều trị   | 140px | ✅ Filter   | `dentist.fullName`                                                                          |
| Điều dưỡng 1      | 120px | ✅ Filter   | `assistant1.fullName` (nullable)                                                            |
| Điều dưỡng 2      | 120px | ✅ Filter   | `assistant2.fullName` (nullable)                                                            |
| Trạng thái        | 120px | ✅ Filter   | Tag: Chưa (gray) / Đang (blue) / Hoàn thành (green)                                         |
| Thao tác          | 120px | -           | Edit \| Delete (fixed="right", conditional by permission)                                   |

**Notes**:

- **Reuse existing component**: `TreatmentLogTable` đã implement ở Customer Detail
  - Pass props: `showCustomerColumn={true}` + `hideServiceColumn={false}` + `hideDateColumn={true}`
  - Cột "Khách hàng" CHỈ hiện ở Daily View (cần biết ai là khách)
  - Cột "Ngày điều trị" ẨN ở Daily View (vì đã filter theo 1 ngày, redundant)
  - Cột "Dịch vụ điều trị" HIỆN ở Daily View (cần biết dịch vụ gì được thực hiện)
- **Khách hàng**:
  - Tên: Link → navigate to `/customers/{customerId}?tab=treatment-logs` (Customer Detail - Treatment Log Tab)
  - Tuổi: Calculate từ `customer.dateOfBirth` → `{currentYear - birthYear} tuổi`
- **Nội dung điều trị**:
  - Width tăng từ 250px → 300px (vì bỏ cột Giờ điều trị)
  - Truncate at 60 chars với "..." (tăng từ 50 chars)
  - Tooltip hiển thị full content on hover (maxWidth: 400px)
- **Sort/Filter**: Client-side (dữ liệu daily < 500 records)
- **Default sort**: Customer Code A-Z (ascending) - `defaultSortOrder: "ascend"` on Customer column
- **Total width**: ~1400px (compact, focus vào content)

### Permissions

- **View Access**:
  - Employee: Xem treatment logs của clinic mình
  - Admin: Chọn clinic và xem
- **Actions**:
  - Edit: Conditional display (show nếu Admin hoặc Employee + createdById match)
  - Delete: Conditional display (same as Edit)

### Navigation

**Sidebar Menu**: Thêm menu item mới

```
📋 Quản lý (Section)
  ├── 📅 Lịch hẹn
  ├── 🦷 Dịch vụ tư vấn
  ├── 💊 Lịch sử điều trị  ← NEW
  └── ...
```

**Menu Config**:

- Label: "Lịch sử điều trị"
- Icon: MedicineBoxOutlined (hoặc ExperimentOutlined)
- Path: `/treatment-logs`
- Permission: Accessible by all authenticated users (Employee + Admin)

---

## 5. 👤 Customer Detail View

### Structure

```
<TreatmentLogTab customerId={customerId} />
  ├── View Mode Toggle (by-date / by-service)
  ├── Loading State
  ├── Empty State
  └── Content
      ├── by-date: TreatmentLogCard (grouped by appointment)
      └── by-service: TreatmentLogServiceCard (grouped by service)
```

### Customer Detail - View Mode: By Date (Theo ngày hẹn)

**Grouping Logic**:

1. Fetch checked-in appointments với `status IN ("Đã đến", "Đến đột xuất")`
2. Include:
   - `primaryDentist` (Employee)
   - `treatmentLogs` (TreatmentLog[]) → include `consultedService` (with toothPosition + confirmedAt), `dentist`, `assistant1`, `assistant2`, `createdBy`
   - `customer` → include `consultedServices` (filter serviceStatus = "Đã chốt") - dùng cho dropdown khi tạo log mới
3. Group treatment logs theo appointment
4. Sort appointments: `appointmentDateTime DESC` (mới nhất trước)
5. Sort logs trong appointment: `treatmentDate ASC` (cũ nhất trước)

**TreatmentLogCard**:

```
┌─ Card Header ──────────────────────────────────────────┐
│ 📅 15/11/2025 14:30 | 👨‍⚕️ BS. Nguyễn Văn A | [+ Thêm điều trị] │
├────────────────────────────────────────────────────────┤
│ Timeline (vertical):                                   │
│  ● Nhổ răng khôn - 18 - 10/11/25 - BS. Trần B - [Hoàn thành]│
│    "Đã nhổ răng số 8..."                               │
│    [✏️] [🗑️]                                           │
│  ● Cạo vôi răng - 12/11/25 - BS. Nguyễn A - [Đang điều trị]│
│    "Cạo vôi toàn hàm..."                               │
│    [✏️] [🗑️]                                           │
└────────────────────────────────────────────────────────┘
```

**Features**:

- Card collapsible (default expanded)
- Button "Thêm điều trị" → Modal với appointmentId preset
- Timeline hiển thị: service name, dentist, status badge, notes excerpt, actions
- Status badge colors: Gray (Chưa điều trị), Blue (Đang điều trị), Green (Hoàn thành)
- **Actions conditional display**:
  - Edit button: Always show (modal sẽ disable fields nếu không có quyền sửa)
  - Delete button: Show nếu (Admin) hoặc (Employee và createdById === currentUser.id)

### Customer Detail - View Mode: By Service (Theo dịch vụ)

**Grouping Logic**:

1. Get ALL consultedServices từ appointments[0].customer.consultedServices
2. Filter: `serviceStatus = "Đã chốt"`
3. Initialize serviceMap với all services (status = "Chưa bắt đầu", logs = [])
4. Loop appointments → treatmentLogs → add to corresponding service
5. Calculate aggregate status:
   - **Chưa điều trị** (Gray): `logs.length === 0`
   - **Đang điều trị** (Blue): `logs.some(log => log.treatmentStatus === "Đang điều trị")`
   - **Hoàn thành** (Green): `logs.every(log => log.treatmentStatus === "Hoàn thành")`
6. Sort logs trong mỗi service: `treatmentDate ASC` (cũ nhất trước)
7. Sort services: A-Z theo `consultedServiceName`

**TreatmentLogServiceCard**:

```
┌─ Card Header ──────────────────────────────────────────┐
│ 🦷 Nhổ răng khôn - 18 - 10/11/25 | 👨‍⚕️ BS. Nguyễn Văn A | [Đang điều trị] │
├────────────────────────────────────────────────────────┤
│ Timeline (vertical):                                   │
│  ● 12/11/2025 09:00 - BS. Trần B                       │
│    "Kiểm tra và lên kế hoạch..."                       │
│    [✏️] [🗑️]                                           │
│  ● 13/11/2025 14:30 - BS. Nguyễn A                     │
│    "Đã nhổ răng số 8..."                               │
│    [✏️] [🗑️]                                           │
└────────────────────────────────────────────────────────┘
```

**Features**:

- Card collapsible (default expanded)
- Show ALL services đã chốt (kể cả chưa có log)
- Empty state nếu chưa có logs: "Chưa có lịch sử điều trị cho dịch vụ này"
- Timeline hiển thị: date, dentist, notes excerpt, actions
- **KHÔNG có button "Thêm điều trị"** (vì không có appointment context - chỉ add từ by-date view)
- **Actions conditional display**: Same as by-date view (check ownership)

---

## 6. API Routes & Server Actions

### API Routes (Queries - GET)

#### GET `/api/v1/treatment-logs/daily`

**Query Params**:

```typescript
{
  date: string; // YYYY-MM-DD format (required)
  clinicId: string; // UUID (required for Employee, optional for Admin)
}
```

**Purpose**: Lấy treatment logs của 1 ngày cụ thể cho Daily View

**Response**:

```typescript
{
  items: TreatmentLogResponse[];
  statistics: {
    totalCheckedInCustomers: number;    // Số khách đến
    totalTreatedCustomers: number;      // Số khách đã điều trị
    totalTreatmentLogs: number;         // Số dịch vụ thực hiện
    treatmentRate: number;              // Tỷ lệ (%) điều trị/đến
  };
}
```

**Business Logic**:

- Filter: `DATE(treatmentDate) = params.date AND clinicId = params.clinicId`
- Include: customer (fullName, dateOfBirth, customerCode), consultedService (consultedServiceName, toothPositions), appointment (appointmentDateTime), dentist, assistant1, assistant2, createdBy
- Sort: `customer.customerCode ASC` (A-Z, nullable last) - align với frontend table default sort
- **Statistics Calculation**:
  - `totalCheckedInCustomers`: Count distinct customers from Appointment WHERE DATE(checkInTime) = params.date AND clinicId = params.clinicId
  - `totalTreatedCustomers`: Count distinct customerId from filtered treatment logs
  - `totalTreatmentLogs`: Count filtered treatment logs
  - `treatmentRate`: (totalTreatedCustomers / totalCheckedInCustomers) × 100 (nếu totalCheckedInCustomers > 0, else 0)

**Permission Check**:

- Employee: Auto-filter by user's clinicId (ignore params.clinicId)
- Admin: Use params.clinicId (required)

**Caching**: No cache (treatment data changes frequently during the day)

#### GET `/api/v1/appointments/checked-in`

**Query Params**:

```typescript
{
  customerId: string; // required
}
```

**Purpose**: Lấy appointments đã check-in + consultedServices + treatmentLogs cho Customer Detail

**Response**:

```typescript
{
  items: AppointmentForTreatmentResponse[];
}
```

**Business Logic**:

- Filter: `customerId = params.customerId AND status IN ("Đã đến", "Đến đột xuất")`
- Include:
  - customer.consultedServices (serviceStatus = "Đã chốt", include treatingDoctor, toothPosition, confirmedAt)
  - treatmentLogs (include consultedService with toothPosition + confirmedAt, dentist, assistant1, assistant2, createdBy)
  - primaryDentist
- Sort: `appointmentDateTime DESC`

**Caching**: No cache (appointment data changes frequently)

#### GET `/api/v1/treatment-logs`

**Query Params**:

```typescript
{
  customerId?: string;
  appointmentId?: string;
}
```

**Purpose**: Lấy treatment logs với filter options

**Response**:

```typescript
{
  items: TreatmentLogResponse[];
}
```

**Business Logic**:

- Filter theo customerId và/hoặc appointmentId
- Include: customer, consultedService (with toothPosition + confirmedAt), appointment, dentist, assistants, createdBy
- Sort: `createdAt ASC`

**Caching**: No cache

#### GET `/api/v1/treatment-logs/:id`

**Purpose**: Lấy chi tiết 1 treatment log

**Response**:

```typescript
TreatmentLogResponse;
```

**Business Logic**:

- Include: customer, consultedService (with toothPosition + confirmedAt), appointment, dentist, assistants, createdBy
- 404 nếu không tìm thấy

**Caching**: No cache

### Server Actions (Mutations - CUD)

#### `createTreatmentLogAction(data: CreateTreatmentLogRequest)`

**Input**:

```typescript
{
  consultedServiceId: string;
  appointmentId: string; // REQUIRED - not optional
  treatmentNotes: string;
  nextStepNotes?: string;
  treatmentStatus?: string;
  dentistId: string;
  assistant1Id?: string;
  assistant2Id?: string;
}
```

**Process**:

1. Auth: Get session user
2. **Validate appointmentId required** → 422 nếu missing
3. Validate appointment exists và đã check-in:
   - `checkInTime != null`
   - `status IN ("Đã đến", "Đến đột xuất")`
   - → 422 với `{ appointmentNotCheckedIn: true }`
4. Validate consultedService exists và serviceStatus = "Đã chốt" → 422
5. Derive customerId từ consultedService.customerId
6. Validate appointment thuộc cùng customer → 422
7. Derive clinicId từ appointment.clinicId
8. Set treatmentDate = appointment.appointmentDateTime (hoặc now())
9. Create với defaults: imageUrls = [], xrayUrls = []
10. Return: Created TreatmentLog với nested relations

**Error Codes**:

- 422: Appointment missing, appointment not checked-in, service not found, service not confirmed, appointment-customer mismatch
- 400: Validation error (missing required fields)

#### `updateTreatmentLogAction(id: string, data: UpdateTreatmentLogRequest)`

**Input**:

```typescript
{
  treatmentNotes: string;
  nextStepNotes?: string;
  treatmentStatus?: string;
  dentistId: string;
  assistant1Id?: string;
  assistant2Id?: string;
  clinicId?: string;
}
```

**Process**:

1. Auth: Get session user
2. Find existing treatment log → 404
3. **Permission check** (nếu Employee):
   - Validate `treatmentLog.createdById === currentUser.id`
   - Nếu không match → 403 với `{ notOwner: true }`
   - Admin: Skip check
4. Update editable fields only
5. Non-editable: customerId, consultedServiceId, appointmentId, treatmentDate
6. Set updatedById = current user
7. Return: Updated TreatmentLog với nested relations

**Error Codes**:

- 404: Treatment log not found
- 403: Permission denied (Employee updating other's record)
- 400: Validation error

#### `deleteTreatmentLogAction(id: string)`

**Process**:

1. Auth: Get session user
2. Find treatment log → 404
3. **Permission check** (nếu Employee):
   - Validate `treatmentLog.createdById === currentUser.id`
   - Nếu không match → 403 với `{ notOwner: true }`
   - Admin: Skip check
4. Hard delete
5. Return: Success message

**Error Codes**:

- 404: Treatment log not found
- 403: Permission denied (Employee deleting other's record)

---

## 7. Frontend Architecture

### Hooks

#### Daily View Hooks

##### `useDailyTreatmentLogs(date: string, clinicId: string)`

**Purpose**: Fetch daily treatment logs với statistics

**Query Key**: `["treatment-logs", "daily", date, clinicId]`

**API Call**: `GET /api/v1/treatment-logs/daily?date=&clinicId=`

**Return**:

```typescript
{
  data: {
    items: TreatmentLogResponse[];
    statistics: {
      totalCheckedInCustomers: number;
      totalTreatedCustomers: number;
      totalTreatmentLogs: number;
      treatmentRate: number;
    };
  } | undefined;
  isLoading: boolean;
  error: Error | null;
}
```

**Caching**:

- staleTime: 60s (refetch nếu data > 1 phút)
- gcTime: 5min
- refetchOnWindowFocus: true

#### Customer Detail Hooks

##### `useCheckedInAppointments(customerId: string)`

**Purpose**: Fetch checked-in appointments với consultedServices và treatmentLogs

**Query Key**: `["appointments", "checked-in", customerId]`

**API Call**: `GET /api/v1/appointments/checked-in?customerId=`

**Return**:

```typescript
{
  data: AppointmentForTreatmentResponse[] | undefined;
  isLoading: boolean;
  error: Error | null;
}
```

#### Mutation Hooks

##### `useCreateTreatmentLog()`

**Purpose**: Create treatment log mutation

**Mutation Fn**: `createTreatmentLogAction(data)`

**On Success**:

- Invalidate: `["appointments", "checked-in", customerId]` (Customer Detail)
- Invalidate: `["treatment-logs", "daily", date, clinicId]` (Daily View)
- Toast: "Tạo lịch sử điều trị thành công"
- Close modal

**On Error**:

- Toast: Error message (tiếng Việt)

##### `useUpdateTreatmentLog()`

**Purpose**: Update treatment log mutation

**Mutation Fn**: `updateTreatmentLogAction(id, data)`

**On Success**:

- Invalidate: `["appointments", "checked-in", customerId]` (Customer Detail)
- Invalidate: `["treatment-logs", "daily", date, clinicId]` (Daily View)
- Toast: "Cập nhật lịch sử điều trị thành công"
- Close modal

**On Error**:

- Toast: Error message

##### `useDeleteTreatmentLog()`

**Purpose**: Delete treatment log mutation

**Mutation Fn**: `deleteTreatmentLogAction(id)`

**On Success**:

- Invalidate: `["appointments", "checked-in", customerId]` (Customer Detail)
- Invalidate: `["treatment-logs", "daily", date, clinicId]` (Daily View)
- Toast: "Xóa lịch sử điều trị thành công"

**On Error**:

- Toast: Error message

### Components

#### Daily View Components

##### `TreatmentLogDailyView`

**Location**: `src/features/treatment-logs/views/TreatmentLogDailyView.tsx`

**Props**: None (uses context/hooks internally)

**State**:

```typescript
const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
const [selectedClinic, setSelectedClinic] = useState<string | null>(null);
```

**Structure**:

```tsx
<>
  <PageHeaderWithDateNav
    title="Lịch sử điều trị"
    date={selectedDate}
    onDateChange={setSelectedDate}
  />

  {isAdmin && (
    <ClinicTabs value={selectedClinic} onChange={setSelectedClinic} />
  )}

  <TreatmentLogStatistics statistics={data?.statistics} />

  <TreatmentLogFilters count={data?.items.length} onExport={handleExport} />

  <TreatmentLogTable
    data={data?.items}
    loading={isLoading}
    onEdit={handleEdit}
    onDelete={handleDelete}
  />
</>
```

**Logic**:

1. Fetch daily data on mount và khi date/clinic thay đổi (auto-refetch by React Query)
2. Handle modal open/close for edit
3. Handle delete with permission check + popconfirm
4. Export to Excel (future)

**Note**: Không cần manual refetch button - React Query handles cache invalidation

##### `TreatmentLogStatistics`

**Props**:

```typescript
{
  statistics: {
    totalCheckedInCustomers: number;
    totalTreatedCustomers: number;
    totalTreatmentLogs: number;
    treatmentRate: number;
  } | undefined;
  loading?: boolean;
}
```

**Features**:

- **Pattern**: Backend-calculated statistics (giống ConsultedService và Payment patterns)
- **Component responsibility**: Chỉ hiển thị statistics đã tính sẵn từ backend API
- 4 Statistic cards in Row (gutter 16)
- Card 1: Số khách đến (UserOutlined icon, blue)
  - Value: `statistics.totalCheckedInCustomers`
- Card 2: Số khách đã điều trị (MedicineBoxOutlined icon, green)
  - Value: `statistics.totalTreatedCustomers`
- Card 3: Số dịch vụ thực hiện (ExperimentOutlined icon, orange)
  - Value: `statistics.totalTreatmentLogs`
- Card 4: Tỷ lệ điều trị/đến (RiseOutlined icon, purple)
  - Display format: "38/45 (84.4%)"
  - Color logic: Green if >= 80%, Orange if >= 60%, Red if < 60%
  - Calculation: Frontend format only (backend sends treatmentRate as percentage)

##### `TreatmentLogFilters`

**Props**:

```typescript
{
  count: number;
  onExport: () => void;
}
```

**Layout**:

```tsx
<Row justify="space-between" align="middle">
  <Col>
    <Typography.Text>{count} dịch vụ điều trị hôm nay</Typography.Text>
  </Col>
  <Col>
    <Button icon={<DownloadOutlined />} onClick={onExport}>
      Xuất Excel
    </Button>
  </Col>
</Row>
```

**Note**: Không cần button "Làm mới" vì React Query tự động refetch khi:

- Window focus (refetchOnWindowFocus: true)
- Data stale > 60s (staleTime: 60s)
- Date/clinic thay đổi (query key change)
- Mutation success (query invalidation)

##### `TreatmentLogTable` (Reusable Component)

**Props**:

```typescript
{
  data: TreatmentLogResponse[];
  loading: boolean;
  onEdit: (log: TreatmentLogResponse) => void;
  onDelete: (log: TreatmentLogResponse) => void;
  hideServiceColumn?: boolean;    // true for by-service view, false for by-appointment & Daily View
  hideDateColumn?: boolean;       // true for by-appointment view & Daily View (single day), false for by-service view
  showCustomerColumn?: boolean;   // true for Daily View only, false for Customer Detail
}
```

**Features**:

- **Reusable component**: Same `TreatmentLogTable` cho cả Customer Detail (2 modes) và Daily View
- **Conditional columns**:
  - `hideServiceColumn`: Ẩn "Dịch vụ điều trị" (by-service view - vì service đã ở Card header)
  - `hideDateColumn`: Ẩn "Ngày điều trị" (by-appointment view hoặc Daily View - vì date context rõ ràng)
  - `showCustomerColumn`: Hiện "Khách hàng" (Daily View only - cần biết khách là ai)
- **Usage Scenarios**:
  - Customer Detail by-appointment: `hideServiceColumn={false}` + `hideDateColumn={true}` + `showCustomerColumn={false}`
  - Customer Detail by-service: `hideServiceColumn={true}` + `hideDateColumn={false}` + `showCustomerColumn={false}`
  - Daily View: `hideServiceColumn={false}` + `hideDateColumn={true}` + `showCustomerColumn={true}`
- Filters: Client-side filterDropdown cho service, dentist, assistants, status
- Sort: Client-side sorter cho treatmentDate (when visible)
- Actions: Conditional render based on permission (canEditTreatmentLog, canDeleteTreatmentLog)
- Scroll: x: 1400 (Daily with customer), x: 1200 (Customer Detail), y: calc(100vh - 450px)
- Pagination: pageSize 50, showSizeChanger, showTotal

#### Customer Detail Components

##### `TreatmentLogTab`

**Props**: `customerId: string`

**State**:

```typescript
const [viewMode, setViewMode] = useState<"by-date" | "by-service">("by-date");
const [modal, setModal] = useState({
  open: boolean,
  mode: "add" | "edit",
  appointmentId: string,
  initialData: TreatmentLogResponse,
});
```

**Logic**:

1. Fetch checked-in appointments on mount
2. Extract consulted services từ appointments
3. Group data theo viewMode
4. Handle modal open/close/submit
5. Refresh data sau create/update/delete

**View Mode Toggle** (THỰC TẾ):

```tsx
<Row justify="space-between" align="middle">
  <Col>
    <Typography.Title level={5}>
      {viewMode === "by-date"
        ? `Lịch sử điều trị theo ngày (${appointmentsData.items.length} buổi)`
        : `Lịch sử điều trị theo dịch vụ (${serviceGroups.length} dịch vụ)`}
    </Typography.Title>
  </Col>
  <Col>
    <Space align="center">
      <Typography.Text>Theo ngày</Typography.Text>
      <Switch
        checked={viewMode === "by-service"}
        onChange={(checked) => setViewMode(checked ? "by-service" : "by-date")}
        checkedChildren={<MedicineBoxOutlined />}
        unCheckedChildren={<CalendarOutlined />}
      />
      <Typography.Text>Theo dịch vụ</Typography.Text>
    </Space>
  </Col>
</Row>
```

#### `TreatmentLogsByAppointment` (ĐÃ RENAME)

**Props**:

```typescript
{
  appointment: AppointmentForTreatmentResponse;
  onAddTreatment: (appointmentId: string) => void;
  onEditTreatment: (log: TreatmentLogResponse) => void;
  onDeleteTreatment: (log: TreatmentLogResponse) => void;
}
```

**Features** (THỰC TẾ):

- ✅ Card size="small" (compact format)
- ✅ Card header: Appointment date + time (DD/MM/YYYY HH:mm), BS. {primaryDentist}
- ✅ Extra button: "Thêm điều trị" (primary, icon PlusOutlined)
- ✅ **Table view** (không phải Timeline): TreatmentLogTable component
- ✅ Columns: Dịch vụ, Nội dung điều trị, Bác sĩ, Điều dưỡng 1/2, Trạng thái, Ngày điều trị, Thao tác
- ✅ Treatment logs sorted by treatmentDate ASC (oldest first)
- ✅ Tooltip cho nội dung điều trị (maxWidth 600px)
- ❌ Không collapsible (always expanded)

#### `TreatmentLogsByService` (ĐÃ RENAME)

**Props**:

```typescript
{
  serviceGroup: ServiceGroup;
  onEditTreatment: (log: TreatmentLogResponse) => void;
  onDeleteTreatment: (log: TreatmentLogResponse) => void;
}
```

**ServiceGroup Type**:

```typescript
type ServiceGroup = {
  serviceId: string;
  serviceName: string;
  toothPositions: string[];
  serviceConfirmDate: string | null;
  treatingDoctorName: string | null;
  aggregateStatus: "Chưa điều trị" | "Đang điều trị" | "Hoàn thành";
  logs: TreatmentLogResponse[];
};
```

**Features** (THỰC TẾ):

- ✅ Card size="small" (compact format)
- ✅ Card header: Service name + toothPositions (join ", ") + BS. {treatingDoctorName} + Status Tag
- ✅ **Table view** (không phải Timeline): TreatmentLogTable component
- ✅ Treatment logs sorted by treatmentDate ASC (oldest first) trong serviceGroup
- ✅ Aggregate status logic:
  - No logs → "Chưa điều trị"
  - All logs "Hoàn thành" → "Hoàn thành"
  - Otherwise → "Đang điều trị"
- ✅ ServiceGroups sorted by serviceConfirmDate DESC (newest first)
- ❌ Không có empty state (vì show tất cả services đã chốt, kể cả chưa có log)
- ❌ Không collapsible (always expanded)

#### `TreatmentLogModal`

**Props**:

```typescript
{
  open: boolean;
  mode: "add" | "edit";
  appointmentId?: string;
  customerId?: string;
  appointmentDate?: string;
  initialData?: TreatmentLogResponse;
  consultedServices: ConsultedServiceOption[];
  onCancel: () => void;
  onFinish: (values: CreateTreatmentLogFormData) => void;
  loading?: boolean;
}
```

**Form Fields**: See Section 1 (Create) and Section 2 (Update)

**Preset Logic (Add Mode)**:

- `dentistId`: current employee ID
- `treatmentStatus`: "Đang điều trị"
- `appointmentId`: từ props (REQUIRED - passed from by-date view Card header)
  - Modal CHỈ được mở từ by-date view
  - Validate appointmentId !== undefined trước khi submit

---

## 8. Types & Schemas

### Zod Schemas

#### Additional Response Schema for Daily View

```typescript
export const DailyTreatmentLogsResponseSchema = z.object({
  items: z.array(TreatmentLogResponseSchema),
  statistics: z.object({
    totalCheckedInCustomers: z.number().int(),
    totalTreatedCustomers: z.number().int(),
    totalTreatmentLogs: z.number().int(),
    treatmentRate: z.number(), // percentage (0-100)
  }),
});

export type DailyTreatmentLogsResponse = z.infer<
  typeof DailyTreatmentLogsResponseSchema
>;
```

### Zod Schemas

#### Base Schema

```typescript
const TreatmentLogCommonFieldsSchema = z.object({
  consultedServiceId: z.string().uuid(),
  appointmentId: z.string().uuid(), // REQUIRED - not optional
  treatmentNotes: z.string().min(1, "Nội dung điều trị là bắt buộc"),
  nextStepNotes: z.string().optional(),
  treatmentStatus: z.enum(["Chưa điều trị", "Đang điều trị", "Hoàn thành"]),
  dentistId: z.string().uuid(),
  assistant1Id: z.string().uuid().optional(),
  assistant2Id: z.string().uuid().optional(),
});
```

#### Frontend Schema

```typescript
export const CreateTreatmentLogFormSchema = TreatmentLogCommonFieldsSchema;
// appointmentId already required in base schema

export type CreateTreatmentLogFormData = z.infer<
  typeof CreateTreatmentLogFormSchema
>;
```

#### Backend Request Schema

```typescript
export const CreateTreatmentLogRequestSchema = TreatmentLogCommonFieldsSchema;
// appointmentId already required in base schema

export const UpdateTreatmentLogRequestSchema =
  TreatmentLogCommonFieldsSchema.omit({ appointmentId: true }) // Cannot change appointment
    .extend({
      clinicId: z.string().uuid().optional(),
    })
    .partial()
    .required({
      treatmentNotes: true,
      dentistId: true,
    });

export type CreateTreatmentLogRequest = z.infer<
  typeof CreateTreatmentLogRequestSchema
>;
export type UpdateTreatmentLogRequest = z.infer<
  typeof UpdateTreatmentLogRequestSchema
>;
```

#### Backend Response Schema

```typescript
export const TreatmentLogResponseSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  consultedServiceId: z.string(),
  appointmentId: z.string(), // NOT nullable - always required
  treatmentDate: z.string().datetime(),
  treatmentNotes: z.string(),
  nextStepNotes: z.string().nullable(),
  treatmentStatus: z.string(),
  imageUrls: z.array(z.string()),
  xrayUrls: z.array(z.string()),
  dentistId: z.string(),
  assistant1Id: z.string().nullable(),
  assistant2Id: z.string().nullable(),
  clinicId: z.string().nullable(),
  createdById: z.string(),
  updatedById: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  customer: z.object({
    id: z.string(),
    fullName: z.string(),
    customerCode: z.string().nullable(),
  }),
  consultedService: z.object({
    id: z.string(),
    consultedServiceName: z.string(),
    consultedServiceUnit: z.string(),
    treatingDoctor: z
      .object({
        id: z.string(),
        fullName: z.string(),
      })
      .nullable(),
  }),
  appointment: z.object({
    id: z.string(),
    appointmentDateTime: z.string().datetime(),
    status: z.string(),
  }), // NOT nullable - always present
  dentist: z.object({
    id: z.string(),
    fullName: z.string(),
  }),
  assistant1: z
    .object({
      id: z.string(),
      fullName: z.string(),
    })
    .nullable(),
  assistant2: z
    .object({
      id: z.string(),
      fullName: z.string(),
    })
    .nullable(),
  createdBy: z.object({
    id: z.string(),
    fullName: z.string(),
  }),
});

export const AppointmentForTreatmentResponseSchema = z.object({
  id: z.string(),
  appointmentDateTime: z.string().datetime(),
  status: z.string(),
  primaryDentist: z
    .object({
      id: z.string(),
      fullName: z.string(),
    })
    .nullable(),
  customer: z.object({
    id: z.string(),
    fullName: z.string(),
    customerCode: z.string().nullable(),
    consultedServices: z.array(
      z.object({
        id: z.string(),
        consultedServiceName: z.string(),
        toothPosition: z.string().nullable(),
        confirmedAt: z.string().datetime(),
        serviceStatus: z.string(),
        treatingDoctor: z
          .object({
            id: z.string(),
            fullName: z.string(),
          })
          .nullable(),
      })
    ),
  }),
  treatmentLogs: z.array(TreatmentLogResponseSchema),
});

export type TreatmentLogResponse = z.infer<typeof TreatmentLogResponseSchema>;
export type AppointmentForTreatmentResponse = z.infer<
  typeof AppointmentForTreatmentResponseSchema
>;
```

---

## 9. Routes & Navigation

### Route Definition

**Path**: `/treatment-logs`

**Layout**: `(private)` layout (authenticated users only)

**Page Component**: `src/app/(private)/treatment-logs/page.tsx`

```tsx
import { TreatmentLogDailyView } from "@/features/treatment-logs";

export default function TreatmentLogPage() {
  return <TreatmentLogDailyView />;
}
```

### Sidebar Menu Integration

**Location**: `src/layouts/AppLayout/Sidebar.tsx` (hoặc menu config file)

**Menu Structure**:

```typescript
{
  key: 'treatment-logs',
  icon: <MedicineBoxOutlined />,
  label: 'Lịch sử điều trị',
  path: '/treatment-logs',
  // Permission: All authenticated users (Employee + Admin)
}
```

**Position**: Sau "Dịch vụ tư vấn", trước "Thanh toán" (nếu có)

---

## 10. Implementation Checklist

### Phase 1 - Core Features ✅ HOÀN THÀNH (Customer Detail View)

- [x] **Zod Schemas** (`src/shared/validation/treatment-log.schema.ts`)

  - [x] TreatmentLogCommonFieldsSchema
  - [x] CreateTreatmentLogFormSchema / CreateTreatmentLogRequestSchema
  - [x] UpdateTreatmentLogFormSchema / UpdateTreatmentLogRequestSchema
  - [x] TreatmentLogResponseSchema
  - [x] AppointmentForTreatmentResponseSchema
  - [x] CheckedInAppointmentsListResponseSchema
  - [x] GetCheckedInAppointmentsQuerySchema

- [x] **Backend - Repository** (`src/server/repos/treatment-log.repo.ts`)

  - [x] treatmentLogRepo.create() - with TreatmentLogCreateInput type
  - [x] treatmentLogRepo.update() - with TreatmentLogUpdateInput type
  - [x] treatmentLogRepo.delete()
  - [x] treatmentLogRepo.findById() - with full includes
  - [x] treatmentLogRepo.findCheckedInAppointmentsForTreatment()
  - [x] Include pattern: customer, consultedService, appointment, dentist, assistants, clinic

- [x] **Backend - Service** (`src/server/services/treatment-log.service.ts`)

  - [x] treatmentLogService.create() - Validate service, appointment, derive customerId/clinicId/treatmentDate
  - [x] treatmentLogService.update() - Permission check with treatmentLogPermissions.canEdit()
  - [x] treatmentLogService.delete() - Permission check with treatmentLogPermissions.canDelete()
  - [x] treatmentLogService.getCheckedInAppointmentsForTreatment()
  - [x] Mapper functions: mapTreatmentLogToResponse, mapAppointmentForTreatmentToResponse

- [x] **Backend - Server Actions** (`src/server/actions/treatment-log.actions.ts`)

  - [x] createTreatmentLogAction() - Auth gate + delegation to service
  - [x] updateTreatmentLogAction() - Auth gate + delegation to service
  - [x] deleteTreatmentLogAction() - Auth gate + delegation to service

- [x] **Backend - API Routes**

  - [x] GET /api/v1/appointments/checked-in (`app/api/v1/appointments/checked-in/route.ts`)
  - [x] Validation: GetCheckedInAppointmentsQuerySchema
  - [x] Cache headers: staleTime 1 minute

- [x] **Permission Module** (`src/shared/permissions/treatment-log.permissions.ts`)

  - [x] Pure TypeScript - No DB, No Supabase, No React
  - [x] canEdit() - Admin full, Employee own records only
  - [x] canDelete() - Admin full, Employee own records only
  - [x] canCreate() - Admin + Employee (clinic-based)
  - [x] Used in both frontend (UI) and backend (validation)

- [x] **Frontend - API Client** (`src/features/treatment-logs/api.ts`)

  - [x] getCheckedInAppointmentsApi()

- [x] **Frontend - Hooks** (`src/features/treatment-logs/hooks/`)

  - [x] useCheckedInAppointments() - Query hook with staleTime 1 minute
  - [x] useCreateTreatmentLog() - Mutation hook with invalidation
  - [x] useUpdateTreatmentLog() - Mutation hook with invalidation
  - [x] useDeleteTreatmentLog() - Mutation hook with invalidation
  - [x] **Reuse**: useWorkingEmployees(), useClinics() (từ existing features)

- [x] **Frontend - Components** (`src/features/treatment-logs/components/`)

  - [x] TreatmentLogTab - Container with viewMode state (by-date/by-service)
  - [x] TreatmentLogsByAppointment - By-date view (renamed from TreatmentLogCard)
  - [x] TreatmentLogsByService - By-service view (renamed from TreatmentLogServiceCard)
  - [x] TreatmentLogTable - Reusable table component with permissions
  - [x] TreatmentLogModal - Create/edit modal with React Hook Form + Zod
  - [x] Performance: useMemo for serviceGroups, useCallback for all handlers

- [x] **Frontend - Constants** (`src/features/treatment-logs/constants.ts`)

  - [x] TREATMENT_LOG_MESSAGES
  - [x] TREATMENT_LOG_QUERY_KEYS
  - [x] TREATMENT_LOG_ENDPOINTS

- [x] **Integration**
  - [x] Thêm TreatmentLogTab vào CustomerDetailView
  - [x] Tooltip với styles.root (không dùng deprecated overlayStyle)
  - [x] Date format: DD/MM/YYYY HH:mm (with time)
  - [x] Table scroll: x: 1200 (for all columns)

### Phase 2 - Daily View 🔄 TODO

- [ ] **Backend - API Route** (`src/app/api/v1/treatment-logs/daily/route.ts`)

  - [ ] GET handler với date + clinicId params validation
  - [ ] Statistics calculation:
    - [ ] totalCheckedInCustomers (count distinct from Appointment)
    - [ ] totalTreatedCustomers (count distinct from TreatmentLog)
    - [ ] totalTreatmentLogs (count all)
    - [ ] treatmentRate (percentage calculation)
  - [ ] Permission check (Employee auto-filter by clinicId)
  - [ ] Response schema: DailyTreatmentLogsResponseSchema
  - [ ] Include: customer, consultedService, appointment, dentist, assistants

- [ ] **Zod Schema** (`src/shared/validation/treatment-log.schema.ts`)

  - [ ] DailyTreatmentLogsResponseSchema (items + statistics)
  - [ ] GetDailyTreatmentLogsQuerySchema (date + clinicId validation)

- [ ] **Frontend - API Client** (`src/features/treatment-logs/api.ts`)

  - [ ] getDailyTreatmentLogsApi(date: string, clinicId: string)

- [ ] **Frontend - Hook** (`src/features/treatment-logs/hooks/`)

  - [ ] useDailyTreatmentLogs(date, clinicId)
  - [ ] Query key: ["treatment-logs", "daily", date, clinicId]
  - [ ] Caching: staleTime 60s, gcTime 5min, refetchOnWindowFocus true

- [ ] **Frontend - Views** (`src/features/treatment-logs/views/`)

  - [ ] TreatmentLogDailyView - Main container with date/clinic state

- [ ] **Frontend - Components** (`src/features/treatment-logs/components/`)

  - [ ] TreatmentLogStatistics - 4 KPI cards (checked-in, treated, services, rate)
  - [ ] TreatmentLogFilters - Display count + Export button (no refresh needed)
  - [ ] **Reuse TreatmentLogTable** - Pass `showCustomerColumn={true}`, `showAppointmentColumn={false}`
    - [ ] Update existing component với conditional columns props
    - [ ] Customer column (link to customer detail) - show nếu prop = true
    - [ ] NO appointment column for Daily View (redundant)

- [ ] **Frontend - Page** (`src/app/(private)/treatment-logs/page.tsx`)

  - [ ] Create route file với TreatmentLogDailyView component

- [ ] **Navigation - Sidebar Menu**

  - [ ] Add menu item "Lịch sử điều trị"
  - [ ] Icon: MedicineBoxOutlined
  - [ ] Path: /treatment-logs
  - [ ] Position: Sau "Dịch vụ tư vấn" trong section "Quản lý"

- [ ] **Mutations - Query Invalidation Updates**

  - [ ] useCreateTreatmentLog: Add invalidation for ["treatment-logs", "daily"]
  - [ ] useUpdateTreatmentLog: Add invalidation for ["treatment-logs", "daily"]
  - [ ] useDeleteTreatmentLog: Add invalidation for ["treatment-logs", "daily"]

- [ ] **Export to Excel** (Optional Phase 2.1)
  - [ ] handleExport function trong TreatmentLogDailyView
  - [ ] Export columns: Customer, Service, Content, Dentist, Assistants, Status, Time
  - [ ] Filename: `lich-su-dieu-tri-{date}.xlsx`

### Phase 3 - Media Upload (FUTURE)

- [ ] **Image & X-ray Upload**

  - [ ] Image upload UI (imageUrls field)
  - [ ] X-ray upload UI (xrayUrls field)
  - [ ] Supabase Storage integration
  - [ ] Image preview/gallery component
  - [ ] File validation (size, type)

- [x] **Enhanced Permissions** ✅

  - [x] Ownership-based edit/delete (Employee only own records)
  - [x] Admin full access
  - [x] Centralized permission module (shared FE/BE)
  - [ ] Timeline-based restrictions (optional - nếu cần thêm time window)

- [x] **Performance** ✅

  - [x] useMemo for serviceGroups computation
  - [x] useCallback for all handlers
  - [x] Table component memoization
  - [ ] Pagination cho treatment logs (not needed yet - data size small)
  - [ ] Virtual scroll (not needed - Table handles well)

### Testing (CHƯA IMPLEMENT)

- [ ] Unit tests: Zod schema validation
- [ ] Integration tests: API routes + Server Actions
- [ ] E2E tests: Create/Update/Delete flows
- [ ] Edge cases:
  - [x] Service not confirmed → 422 (implemented in service layer)
  - [x] Appointment mismatch customer → 422 (implemented)
  - [x] Appointment not checked-in → 422 (implemented)
  - [x] Derive clinicId from appointment.clinicId (implemented)
  - [x] Group by service với empty logs (implemented - shows all confirmed services)
  - [x] Aggregate status calculation (implemented)

---
