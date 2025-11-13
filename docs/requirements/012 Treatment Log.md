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

## 4. 📊 Customer Detail View

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

### View Mode: By Date (Theo ngày hẹn)

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

### View Mode: By Service (Theo dịch vụ)

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

## 5. API Routes & Server Actions

### API Routes (Queries - GET)

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

## 6. Frontend Architecture

### Hooks

#### `useCheckedInAppointments(customerId: string)`

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

#### `useCreateTreatmentLog()`

**Purpose**: Create treatment log mutation

**Mutation Fn**: `createTreatmentLogAction(data)`

**On Success**:

- Invalidate: `["appointments", "checked-in", customerId]`
- Toast: "Tạo lịch sử điều trị thành công"
- Close modal

**On Error**:

- Toast: Error message (tiếng Việt)

#### `useUpdateTreatmentLog()`

**Purpose**: Update treatment log mutation

**Mutation Fn**: `updateTreatmentLogAction(id, data)`

**On Success**:

- Invalidate: `["appointments", "checked-in", customerId]`
- Toast: "Cập nhật lịch sử điều trị thành công"
- Close modal

**On Error**:

- Toast: Error message

#### `useDeleteTreatmentLog()`

**Purpose**: Delete treatment log mutation

**Mutation Fn**: `deleteTreatmentLogAction(id)`

**On Success**:

- Invalidate: `["appointments", "checked-in", customerId]`
- Toast: "Xóa lịch sử điều trị thành công"

**On Error**:

- Toast: Error message

### Components

#### `TreatmentLogTab`

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

## 7. Types & Schemas

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

## 8. Implementation Checklist

### Phase 1 - Core Features ✅ HOÀN THÀNH

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

### Phase 2 - Advanced Features (CHƯA IMPLEMENT)

- [ ] **Media Upload**

  - [ ] Image upload (imageUrls)
  - [ ] X-ray upload (xrayUrls)
  - [ ] Supabase Storage integration

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

## 9. Những Thay Đổi Quan Trọng So Với Dự Án Cũ

### ✅ Improvements & Changes

**1. Component Naming** (Renamed for clarity):

- ❌ Old: `TreatmentLogCard`, `TreatmentLogServiceCard`
- ✅ New: `TreatmentLogsByAppointment`, `TreatmentLogsByService`
- **Lý do**: Tên mới rõ ràng hơn về chức năng grouping

**2. UI Components** (Table thay Timeline):

- ❌ Old: Ant Design Timeline component
- ✅ New: Custom TreatmentLogTable component
- **Lý do**: Table structure phù hợp hơn cho data tabular, dễ scan, sortable

**3. Card Format** (Consistent sizing):

- ❌ Old: Mixed card sizes
- ✅ New: `size="small"` for all Cards (TreatmentLogsByAppointment & TreatmentLogsByService)
- **Lý do**: Consistent UI, compact display

**4. Tooltip Props** (Ant Design 5 API):

- ❌ Old: `overlayStyle` (deprecated)
- ✅ New: `styles={{ root: { maxWidth: 600 } }}`
- **Lý do**: Follow Ant Design 5 API, avoid deprecation warnings

**5. Required Field Asterisks** (Form.Item API):

- ❌ Old: Manual asterisks in label strings
- ✅ New: `requiredMark` prop on Form + `required` prop on Form.Item
- **Lý do**: Automatic red color, consistent styling

**6. Modal Title** (More context):

- ❌ Old: "Thêm lịch sử điều trị" / "Cập nhật lịch sử điều trị"
- ✅ New: Title + subtitle with appointmentDate
- **Lý do**: User knows which appointment they're working on

**7. Permission System** (Centralized):

- ❌ Old: Inline permission checks scattered in components and services
- ✅ New: `src/shared/permissions/treatment-log.permissions.ts` (pure TypeScript module)
- **Lý do**:
  - Single source of truth
  - Reusable in both frontend (UI) and backend (validation)
  - Consistent permission logic
  - Easy to test and maintain

**8. Sorting Logic** (Backend + Frontend):

- ❌ Old: Frontend-only sorting
- ✅ New:
  - Backend: Appointments sorted by appointmentDateTime DESC
  - Frontend: ServiceGroups sorted by serviceConfirmDate DESC
  - Treatment logs: Always sorted by treatmentDate ASC (oldest first)
- **Lý do**: Proper data ordering from source, reduce client-side computation

**9. Date Display Format** (With time):

- ❌ Old: "DD/MM/YYYY" (date only)
- ✅ New: "DD/MM/YYYY HH:mm" (date + time)
- **Lý do**: Treatment logs need time precision

**10. Table Scrolling** (Responsive):

- ❌ Old: Fixed width, potential overflow issues
- ✅ New: `scroll={{ x: 1200 }}` (calculated from total column widths)
- **Lý do**: Smooth horizontal scroll on smaller screens

**11. Performance Optimization** (React patterns):

- ❌ Old: No memoization
- ✅ New:
  - `useMemo` for `serviceGroups` computation
  - `useCallback` for all handlers
  - Prevents unnecessary re-renders on view mode switch
- **Lý do**: Follow Payment feature pattern, reduce render cycles

**12. View Mode Switch** (Conditional Rendering):

- ⚠️ Current: Conditional rendering causes unmount/mount on switch
- 🔄 Trade-off: Simpler code vs slight "jank" when switching views
- 💡 Future: CSS display toggle if performance becomes critical
- **Decision**: Keep current implementation (conditional) because:
  - Code simpler to maintain
  - Switch không thường xuyên (user chỉ toggle 1-2 lần)
  - Performance impact acceptable (< 100ms)

### 📋 Component Comparison

| Component       | Old Project             | New Project                | Status     |
| --------------- | ----------------------- | -------------------------- | ---------- |
| Container       | TreatmentLogTab         | TreatmentLogTab            | Same ✅    |
| By-date view    | TreatmentLogCard        | TreatmentLogsByAppointment | Renamed ✅ |
| By-service view | TreatmentLogServiceCard | TreatmentLogsByService     | Renamed ✅ |
| Modal           | TreatmentLogModal       | TreatmentLogModal          | Same ✅    |
| Display         | Timeline                | **Table**                  | Changed ✅ |
| Table component | N/A                     | TreatmentLogTable          | **New** ✅ |

### 🔧 Technical Debt & Known Issues

**1. View Mode Switch "Jank"**:

- **Issue**: Slight visual "jump" when switching between by-date and by-service views
- **Root Cause**: Conditional rendering causes complete unmount/mount of component trees
- **Current Status**: Acceptable (not critical)
- **Future Fix**: CSS display toggle (if becomes UX issue)

**2. No Pagination**:

- **Current**: Load all treatment logs for customer
- **Assumption**: Treatment log count per customer remains manageable (< 100)
- **Future**: Add pagination if data grows

**3. No Image/X-ray Upload**:

- **Current**: Schema fields exist (`imageUrls`, `xrayUrls`) but UI not implemented
- **Planned**: Phase 2 feature

---

## 10. Files Đã Tạo Mới (Implementation Reference)

### Backend Files ✅

```
src/shared/
├── validation/
│   └── treatment-log.schema.ts          # Zod schemas (3-layer: Base, Frontend, Backend)
└── permissions/
    └── treatment-log.permissions.ts     # Centralized permission logic (FE + BE)

src/server/
├── repos/
│   └── treatment-log.repo.ts            # Repository pattern (CRUD + findCheckedInAppointments)
├── services/
│   ├── treatment-log.service.ts         # Business logic, validation, mappers
│   └── treatment-log/
│       └── _mappers.ts                  # Response mappers
└── actions/
    └── treatment-log.actions.ts         # Server Actions (auth gate + delegation)

src/app/api/v1/
└── appointments/
    └── checked-in/
        └── route.ts                     # GET /api/v1/appointments/checked-in
```

### Frontend Files ✅

```
src/features/treatment-logs/
├── api.ts                               # API client functions
├── constants.ts                         # Messages, query keys, endpoints
├── index.ts                             # Barrel exports
├── hooks/
│   ├── useCheckedInAppointments.ts      # Query hook
│   ├── useCreateTreatmentLog.ts         # Mutation hook
│   ├── useUpdateTreatmentLog.ts         # Mutation hook
│   └── useDeleteTreatmentLog.ts         # Mutation hook
└── components/
    ├── TreatmentLogTab.tsx              # Container (viewMode, handlers, memoization)
    ├── TreatmentLogsByAppointment.tsx   # By-date view Card
    ├── TreatmentLogsByService.tsx       # By-service view Card
    ├── TreatmentLogTable.tsx            # Reusable Table component
    └── TreatmentLogModal.tsx            # Create/Edit modal (React Hook Form)
```

### Modified Files ✅

```
src/features/customers/
└── views/
    └── CustomerDetailView.tsx           # Added TreatmentLogTab to tabs array

prisma/
└── schema.prisma                        # TreatmentLog model already existed (no changes needed)
```

### Key Metrics

- **Backend Files Created**: 8 files
- **Frontend Files Created**: 11 files
- **Total Lines of Code**: ~2,500 lines
- **Components**: 5 React components
- **Hooks**: 4 React Query hooks
- **API Endpoints**: 1 new route
- **Server Actions**: 3 actions
- **Permission Functions**: 3 functions

---

## 11. Tái Sử Dụng (Reuse) vs Tạo Mới (New)

### ✅ Components/Hooks Đã Có (Reuse)

| Component/Hook           | Location                        | Usage                                 |
| ------------------------ | ------------------------------- | ------------------------------------- |
| `useWorkingEmployees()`  | `features/employees/hooks`      | Dropdown bác sĩ/điều dưỡng            |
| `getWorkingEmployeesApi` | `features/employees/api.ts`     | API call cho working employees        |
| Status Badge patterns    | `features/consulted-services`   | Reference cho treatment status badges |
| Modal patterns           | `features/consulted-services`   | Create/Update modal structure         |
| Customer Detail Tab      | `features/customers/components` | Container pattern cho TreatmentLogTab |
| AppointmentsTab          | `features/customers/components` | Reference cho tab structure           |
| Timeline component       | Ant Design `<Timeline>`         | UI component cho history view         |
| Card component           | Ant Design `<Card>`             | Collapsible cards                     |
| Descriptions component   | Ant Design `<Descriptions>`     | Metadata display                      |
| Switch component         | Ant Design `<Switch>`           | View mode toggle (by-date/by-service) |
| `sessionCache`           | `server/utils/sessionCache.ts`  | Auth gate trong Server Actions        |
| `COMMON_MESSAGES`        | `shared/constants/messages.ts`  | Error messages                        |
| Date formatting          | `dayjs`                         | DD/MM/YYYY HH:mm format               |
| Repository patterns      | `server/repos/*.repo.ts`        | CRUD pattern với Prisma               |
| Service patterns         | `server/services/*.service.ts`  | Business logic layer                  |
| Server Action patterns   | `server/actions/*.actions.ts`   | Auth + delegation pattern             |
| API Route patterns       | `app/api/v1/*/route.ts`         | Standard GET route template           |
| Zod validation patterns  | `shared/validation/*.schema.ts` | 3-layer schema pattern                |
| React Query hooks        | `features/*/hooks/*.ts`         | Query/Mutation hook patterns          |

### 🆕 Components Cần Tạo Mới (New)

#### Backend (New)

1. **API Routes** (chưa có):

   - `app/api/v1/appointments/checked-in/route.ts` - GET checked-in appointments
   - `app/api/v1/treatment-logs/route.ts` - GET treatment logs list
   - `app/api/v1/treatment-logs/[id]/route.ts` - GET single treatment log

2. **Repository** (chưa có):

   - `server/repos/treatment-log.repo.ts` - Complete CRUD
   - Hoặc extend `server/repos/appointment.repo.ts` với method `findCheckedInForTreatment()`

3. **Service** (chưa có):

   - `server/services/treatment-log.service.ts` - Business logic, validation, derivation

4. **Server Actions** (chưa có):

   - `server/actions/treatment-log.actions.ts` - Create/Update/Delete actions

5. **Schemas** (chưa có):
   - `shared/validation/treatment-log.schema.ts` - Complete schemas package

#### Frontend (New)

1. **Feature Folder** (chưa có):

   - `features/treatment-logs/` - Complete feature structure

2. **API Client** (chưa có):

   - `features/treatment-logs/api.ts` - Query functions

3. **Hooks** (chưa có):

   - `features/treatment-logs/hooks/useCheckedInAppointments.ts`
   - `features/treatment-logs/hooks/useCreateTreatmentLog.ts`
   - `features/treatment-logs/hooks/useUpdateTreatmentLog.ts`
   - `features/treatment-logs/hooks/useDeleteTreatmentLog.ts`

4. **Components** (chưa có):

   - `features/treatment-logs/components/TreatmentLogTab.tsx` - Container
   - `features/treatment-logs/components/TreatmentLogCard.tsx` - By-date view
   - `features/treatment-logs/components/TreatmentLogServiceCard.tsx` - By-service view
   - `features/treatment-logs/components/TreatmentLogModal.tsx` - Create/Edit modal

5. **Constants** (chưa có):

   - `features/treatment-logs/constants.ts` - Query keys, endpoints, etc.

6. **Integration** (cần modify):
   - `features/customers/views/CustomerDetailView.tsx` - Add TreatmentLogTab
   - Import và thêm tab mới vào tabs array

### 📝 Key Differences from Old Implementation

| Aspect             | Old Implementation            | New Implementation (Requirements)                        |
| ------------------ | ----------------------------- | -------------------------------------------------------- |
| API Pattern        | All REST APIs                 | Hybrid (GET=API, CUD=Server Actions)                     |
| Schemas            | Scattered validation          | Centralized Zod 3-layer pattern                          |
| Response Structure | Mixed flat/nested             | Consistent nested structure                              |
| Hooks Pattern      | Custom hook `useTreatmentLog` | Separate React Query hooks per action                    |
| Repository Layer   | Missing                       | Proper repo pattern                                      |
| Service Layer      | Missing                       | Proper service pattern                                   |
| Modal Pattern      | Single modal with mode        | Same (good pattern, keep it)                             |
| View Modes         | by-date + by-service          | Same (good feature, keep it)                             |
| Employee Selection | Custom logic                  | Reuse `useWorkingEmployees()`                            |
| Permission Check   | None                          | Auth gate via `getSessionUser()`                         |
| Status Constants   | Hardcoded strings             | Zod enum: "Chưa điều trị", "Đang điều trị", "Hoàn thành" |

### 🎯 Implementation Priority

**Phase 1A - Backend Foundation** (Implement first):

1. Zod schemas
2. Repository layer
3. Service layer
4. API Routes (checked-in appointments + treatment logs)
5. Server Actions

**Phase 1B - Frontend Core** (Then implement):

1. API client
2. React Query hooks
3. TreatmentLogModal component
4. Basic TreatmentLogCard (by-date only)

**Phase 1C - Frontend Advanced**:

1. TreatmentLogServiceCard (by-service view)
2. View mode toggle
3. Integration vào Customer Detail
4. Polish UX (loading, empty states, etc.)

**Phase 2 - Enhancements** (Later):

1. Media upload (images/xrays)
2. Enhanced permissions
3. Performance optimizations
