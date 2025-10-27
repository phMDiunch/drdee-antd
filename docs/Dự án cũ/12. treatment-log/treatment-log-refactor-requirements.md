# Treatment Log Feature - Requirements để Refactor

## 1. Overview

Feature Treatment Log là hệ thống ghi lại lịch sử điều trị chi tiết cho từng dịch vụ nha khoa mà khách hàng đã được tư vấn và check-in.

**Core Concept:**

- Mỗi TreatmentLog gắn với 1 ConsultedService cụ thể
- Mỗi ConsultedService có thể có nhiều TreatmentLogs (nhiều buổi điều trị)
- TreatmentLog thường gắn với 1 Appointment (buổi hẹn đã check-in)
- Track quá trình điều trị: "Đang tiến hành" → "Hoàn tất bước" → "Hoàn tất dịch vụ"

---

## 2. Database Schema

### TreatmentLog Model

```prisma
model TreatmentLog {
  id                 String   @id @default(uuid())

  // Liên kết
  customerId         String
  consultedServiceId String   // Dịch vụ đang được điều trị
  appointmentId      String?  // Lịch hẹn của buổi điều trị này

  // Thông tin lâm sàng
  treatmentDate      DateTime @default(now()) @db.Timestamptz
  treatmentNotes     String   // Nội dung điều trị chi tiết
  nextStepNotes      String?  // Kế hoạch cho buổi tiếp theo
  treatmentStatus    String   // "Đang tiến hành" | "Hoàn tất bước" | "Hoàn tất dịch vụ"

  // Media
  imageUrls          String[] // URLs hình ảnh
  xrayUrls           String[] // URLs phim X-quang

  // Nhân sự
  dentistId          String   // Bác sĩ điều trị chính
  assistant1Id       String?  // Điều dưỡng 1
  assistant2Id       String?  // Điều dưỡng 2
  clinicId           String?

  // Metadata
  createdById        String
  updatedById        String
  createdAt          DateTime
  updatedAt          DateTime

  // Relations
  customer           Customer
  consultedService   ConsultedService
  appointment        Appointment?
  dentist            Employee
  assistant1         Employee?
  assistant2         Employee?
  createdBy          Employee
  updatedBy          Employee
}
```

**Key Relations:**

- `consultedService`: MUST belong to same customer
- `appointment`: MUST belong to same customer (if provided)
- `dentist`: Bác sĩ thực hiện điều trị (required)
- `assistant1/2`: Điều dưỡng hỗ trợ (optional)

---

## 3. Business Rules

### 3.1 Creation Rules

**Prerequisites:**

- Customer MUST have Appointment với status = "Đã check-in"
- Appointment MUST have ConsultedServices với serviceStatus = "Đã chốt"
- ConsultedService MUST belong to customer

**Validation:**

1. `customerId` từ body MUST match `consultedService.customerId`
2. `appointmentId` (if provided) MUST belong to same customer
3. `dentistId` required
4. `treatmentNotes` required
5. `treatmentStatus` defaults to "Đang tiến hành"

**ClinicId Logic:**

```typescript
// Priority order for clinicId
1. Use provided clinicId (if any)
2. Else get from appointment.clinicId
3. Else get from consultedService.clinicId
4. Fallback to null
```

**Auto-derive customerId:**

- Backend derives `customerId` từ `consultedService.customerId`
- Nếu body.customerId khác → log warning nhưng vẫn dùng service's customerId

### 3.2 Update Rules

**Editable Fields:**

- treatmentNotes
- nextStepNotes
- treatmentStatus
- dentistId
- assistant1Id, assistant2Id
- clinicId

**Non-editable Fields:**

- customerId
- consultedServiceId
- appointmentId
- treatmentDate (auto-set on create)
- imageUrls, xrayUrls (future feature)

**No Permission Check:**

- Hiện tại không có permission restriction
- Bất kỳ user nào cũng có thể edit/delete TreatmentLog

### 3.3 Delete Rules

**Current Implementation:**

- Không có permission check
- Bất kỳ user nào cũng có thể delete

**Recommendation:**

- Admin only hoặc createdBy only
- Soft delete thay vì hard delete

### 3.4 Treatment Status Flow

```
"Đang tiến hành" (Yellow)
    ↓
"Hoàn tất bước" (Blue)
    ↓
"Hoàn tất dịch vụ" (Green)
```

**Không enforce strict flow:**

- User có thể set bất kỳ status nào bất kỳ lúc nào
- Frontend suggest flow nhưng không validate

### 3.5 View Modes

**2 cách hiển thị:**

1. **By Date (Theo ngày):**

   - Group treatment logs theo appointment
   - Sort appointments theo appointmentDateTime descending (mới nhất trước)
   - Show: appointmentDate, service, dentist, notes

2. **By Service (Theo dịch vụ):**
   - Group treatment logs theo consultedService
   - Show ALL consultedServices của customer (kể cả chưa có treatment log)
   - Status logic:
     - Chưa bắt đầu: Không có treatment log nào
     - Đang điều trị: Có ít nhất 1 log với status ≠ "Hoàn tất dịch vụ"
     - Hoàn thành: TẤT CẢ logs có status = "Hoàn tất dịch vụ"
   - Sort services A-Z theo tên
   - Sort treatment logs trong service theo treatmentDate ascending (cũ nhất trước)

---

## 4. Backend Architecture

### 4.1 API Routes

#### GET /api/treatment-logs

**Query Params:**

- `customerId`: string (optional)
- `appointmentId`: string (optional)

**Logic:**

- Filter TreatmentLog theo params
- Include: customer, consultedService, appointment, dentist, assistant1, assistant2, createdBy
- Order by createdAt ASC (cũ nhất trước)

**Response:**

```typescript
TreatmentLogWithDetails[]
```

#### POST /api/treatment-logs

**Body:**

```typescript
{
  customerId: string,
  consultedServiceId: string (required),
  appointmentId: string (optional),
  treatmentNotes: string (required),
  nextStepNotes: string (optional),
  treatmentStatus: string (default: "Đang tiến hành"),
  dentistId: string (required),
  assistant1Id: string (optional),
  assistant2Id: string (optional),
  clinicId: string (optional),
  createdById: string (required)
}
```

**Validation Steps:**

1. Check consultedService exists → derive customerId từ service
2. If appointmentId: Check appointment exists + belongs to same customer
3. Determine effective clinicId (priority: provided → appointment → consultedService)
4. Create TreatmentLog với auto-set: imageUrls=[], xrayUrls=[]

**Response:**

- 201 với created TreatmentLog (with includes)
- 400 nếu missing required fields
- 422 nếu foreign key validation fails

#### GET /api/treatment-logs/[id]

**Response:**

- 200 với TreatmentLogWithDetails
- 404 nếu không tìm thấy

#### PUT /api/treatment-logs/[id]

**Body:**

```typescript
{
  treatmentNotes: string (required),
  nextStepNotes: string (optional),
  treatmentStatus: string (required),
  dentistId: string (required),
  assistant1Id: string (optional),
  assistant2Id: string (optional),
  clinicId: string (optional),
  updatedById: string (required)
}
```

**Logic:**

- Update only editable fields
- customerId, consultedServiceId, appointmentId KHÔNG thay đổi

**Response:**

- 200 với updated TreatmentLog
- 400 nếu missing required fields

#### DELETE /api/treatment-logs/[id]

**Logic:**

- Hard delete treatment log
- Không có cascade effects (appointment/consultedService không bị ảnh hưởng)

**Response:**

- 200 với success message
- 404 nếu không tìm thấy

#### GET /api/appointments/checked-in

**Query Params:**

- `customerId`: string (required)

**Purpose:**

- Lấy danh sách appointments đã check-in của customer
- Include: customer.consultedServices, treatmentLogs, treatmentLogs.dentist

**Logic:**

```typescript
WHERE:
  customerId = params.customerId
  status = "Đã check-in"

INCLUDE:
  - customer.consultedServices (serviceStatus = "Đã chốt")
  - customer.consultedServices.treatingDoctor
  - customer.consultedServices.treatmentLogs (với dentist, consultedService)
  - primaryDentist (từ primaryDentistId)

ORDER BY:
  appointmentDateTime DESC (mới nhất trước)
```

**Response:**

```typescript
AppointmentForTreatment[]
```

**Used by:**

- TreatmentLogTab để fetch appointments + services + existing treatment logs

### 4.2 No Repository/Service Layer

Treatment Log hiện tại KHÔNG có repo/service layer. Logic nằm trực tiếp trong API routes.

**Refactor cần:**

- `treatmentLogRepository.ts`:

  - `getTreatmentLogs(filters)`
  - `getTreatmentLogById(id)`
  - `createTreatmentLog(data)`
  - `updateTreatmentLog(id, data)`
  - `deleteTreatmentLog(id)`

- `treatmentLogService.ts`:
  - Validate consultedService belongs to customer
  - Validate appointment belongs to customer
  - Determine effective clinicId
  - Handle permission checks (future)

---

## 5. Frontend Architecture

### 5.1 Types

```typescript
// src/features/treatment-log/type.ts

type TreatmentLog = {
  id: string;
  customerId: string;
  consultedServiceId: string;
  appointmentId?: string;
  treatmentDate: Date;
  treatmentNotes: string;
  nextStepNotes?: string;
  treatmentStatus: string;
  imageUrls: string[];
  xrayUrls: string[];
  dentistId: string;
  assistant1Id?: string;
  assistant2Id?: string;
  clinicId?: string;
  createdById: string;
  updatedById: string;
  createdAt: Date;
  updatedAt: Date;
};

type TreatmentLogWithDetails = TreatmentLog & {
  customer: { id; fullName; customerCode };
  consultedService: {
    id;
    consultedServiceName;
    consultedServiceUnit;
    treatingDoctor?: { id; fullName };
  };
  appointment?: { id; appointmentDateTime; status };
  dentist: { id; fullName };
  assistant1?: { id; fullName };
  assistant2?: { id; fullName };
  createdBy: { id; fullName };
};

type AppointmentForTreatment = {
  id: string;
  appointmentDateTime: Date;
  status: string;
  customer: {
    id: string;
    fullName: string;
    consultedServices: {
      id: string;
      consultedServiceName: string;
      serviceStatus: string;
      treatingDoctor?: { id; fullName };
    }[];
  };
  primaryDentist: { id; fullName };
  treatmentLogs: TreatmentLogWithDetails[];
};

type ServiceGroup = {
  consultedServiceId: string;
  consultedServiceName: string;
  consultedServiceUnit: string;
  treatingDoctorName: string;
  serviceStatus: "Chưa bắt đầu" | "Đang điều trị" | "Hoàn thành";
  treatmentLogs: TreatmentLogWithDetails[];
};
```

### 5.2 Hooks

#### useTreatmentLog()

**Purpose:** Handle CRUD operations và fetch checked-in appointments

**State:**

```typescript
const [loading, setLoading] = useState(false);
const [appointments, setAppointments] = useState<AppointmentForTreatment[]>([]);
```

**Functions:**

- `fetchCheckedInAppointments(customerId)`: Fetch từ `/api/appointments/checked-in`
- `createTreatmentLog(data)`: POST to `/api/treatment-logs`
- `updateTreatmentLog(id, data)`: PUT to `/api/treatment-logs/[id]`
- `deleteTreatmentLog(id)`: DELETE to `/api/treatment-logs/[id]`

**Error Handling:**

- Parse error message từ response.json().error
- Fallback to response.statusText
- Throw error để caller handle

**Return:**

```typescript
{
  loading: boolean,
  appointments: AppointmentForTreatment[],
  fetchCheckedInAppointments: (customerId) => Promise<AppointmentForTreatment[]>,
  createTreatmentLog: (data) => Promise<TreatmentLog>,
  updateTreatmentLog: (id, data) => Promise<TreatmentLog>,
  deleteTreatmentLog: (id) => Promise<void>
}
```

### 5.3 Components

#### TreatmentLogTab

**Props:** `customerId: string`

**Purpose:** Main container cho treatment log feature trong Customer Detail

**State:**

```typescript
const [viewMode, setViewMode] = useState<"by-date" | "by-service">("by-date");
const [modal, setModal] = useState({ open, mode, appointmentId, initialData });
const [saving, setSaving] = useState(false);
```

**Logic:**

1. Fetch checked-in appointments on mount
2. Extract consulted services từ appointments
3. Group data theo viewMode:
   - **by-date:** Group theo appointment, sort DESC
   - **by-service:** Group theo consultedService, show ALL services (kể cả chưa có log), calculate aggregate status
4. Handle modal open/close/submit
5. Refresh data sau khi create/update/delete

**View Mode Toggle:**

```tsx
<Switch
  checkedChildren={<MedicineBoxOutlined />}
  unCheckedChildren={<CalendarOutlined />}
  checked={viewMode === "by-service"}
  onChange={(checked) => setViewMode(checked ? "by-service" : "by-date")}
/>
```

**Render Logic:**

```tsx
{
  viewMode === "by-date"
    ? appointments.map((appointment) => (
        <TreatmentLogCard
          appointment={appointment}
          onAddTreatment={() => handleAddTreatment(appointment.id)}
          onEditTreatment={handleEditTreatment}
          onDeleteTreatment={handleDeleteTreatment}
        />
      ))
    : groupByService().map((serviceGroup) => (
        <TreatmentLogServiceCard
          serviceGroup={serviceGroup}
          onEditTreatment={handleEditTreatment}
          onDeleteTreatment={handleDeleteTreatment}
        />
      ));
}
```

**groupByService() Logic:**

```typescript
1. Get ALL consultedServices từ appointments[0].customer.consultedServices
2. Initialize serviceMap với all services (status = "Chưa bắt đầu", logs = [])
3. Loop appointments → treatmentLogs → add to serviceMap
4. Calculate aggregate status:
   - Chưa bắt đầu: logs.length === 0
   - Đang điều trị: logs.some(log => log.treatmentStatus !== "Hoàn tất dịch vụ")
   - Hoàn thành: logs.every(log => log.treatmentStatus === "Hoàn tất dịch vụ")
5. Sort logs trong mỗi service theo treatmentDate ASC
6. Sort services A-Z theo consultedServiceName
```

#### TreatmentLogCard

**Props:**

- `appointment: AppointmentForTreatment`
- `onAddTreatment: () => void`
- `onEditTreatment: (log) => void`
- `onDeleteTreatment: (log) => void`

**Features:**

- Card header: Appointment date, primary dentist, "Thêm điều trị" button
- Timeline của treatment logs (sort by treatmentDate ASC)
- Each log: service name, dentist, status badge, notes, actions (edit/delete)
- Collapsible card

#### TreatmentLogServiceCard

**Props:**

- `serviceGroup: ServiceGroup`
- `onEditTreatment: (log) => void`
- `onDeleteTreatment: (log) => void`

**Features:**

- Card header: Service name, treating doctor, status badge
- Status badge colors:
  - Chưa bắt đầu: Gray
  - Đang điều trị: Yellow
  - Hoàn thành: Green
- Timeline của treatment logs (sorted ASC)
- Empty state nếu chưa có logs: "Chưa có lịch sử điều trị cho dịch vụ này"

#### TreatmentLogModal

**Props:**

- `open: boolean`
- `mode: "add" | "edit"`
- `appointmentId?: string`
- `customerId?: string`
- `appointmentDate?: string`
- `initialData?: Partial<TreatmentLogWithDetails>`
- `consultedServices: Array<{id, consultedServiceName, consultedServiceUnit}>`
- `onCancel: () => void`
- `onFinish: (values) => void`
- `loading?: boolean`

**Form Fields:**

1. **consultedServiceId** (Select, required):

   - Options: consultedServices từ props
   - Disabled trong edit mode
   - Show service name + unit

2. **treatmentNotes** (TextArea, required):

   - 4 rows
   - Placeholder: "Mô tả chi tiết quá trình điều trị..."

3. **nextStepNotes** (TextArea, optional):

   - 3 rows
   - Placeholder: "Ghi chú cho buổi hẹn tiếp theo..."

4. **dentistId** (Select, required):

   - Options: activeEmployees
   - Default: employeeProfile.id (current user)

5. **assistant1Id, assistant2Id** (Select, optional):

   - Options: activeEmployees

6. **treatmentStatus** (Select, required):

   - Options: TREATMENT_STATUS_OPTIONS
   - Default: "Đang tiến hành"

7. **clinicId** (Select, required):
   - Options: clinics từ `/api/clinics`
   - Default: employeeProfile.clinicId

**Form Initialization:**

```typescript
// Add mode
form.setFieldsValue({
  appointmentId: props.appointmentId,
  dentistId: employeeProfile.id,
  treatmentStatus: "Đang tiến hành",
  clinicId: employeeProfile.clinicId,
});

// Edit mode
form.setFieldsValue({
  consultedServiceId: initialData.consultedServiceId,
  treatmentNotes: initialData.treatmentNotes,
  nextStepNotes: initialData.nextStepNotes,
  treatmentStatus: initialData.treatmentStatus,
  dentistId: initialData.dentistId,
  assistant1Id: initialData.assistant1Id,
  assistant2Id: initialData.assistant2Id,
  clinicId: initialData.clinicId,
});
```

**Submit Handler:**

```typescript
const handleFinish = (values) => {
  const submitData = {
    ...values,
    customerId: props.customerId,
    appointmentId: props.appointmentId,
    createdById: employeeProfile.id,
    updatedById: employeeProfile.id,
  };
  onFinish(submitData);
};
```

### 5.4 Integration với Customer Feature

**Location:** `src/features/customers/pages/CustomerDetailPage.tsx`

**Integration:**

- Tab "Lịch sử điều trị" với icon
- Content: `<TreatmentLogTab customerId={customerId} />`
- Tab count: `customer.treatmentLogs.length` (if available)

**Customer Type:**

```typescript
type Customer = {
  id: string;
  fullName: string;
  // ... other fields
  treatmentLogs?: TreatmentLog[];
};
```

---

## 6. Constants

```typescript
// src/features/treatment-log/constants.ts

export const TREATMENT_STATUS_OPTIONS = [
  { label: "Đang tiến hành", value: "Đang tiến hành", color: "#faad14" }, // Yellow
  { label: "Hoàn tất bước", value: "Hoàn tất bước", color: "#1890ff" }, // Blue
  { label: "Hoàn tất dịch vụ", value: "Hoàn tất dịch vụ", color: "#52c41a" }, // Green
];

export const DEFAULT_TREATMENT_STATUS = "Đang tiến hành";
```

---

## 7. Key Implementation Points

### 7.1 CustomerId Auto-derive Pattern

**Problem:** Body.customerId có thể mismatch với consultedService.customerId

**Solution:**

```typescript
// Backend always derives customerId from consultedService
const consulted = await prisma.consultedService.findUnique({
  where: { id: consultedServiceId },
  select: { customerId: true }
})

const effectiveCustomerId = consulted.customerId

// Log warning if body.customerId differs
if (customerId && consulted.customerId !== customerId) {
  console.warn("Mismatch customerId", { body: customerId, service: consulted.customerId })
}

// Always use effectiveCustomerId
await prisma.treatmentLog.create({
  data: { customerId: effectiveCustomerId, ... }
})
```

### 7.2 ClinicId Determination Logic

**Priority:**

```typescript
1. Use provided clinicId (if any)
2. Else get from appointment.clinicId (if appointmentId provided)
3. Else get from consultedService.clinicId
4. Fallback to null
```

**Implementation:**

```typescript
let effectiveClinicId = null;

if (clinicId) {
  effectiveClinicId = clinicId;
} else if (appointmentId) {
  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: { clinicId: true },
  });
  effectiveClinicId = appt?.clinicId;
}

if (!effectiveClinicId) {
  const consulted = await prisma.consultedService.findUnique({
    where: { id: consultedServiceId },
    select: { clinicId: true },
  });
  effectiveClinicId = consulted?.clinicId;
}
```

### 7.3 View Mode - By Service Status Calculation

**Logic:**

```typescript
const serviceStatus = (() => {
  if (treatmentLogs.length === 0) return "Chưa bắt đầu";

  const hasIncomplete = treatmentLogs.some(
    (log) => log.treatmentStatus !== "Hoàn tất dịch vụ"
  );

  return hasIncomplete ? "Đang điều trị" : "Hoàn thành";
})();
```

**Display:**

- Chưa bắt đầu: Gray badge, empty state message
- Đang điều trị: Yellow badge, timeline với logs
- Hoàn thành: Green badge, timeline với logs (all completed)

### 7.4 Form State Management

**Challenge:** Modal form values không update đúng khi switch giữa add/edit

**Solution:**

```typescript
// Reset form khi modal đóng
useEffect(() => {
  if (!open) {
    form.resetFields();
  }
}, [open]);

// Set form values sau khi ALL dependencies ready
useEffect(() => {
  if (open && !loadingClinics && consultedServices.length > 0) {
    form.resetFields(); // Reset trước khi set values mới

    if (mode === "add") {
      form.setFieldsValue({
        dentistId,
        clinicId,
        treatmentStatus: "Đang tiến hành",
      });
    } else {
      form.setFieldsValue(initialData);
    }
  }
}, [open, mode, initialData, loadingClinics, consultedServices.length]);

// Use requestAnimationFrame để verify values
requestAnimationFrame(() => {
  const values = form.getFieldsValue();
  console.log("Verified form values:", values);
});
```

### 7.5 Checked-in Appointments API

**Purpose:** Lấy appointments + services + existing treatment logs trong 1 request

**Includes Structure:**

```typescript
{
  id: appointmentId,
  appointmentDateTime: Date,
  status: "Đã check-in",
  customer: {
    id: customerId,
    fullName: string,
    consultedServices: [
      {
        id: serviceId,
        consultedServiceName: string,
        serviceStatus: "Đã chốt",
        treatingDoctor: { id, fullName },
        treatmentLogs: [
          {
            id: logId,
            treatmentNotes: string,
            dentist: { id, fullName },
            consultedService: { id, consultedServiceName }
          }
        ]
      }
    ]
  },
  primaryDentist: { id, fullName }
}
```

**Benefits:**

- 1 API call thay vì nhiều calls
- Có tất cả data cần thiết cho cả 2 view modes
- treatmentLogs already joined với dentist + consultedService

---

## 8. Checklist để Code lại

### Backend

- [ ] Tạo `treatmentLogRepository.ts`:

  - [ ] `getTreatmentLogs(filters)`
  - [ ] `getTreatmentLogById(id)`
  - [ ] `createTreatmentLog(data)`
  - [ ] `updateTreatmentLog(id, data)`
  - [ ] `deleteTreatmentLog(id)`

- [ ] Tạo `treatmentLogService.ts`:

  - [ ] `validateConsultedService(consultedServiceId, customerId)`
  - [ ] `validateAppointment(appointmentId, customerId)`
  - [ ] `determineEffectiveClinicId(clinicId, appointmentId, consultedServiceId)`
  - [ ] `createTreatmentLog(input)` với validation
  - [ ] `updateTreatmentLog(id, input)` với validation

- [ ] Refactor API routes:

  - [ ] Add Zod schemas cho request validation
  - [ ] Use service layer thay vì direct Prisma calls
  - [ ] Add permission checks (admin/creator only for delete)
  - [ ] Consistent error messages

- [ ] Add soft delete support:
  - [ ] Add `deletedAt` field to schema
  - [ ] Update queries để exclude deleted records
  - [ ] DELETE route chỉ set deletedAt instead of hard delete

### Frontend

- [ ] Refactor hooks:

  - [ ] Convert to React Query (useQuery, useMutation)
  - [ ] Proper cache invalidation
  - [ ] Optimistic updates
  - [ ] Error handling with toast

- [ ] Refactor components:

  - [ ] Extract common Timeline component
  - [ ] Extract StatusBadge component
  - [ ] Consistent loading states
  - [ ] Empty states với illustrations

- [ ] Form improvements:

  - [ ] Add image upload UI (imageUrls field)
  - [ ] Add X-ray upload UI (xrayUrls field)
  - [ ] Add date picker cho treatmentDate (edit mode)
  - [ ] Validate consultedService belongs to checked-in appointment

- [ ] View mode enhancements:
  - [ ] Add filter: by dentist, by status, by date range
  - [ ] Add search: by service name, by notes
  - [ ] Add sort options
  - [ ] Export to PDF/Excel

### Testing

- [ ] Test customerId auto-derive logic
- [ ] Test clinicId determination priority
- [ ] Test appointment validation (same customer)
- [ ] Test consultedService validation (same customer, serviceStatus = "Đã chốt")
- [ ] Test view mode status calculations
- [ ] Test form state management (add vs edit)
- [ ] Test concurrent create/edit operations

### Permission System (Future)

- [ ] Define roles: admin, doctor, assistant
- [ ] Admin: Full CRUD
- [ ] Doctor: Create/Edit own logs, View all
- [ ] Assistant: View only
- [ ] Creator: Edit/Delete own logs within 24h

---

## 9. Data Flow Diagrams

### Create Treatment Log Flow

```
Customer Detail Page → Click "Thêm điều trị" on Appointment Card →
Modal opens (mode="add") →
Fetch clinics + consultedServices (already loaded từ appointments) →
Form pre-fills: appointmentId, dentistId (current user), clinicId (current user) →
User selects: consultedService, fills treatmentNotes, selects status →
Submit →
API: POST /api/treatment-logs →
Backend:
  1. Validate consultedService exists + get customerId
  2. Validate appointment belongs to same customer (if provided)
  3. Determine effective clinicId
  4. Create TreatmentLog
  5. Return created log with includes
→ Frontend:
  1. Toast success
  2. Close modal
  3. Refetch appointments (include new treatment log)
  4. Refresh view
```

### Edit Treatment Log Flow

```
Customer Detail Page (any view mode) → Click "Sửa" on Treatment Log →
Modal opens (mode="edit", initialData=treatmentLog) →
Form pre-fills ALL fields từ initialData →
User edits: treatmentNotes, nextStepNotes, treatmentStatus, dentist, assistants →
Submit →
API: PUT /api/treatment-logs/[id] →
Backend:
  1. Validate required fields
  2. Update treatment log (only editable fields)
  3. Return updated log with includes
→ Frontend:
  1. Toast success
  2. Close modal
  3. Refetch appointments
  4. Refresh view
```

### View Mode - By Service Flow

```
TreatmentLogTab loads →
Fetch checked-in appointments →
Extract all consultedServices từ appointments[0].customer.consultedServices →
Initialize serviceMap với ALL services (status="Chưa bắt đầu", logs=[]) →
Loop appointments → treatmentLogs → Add to serviceMap →
Calculate aggregate status per service:
  - logs.length === 0 → "Chưa bắt đầu"
  - some log with status ≠ "Hoàn tất" → "Đang điều trị"
  - all logs "Hoàn tất" → "Hoàn thành"
→ Sort services A-Z →
Render TreatmentLogServiceCard for each service →
  Show status badge + timeline of logs (or empty state)
```

---

## 10. Future Enhancements

### Image/X-ray Upload

- Add upload UI trong TreatmentLogModal
- Store images in cloud storage (S3, Cloudinary)
- Save URLs to imageUrls[], xrayUrls[] arrays
- Display gallery trong TreatmentLogCard/ServiceCard
- Lightbox để view full-size images

### Treatment Templates

- Pre-defined treatment note templates per service type
- Quick-fill buttons: "Cạo vôi răng", "Hàn răng", "Nhổ răng", etc.
- Customizable templates per clinic

### Treatment Plans

- Link multiple treatment logs to a treatment plan
- Track overall progress: X/Y sessions completed
- Estimated completion date
- Notifications when plan is overdue

### Notifications

- Notify dentist khi có appointment check-in
- Remind to fill treatment notes after appointment
- Alert when service is nearing completion

### Analytics

- Treatment completion rate per dentist
- Average sessions per service type
- Time-to-completion metrics
- Most common treatment combinations

---

**Tổng kết:** Treatment Log là feature ghi nhận chi tiết quá trình điều trị, gắn với ConsultedService và Appointment đã check-in. Key features: 2 view modes (by date vs by service), status tracking, multi-dentist/assistant support, và validation logic phức tạp (customerId auto-derive, clinicId priority). Hiện tại chưa có permission system và image upload - cả 2 đều là future enhancements.
