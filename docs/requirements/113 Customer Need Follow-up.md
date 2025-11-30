# 🧩 Requirements: Customer Need Follow-up (Denormalized Approach)

> **📋 STATUS: PENDING** - Awaiting approval for implementation  
> **📄 Feature Documentation**: `docs/features/113_Customer_Need_Follow_up.md` (when completed)  
> **🔗 Implementation**: `src/features/customers/` (extend existing feature)

## 📊 Tham khảo

- Related Requirements: `008 Appointment.md` (Status definitions)
- Prisma Model Customer: `prisma/schema.prisma`
- Validation Schema: `src/shared/validation/customer.schema.ts` (extend)
- Constants: `src/features/customers/constants.ts` (extend)

## 🎯 Mục Tiêu & Phạm Vi

### 📐 **Vấn đề cần giải quyết:**

Lễ tân cần biết **khách hàng nào chưa đến lịch hẹn** và **chưa đặt lịch mới** để gọi điện follow-up, nhắc nhở hoặc tái lập lịch.

**User Story:**

> "Là lễ tân, tôi muốn xem danh sách khách hàng có lịch hẹn nhưng không đến, và họ chưa đặt lịch mới, để tôi có thể gọi điện nhắc nhở và chăm sóc khách hàng."

### 🎯 **Phạm vi:**

- ✅ Denormalized approach: Lưu `lastAppointmentDate` + `lastAppointmentStatus` vào `Customer`
- ✅ Auto-update khi tạo/sửa/xóa appointment
- ✅ Trang mới: `/customers/need-follow-up` - List khách cần follow-up
- ✅ Filter theo clinic, tìm kiếm, sắp xếp
- ✅ Query real-time cho next appointment (không lưu vào DB)
- ❌ KHÔNG tạo bảng FollowUpTask riêng (quá phức tạp, không cần thiết - Phương án 1)
- ❌ KHÔNG dùng report + filter appointments (không đủ thông tin về lịch sau này - Phương án 2)

---

## 🎲 Decision Log

### Database Schema

- ✅ **Denormalized fields trong Customer**:

  - Lưu `lastAppointmentDate` + `lastAppointmentStatus` cho query nhanh
  - KHÔNG lưu `nextAppointmentDate` + `nextAppointmentStatus` (query real-time để tránh duplicate)
  - Pattern giống `lastConsultedServiceDate` đã có sẵn

- ✅ **Auto-update trigger**:
  - Update khi: CREATE/UPDATE/DELETE appointment
  - Update trong transaction với appointment changes
  - Re-calculate from database (không dựa vào memory)

### Query Strategy

- ✅ **Last Appointment**: Stored trong Customer (denormalized)

  - Fast query: `WHERE lastAppointmentStatus NOT IN (...)`
  - No JOIN needed cho initial filter

- ✅ **Next Appointment**: Query real-time
  - JOIN với Appointment table
  - Filter: `appointmentDateTime > TODAY AND status != 'Đã hủy'`
  - Rationale: Tránh duplicate data, sync issues, và next appointment ít thay đổi

### Follow-up Criteria

**3 điều kiện cần đồng thời đáp ứng:**

1. **Có lịch hẹn gần nhất**: `lastAppointmentDate IS NOT NULL AND lastAppointmentDate <= TODAY`
2. **Status chưa đến**: `lastAppointmentStatus NOT IN ('Đã đến', 'Đến đột xuất', 'Đã hủy')`
3. **Chưa có lịch tương lai**: `NOT EXISTS (SELECT 1 FROM Appointment WHERE ... AND status != 'Đã hủy')`

**Giải thích status (từ 008 Appointment.md):**

- ✅ "Chờ xác nhận": Cần follow-up (khách chưa confirm)
- ✅ "Đã xác nhận": Cần follow-up (khách confirm nhưng không đến)
- ~~✅ "Không đến": Cần follow-up (status legacy - không còn tạo mới)~~ **[REMOVED 2025-11-30]** - Status đã bị xóa hoàn toàn
- ❌ "Đã đến": Không cần follow-up (đã đến rồi)
- ❌ "Đến đột xuất": Không cần follow-up (walk-in đã đến)
- ❌ "Đã hủy": Không cần follow-up (khách không muốn làm nữa)

**⚠️ Lưu ý về Status "Không đến" (2025-11-30 Update)**:

- ❌ Status "Không đến" **đã bị xóa hoàn toàn** khỏi schema, permissions, constants
- ✅ Tất cả data cũ đã được migrate sang "Chờ xác nhận" qua script `scripts/migrate-no-show-status.ts`
- ✅ Follow-up criteria chỉ còn check 2 status: "Chờ xác nhận" và "Đã xác nhận"
- ✅ Schema validation không còn accept "Không đến"

---

## 🏗️ Technical Implementation

### 📊 **Schema Changes:**

```prisma
model Customer {
  // ... existing fields

  // Denormalized appointment tracking (THÊM MỚI)
  lastAppointmentDate   DateTime? // Ngày của lịch hẹn gần nhất (quá khứ + hôm nay)
  lastAppointmentStatus String?   // Status: "Chờ xác nhận" | "Đã xác nhận" | "Đã đến" | "Đến đột xuất" | "Đã hủy"
                                  // Note: "Không đến" removed 2025-11-30

  // Existing denormalized fields (THAM KHẢO - không sửa)
  lastConsultedServiceDate DateTime?
  totalSpent               Decimal?
  totalPaid                Decimal?
  totalUnpaid              Decimal?
}
```

### 🔄 **Auto-update Logic:**

**Hàm helper mới trong `appointment.service.ts`:**

```typescript
/**
 * Re-calculate và update lastAppointmentDate/Status của customer
 * Gọi sau mỗi CREATE/UPDATE/DELETE appointment
 */
async function updateCustomerLastAppointment(
  customerId: string
): Promise<void> {
  // 1. Query last appointment (quá khứ + hôm nay)
  const today = dayjs().endOf("day").toDate(); // 23:59:59 hôm nay

  const lastAppointment = await prisma.appointment.findFirst({
    where: {
      customerId,
      appointmentDateTime: { lte: today },
    },
    orderBy: { appointmentDateTime: "desc" },
    select: {
      appointmentDateTime: true,
      status: true,
    },
  });

  // 2. Update Customer
  await prisma.customer.update({
    where: { id: customerId },
    data: {
      lastAppointmentDate: lastAppointment?.appointmentDateTime ?? null,
      lastAppointmentStatus: lastAppointment?.status ?? null,
    },
  });
}
```

**Trigger points trong appointment.service.ts:**

```typescript
// CREATE appointment
async create(data: AppointmentCreateInput, user: UserCore) {
  const appointment = await appointmentRepo.create(data);
  await updateCustomerLastAppointment(data.customerId); // <-- THÊM
  return appointment;
}

// UPDATE appointment
async update(id: string, data: AppointmentUpdateInput, user: UserCore) {
  const updated = await appointmentRepo.update(id, data);
  await updateCustomerLastAppointment(updated.customerId); // <-- THÊM
  return updated;
}

// DELETE appointment
async delete(id: string, user: UserCore) {
  const appointment = await appointmentRepo.findById(id);
  await appointmentRepo.delete(id);
  await updateCustomerLastAppointment(appointment.customerId); // <-- THÊM
}
```

### 📡 **API Endpoint mới:**

```
GET /api/v1/customers/need-follow-up?clinicId={clinicId}&search={keyword}
```

**Request Query:**

```typescript
export const GetCustomersNeedFollowUpQuerySchema = z.object({
  clinicId: z.string().uuid("Clinic ID không hợp lệ").optional(),
  search: z.string().optional(), // Tìm theo tên hoặc SĐT
});
```

**Response:**

```typescript
export const CustomerNeedFollowUpResponseSchema = z.object({
  id: z.string(),
  customerCode: z.string(),
  fullName: z.string(),
  phone: z.string().nullable(),
  lastAppointmentDate: z.string(), // ISO date
  lastAppointmentStatus: z.string(),
  daysSinceLastAppointment: z.number(), // Số ngày kể từ lịch hẹn cuối
  clinic: z
    .object({
      id: z.string(),
      name: z.string(),
      colorCode: z.string().nullable(),
    })
    .nullable(),
});

export const CustomersNeedFollowUpListResponseSchema = z.array(
  CustomerNeedFollowUpResponseSchema
);
```

**Service Layer Logic:**

```typescript
// src/server/services/customer.service.ts

async getCustomersNeedFollowUp(
  clinicId?: string,
  search?: string,
  user?: UserCore
): Promise<CustomerNeedFollowUp[]> {
  const today = dayjs().endOf('day').toDate();

  // Filter customers cần follow-up
  const customers = await prisma.customer.findMany({
    where: {
      // Điều kiện 1: Có lịch hẹn gần nhất <= hôm nay
      lastAppointmentDate: {
        not: null,
        lte: today
      },
      // Điều kiện 2: Status chưa đến
      lastAppointmentStatus: {
        notIn: ['Đã đến', 'Đến đột xuất', 'Đã hủy']
      },
      // Điều kiện 3: Chưa có lịch tương lai (NOT EXISTS - query real-time)
      appointments: {
        none: {
          appointmentDateTime: { gt: today },
          status: { not: 'Đã hủy' }
        }
      },
      // Filter theo clinic nếu có
      ...(clinicId && { primaryClinicId: clinicId }),
      // Tìm kiếm theo tên/SĐT
      ...(search && {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } }
        ]
      })
    },
    select: {
      id: true,
      customerCode: true,
      fullName: true,
      phone: true,
      lastAppointmentDate: true,
      lastAppointmentStatus: true,
      primaryClinic: {
        select: {
          id: true,
          name: true,
          colorCode: true
        }
      }
    },
    orderBy: [
      { lastAppointmentDate: 'asc' } // Lịch cũ nhất lên đầu (ưu tiên follow-up)
    ]
  });

  // Calculate daysSinceLastAppointment
  return customers.map(customer => ({
    ...customer,
    daysSinceLastAppointment: dayjs().diff(dayjs(customer.lastAppointmentDate), 'day'),
    clinic: customer.primaryClinic
  }));
}
```

---

## 🎨 Component Specifications

### 1. 📋 **Trang `/customers/need-follow-up`**

#### 🎯 **Layout & Design:**

```
┌──────────────────────────────────────────────────────────────────┐
│  👥 Khách Hàng Cần Follow-up                    [🔍 Tìm kiếm]   │
├──────────────────────────────────────────────────────────────────┤
│  Tổng: 15 khách hàng                                              │
├──────────────────────────────────────────────────────────────────┤
│  Mã KH   │ Họ tên          │ SĐT        │ Lịch cuối │ Trạng thái │ Chi nhánh │ Số ngày │ Hành động │
│  KH001   │ Nguyễn Văn A    │ 0901...    │ 25/11     │ Không đến  │ CS1       │ 5 ngày  │ [📞][📅]  │
│  KH002   │ Trần Thị B      │ 0902...    │ 20/11     │ Chờ XN     │ CS2       │ 10 ngày │ [📞][📅]  │
└──────────────────────────────────────────────────────────────────┘
```

#### 📊 **Table Columns:**

| Column        | Width | Type        | Description                              |
| ------------- | ----- | ----------- | ---------------------------------------- |
| Mã KH         | 100px | Text        | Customer code                            |
| Họ tên        | 180px | Text + Link | Tên khách → Click vào mở Customer Detail |
| SĐT           | 120px | Text        | Phone number                             |
| Lịch hẹn cuối | 100px | Date        | lastAppointmentDate (DD/MM)              |
| Trạng thái    | 120px | Tag         | lastAppointmentStatus với màu sắc        |
| Chi nhánh     | 120px | Tag         | Clinic name + color                      |
| Số ngày       | 80px  | Number      | Days since last appointment              |
| Hành động     | 120px | Buttons     | Gọi điện, Đặt lịch                       |

#### 🎨 **Status Colors:**

- "Chờ xác nhận" → Tag màu `orange`
- "Đã xác nhận" → Tag màu `blue`
- "Không đến" → Tag màu `red`

#### 🔍 **Filters:**

```typescript
// State
const [clinicId, setClinicId] = useState<string | undefined>();
const [search, setSearch] = useState<string>('');

// UI Components
<Select
  placeholder="Tất cả chi nhánh"
  value={clinicId}
  onChange={setClinicId}
  options={clinics} // Load từ useClinics()
/>

<Input.Search
  placeholder="Tìm theo tên hoặc SĐT..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  allowClear
/>
```

#### 🎯 **Actions:**

1. **📞 Gọi điện**:

   - Copy SĐT vào clipboard
   - Hiển thị toast: "Đã copy số điện thoại"
   - (Future: Tích hợp VoIP nếu có)

2. **📅 Đặt lịch mới**:
   - Mở `CreateAppointmentModal` với customerId pre-filled
   - Sau khi tạo lịch thành công → Customer biến mất khỏi list (do có next appointment)

---

### 2. 🎣 **Custom Hook: `useCustomersNeedFollowUp`**

```typescript
// src/features/customers/hooks/useCustomersNeedFollowUp.ts

export function useCustomersNeedFollowUp(clinicId?: string, search?: string) {
  return useQuery({
    queryKey: CUSTOMER_QUERY_KEYS.needFollowUp(clinicId, search),
    queryFn: () => getCustomersNeedFollowUpApi({ clinicId, search }),
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  });
}
```

**Query Key pattern:**

```typescript
// src/features/customers/constants.ts
export const CUSTOMER_QUERY_KEYS = {
  // ... existing keys
  needFollowUp: (clinicId?: string, search?: string) =>
    ["customers", "need-follow-up", { clinicId, search }] as const,
} as const;
```

---

## 🧪 Validation Cases

### ✅ **Test Scenarios:**

Giả sử **hôm nay là ngày 15/11/2025**:

| #   | Tình huống   | Last Appointment          | Next Appointment (Query) | Hiển thị? | Lý do                                    |
| --- | ------------ | ------------------------- | ------------------------ | --------- | ---------------------------------------- |
| 1   | Khách A      | Ngày 8: **Không đến**     | NULL                     | ✅ **CÓ** | Không đến + chưa đặt lịch mới            |
| 2   | Khách B      | Ngày 9: **Đã đến**        | NULL                     | ❌ KHÔNG  | Đã đến rồi                               |
| 3   | Khách C (v1) | Ngày 10: **Không đến**    | Ngày 25: Chờ xác nhận    | ❌ KHÔNG  | Đã có lịch tương lai active              |
| 4   | Khách C (v2) | Ngày 10: **Không đến**    | Ngày 14: **Đã hủy**      | ✅ **CÓ** | Lịch tương lai bị hủy → coi như không có |
| 5   | Khách D      | Ngày 12: **Đã hủy**       | NULL                     | ❌ KHÔNG  | Khách không muốn làm nữa                 |
| 6   | Khách E      | Ngày 14: **Chờ xác nhận** | NULL                     | ✅ **CÓ** | Khách chưa confirm                       |
| 7   | Khách F      | Ngày 13: **Đã xác nhận**  | NULL                     | ✅ **CÓ** | Khách confirm nhưng không đến            |
| 8   | Khách G      | Ngày 5: **Đến đột xuất**  | NULL                     | ❌ KHÔNG  | Walk-in đã đến                           |

**Giải thích Case 4 (quan trọng):**

- Last appointment: Ngày 10 (Không đến)
- Next appointment: Ngày 14 (Đã hủy) - **trong quá khứ nhưng status "Đã hủy"**
- Lễ tân gọi điện ngày 15, khách bảo không làm nữa → lễ tân ấn "Khách hủy"
- Query: `appointments.none` với điều kiện `appointmentDateTime > today AND status != 'Đã hủy'`
- → Ngày 14 bị loại vì `status = 'Đã hủy'` → Match "none" condition → Customer xuất hiện trong list ✅

### 🎯 **Edge Cases:**

| Edge Case                              | Xử lý                                               |
| -------------------------------------- | --------------------------------------------------- |
| Customer có 2 appointments cùng ngày   | Lấy record có `appointmentDateTime` DESC (mới nhất) |
| Appointment bị xóa                     | Re-calculate `lastAppointmentDate/Status` từ DB     |
| Hôm nay có appointment status "Đã đến" | Update ngay vào Customer (trong transaction)        |
| Multiple clinics                       | Filter theo `primaryClinicId` của employee          |
| Customer mới (chưa có lịch hẹn)        | `lastAppointmentDate = NULL` → Không hiển thị       |
| Tất cả lịch tương lai bị hủy           | `appointments.none` match → Hiển thị trong list     |

---

## 📱 User Experience

### 🎯 **Main User Flow:**

```
1. Lễ tân mở trang /customers/need-follow-up
   ↓
2. Hệ thống hiển thị danh sách khách cần follow-up
   - Sắp xếp theo ngày cũ nhất (ưu tiên cao)
   ↓
3. Lễ tân lọc theo chi nhánh hoặc tìm kiếm tên/SĐT
   ↓
4. Click "Gọi điện" → Copy SĐT → Toast notification
   ↓
5. Gọi điện cho khách
   ↓
6a. Nếu khách đồng ý → Click "Đặt lịch" → Modal tạo appointment → Customer biến mất
6b. Nếu khách từ chối → Mở appointment cũ → Cập nhật status "Đã hủy"
```

### 🚨 **Error Handling:**

```typescript
// Error message mapping
'UNAUTHORIZED' → 'Bạn chưa đăng nhập'
'NOT_FOUND' → 'Không tìm thấy dữ liệu'
'SERVER_ERROR' → 'Lỗi máy chủ. Vui lòng thử lại.'
```

### 📱 **Responsive Design:**

- **Desktop**: Table layout đầy đủ
- **Tablet**: Scroll horizontal table
- **Mobile**: Card layout với thông tin rút gọn
- **Loading**: Skeleton table với 5 rows
- **Empty state**:
  ```
  🎉 Tuyệt vời! Không có khách hàng cần follow-up.
  Tất cả khách hàng đều đã đến hoặc đã đặt lịch mới.
  ```

---

## 🔐 Security & Permissions

### 👨‍💼 **Role-based Access:**

- ✅ **Admin**: Xem tất cả customers need follow-up (all clinics)
- ✅ **Employee**: Chỉ xem customers của clinic mình
  - Server filter: `WHERE primaryClinicId = user.clinicId`
- ❌ Không cần permission mới (dùng existing `customer.view`)

### 🛡️ **Security Measures:**

- Server-side clinic filter based on user role
- No sensitive data exposure (chỉ public customer fields)
- Query optimization với index

---

## ⚡ Performance & Optimization

### 🎯 **Database Optimization:**

**Index mới cần thêm:**

```prisma
model Customer {
  // ... fields

  @@index([lastAppointmentDate, lastAppointmentStatus]) // Composite index cho follow-up query
  @@index([primaryClinicId, lastAppointmentDate]) // Clinic filter
}
```

**Query performance estimate:**

- Denormalized fields → No JOIN cho initial filter
- `appointments.none` → Prisma optimize với NOT EXISTS
- Index scan trên `lastAppointmentDate ASC`
- 🎯 Target: < 100ms cho 1000 customers

### 🔄 **Caching Strategy:**

```typescript
// React Query config
staleTime: 30 * 1000, // 30s (acceptable staleness)
refetchOnWindowFocus: true, // Fresh data on tab focus
gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
```

**Invalidation triggers:**

- Sau CREATE appointment → `invalidateQueries(['customers', 'need-follow-up'])`
- Sau UPDATE appointment status → Invalidate
- Không invalidate khi update customer info

---

## ✅ Acceptance Criteria

### 🧪 **Functional Requirements:**

- [ ] Schema migration thành công (2 fields mới)
- [ ] Auto-update `lastAppointmentDate/Status` khi CREATE/UPDATE/DELETE appointment
- [ ] API endpoint `/customers/need-follow-up` hoạt động
- [ ] Filter theo clinic chính xác (Employee chỉ thấy clinic mình)
- [ ] Tìm kiếm theo tên/SĐT
- [ ] Sắp xếp theo `lastAppointmentDate ASC`
- [ ] Tính `daysSinceLastAppointment` chính xác
- [ ] Status tags hiển thị đúng màu
- [ ] Button "Gọi điện" copy SĐT + toast
- [ ] Button "Đặt lịch" mở modal pre-filled
- [ ] Sau tạo lịch → Customer biến mất khỏi list

### 🎯 **Validation Test Cases:**

- [ ] Case 1-8 theo bảng validation ở trên
- [ ] Edge cases: xóa appointment, cùng ngày, multiple clinics

### 🎨 **UI/UX Requirements:**

- [ ] Responsive (Desktop/Tablet/Mobile)
- [ ] Loading skeleton
- [ ] Empty state
- [ ] Toast notifications
- [ ] Smooth transitions

### 🔐 **Security Requirements:**

- [ ] Employee chỉ xem clinic mình
- [ ] Admin xem tất cả
- [ ] No SQL injection (Prisma)
- [ ] No sensitive data leak

### ⚡ **Performance Requirements:**

- [ ] Query < 100ms
- [ ] Composite index active
- [ ] React Query caching
- [ ] No unnecessary re-renders

---

## 📝 Migration Plan

### 1️⃣ **Phase 1: Database Migration**

```bash
npx prisma migrate dev --name add_customer_last_appointment_tracking
```

Prisma schema change:

```prisma
model Customer {
  // ... existing
  lastAppointmentDate   DateTime?
  lastAppointmentStatus String?

  @@index([lastAppointmentDate, lastAppointmentStatus])
  @@index([primaryClinicId, lastAppointmentDate])
}
```

### 2️⃣ **Phase 2: Backfill Data Script**

```typescript
// scripts/backfill-customer-last-appointment.ts
import { prisma } from "@/services/prisma/prisma";
import dayjs from "dayjs";

async function backfillCustomerLastAppointment() {
  const customers = await prisma.customer.findMany({ select: { id: true } });
  const today = dayjs().endOf("day").toDate();

  for (const customer of customers) {
    const lastAppointment = await prisma.appointment.findFirst({
      where: {
        customerId: customer.id,
        appointmentDateTime: { lte: today },
      },
      orderBy: { appointmentDateTime: "desc" },
      select: { appointmentDateTime: true, status: true },
    });

    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        lastAppointmentDate: lastAppointment?.appointmentDateTime ?? null,
        lastAppointmentStatus: lastAppointment?.status ?? null,
      },
    });

    console.log(`Updated customer ${customer.id}`);
  }

  console.log("✅ Backfill complete");
}

backfillCustomerLastAppointment();
```

### 3️⃣ **Phase 3: Backend Implementation**

- [ ] Update `appointment.service.ts` với `updateCustomerLastAppointment()` helper
- [ ] Add trigger points trong CREATE/UPDATE/DELETE
- [ ] Implement `customer.service.ts` → `getCustomersNeedFollowUp()`
- [ ] Create API route `/api/v1/customers/need-follow-up/route.ts`
- [ ] Add Zod schemas

### 4️⃣ **Phase 4: Frontend Implementation**

- [ ] Create page `src/app/(private)/customers/need-follow-up/page.tsx`
- [ ] Implement hook `useCustomersNeedFollowUp()`
- [ ] Add query keys, API client functions
- [ ] UI components: Table, filters, action buttons
- [ ] Integrate with existing `CreateAppointmentModal`

### 5️⃣ **Phase 5: Testing**

- [ ] Unit tests for `updateCustomerLastAppointment()`
- [ ] Integration tests for API endpoint
- [ ] Manual testing all 8 validation cases
- [ ] Performance test với 1000+ customers
- [ ] Cross-browser & mobile testing

---

## 🔮 Future Enhancements (Out of Scope)

- [ ] `lastContactedDate` field để track lần gọi cuối
- [ ] "Đã liên hệ" button
- [ ] Dashboard badge: số khách cần follow-up
- [ ] Auto-reminder notifications
- [ ] SMS/Email integration
- [ ] Follow-up conversion analytics
- [ ] VoIP direct calling
- [ ] Follow-up notes/history

---
