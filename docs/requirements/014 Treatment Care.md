# 🩺 Requirements: Treatment Care (Aftercare) System

> **📋 STATUS: 📝 DRAFT** - Requirements specified, implementation needed  
> **🔗 Implementation**: `src/features/treatment-care/`  
> **🔧 Last Updated**: 2025-01-13 - Initial version

## 📊 Tham khảo

- Prisma Model: `prisma/schema.prisma` → TreatmentCare
- Old Spec: `docs/Dự án cũ/13. treatment-care/treatment-care-refactor-requirements.md`, `treatment-care-spec.md`
- Related: `012 Treatment Log.md`, `007 Customer.md`

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
  - `careAt`: Thời điểm chăm sóc thực tế (DateTime with TZ) - khi staff gọi điện
  - Validate: `careAt >= treatmentDate` (cùng ngày hoặc sau)
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

### Repository Pattern

```typescript
// Complex + Server Fields
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

### Permission Rules

**Quyền dựa trên: Role + Ownership + Timeline (same VN day) + Clinic**

#### CREATE

- Employee/Admin: Tạo cho clinic của mình
- **Ràng buộc**: Customer phải có TreatmentLog trong `treatmentDate` (backend 422)

#### UPDATE

- ❌ **NO UPDATE ENDPOINT** (Current implementation - immutable records)
- 💡 **Recommendation**: Add update for `careContent` và `careStatus`
  - Permission: Same as DELETE (own record + same day)

#### DELETE

| Role     | Permission                                                               |
| -------- | ------------------------------------------------------------------------ |
| Admin    | ✅ Xóa tất cả                                                            |
| Employee | ⚠️ Chỉ xóa bản ghi của mình (`careStaffId = employeeId`) trong cùng ngày |
|          | Same VN day check: `careAt.date === today.date` (VN TZ)                  |

### Architecture

- ✅ **Hybrid**: GET qua API Routes + Mutations qua Server Actions
- ✅ **3 Query Modes**:
  1. By Customer: History view (customerId filter)
  2. By Date Range: Grouped by day (default 35 days)
  3. Customers Needing Care: TreatmentLog → TreatmentCare count
- ✅ **Filters**: `from`, `to`, `groupBy`, `onlyMine`, `clinicId`, `customerId`
- ✅ **Scope Logic**: Non-admin auto-scope to own clinic

---

## 1. ➕ Tạo Bản Ghi Chăm Sóc

### Permissions

- Employee: Clinic của mình + customer có TreatmentLog trong `treatmentDate`
- Admin: Clinic đang chọn + customer có TreatmentLog
- Backend: Validate TreatmentLog exists → 422 với message "Không tìm thấy TreatmentLog cho ngày điều trị"

### UI/UX

**Component**: `CreateTreatmentCareModal` (85% mobile, 65% desktop)

**Context**: Modal mở từ button "Chăm sóc" trong `TreatmentCareCustomerTable`

**Form Layout**:

```
Hàng 1: [* Khách hàng (readonly, display)                                      ]
Hàng 2: [* Ngày điều trị (readonly, from table context)                        ]
Hàng 3: [* Thời gian chăm sóc (DatePicker, default: now, disabled)             ]
Hàng 4: [* Trạng thái (Radio Group - 3 options)                                ]
Hàng 5: [* Nội dung chăm sóc (Textarea)                                        ]
```

**Notes**:

- "\* Khách hàng": readonly display `{customerCode} - {fullName} - {phone}`
- "\* Ngày điều trị": readonly display từ table context (YYYY-MM-DD)
- "\* Thời gian chăm sóc": DatePicker showTime, default now(), disabled (read-only)
- "\* Trạng thái": Radio vertical
  - "Bệnh nhân đã ổn" (STABLE)
  - "Không liên lạc được" (UNREACHABLE)
  - "Cần chăm sóc thêm" (NEEDS_FOLLOW_UP)
- "\* Nội dung chăm sóc": Textarea rows={4}, placeholder "Ghi chú tình trạng khách hàng sau điều trị..."

### Validation

**Required**:

- `customerId`: UUID (auto-filled từ context, hidden)
- `treatmentDate`: YYYY-MM-DD (auto-filled từ table date selector)
- `careAt`: ISO DateTime (default now(), VN TZ)
  - Validate: `careAt >= treatmentDate` (backend)
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

### Snapshot Generation Logic

```typescript
// Backend service
async function buildTreatmentSnapshots(
  customerId: string,
  treatmentDate: string
) {
  const day = dayjs.tz(treatmentDate, VN_TZ);
  const logs = await prisma.treatmentLog.findMany({
    where: {
      customerId,
      treatmentDate: {
        gte: day.startOf("day").toDate(),
        lt: day.add(1, "day").startOf("day").toDate(),
      },
    },
    include: { consultedService: true, dentist: true },
  });

  const serviceSet = new Set<string>();
  const doctorNameSet = new Set<string>();
  const doctorIdSet = new Set<string>();
  const clinicIdSet = new Set<string>();

  logs.forEach((log) => {
    if (log.consultedService?.consultedServiceName)
      serviceSet.add(log.consultedService.consultedServiceName);
    if (log.dentist?.fullName) doctorNameSet.add(log.dentist.fullName);
    if (log.dentistId) doctorIdSet.add(log.dentistId);
    if (log.clinicId) clinicIdSet.add(log.clinicId);
  });

  return {
    treatmentServiceNames: Array.from(serviceSet),
    treatingDoctorNames: Array.from(doctorNameSet),
    treatingDoctorIds: Array.from(doctorIdSet),
    treatmentClinicIds: Array.from(clinicIdSet),
  };
}
```

### Error Handling

- 400: Missing required fields, `careAt < treatmentDate`
- 401: Missing `x-employee-id` header
- 422: No TreatmentLog found for `treatmentDate` - show message "Khách hàng chưa có lịch sử điều trị trong ngày này"

---

## 2. ✏️ Cập Nhật Bản Ghi (FUTURE)

### Current Implementation

- ❌ **NO UPDATE ENDPOINT** - TreatmentCare is immutable after creation

### Recommendation

Add update endpoint cho:

- `careContent`: String (editable)
- `careStatus`: Enum (editable)

**Permission**: Same as DELETE

- Admin: Full access
- Employee: Own records only + same VN day

**UI**: Reuse modal layout from Create, pre-filled with existing data

---

## 3. 🗑️ Xoá Bản Ghi

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
  - `careAt.date === today.date` (VN TZ same day check)
  - Return 403 nếu vi phạm
- **Admin**: Delete all

### Implementation

```typescript
// Backend service
async function deleteTreatmentCare(id: string, user: SessionUser) {
  const record = await prisma.treatmentCare.findUnique({ where: { id } });
  if (!record) throw new NotFoundError();

  if (user.role !== "admin") {
    // Ownership check
    if (record.careStaffId !== user.employeeId) {
      throw new ForbiddenError("Chỉ có thể xóa bản ghi của chính mình");
    }

    // Same day check (VN TZ)
    const careDay = dayjs(record.careAt).tz(VN_TZ).format("YYYY-MM-DD");
    const today = dayjs().tz(VN_TZ).format("YYYY-MM-DD");
    if (careDay !== today) {
      throw new ForbiddenError("Chỉ có thể xóa bản ghi trong ngày tạo");
    }
  }

  await prisma.treatmentCare.delete({ where: { id } });
  return { success: true };
}
```

---

## 4. 📋 Xem Danh Sách Chăm Sóc (Grouped by Day)

### Use Case

Staff xem lịch sử chăm sóc 35 ngày gần nhất, grouped theo ngày

### UI/UX

**Component**: `TreatmentCareTable` (Tab "Lịch sử chăm sóc")

**Filters**:

```
[Đến ngày (DatePicker, default: today)] [✓ Chỉ của tôi (Checkbox)]
```

**Table Columns**:

| Column           | Description                        | Width |
| ---------------- | ---------------------------------- | ----- |
| Ngày chăm sóc    | `careAt` (DD/MM/YYYY HH:mm)        | 150px |
| Khách hàng       | `{code} - {name}` (Link to detail) | 200px |
| Điện thoại       | `phone` với icon                   | 120px |
| Dịch vụ điều trị | `treatmentServiceNames` (tags)     | 250px |
| Bác sĩ điều trị  | `treatingDoctorNames` (comma sep)  | 180px |
| Nhân viên CS     | `careStaff.fullName`               | 150px |
| Trạng thái       | `careStatus` (Tag color-coded)     | 120px |
| Nội dung         | `careContent` (truncate 50 chars)  | 200px |
| Actions          | View, Delete                       | 80px  |

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

**Actions**:

- View: Modal `TreatmentCareDetailModal` (read-only)
- Delete: Popconfirm → Server Action

### API

**Endpoint**: `GET /api/v1/treatment-cares`

**Query Params**:

- `from`: YYYY-MM-DD (optional, default: `to - 34 days`)
- `to`: YYYY-MM-DD (optional, default: today)
- `groupBy`: "day" (optional, default: "day")
- `onlyMine`: "true" | "false" (optional, filter by `careStaffId = employeeId`)
- `clinicId`: UUID (optional, admin only)

**Headers**:

- `x-employee-role`: string
- `x-employee-id`: UUID
- `x-clinic-id`: UUID (optional)

**Response** (groupBy=day):

```typescript
type TreatmentCareGroupedResponse = Array<{
  day: string; // YYYY-MM-DD
  items: TreatmentCareRecord[];
}>;

type TreatmentCareRecord = {
  id: string;
  customerId: string;
  customer: { id: string; code: string; fullName: string; phone: string };
  treatmentDate: string; // YYYY-MM-DD
  careAt: string; // ISO DateTime
  careContent: string;
  careStatus: TreatmentCareStatus;
  treatmentServiceNames: string[];
  treatingDoctorNames: string[];
  careStaff: { id: string; fullName: string };
  createdAt: string;
  updatedAt: string;
};
```

**Logic**:

```typescript
// Service layer
async function listTreatmentCares(
  params: GetTreatmentCaresQuery,
  user: SessionUser
) {
  const toDay = params.to ? dayjs.tz(params.to, VN_TZ) : dayjs().tz(VN_TZ);
  const fromDay = params.from
    ? dayjs.tz(params.from, VN_TZ)
    : toDay.subtract(34, "day");

  // Clinic scope
  const clinicId =
    user.role !== "admin" ? user.clinicId : params.clinicId || user.clinicId;

  const where = {
    clinicId,
    careAt: { gte: fromDay.toDate(), lt: toDay.add(1, "day").toDate() },
    ...(params.onlyMine && { careStaffId: user.employeeId }),
  };

  const records = await prisma.treatmentCare.findMany({
    where,
    include: {
      customer: {
        select: { id: true, code: true, fullName: true, phone: true },
      },
      careStaff: { select: { id: true, fullName: true } },
    },
    orderBy: { careAt: "desc" },
  });

  if (params.groupBy === "day") {
    return groupByDay(records); // { day, items }[]
  }

  return records;
}
```

---

## 5. 📋 Xem Lịch Sử Chăm Sóc Theo Khách Hàng

### Use Case

Trong Customer Detail page, xem toàn bộ lịch sử chăm sóc của khách

### UI/UX

**Component**: `CustomerTreatmentCareHistory` (trong Customer Detail tabs)

**Table Columns** (không cần cột Khách hàng):

| Column           | Description                    | Width |
| ---------------- | ------------------------------ | ----- |
| Ngày điều trị    | `treatmentDate` (DD/MM/YYYY)   | 120px |
| Ngày chăm sóc    | `careAt` (DD/MM/YYYY HH:mm)    | 150px |
| Dịch vụ điều trị | `treatmentServiceNames` (tags) | 250px |
| Bác sĩ điều trị  | `treatingDoctorNames`          | 180px |
| Nhân viên CS     | `careStaff.fullName`           | 150px |
| Trạng thái       | `careStatus` (Tag)             | 120px |
| Nội dung         | `careContent` (full text)      | auto  |
| Actions          | View, Delete                   | 80px  |

**Sorting**: `careAt` DESC (mới nhất trên cùng)

**No Grouping**: Flat list

### API

**Endpoint**: `GET /api/v1/treatment-cares?customerId={id}`

**Query Params**:

- `customerId`: UUID (required for this mode)

**Headers**: Same as above

**Response**: `TreatmentCareRecord[]` (flat array, no grouping)

**Logic**: Same as above but with `customerId` filter, no date range limit

---

## 6. 👥 Xem Danh Sách Khách Cần Chăm Sóc

### Use Case

Staff chọn ngày → xem danh sách khách đã điều trị trong ngày đó → gọi điện chăm sóc

### UI/UX

**Component**: `TreatmentCareCustomerTable` (Tab "Khách cần chăm sóc")

**Filters**:

```
[Ngày điều trị (DatePicker, default: yesterday)] [< Prev Day] [Next Day >] [Tìm kiếm (Search: code/name/phone)]
```

**Notes**:

- Default date: **Yesterday** (hôm qua) - khách điều trị hôm qua thì hôm nay gọi chăm sóc
- Navigation: Prev/Next day buttons
- Search: Real-time filter by keyword

**Table Columns**:

| Column           | Description                       | Width |
| ---------------- | --------------------------------- | ----- |
| Mã KH            | `customerCode`                    | 100px |
| Khách hàng       | `fullName` (Link to detail)       | 180px |
| Điện thoại       | `phone` với icon copy             | 120px |
| Dịch vụ điều trị | `treatmentServiceNames` (tags)    | 280px |
| Bác sĩ điều trị  | `treatingDoctorNames` (comma sep) | 200px |
| Số lần CS        | `careCount` (Badge số)            | 80px  |
| Actions          | Button "Chăm sóc"                 | 100px |

**Notes**:

- "Số lần CS": Badge hiển thị số lần đã chăm sóc trong ngày này (`careCount`)
- Button "Chăm sóc": Primary button → Mở `CreateTreatmentCareModal`
  - Pass context: `customerId`, `treatmentDate`, customer info, snapshots preview

### API

**Endpoint**: `GET /api/v1/treatment-cares/customers?date={YYYY-MM-DD}`

**Query Params**:

- `date`: YYYY-MM-DD (required) - ngày điều trị
- `keyword`: string (optional) - search by code/name/phone
- `clinicId`: UUID (optional, admin only)

**Headers**: Same as above

**Response**:

```typescript
type TreatmentCareCustomer = {
  customerId: string;
  customerCode: string;
  customerName: string;
  customerPhone: string;
  treatmentDate: string; // YYYY-MM-DD (same as query param)
  treatmentServiceNames: string[]; // Unique services
  treatingDoctorNames: string[]; // Unique doctors
  careCount: number; // Badge: số lần đã chăm sóc trong ngày này
};

type Response = TreatmentCareCustomer[];
```

**Logic**:

```typescript
async function getCustomersNeedingCare(
  date: string,
  clinicId: string,
  keyword?: string
) {
  const day = dayjs.tz(date, VN_TZ);

  // 1. Get TreatmentLogs on date
  const logs = await prisma.treatmentLog.findMany({
    where: {
      clinicId,
      treatmentDate: {
        gte: day.startOf("day").toDate(),
        lt: day.add(1, "day").toDate(),
      },
    },
    include: { customer: true, consultedService: true, dentist: true },
  });

  // 2. Group by customer
  const customerMap = new Map<
    string,
    {
      customer: Customer;
      serviceSet: Set<string>;
      doctorSet: Set<string>;
    }
  >();

  logs.forEach((log) => {
    if (!customerMap.has(log.customerId)) {
      customerMap.set(log.customerId, {
        customer: log.customer,
        serviceSet: new Set(),
        doctorSet: new Set(),
      });
    }
    const entry = customerMap.get(log.customerId)!;
    if (log.consultedService?.consultedServiceName)
      entry.serviceSet.add(log.consultedService.consultedServiceName);
    if (log.dentist?.fullName) entry.doctorSet.add(log.dentist.fullName);
  });

  // 3. Count existing TreatmentCares per customer on date
  const customerIds = Array.from(customerMap.keys());
  const careCounts = await prisma.treatmentCare.groupBy({
    by: ["customerId"],
    where: {
      customerId: { in: customerIds },
      treatmentDate: {
        gte: day.startOf("day").toDate(),
        lt: day.add(1, "day").toDate(),
      },
    },
    _count: true,
  });
  const careCountMap = new Map(careCounts.map((c) => [c.customerId, c._count]));

  // 4. Build response
  let results = Array.from(customerMap.entries()).map(([customerId, data]) => ({
    customerId,
    customerCode: data.customer.customerCode,
    customerName: data.customer.fullName,
    customerPhone: data.customer.phone,
    treatmentDate: date,
    treatmentServiceNames: Array.from(data.serviceSet),
    treatingDoctorNames: Array.from(data.doctorSet),
    careCount: careCountMap.get(customerId) || 0,
  }));

  // 5. Filter by keyword (case-insensitive)
  if (keyword) {
    const lower = keyword.toLowerCase();
    results = results.filter(
      (r) =>
        r.customerCode?.toLowerCase().includes(lower) ||
        r.customerName.toLowerCase().includes(lower) ||
        r.customerPhone?.toLowerCase().includes(lower)
    );
  }

  // 6. Sort by customerName A-Z
  results.sort((a, b) => a.customerName.localeCompare(b.customerName, "vi"));

  return results;
}
```

---

## 7. 🔍 Xem Chi Tiết Bản Ghi

### UI/UX

**Component**: `TreatmentCareDetailModal` (Read-only)

**Layout**:

```
Thông tin chăm sóc
────────────────────────────────────────
Khách hàng:         {code} - {name} - {phone}
Ngày điều trị:      {treatmentDate}
Thời gian chăm sóc: {careAt}
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

## 8. 📊 Backend Implementation

### 8.1. Zod Schemas

**Location**: `src/shared/validation/treatment-care.validation.ts`

```typescript
import { z } from "zod";
import { TreatmentCareStatus } from "@prisma/client";

// Request Schemas
export const CreateTreatmentCareRequestSchema = z.object({
  customerId: z.string().uuid(),
  treatmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  careAt: z.string().datetime(), // ISO DateTime
  careStatus: z.nativeEnum(TreatmentCareStatus).or(
    z.string().transform((val) => {
      const upper = val.toUpperCase();
      if (Object.values(TreatmentCareStatus).includes(upper as any))
        return upper as TreatmentCareStatus;
      throw new Error("Invalid careStatus");
    })
  ),
  careContent: z.string().min(1, "Nội dung chăm sóc không được để trống"),
});

export const GetTreatmentCaresQuerySchema = z.object({
  customerId: z.string().uuid().optional(),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  groupBy: z.enum(["day"]).optional(),
  onlyMine: z.enum(["true", "false"]).optional(),
  clinicId: z.string().uuid().optional(),
});

export const GetTreatmentCareCustomersQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  keyword: z.string().optional(),
  clinicId: z.string().uuid().optional(),
});

// Response Schemas
export const TreatmentCareResponseSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  customer: z.object({
    id: z.string(),
    code: z.string().nullable(),
    fullName: z.string(),
    phone: z.string().nullable(),
  }),
  clinicId: z.string(),
  careStaffId: z.string(),
  careStaff: z.object({
    id: z.string(),
    fullName: z.string(),
  }),
  treatmentDate: z.string(), // YYYY-MM-DD
  careAt: z.string().datetime(),
  careContent: z.string(),
  careStatus: z.nativeEnum(TreatmentCareStatus),
  treatmentServiceNames: z.array(z.string()),
  treatingDoctorNames: z.array(z.string()),
  treatingDoctorIds: z.array(z.string()),
  treatmentClinicIds: z.array(z.string()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const TreatmentCareCustomerResponseSchema = z.object({
  customerId: z.string(),
  customerCode: z.string().nullable(),
  customerName: z.string(),
  customerPhone: z.string().nullable(),
  treatmentDate: z.string(),
  treatmentServiceNames: z.array(z.string()),
  treatingDoctorNames: z.array(z.string()),
  careCount: z.number(),
});

// Types
export type CreateTreatmentCareRequest = z.infer<
  typeof CreateTreatmentCareRequestSchema
>;
export type GetTreatmentCaresQuery = z.infer<
  typeof GetTreatmentCaresQuerySchema
>;
export type GetTreatmentCareCustomersQuery = z.infer<
  typeof GetTreatmentCareCustomersQuerySchema
>;
export type TreatmentCareResponse = z.infer<typeof TreatmentCareResponseSchema>;
export type TreatmentCareCustomerResponse = z.infer<
  typeof TreatmentCareCustomerResponseSchema
>;
```

### 8.2. Repository

**Location**: `src/server/repos/treatment-care.repo.ts`

```typescript
import { prisma } from "@/services/prisma/client";
import type { CreateTreatmentCareRequest } from "@/shared/validation/treatment-care.validation";

export type TreatmentCareCreateInput = CreateTreatmentCareRequest & {
  createdById: string;
  updatedById: string;
  careStaffId: string;
  clinicId: string;
  treatmentServiceNames: string[];
  treatingDoctorNames: string[];
  treatingDoctorIds: string[];
  treatmentClinicIds: string[];
};

export const treatmentCareRepo = {
  async create(data: TreatmentCareCreateInput) {
    return prisma.treatmentCare.create({
      data,
      include: {
        customer: {
          select: { id: true, customerCode: true, fullName: true, phone: true },
        },
        careStaff: { select: { id: true, fullName: true } },
      },
    });
  },

  async findById(id: string) {
    return prisma.treatmentCare.findUnique({
      where: { id },
      include: {
        customer: {
          select: { id: true, customerCode: true, fullName: true, phone: true },
        },
        careStaff: { select: { id: true, fullName: true } },
        createdBy: { select: { id: true, fullName: true } },
        updatedBy: { select: { id: true, fullName: true } },
      },
    });
  },

  async list(where: any, orderBy: any = { careAt: "desc" }) {
    return prisma.treatmentCare.findMany({
      where,
      include: {
        customer: {
          select: { id: true, customerCode: true, fullName: true, phone: true },
        },
        careStaff: { select: { id: true, fullName: true } },
      },
      orderBy,
    });
  },

  async delete(id: string) {
    return prisma.treatmentCare.delete({ where: { id } });
  },
};
```

### 8.3. Service

**Location**: `src/server/services/treatment-care.service.ts`

```typescript
import { prisma } from "@/services/prisma/client";
import { treatmentCareRepo } from "@/server/repos/treatment-care.repo";
import {
  ServiceError,
  NotFoundError,
  ForbiddenError,
  UnprocessableEntityError,
} from "@/server/utils/errors";
import type {
  CreateTreatmentCareRequest,
  GetTreatmentCaresQuery,
  GetTreatmentCareCustomersQuery,
} from "@/shared/validation/treatment-care.validation";
import type { SessionUser } from "@/shared/types/auth.types";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const VN_TZ = "Asia/Ho_Chi_Minh";

export const treatmentCareService = {
  async create(user: SessionUser, data: CreateTreatmentCareRequest) {
    // 1. Validate careAt >= treatmentDate
    const treatmentDay = dayjs.tz(data.treatmentDate, VN_TZ);
    const careTime = dayjs(data.careAt).tz(VN_TZ);

    if (careTime.isBefore(treatmentDay.startOf("day"))) {
      throw new ServiceError(
        "INVALID_CARE_TIME",
        "Thời gian chăm sóc phải cùng ngày hoặc sau ngày điều trị",
        400
      );
    }

    // 2. Check TreatmentLog exists on treatmentDate
    const logsExist = await prisma.treatmentLog.count({
      where: {
        customerId: data.customerId,
        treatmentDate: {
          gte: treatmentDay.startOf("day").toDate(),
          lt: treatmentDay.add(1, "day").startOf("day").toDate(),
        },
      },
    });

    if (logsExist === 0) {
      throw new UnprocessableEntityError(
        "Không tìm thấy TreatmentLog cho ngày điều trị"
      );
    }

    // 3. Build snapshots
    const snapshots = await this.buildTreatmentSnapshots(
      data.customerId,
      data.treatmentDate
    );

    // 4. Determine clinicId (priority: header → careStaff profile)
    let clinicId = user.clinicId; // From x-clinic-id or profile
    if (!clinicId) {
      const careStaff = await prisma.employee.findUnique({
        where: { id: user.employeeId },
        select: { clinicId: true },
      });
      clinicId = careStaff?.clinicId || null;
    }

    if (!clinicId) {
      throw new ServiceError(
        "MISSING_CLINIC",
        "Không xác định được clinicId",
        400
      );
    }

    // 5. Create record
    const createInput = {
      ...data,
      careStaffId: user.employeeId!,
      clinicId,
      createdById: user.employeeId!,
      updatedById: user.employeeId!,
      ...snapshots,
    };

    return treatmentCareRepo.create(createInput);
  },

  async delete(id: string, user: SessionUser) {
    const record = await treatmentCareRepo.findById(id);
    if (!record) throw new NotFoundError("Không tìm thấy bản ghi chăm sóc");

    // Permission check
    if (user.role !== "admin") {
      // Ownership check
      if (record.careStaffId !== user.employeeId) {
        throw new ForbiddenError("Chỉ có thể xóa bản ghi của chính mình");
      }

      // Same day check (VN TZ)
      const careDay = dayjs(record.careAt).tz(VN_TZ).format("YYYY-MM-DD");
      const today = dayjs().tz(VN_TZ).format("YYYY-MM-DD");

      if (careDay !== today) {
        throw new ForbiddenError("Chỉ có thể xóa bản ghi trong ngày tạo");
      }
    }

    await treatmentCareRepo.delete(id);
    return { success: true };
  },

  async list(query: GetTreatmentCaresQuery, user: SessionUser) {
    // Clinic scope
    const clinicId =
      user.role !== "admin" ? user.clinicId : query.clinicId || user.clinicId;

    // Customer-specific query
    if (query.customerId) {
      const where = {
        customerId: query.customerId,
        clinicId,
      };
      return treatmentCareRepo.list(where);
    }

    // Date range query
    const toDay = query.to ? dayjs.tz(query.to, VN_TZ) : dayjs().tz(VN_TZ);
    const fromDay = query.from
      ? dayjs.tz(query.from, VN_TZ)
      : toDay.subtract(34, "day");

    const where = {
      clinicId,
      careAt: {
        gte: fromDay.startOf("day").toDate(),
        lt: toDay.add(1, "day").startOf("day").toDate(),
      },
      ...(query.onlyMine === "true" && user.employeeId
        ? { careStaffId: user.employeeId }
        : {}),
    };

    const records = await treatmentCareRepo.list(where);

    // Group by day if requested
    if (query.groupBy === "day") {
      return this.groupByDay(records);
    }

    return records;
  },

  async getCustomersNeedingCare(
    query: GetTreatmentCareCustomersQuery,
    user: SessionUser
  ) {
    const day = dayjs.tz(query.date, VN_TZ);
    const clinicId =
      user.role !== "admin" ? user.clinicId : query.clinicId || user.clinicId;

    // 1. Get TreatmentLogs on date
    const logs = await prisma.treatmentLog.findMany({
      where: {
        clinicId,
        treatmentDate: {
          gte: day.startOf("day").toDate(),
          lt: day.add(1, "day").startOf("day").toDate(),
        },
      },
      include: {
        customer: {
          select: { id: true, customerCode: true, fullName: true, phone: true },
        },
        consultedService: { select: { consultedServiceName: true } },
        dentist: { select: { fullName: true } },
      },
    });

    // 2. Group by customer
    const customerMap = new Map<
      string,
      {
        customer: any;
        serviceSet: Set<string>;
        doctorSet: Set<string>;
      }
    >();

    logs.forEach((log) => {
      if (!customerMap.has(log.customerId)) {
        customerMap.set(log.customerId, {
          customer: log.customer,
          serviceSet: new Set(),
          doctorSet: new Set(),
        });
      }
      const entry = customerMap.get(log.customerId)!;
      if (log.consultedService?.consultedServiceName) {
        entry.serviceSet.add(log.consultedService.consultedServiceName);
      }
      if (log.dentist?.fullName) {
        entry.doctorSet.add(log.dentist.fullName);
      }
    });

    // 3. Count existing TreatmentCares per customer on date
    const customerIds = Array.from(customerMap.keys());
    const careCounts = await prisma.treatmentCare.groupBy({
      by: ["customerId"],
      where: {
        customerId: { in: customerIds },
        treatmentDate: {
          gte: day.startOf("day").toDate(),
          lt: day.add(1, "day").startOf("day").toDate(),
        },
      },
      _count: true,
    });
    const careCountMap = new Map(
      careCounts.map((c) => [c.customerId, c._count])
    );

    // 4. Build response
    let results = Array.from(customerMap.entries()).map(
      ([customerId, data]) => ({
        customerId,
        customerCode: data.customer.customerCode,
        customerName: data.customer.fullName,
        customerPhone: data.customer.phone,
        treatmentDate: query.date,
        treatmentServiceNames: Array.from(data.serviceSet),
        treatingDoctorNames: Array.from(data.doctorSet),
        careCount: careCountMap.get(customerId) || 0,
      })
    );

    // 5. Filter by keyword
    if (query.keyword) {
      const lower = query.keyword.toLowerCase();
      results = results.filter(
        (r) =>
          r.customerCode?.toLowerCase().includes(lower) ||
          r.customerName.toLowerCase().includes(lower) ||
          r.customerPhone?.toLowerCase().includes(lower)
      );
    }

    // 6. Sort by customerName A-Z
    results.sort((a, b) => a.customerName.localeCompare(b.customerName, "vi"));

    return results;
  },

  // Helper: Build snapshots from TreatmentLogs
  async buildTreatmentSnapshots(customerId: string, treatmentDate: string) {
    const day = dayjs.tz(treatmentDate, VN_TZ);

    const logs = await prisma.treatmentLog.findMany({
      where: {
        customerId,
        treatmentDate: {
          gte: day.startOf("day").toDate(),
          lt: day.add(1, "day").startOf("day").toDate(),
        },
      },
      include: {
        consultedService: { select: { consultedServiceName: true } },
        dentist: { select: { id: true, fullName: true } },
      },
    });

    const serviceSet = new Set<string>();
    const doctorNameSet = new Set<string>();
    const doctorIdSet = new Set<string>();
    const clinicIdSet = new Set<string>();

    logs.forEach((log) => {
      if (log.consultedService?.consultedServiceName) {
        serviceSet.add(log.consultedService.consultedServiceName);
      }
      if (log.dentist?.fullName) {
        doctorNameSet.add(log.dentist.fullName);
      }
      if (log.dentistId) {
        doctorIdSet.add(log.dentistId);
      }
      if (log.clinicId) {
        clinicIdSet.add(log.clinicId);
      }
    });

    return {
      treatmentServiceNames: Array.from(serviceSet),
      treatingDoctorNames: Array.from(doctorNameSet),
      treatingDoctorIds: Array.from(doctorIdSet),
      treatmentClinicIds: Array.from(clinicIdSet),
    };
  },

  // Helper: Group records by day
  groupByDay(records: any[]) {
    const groups = new Map<string, any[]>();

    records.forEach((record) => {
      const day = dayjs(record.careAt).tz(VN_TZ).format("YYYY-MM-DD");
      if (!groups.has(day)) {
        groups.set(day, []);
      }
      groups.get(day)!.push(record);
    });

    return Array.from(groups.entries())
      .map(([day, items]) => ({ day, items }))
      .sort((a, b) => b.day.localeCompare(a.day)); // DESC
  },
};
```

### 8.4. Server Actions

**Location**: `src/server/actions/treatment-care.actions.ts`

```typescript
"use server";

import { getSessionUser } from "@/server/utils/sessionCache";
import { treatmentCareService } from "@/server/services/treatment-care.service";
import type { CreateTreatmentCareRequest } from "@/shared/validation/treatment-care.validation";

export async function createTreatmentCareAction(
  data: CreateTreatmentCareRequest
) {
  const user = await getSessionUser();
  return treatmentCareService.create(user, data);
}

export async function deleteTreatmentCareAction(id: string) {
  const user = await getSessionUser();
  return treatmentCareService.delete(id, user);
}
```

### 8.5. API Routes

**Location**: `src/app/api/v1/treatment-cares/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/server/utils/sessionCache";
import { treatmentCareService } from "@/server/services/treatment-care.service";
import { GetTreatmentCaresQuerySchema } from "@/shared/validation/treatment-care.validation";
import { ServiceError } from "@/server/utils/errors";

/**
 * GET /api/v1/treatment-cares - List treatment care records
 *
 * Query Params:
 * - customerId: UUID (optional) - Filter by customer
 * - from: YYYY-MM-DD (optional, default: to - 34 days)
 * - to: YYYY-MM-DD (optional, default: today)
 * - groupBy: "day" (optional) - Group by day
 * - onlyMine: "true"|"false" (optional) - Filter by careStaffId
 * - clinicId: UUID (optional, admin only)
 *
 * Headers: x-employee-role, x-employee-id, x-clinic-id
 *
 * Cache: No cache (dynamic data)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    const searchParams = Object.fromEntries(req.nextUrl.searchParams);
    const query = GetTreatmentCaresQuerySchema.parse(searchParams);

    const data = await treatmentCareService.list(query, user);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("GET /api/v1/treatment-cares error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
```

**Location**: `src/app/api/v1/treatment-cares/customers/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/server/utils/sessionCache";
import { treatmentCareService } from "@/server/services/treatment-care.service";
import { GetTreatmentCareCustomersQuerySchema } from "@/shared/validation/treatment-care.validation";
import { ServiceError } from "@/server/utils/errors";

/**
 * GET /api/v1/treatment-cares/customers - Get customers needing care on specific date
 *
 * Query Params:
 * - date: YYYY-MM-DD (required) - Treatment date
 * - keyword: string (optional) - Search by code/name/phone
 * - clinicId: UUID (optional, admin only)
 *
 * Headers: x-employee-role, x-employee-id, x-clinic-id
 *
 * Cache: No cache (dynamic data)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    const searchParams = Object.fromEntries(req.nextUrl.searchParams);
    const query = GetTreatmentCareCustomersQuerySchema.parse(searchParams);

    const data = await treatmentCareService.getCustomersNeedingCare(
      query,
      user
    );
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("GET /api/v1/treatment-cares/customers error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
```

---

## 9. 🎨 Frontend Implementation

### 9.1. Types

**Location**: `src/features/treatment-care/types.ts`

```typescript
import type {
  TreatmentCareResponse,
  TreatmentCareCustomerResponse,
} from "@/shared/validation/treatment-care.validation";

export type TreatmentCareRecord = TreatmentCareResponse;
export type TreatmentCareCustomer = TreatmentCareCustomerResponse;

export type TreatmentCareGroupedByDay = Array<{
  day: string; // YYYY-MM-DD
  items: TreatmentCareRecord[];
}>;
```

### 9.2. API Client

**Location**: `src/features/treatment-care/api.ts`

```typescript
import type {
  GetTreatmentCaresQuery,
  GetTreatmentCareCustomersQuery,
} from "@/shared/validation/treatment-care.validation";

export async function getTreatmentCaresApi(params?: GetTreatmentCaresQuery) {
  const query = new URLSearchParams(params as any);
  const res = await fetch(`/api/v1/treatment-cares?${query}`);
  if (!res.ok) throw new Error("Failed to fetch treatment cares");
  return res.json();
}

export async function getTreatmentCareCustomersApi(
  params: GetTreatmentCareCustomersQuery
) {
  const query = new URLSearchParams(params as any);
  const res = await fetch(`/api/v1/treatment-cares/customers?${query}`);
  if (!res.ok) throw new Error("Failed to fetch customers needing care");
  return res.json();
}
```

### 9.3. React Query Hooks

**Location**: `src/features/treatment-care/hooks/useTreatmentCares.ts`

```typescript
import { useQuery } from "@tanstack/react-query";
import { getTreatmentCaresApi } from "../api";
import type { GetTreatmentCaresQuery } from "@/shared/validation/treatment-care.validation";

export function useTreatmentCares(params?: GetTreatmentCaresQuery) {
  return useQuery({
    queryKey: ["treatment-cares", params],
    queryFn: () => getTreatmentCaresApi(params),
  });
}
```

**Location**: `src/features/treatment-care/hooks/useTreatmentCareCustomers.ts`

```typescript
import { useQuery } from "@tanstack/react-query";
import { getTreatmentCareCustomersApi } from "../api";
import type { GetTreatmentCareCustomersQuery } from "@/shared/validation/treatment-care.validation";

export function useTreatmentCareCustomers(
  params: GetTreatmentCareCustomersQuery
) {
  return useQuery({
    queryKey: ["treatment-care-customers", params],
    queryFn: () => getTreatmentCareCustomersApi(params),
    enabled: !!params.date,
  });
}
```

**Location**: `src/features/treatment-care/hooks/useCreateTreatmentCare.ts`

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTreatmentCareAction } from "@/server/actions/treatment-care.actions";
import { message } from "antd";

export function useCreateTreatmentCare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTreatmentCareAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treatment-cares"] });
      queryClient.invalidateQueries({ queryKey: ["treatment-care-customers"] });
      message.success("Tạo bản ghi chăm sóc thành công");
    },
    onError: (error: any) => {
      message.error(error.message || "Có lỗi xảy ra");
    },
  });
}
```

**Location**: `src/features/treatment-care/hooks/useDeleteTreatmentCare.ts`

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteTreatmentCareAction } from "@/server/actions/treatment-care.actions";
import { message } from "antd";

export function useDeleteTreatmentCare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTreatmentCareAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treatment-cares"] });
      queryClient.invalidateQueries({ queryKey: ["treatment-care-customers"] });
      message.success("Xóa bản ghi chăm sóc thành công");
    },
    onError: (error: any) => {
      message.error(error.message || "Có lỗi xảy ra");
    },
  });
}
```

### 9.4. Constants

**Location**: `src/features/treatment-care/constants.ts`

```typescript
import { TreatmentCareStatus } from "@prisma/client";
import type { RadioGroupProps } from "antd";

export const TREATMENT_CARE_STATUS_OPTIONS: RadioGroupProps["options"] = [
  { label: "Bệnh nhân đã ổn", value: TreatmentCareStatus.STABLE },
  { label: "Không liên lạc được", value: TreatmentCareStatus.UNREACHABLE },
  { label: "Cần chăm sóc thêm", value: TreatmentCareStatus.NEEDS_FOLLOW_UP },
];

export const TREATMENT_CARE_STATUS_COLORS = {
  [TreatmentCareStatus.STABLE]: "success",
  [TreatmentCareStatus.UNREACHABLE]: "error",
  [TreatmentCareStatus.NEEDS_FOLLOW_UP]: "warning",
} as const;

export const TREATMENT_CARE_STATUS_LABELS = {
  [TreatmentCareStatus.STABLE]: "Bệnh nhân đã ổn",
  [TreatmentCareStatus.UNREACHABLE]: "Không liên lạc được",
  [TreatmentCareStatus.NEEDS_FOLLOW_UP]: "Cần chăm sóc thêm",
} as const;
```

---

## 10. ✅ Implementation Checklist

### Backend

- [ ] Zod schemas (`treatment-care.validation.ts`)
  - [ ] CreateTreatmentCareRequestSchema với careStatus coerce
  - [ ] Query schemas (GetTreatmentCares, GetTreatmentCareCustomers)
  - [ ] Response schemas (TreatmentCareResponse, TreatmentCareCustomerResponse)
- [ ] Repository (`treatment-care.repo.ts`)
  - [ ] create() với snapshot fields
  - [ ] list() với include customer + careStaff
  - [ ] findById() với full relations
  - [ ] delete()
- [ ] Service (`treatment-care.service.ts`)
  - [ ] create() - validate careAt >= treatmentDate, check TreatmentLog exists, build snapshots
  - [ ] delete() - permission check (admin | own + same day)
  - [ ] list() - clinic scope, date range, groupBy day, onlyMine
  - [ ] getCustomersNeedingCare() - aggregate TreatmentLogs, count TreatmentCares
  - [ ] buildTreatmentSnapshots() helper
  - [ ] groupByDay() helper
- [ ] Server Actions (`treatment-care.actions.ts`)
  - [ ] createTreatmentCareAction()
  - [ ] deleteTreatmentCareAction()
- [ ] API Routes
  - [ ] GET `/api/v1/treatment-cares` - list/grouped
  - [ ] GET `/api/v1/treatment-cares/customers` - customers needing care

### Frontend

- [ ] Types (`types.ts`)
- [ ] API Client (`api.ts`)
  - [ ] getTreatmentCaresApi()
  - [ ] getTreatmentCareCustomersApi()
- [ ] React Query Hooks
  - [ ] useTreatmentCares()
  - [ ] useTreatmentCareCustomers()
  - [ ] useCreateTreatmentCare()
  - [ ] useDeleteTreatmentCare()
- [ ] Constants (`constants.ts`)
  - [ ] Status options, colors, labels
- [ ] Components
  - [ ] CreateTreatmentCareModal (form with status radio, careContent textarea)
  - [ ] TreatmentCareCustomerTable (date selector, search, care count badge)
  - [ ] TreatmentCareTable (grouped by day, collapse panels, onlyMine filter)
  - [ ] TreatmentCareDetailModal (read-only view)
  - [ ] CustomerTreatmentCareHistory (for Customer Detail page)

### Tests

- [ ] Validate TreatmentLog dependency (422 error)
- [ ] Validate careAt >= treatmentDate (400 error)
- [ ] Snapshot generation (unique services/doctors/clinics)
- [ ] Delete permission (admin vs employee, same day check)
- [ ] Clinic scope (non-admin auto-scope)
- [ ] Date range default (35 days)
- [ ] GroupBy day logic
- [ ] OnlyMine filter
- [ ] Customer aggregation with careCount

---

## 📝 Notes

### Key Differences from Consulted Service

1. **No Appointment Dependency**: TreatmentCare links to TreatmentLog (via date), not Appointment
2. **Multiple Records**: Same customer can have multiple care records on same treatment date
3. **Immutable**: No update endpoint (current implementation)
4. **Snapshot Focus**: Denormalize treatment data to avoid complex joins
5. **Date Logic**: Two dates (`treatmentDate` vs `careAt`) with validation
6. **Default View**: 35-day grouped view (vs single-day in Consulted Service)

### Future Enhancements

- [ ] Add UPDATE endpoint for editing careContent + careStatus
- [ ] Add bulk create (care for multiple customers at once)
- [ ] Add care reminder notifications
- [ ] Add care statistics/reports
- [ ] Add care templates for common scenarios
