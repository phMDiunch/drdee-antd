# Treatment Care Feature - Requirements để Refactor

## 1. Overview

Feature Treatment Care là hệ thống **chăm sóc khách hàng sau điều trị**, ghi lại việc liên lạc và theo dõi tình trạng của khách hàng sau các buổi điều trị.

**Core Concept:**

- Sau khi customer có TreatmentLog trong ngày X, staff gọi điện chăm sóc và ghi lại
- 1 customer có thể được chăm sóc nhiều lần trong 1 ngày điều trị
- Snapshot data từ TreatmentLogs (service names, doctor names) để tránh join queries
- Track status: STABLE (Ổn định), UNREACHABLE (Không liên lạc được), NEEDS_FOLLOW_UP (Cần theo dõi)

**Use Case:**

- Staff xem danh sách customers đã điều trị trong ngày X
- Gọi điện chăm sóc từng customer → Ghi lại nội dung + status
- View lịch sử chăm sóc: by day (grouped) hoặc by customer

---

## 2. Database Schema

### TreatmentCare Model

```prisma
model TreatmentCare {
  id            String   @id @default(uuid())

  // Liên kết
  customerId    String
  customer      Customer

  // Reporting scope: theo nhân viên chăm sóc + clinic
  clinicId      String
  careStaffId   String   // Nhân viên thực hiện chăm sóc
  careStaff     Employee

  // Ngày nghiệp vụ
  treatmentDate DateTime @db.Date        // Ngày điều trị (date-only)
  careAt        DateTime @db.Timestamptz // Thời điểm chăm sóc (timestamp)

  // Nội dung & Trạng thái
  careContent   String
  careStatus    TreatmentCareStatus // STABLE | UNREACHABLE | NEEDS_FOLLOW_UP

  // Snapshot (gộp từ TreatmentLogs của treatmentDate)
  treatmentServiceNames String[] // Tên dịch vụ được điều trị
  treatingDoctorNames   String[] // Tên bác sĩ điều trị
  treatingDoctorIds     String[] // IDs bác sĩ
  treatmentClinicIds    String[] // IDs clinics

  // Audit
  createdById   String
  updatedById   String
  createdAt     DateTime
  updatedAt     DateTime

  createdBy     Employee
  updatedBy     Employee

  // Indexes
  @@index([clinicId, treatmentDate])
  @@index([clinicId, careAt])
  @@index([careStaffId, careAt])
  @@index([customerId, treatmentDate])
}

enum TreatmentCareStatus {
  STABLE           // Ổn định
  UNREACHABLE      // Không liên lạc được
  NEEDS_FOLLOW_UP  // Cần theo dõi
}
```

**Key Design Decisions:**

1. **treatmentDate vs careAt:**

   - `treatmentDate`: Ngày điều trị (date-only) - business key
   - `careAt`: Thời điểm chăm sóc (timestamp) - audit trail
   - Example: Customer điều trị 2024-10-15, staff gọi chăm sóc 2024-10-16 09:30 AM
     - treatmentDate = 2024-10-15
     - careAt = 2024-10-16T09:30:00+07:00

2. **Snapshot Arrays:**

   - Lưu trữ denormalized data từ TreatmentLogs
   - Tránh phải join TreatmentLog + ConsultedService + Employee khi query
   - Trade-off: Data có thể stale nếu TreatmentLog bị sửa/xóa sau khi tạo TreatmentCare

3. **clinicId:**
   - Scope cho reporting (filter by clinic)
   - Derived từ careStaff.clinicId hoặc x-clinic-id header

---

## 3. Business Rules

### 3.1 Creation Rules

**Prerequisites:**

- Customer MUST have at least 1 TreatmentLog on `treatmentDate`
- `careAt` MUST be >= `treatmentDate` (cùng ngày hoặc sau)

**Validation:**

```typescript
1. Check TreatmentLog exists cho (customerId, treatmentDate)
2. If no TreatmentLog found → Error: "Không tìm thấy TreatmentLog cho ngày điều trị"
3. careAt >= treatmentDate.startOf("day")
4. careStatus MUST be valid enum value
```

**Snapshot Generation:**

```typescript
// Query TreatmentLogs trong treatmentDate
const logs = await prisma.treatmentLog.findMany({
  where: {
    customerId,
    treatmentDate: { gte: dayStart, lte: dayEnd },
  },
  include: {
    consultedService: { select: { consultedServiceName: true } },
    dentist: { select: { id, fullName } },
  },
});

// Build snapshots
const serviceSet = new Set<string>();
const doctorNameSet = new Set<string>();
const doctorIdSet = new Set<string>();
const clinicIdSet = new Set<string>();

logs.forEach((log) => {
  if (log.consultedService?.consultedServiceName)
    serviceSet.add(log.consultedService.consultedServiceName.trim());
  if (log.dentist?.fullName) doctorNameSet.add(log.dentist.fullName.trim());
  if (log.dentist?.id) doctorIdSet.add(log.dentist.id);
  if (log.clinicId) clinicIdSet.add(log.clinicId);
});

// Store as arrays
treatmentServiceNames = Array.from(serviceSet);
treatingDoctorNames = Array.from(doctorNameSet);
treatingDoctorIds = Array.from(doctorIdSet);
treatmentClinicIds = Array.from(clinicIdSet);
```

**ClinicId Determination:**

```typescript
// Priority
1. Use x-clinic-id header (if provided)
2. Else get from careStaff.clinicId
3. Error if cannot determine
```

### 3.2 Update Rules

**Current Implementation:**

- NO UPDATE endpoint
- TreatmentCare is immutable after creation

**Recommendation:**

- Add PUT endpoint for updating `careContent` and `careStatus`
- Restrict edit: only creator within same day (like delete)

### 3.3 Delete Rules

**Permission:**

- **Admin:** Can delete any record
- **Non-admin:** Can only delete own records (careStaffId = employeeId) và only on same VN day (careAt.date === today)

**Validation:**

```typescript
if (role !== "admin") {
  if (record.careStaffId !== employeeId) {
    throw "Không có quyền xóa";
  }

  const nowVN = dayjs().tz("Asia/Ho_Chi_Minh");
  const careDay = dayjs(record.careAt).tz("Asia/Ho_Chi_Minh");

  if (!careDay.isSame(nowVN, "day")) {
    throw "Chỉ được xóa trong ngày tạo";
  }
}
```

### 3.4 Query Patterns

**3 modes:**

1. **By Customer (History View):**

   - Query: `?customerId={id}`
   - Return: TreatmentCareRecord[] sorted by careAt DESC (newest first)
   - Use case: Customer detail page - lịch sử chăm sóc

2. **By Date Range (Grouped by Day):**

   - Query: `?from={YYYY-MM-DD}&to={YYYY-MM-DD}&groupBy=day`
   - Return: `{ day: "YYYY-MM-DD", items: TreatmentCareRecord[] }[]`
   - Sort: Days DESC (newest first)
   - Use case: Nhật ký chăm sóc page

3. **Get Customers Needing Care:**
   - Endpoint: `/api/treatment-cares/customers?date={YYYY-MM-DD}`
   - Logic:
     1. Find all TreatmentLogs on `date`
     2. Group by customer
     3. Build snapshot (serviceNames, doctorNames)
     4. Count existing TreatmentCare records for each customer on `date`
   - Return: TreatmentCareCustomer[] với careCount badge
   - Use case: "Khách hàng cần chăm sóc" tab

### 3.5 Filters

**Available filters:**

- `customerId`: Per-customer history
- `from`, `to`: Date range
- `groupBy`: "day" (default)
- `onlyMine`: boolean - Only show records created by current user
- `clinicId`: Filter by clinic (admin only)

**Scope Logic:**

```typescript
// Non-admin: force own clinic
const clinicId =
  role !== "admin" ? profileClinicId : clinicIdFilter || profileClinicId;

// onlyMine filter
const where = {
  ...(onlyMine && employeeId ? { careStaffId: employeeId } : {}),
};
```

---

## 4. Backend Architecture

### 4.1 API Routes

#### GET /api/treatment-cares

**Query Params:**

- `customerId`: string (optional)
- `from`: YYYY-MM-DD (optional, default: 34 days ago)
- `to`: YYYY-MM-DD (optional, default: today)
- `groupBy`: "day" (optional)
- `onlyMine`: "true" | "false" (optional)
- `clinicId`: string (optional, admin only)

**Headers:**

- `x-employee-role`: "admin" | other
- `x-employee-id`: string
- `x-clinic-id`: string

**Logic:**

**Case 1: customerId provided**

```typescript
// Return history for specific customer
const records = await prisma.treatmentCare.findMany({
  where: {
    customerId,
    ...(clinicId ? { clinicId } : {}),
    ...(onlyMine ? { careStaffId: employeeId } : {}),
  },
  include: { careStaff: { select: { id, fullName } } },
  orderBy: { careAt: "desc" },
});

return records;
```

**Case 2: No customerId (date range query)**

```typescript
// Calculate date range (default: last 35 days)
const toDay = to ? dayjs.tz(to, VN_TZ) : dayjs().tz(VN_TZ);
const fromDay = from ? dayjs.tz(from, VN_TZ) : toDay.subtract(34, "day");

// Query with filters
const records = await prisma.treatmentCare.findMany({
  where: {
    careAt: {
      gte: fromDay.startOf("day").toDate(),
      lte: toDay.endOf("day").toDate(),
    },
    ...(clinicId ? { clinicId } : {}),
    ...(onlyMine ? { careStaffId: employeeId } : {}),
  },
  include: {
    customer: { select: { id, customerCode, fullName, phone } },
    careStaff: { select: { id, fullName } },
  },
  orderBy: { careAt: "desc" },
});

// If groupBy=day, group records
if (groupBy === "day") {
  const groups = {};
  records.forEach((r) => {
    const key = dayjs(r.careAt).tz(VN_TZ).format("YYYY-MM-DD");
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  });

  // Sort days DESC
  const payload = Object.keys(groups)
    .sort((a, b) => (a < b ? 1 : -1))
    .map((day) => ({ day, items: groups[day] }));

  return payload;
}

return records;
```

**Response Types:**

- customerId mode: `TreatmentCareRecord[]`
- groupBy=day mode: `{ day: string, items: TreatmentCareRecord[] }[]`
- default: `TreatmentCareRecord[]`

#### POST /api/treatment-cares

**Body:**

```typescript
{
  customerId: string (required),
  treatmentDate: string (required), // YYYY-MM-DD
  careAt: string (required),        // ISO timestamp
  careStatus: string (required),    // "STABLE" | "UNREACHABLE" | "NEEDS_FOLLOW_UP"
  careContent: string (required)
}
```

**Headers:**

- `x-employee-id`: string (required)
- `x-clinic-id`: string (optional)

**Logic:**

1. Parse dates với VN timezone
2. Validate careAt >= treatmentDate
3. Query TreatmentLogs on treatmentDate để verify customer có điều trị
4. Build snapshots từ TreatmentLogs
5. Determine clinicId (priority: header → careStaff.clinicId)
6. Coerce careStatus to enum
7. Create TreatmentCare record

**Response:**

- 201 với created record
- 400 nếu missing fields hoặc careAt < treatmentDate
- 401 nếu missing x-employee-id
- 422 nếu không tìm thấy TreatmentLog

#### DELETE /api/treatment-cares/[id]

**Headers:**

- `x-employee-role`: string
- `x-employee-id`: string

**Logic:**

```typescript
const record = await prisma.treatmentCare.findUnique({ where: { id } })
if (!record) return 404

if (role !== "admin") {
  // Check ownership
  if (record.careStaffId !== employeeId) return 403

  // Check same day
  const nowVN = dayjs().tz("Asia/Ho_Chi_Minh")
  const careDay = dayjs(record.careAt).tz("Asia/Ho_Chi_Minh")

  if (!careDay.isSame(nowVN, "day")) {
    return 403: "Chỉ được xóa trong ngày tạo"
  }
}

await prisma.treatmentCare.delete({ where: { id } })
return 200
```

#### GET /api/treatment-cares/customers

**Query Params:**

- `date`: YYYY-MM-DD (required)
- `keyword`: string (optional) - Search by customerCode, fullName, phone
- `clinicId`: string (optional, admin only)

**Headers:**

- `x-employee-role`: string
- `x-clinic-id`: string

**Purpose:** Get list of customers who had treatment on `date` và need care calls

**Logic:**

```typescript
1. Query TreatmentLogs on date (filtered by clinicId)
2. Filter by keyword (if provided)
3. Group by customer:
   - Collect unique service names
   - Collect unique doctor names
4. Count existing TreatmentCare records per customer on date (for badge)
5. Return TreatmentCareCustomer[] sorted by customerName A-Z
```

**Response:**

```typescript
TreatmentCareCustomer[] = {
  customerId: string,
  customerCode: string | null,
  customerName: string,
  phone: string | null,
  treatmentDate: string, // YYYY-MM-DD
  treatmentServiceNames: string[],
  treatingDoctorNames: string[],
  careCount: number // Badge số lần đã chăm sóc
}
```

### 4.2 No Repository/Service Layer

Treatment Care hiện tại KHÔNG có repo/service layer. Logic nằm trực tiếp trong API routes.

**Refactor cần:**

- `treatmentCareRepository.ts`:

  - `getTreatmentCareRecords(filters)`
  - `getTreatmentCareById(id)`
  - `createTreatmentCare(data)`
  - `deleteTreatmentCare(id, userId, role)`
  - `getCustomersNeedingCare(date, clinicId?)`

- `treatmentCareService.ts`:
  - `buildTreatmentSnapshots(customerId, treatmentDate)` - Extract snapshot logic
  - `validateCarePermission(record, userId, role)` - Permission check logic
  - `determineClinicId(headerClinicId, careStaffId)` - ClinicId logic

---

## 5. Frontend Architecture

### 5.1 Types

```typescript
// src/features/treatment-care/type.ts

type TreatmentCareCustomer = {
  customerId: string;
  customerCode: string | null;
  customerName: string;
  phone: string | null;
  treatmentDate: string; // YYYY-MM-DD
  treatmentServiceNames: string[];
  treatingDoctorNames: string[];
  careCount: number; // Badge: số lần đã chăm sóc
};

type TreatmentCareRecord = {
  id: string;
  customerId: string;
  clinicId: string;
  careStaffId: string;
  treatmentDate: string; // YYYY-MM-DD
  careAt: string; // ISO timestamp
  careStatus: "STABLE" | "UNREACHABLE" | "NEEDS_FOLLOW_UP";
  careContent: string;
  treatmentServiceNames: string[];
  treatingDoctorNames: string[];
  treatingDoctorIds: string[];
  treatmentClinicIds: string[];
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    customerCode: string | null;
    fullName: string;
    phone: string | null;
  };
  careStaff?: { id: string; fullName: string };
};

type TreatmentCareGroupedByDay = Array<{
  day: string; // YYYY-MM-DD
  items: TreatmentCareRecord[];
}>;
```

### 5.2 Hooks (React Query)

#### useTreatmentCareCustomers(params)

**Params:**

```typescript
{
  date: string,        // YYYY-MM-DD
  keyword?: string     // Search keyword
}
```

**Query Key:** `["treatment-care-customers", date, keyword]`

**API:** `GET /api/treatment-cares/customers`

**Return:** `{ data: TreatmentCareCustomer[], isLoading, error }`

#### useTreatmentCareRecords(params)

**Params:**

```typescript
{
  from?: string,       // YYYY-MM-DD
  to?: string,         // YYYY-MM-DD
  groupBy?: "day",
  onlyMine?: boolean,
  clinicId?: string,
  customerId?: string
}
```

**Query Key:** `["treatment-care-records", ...params]`

**API:** `GET /api/treatment-cares`

**Return:**

- groupBy="day": `{ data: TreatmentCareGroupedByDay, isLoading, error }`
- else: `{ data: TreatmentCareRecord[], isLoading, error }`

#### useCreateTreatmentCareRecord()

**Mutation:**

```typescript
mutationFn: async (payload: {
  customerId: string;
  treatmentDate: string;
  careAt: string;
  careStatus: string;
  careContent: string;
}) => {
  POST / api / treatment - cares;
};

onSuccess: () => {
  invalidate: ["treatment-care-records"];
  invalidate: ["treatment-care-customers"];
};
```

**Return:** `{ mutate, isLoading, error }`

#### useDeleteTreatmentCareRecord()

**Mutation:**

```typescript
mutationFn: async (id: string) => {
  DELETE /api/treatment-cares/${id}
}

onSuccess: () => {
  invalidate: ["treatment-care-records"]
  invalidate: ["treatment-care-customers"]
}
```

**Return:** `{ mutate, isLoading, error }`

#### useCustomerTreatmentCareRecords(customerId)

**Purpose:** Get care history for specific customer

**Query Key:** `["treatment-care-records", "customer", customerId]`

**API:** `GET /api/treatment-cares?customerId={id}`

**Return:** `{ data: TreatmentCareRecord[], isLoading, error }`

**Enabled:** Only when customerId is provided

### 5.3 Components

#### TreatmentCareListPage

**Location:** `src/features/treatment-care/pages/TreatmentCareListPage.tsx`

**Purpose:** Main page với 2 tabs

**Structure:**

```tsx
<Tabs>
  <Tab key="customers" label="Khách hàng cần chăm sóc">
    <TreatmentCareCustomerTable />
  </Tab>

  <Tab key="records" label="Nhật ký chăm sóc">
    <TreatmentCareTable />
  </Tab>
</Tabs>
```

#### TreatmentCareCustomerTable

**Purpose:** Tab 1 - Danh sách customers cần gọi điện chăm sóc

**Features:**

- Date picker (default: today)
- Search input (keyword)
- Table columns:
  - STT
  - Mã KH
  - Tên khách hàng
  - Số điện thoại
  - Dịch vụ điều trị (tags)
  - Bác sĩ điều trị (tags)
  - Số lần đã chăm sóc (badge)
  - Actions: "Ghi chú chăm sóc" button

**State:**

```typescript
const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
const [keyword, setKeyword] = useState("");
const { data: customers } = useTreatmentCareCustomers({ date, keyword });
```

**Action:** Click "Ghi chú chăm sóc" → Open TreatmentCareModal với pre-filled customer + treatmentDate

#### TreatmentCareTable

**Purpose:** Tab 2 - Lịch sử ghi chú chăm sóc (grouped by day)

**Features:**

- Date range picker (default: last 35 days)
- "Chỉ xem của tôi" checkbox (onlyMine filter)
- Grouped display: Collapsible cards per day
- Each card:
  - Header: Date, count
  - Table: customerName, phone, services, doctors, status, careContent, careStaff, actions

**State:**

```typescript
const [from, setFrom] = useState(
  dayjs().subtract(34, "day").format("YYYY-MM-DD")
);
const [to, setTo] = useState(dayjs().format("YYYY-MM-DD"));
const [onlyMine, setOnlyMine] = useState(false);
const { data: grouped } = useTreatmentCareRecords({
  from,
  to,
  groupBy: "day",
  onlyMine,
});
```

**Actions:**

- Delete button (visible if: admin hoặc own record + same day)

#### TreatmentCareModal

**Props:**

```typescript
{
  open: boolean,
  onClose: () => void,
  customerId?: string,
  treatmentDate?: string,        // Pre-filled from customer table
  customerName?: string,         // Display only
  serviceNames?: string[],       // Display only
  doctorNames?: string[],        // Display only
}
```

**Form Fields:**

1. **Customer Info (Read-only display):**

   - Tên khách hàng
   - Ngày điều trị
   - Dịch vụ đã làm (tags)
   - Bác sĩ điều trị (tags)

2. **careStatus (Select, required):**

   - Options: TREATMENT_CARE_STATUS_OPTIONS
   - STABLE (Ổn định) - Green
   - UNREACHABLE (Không liên lạc được) - Red
   - NEEDS_FOLLOW_UP (Cần theo dõi) - Gold

3. **careContent (TextArea, required):**
   - Rows: 4
   - Placeholder: "Ghi chú nội dung chăm sóc, tình trạng khách hàng..."

**Submit:**

```typescript
const { mutate, isLoading } = useCreateTreatmentCareRecord();

const handleSubmit = (values) => {
  mutate(
    {
      customerId: props.customerId,
      treatmentDate: props.treatmentDate,
      careAt: new Date().toISOString(), // Now
      careStatus: values.careStatus,
      careContent: values.careContent,
    },
    {
      onSuccess: () => {
        toast.success("Ghi nhận chăm sóc thành công");
        onClose();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }
  );
};
```

#### TreatmentCareDetail (Customer Integration)

**Location:** `src/features/treatment-care/components/TreatmentCareDetail.tsx`

**Purpose:** Display care history trong Customer Detail Page

**Props:**

```typescript
{
  customerId: string;
}
```

**Logic:**

```typescript
const { data: records } = useCustomerTreatmentCareRecords(customerId);

// Group by treatmentDate for better display
const grouped = groupBy(records, (r) =>
  dayjs(r.treatmentDate).format("YYYY-MM-DD")
);

return (
  <Timeline>
    {Object.entries(grouped).map(([date, items]) => (
      <Timeline.Item key={date}>
        <Text strong>{formatDate(date)}</Text>
        {items.map((record) => (
          <Card size="small">
            <Badge status={statusColorMap[record.careStatus]} />
            <Text>{record.careContent}</Text>
            <Text type="secondary">Bởi: {record.careStaff.fullName}</Text>
            <Text type="secondary">Lúc: {formatDateTime(record.careAt)}</Text>
          </Card>
        ))}
      </Timeline.Item>
    ))}
  </Timeline>
);
```

---

## 6. Constants

```typescript
// src/features/treatment-care/constants.ts

export const TREATMENT_CARE_STATUS_OPTIONS = [
  { value: "STABLE", label: "Ổn định", color: "green" },
  { value: "UNREACHABLE", label: "Không liên lạc được", color: "red" },
  { value: "NEEDS_FOLLOW_UP", label: "Cần theo dõi", color: "gold" },
];

export const CARE_STATUS_COLOR_MAP = {
  STABLE: "green",
  UNREACHABLE: "red",
  NEEDS_FOLLOW_UP: "gold",
};
```

---

## 7. Key Implementation Points

### 7.1 Snapshot Pattern (Denormalization)

**Why:**

- Tránh phải join TreatmentLog + ConsultedService + Employee mỗi lần query
- Faster read performance
- Data immutability (snapshot reflects state at care time)

**Trade-off:**

- Data có thể stale nếu TreatmentLog bị update sau khi tạo TreatmentCare
- Increased storage (duplicate data)

**Implementation:**

```typescript
// At creation time, collect data from TreatmentLogs
const logs = await prisma.treatmentLog.findMany({
  where: { customerId, treatmentDate: { gte: dayStart, lte: dayEnd } },
  include: {
    consultedService: { select: { consultedServiceName: true } },
    dentist: { select: { id, fullName } },
  },
});

// Use Set to deduplicate
const serviceNames = [
  ...new Set(
    logs.map((l) => l.consultedService.consultedServiceName).filter(Boolean)
  ),
];
const doctorNames = [
  ...new Set(logs.map((l) => l.dentist.fullName).filter(Boolean)),
];

// Store as arrays
await prisma.treatmentCare.create({
  data: {
    treatmentServiceNames: serviceNames,
    treatingDoctorNames: doctorNames,
    // ...
  },
});
```

### 7.2 treatmentDate vs careAt Logic

**Separation of Concerns:**

- `treatmentDate` (Date): Business key - when customer was treated
- `careAt` (Timestamp): Audit trail - when care call was made

**Use Cases:**

- Group by treatmentDate: Show care activities organized by treatment day
- Sort by careAt: Chronological order of care activities
- Filter by careAt: Date range queries

**Validation:**

```typescript
const treatmentDay = dayjs.tz(treatmentDate, VN_TZ);
const careAtDt = dayjs(careAt).tz(VN_TZ);

if (careAtDt.isBefore(treatmentDay.startOf("day"))) {
  throw "careAt phải cùng ngày hoặc sau treatmentDate";
}
```

**Example Scenarios:**

1. **Same-day care:** Customer điều trị 2024-10-15 08:00 AM, staff gọi 2024-10-15 03:00 PM

   - treatmentDate = 2024-10-15
   - careAt = 2024-10-15T15:00:00+07:00

2. **Next-day care:** Customer điều trị 2024-10-15, staff gọi 2024-10-16 09:00 AM

   - treatmentDate = 2024-10-15
   - careAt = 2024-10-16T09:00:00+07:00

3. **Multiple cares:** Customer điều trị 2024-10-15, staff gọi 3 lần (2024-10-15, 2024-10-16, 2024-10-17)
   - 3 TreatmentCare records với cùng treatmentDate nhưng khác careAt

### 7.3 Permission Pattern

**Delete Permission:**

```typescript
// Admin: Can delete any record
if (role === "admin") {
  return true;
}

// Non-admin: Check ownership + same day
if (record.careStaffId !== employeeId) {
  return false; // Not owner
}

const nowVN = dayjs().tz("Asia/Ho_Chi_Minh");
const careDay = dayjs(record.careAt).tz("Asia/Ho_Chi_Minh");

if (!careDay.isSame(nowVN, "day")) {
  return false; // Not same day
}

return true;
```

**Why same-day restriction:**

- Prevent accidental deletion of historical records
- Encourage immediate correction if mistake
- Maintain audit trail integrity

### 7.4 Grouping by Day Logic

**Backend:**

```typescript
const groups = {};

records.forEach((record) => {
  const key = dayjs(record.careAt).tz(VN_TZ).format("YYYY-MM-DD");
  if (!groups[key]) groups[key] = [];
  groups[key].push(record);
});

// Sort days DESC (newest first)
const payload = Object.keys(groups)
  .sort((a, b) => (a < b ? 1 : -1))
  .map((day) => ({ day, items: groups[day] }));
```

**Frontend Display:**

```tsx
{
  grouped.map(({ day, items }) => (
    <Card key={day} title={formatDate(day)} extra={`${items.length} ghi chú`}>
      <Table dataSource={items} columns={columns} />
    </Card>
  ));
}
```

### 7.5 Customer Badge (careCount)

**Purpose:** Show số lần đã chăm sóc trong ngày để staff biết:

- Badge = 0: Chưa gọi → Priority cao
- Badge > 0: Đã gọi rồi → Reference cho lần gọi tiếp theo

**Implementation:**

```typescript
// Count care records per customer on specific date
const careCounts = await prisma.treatmentCare.groupBy({
  by: ["customerId"],
  where: {
    treatmentDate: dayjs.tz(date, VN_TZ).toDate(),
    ...(clinicId ? { clinicId } : {}),
  },
  _count: { customerId: true },
});

const countMap = new Map(
  careCounts.map((c) => [c.customerId, c._count.customerId])
);

// Attach to customer list
customers.forEach((customer) => {
  customer.careCount = countMap.get(customer.customerId) || 0;
});
```

**Display:**

```tsx
<Badge
  count={customer.careCount}
  style={{ backgroundColor: customer.careCount > 0 ? "#52c41a" : "#d9d9d9" }}
/>
```

---

## 8. Checklist để Code lại

### Backend

- [ ] Tạo `treatmentCareRepository.ts`:

  - [ ] `getTreatmentCareRecords(filters)`
  - [ ] `getTreatmentCareById(id)`
  - [ ] `createTreatmentCare(data)`
  - [ ] `deleteTreatmentCare(id, userId, role)`
  - [ ] `getCustomersNeedingCare(date, clinicId?, keyword?)`

- [ ] Tạo `treatmentCareService.ts`:

  - [ ] `buildTreatmentSnapshots(customerId, treatmentDate)` - Extract snapshot logic
  - [ ] `validateCarePermission(record, userId, role)` - Permission check
  - [ ] `determineClinicId(headerClinicId, careStaffId)` - ClinicId logic
  - [ ] `validateCareAt(careAt, treatmentDate)` - Date validation

- [ ] Refactor API routes:

  - [ ] Add Zod schemas cho request validation
  - [ ] Use service layer thay vì direct Prisma
  - [ ] Consistent error messages
  - [ ] Add PUT endpoint for updating careContent + careStatus

- [ ] Add indexes:
  - [ ] `[customerId, treatmentDate]` - For customer history
  - [ ] `[clinicId, careAt]` - For clinic reporting
  - [ ] `[careStaffId, careAt]` - For staff performance

### Frontend

- [ ] Refactor components:

  - [ ] Extract StatusBadge component
  - [ ] Extract CustomerInfoCard component
  - [ ] Consistent loading states với Skeleton
  - [ ] Empty states với illustrations

- [ ] Form improvements:

  - [ ] Add validation rules
  - [ ] Add character count for careContent
  - [ ] Add quick-fill buttons (templates: "Tình trạng tốt", "Cần hẹn lại", etc.)
  - [ ] Add reminder checkbox "Nhắc gọi lại sau X ngày"

- [ ] Table enhancements:

  - [ ] Export to Excel
  - [ ] Bulk delete (admin only)
  - [ ] Advanced filters: by status, by staff, by date range
  - [ ] Pagination cho large datasets

- [ ] Performance:
  - [ ] Implement virtual scrolling for long customer lists
  - [ ] Debounce search input
  - [ ] Cache customer lookup data

### Testing

- [ ] Test snapshot generation với multiple TreatmentLogs
- [ ] Test careAt validation (must be >= treatmentDate)
- [ ] Test permission logic (admin vs non-admin, same day)
- [ ] Test groupBy=day logic với data spanning multiple days
- [ ] Test careCount calculation accuracy
- [ ] Test keyword search (customerCode, fullName, phone)

### Integration

- [ ] Add TreatmentCareDetail to Customer Detail Page
- [ ] Add care reminder notifications
- [ ] Link to TreatmentLog detail from care record
- [ ] Export care report (PDF/Excel)

---

## 9. Data Flow Diagrams

### Create Care Record Flow

```
Staff opens "Khách hàng cần chăm sóc" tab →
Select date (default: today) →
API fetches customers who had TreatmentLog on date →
Display customer list với careCount badges →

Staff clicks "Ghi chú chăm sóc" on customer X →
Modal opens với pre-filled:
  - customerId
  - treatmentDate
  - customerName
  - serviceNames (from snapshot)
  - doctorNames (from snapshot)

Staff fills:
  - careStatus (Select)
  - careContent (TextArea)

Submit →
API: POST /api/treatment-cares →
Backend:
  1. Validate employeeId (from header)
  2. Validate careAt >= treatmentDate
  3. Query TreatmentLogs on treatmentDate
  4. Build snapshots (serviceNames, doctorNames, etc.)
  5. Determine clinicId
  6. Create TreatmentCare record
→ Frontend:
  1. Toast success
  2. Close modal
  3. Invalidate queries (refetch customer list với updated careCount)
```

### View Care History Flow (Customer Detail)

```
Customer Detail Page loads →
Fetch customer data including treatmentCare history →
API: GET /api/treatment-cares?customerId={id} →
Backend:
  1. Query TreatmentCare records cho customerId
  2. Include careStaff relation
  3. Order by careAt DESC
→ Frontend:
  1. Group records by treatmentDate
  2. Render Timeline với cards
  3. Each card: date, status badge, careContent, careStaff, careAt
```

### Delete Care Record Flow

```
Staff clicks delete button on care record →
Confirm dialog →
API: DELETE /api/treatment-cares/{id} →
Backend:
  1. Fetch record
  2. Check permission:
     - Admin: allow
     - Non-admin: Check owner + same day
  3. If unauthorized: return 403
  4. Delete record
→ Frontend:
  1. Toast success/error
  2. Invalidate queries (refetch list)
```

---

## 10. Future Enhancements

### Care Templates

- Pre-defined careContent templates:
  - "Tình trạng tốt, không có vấn đề"
  - "Có đau nhẹ, hẹn theo dõi sau 3 ngày"
  - "Không liên lạc được, sẽ gọi lại sau"
- Quick-fill buttons to speed up data entry

### Care Reminders

- Add `nextCareDate` field to TreatmentCare
- Auto-generate reminders:
  - NEEDS_FOLLOW_UP → Remind after 3 days
  - UNREACHABLE → Remind after 1 day
- Notification system to alert staff

### Care Analytics

- Dashboard:
  - Care completion rate per day/week/month
  - Average care time per customer
  - Status distribution (STABLE, UNREACHABLE, NEEDS_FOLLOW_UP)
  - Staff performance (number of cares per day)
- Charts: Trend of care activities over time

### Voice Recording

- Add `voiceRecordingUrl` field
- Allow staff to record phone calls
- Store in cloud storage (S3)
- Playback in care history

### Integration with Appointment Scheduling

- From care record, quick-book next appointment
- Auto-fill appointment notes from care content
- Link care record to next appointment for context

### Multi-channel Care

- Support SMS/Email care (not just phone calls)
- Add `careChannel` field: "PHONE" | "SMS" | "EMAIL" | "IN_PERSON"
- Different templates per channel

---

**Tổng kết:** Treatment Care là post-treatment follow-up system với snapshot pattern để tránh join queries. Key features: 2 tabs (customers needing care vs care history), permission-based delete (same-day only for non-admin), và date separation logic (treatmentDate vs careAt). Snapshot arrays trade storage for query performance. Future enhancements: templates, reminders, analytics, voice recording.
