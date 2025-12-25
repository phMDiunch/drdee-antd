# 020 Lead-Customer ConsultedService Integration

## 📋 Tổng Quan

**Module**: Lead-Customer ConsultedService Integration

**Mục đích**: Xử lý ConsultedService (Sales Opportunity) cho cả Lead (chưa đến phòng khám) và Customer (đã/đang đến phòng khám), đảm bảo seamless transition khi Lead convert thành Customer.

---

## 🗄️ Schema Design

### Schema Changes Required

```prisma
model ConsultedService {
  // ❌ ISSUE 1: appointmentId NOT NULL
  appointmentId   String // Không thể tạo cho Lead/Customer tư vấn online

  // ❌ ISSUE 2: consultationDate có @default(now())
  consultationDate DateTime @default(now()) @db.Timestamptz // Trùng với createdAt

  // ✅ FIX 1: Make appointmentId nullable
  appointmentId   String? // null = tư vấn online, có value = đã đến phòng khám

  // ✅ FIX 2: Make consultationDate nullable, remove @default(now())
  consultationDate  DateTime? @db.Timestamptz // Set khi bind appointment (= appointmentDateTime)

  appointment Appointment? @relation(...)
}
```

---

## 🔧 Business Logic

### 1. ConsultedService Creation Rules

#### Rule Matrix

| Check-in Status  | appointmentId | Who Can Create                         |
| ---------------- | ------------- | -------------------------------------- |
| ❌ Chưa check-in | `null`        | Sale Online, Sale Offline              |
| ✅ Đã check-in   | `<id>`        | Lễ tân/Bác sĩ/Sale Offline (tại phòng) |

**⭐ Key Insights**:

- Logic **CHỈ** phụ thuộc vào **check-in status**
- Backend tự động set `appointmentId` dựa vào check-in status
- **Chưa check-in**: `appointmentId = null` (tự động)
- **Đã check-in**: `appointmentId = checkedInAppointment.id` (tự động)
- Frontend không cần gửi flag hay channel gì

#### Business Rules

**Rule 1: Auto-detect appointmentId dựa vào check-in status**

```typescript
// Backend tự động xử lý appointmentId
const appointment = await findCheckedInAppointmentToday(customerId, clinicId);

if (appointment) {
  // Đã check-in → Bắt buộc gắn với appointment
  appointmentId = appointment.id;
} else {
  // Chưa check-in → Không có appointment (tư vấn online)
  appointmentId = null;
}
```

### 2. Auto-Binding Services on Check-in

#### Flow for Lead/Customer with Pending Services

**Scenario**: Khách (Lead hoặc Customer) có các consulted services chưa gắn appointment (appointmentId = null)

**Process:**

```typescript
// Khi check-in → TỰ ĐỘNG bind tất cả pending services
async function handleCheckIn(customerId: string, clinicId: string) {
  // 1. Tạo Appointment & Check-in
  const appointment = await createAndCheckInAppointment({
    customerId,
    clinicId,
    appointmentDateTime: new Date(),
    // ...
  });

  // 2. AUTO: Tìm tất cả services chưa có appointment
  const pendingServices = await findConsultedServices({
    customerId,
    appointmentId: null, // Chỉ cần điều kiện này (tự động là "Chưa chốt")
  });

  // 3. AUTO: Bind tất cả với appointment vừa tạo
  if (pendingServices.length > 0) {
    for (const service of pendingServices) {
      await updateConsultedService(service.id, {
        appointmentId: appointment.id,
        consultationDate: appointment.appointmentDateTime, // Set ngày tư vấn
      });
    }

    console.log(
      `✅ Auto-bound ${pendingServices.length} services to appointment`
    );
  }

  return appointment;
}
```

**UI Flow:**

```
1. User search SĐT Lead → Mở Customer Detail
2. [Optional] Click "Chuyển thành khách hàng" (nếu còn là Lead)
   → Update Customer.type = "CUSTOMER", firstVisitDate = now
3. Click "Check-in" → Tạo Appointment + Check-in
4. Backend TỰ ĐỘNG bind tất cả consulted services (appointmentId = null)
   với appointment vừa tạo
5. Success message: "✅ Đã check-in thành công!"
```

**Business Rules:**

- ✅ Tự động bind TẤT CẢ services có `appointmentId = null`
- ✅ Áp dụng cho cả Lead và Customer
- ✅ Không cần user confirm (tự động 100%)

### 3. Key Points

#### Auto-Binding Behavior

**Khi nào services được bind tự động:**

- ✅ Khi customer check-in (bất kể Lead hay Customer)
- ✅ Tất cả services có `appointmentId = null`
- ✅ Bind với appointment vừa được tạo/check-in
- ✅ Tự động set `consultationDate = appointment.appointmentDateTime`

**Date Fields Logic:**

| Field                | Khi nào set                            | Ý nghĩa                                          |
| -------------------- | -------------------------------------- | ------------------------------------------------ |
| `createdAt`          | Khi tạo record                         | Ngày sale tạo consulted service (online/offline) |
| `consultationDate`   | Khi bind với appointment (check-in)    | Ngày khách ĐẾN phòng khám được tư vấn            |
| `serviceConfirmDate` | Khi chốt dịch vụ (click button "Chốt") | Ngày khách hàng đồng ý/chốt dịch vụ              |

**Note:**

- Nếu customer đã check-in rồi → Backend tự động set `appointmentId` + `consultationDate` khi tạo service mới
- Nếu customer chưa check-in → `appointmentId = null`, `consultationDate = null` → Sẽ được set khi check-in lần sau

---

## 🎨 UI/UX Design

### 1. ConsultedService Creation Form (Dùng chung cho Lead và Customer)

```tsx
// src/features/customers/components/detail-tabs/ConsultedServicesTab.tsx
// ⭐ Component này dùng CHUNG cho cả Lead và Customer

export default function ConsultedServicesTab({
  customerId,
  todayCheckIn, // Lead: null, Customer: có thể có
}: Props) {
  const isCheckedIn = !!todayCheckIn;

  return (
    <Space direction="vertical" size="small">
      <Button
        type={isCheckedIn ? "primary" : "default"}
        icon={<PlusOutlined />}
        onClick={handleCreate}
        style={
          isCheckedIn
            ? {}
            : {
                backgroundColor: "#ff7a45",
                borderColor: "#ff7a45",
                color: "#fff",
              }
        }
      >
        {isCheckedIn
          ? "Thêm dịch vụ tư vấn tại phòng khám"
          : "Thêm dịch vụ tư vấn online"}
      </Button>

      <Text type="secondary" style={{ fontSize: 12 }}>
        {isCheckedIn
          ? "✅ Dịch vụ sẽ gắn với lịch hẹn hôm nay"
          : "💡 Dịch vụ tạo online (chưa có lịch hẹn)"}
      </Text>
    </Space>
  );
}
```

### 2. Check-in Flow

**Note:** Check-in có thể thực hiện ở nhiều nơi (Appointment Daily, Customer Detail, Quick Check-in...). Backend tự động bind pending services, frontend chỉ hiển thị message success đơn giản.

### 3. Table Display

**Note:** Không cần thêm column "Lịch hẹn". Cột **Ngày tư vấn** (consultationDate) đã đủ để phân biệt:

- Trống = Chưa gắn lịch hẹn (appointmentId = null)
- Có giá trị = Đã gắn lịch hẹn (appointmentId có)

---

## 🔄 API Changes

### Backend Service Updates

```typescript
// src/server/services/appointment.service.ts

export const appointmentService = {
  async create(currentUser: UserCore | null, body: unknown) {
    // ...
    const created = await appointmentRepo.create(data);

    // Auto-bind pending consulted services if created with checkInTime (walk-in)
    if (parsed.checkInTime) {
      await consultedServiceService.autoBindPendingServices(
        created.customerId,
        created.id,
        currentUser
      );
    }

    return created;
  },

  async update(id: string, currentUser: UserCore | null, body: unknown) {
    // ...
    const updated = await appointmentRepo.update(id, updates);

    // Auto-bind pending consulted services after check-in
    const isCheckIn = parsed.checkInTime && !updated.checkOutTime;
    if (isCheckIn) {
      await consultedServiceService.autoBindPendingServices(
        updated.customerId,
        updated.id,
        currentUser
      );
    }

    return updated;
  },
};
```

```typescript
// src/server/services/consulted-service.service.ts

export const consultedServiceService = {
  async create(currentUser: UserCore | null, body: unknown) {
    requireAuth(currentUser);

    const parsed = CreateConsultedServiceRequestSchema.parse(body);
    const { customerId, clinicId, ...data } = parsed;

    // 1. Get customer
    const customer = await customerRepo.findById(customerId);
    if (!customer) {
      throw new ServiceError("NOT_FOUND", "Không tìm thấy khách hàng", 404);
    }

    // 2. Auto-detect appointmentId dựa vào check-in status
    const appointment = await appointmentRepo.findCheckedInToday(
      customerId,
      clinicId
    );

    const appointmentId = appointment ? appointment.id : null;
    const consultationDate = appointment
      ? appointment.appointmentDateTime
      : null;

    // 3. Validate dental service, pricing, etc. (existing logic)
    // ...

    // 4. Create ConsultedService
    const createInput = {
      ...data,
      customerId,
      clinicId,
      appointmentId, // Nullable - null khi tạo online
      consultationDate, // Nullable - null khi tạo online, set khi có appointment
      // ... other fields
    };

    return await consultedServiceRepo.create(createInput);
  },

  // NEW: Auto-bind pending services after check-in
  async autoBindPendingServices(
    customerId: string,
    appointmentId: string,
    currentUser: UserCore | null
  ) {
    // Tìm tất cả services chưa có appointment
    const pendingServices = await consultedServiceRepo.findMany({
      customerId,
      appointmentId: null, // Chỉ cần điều kiện này
    });

    if (pendingServices.length === 0) {
      return { success: true, count: 0 };
    }

    // Bind tất cả với appointment
    const appointment = await appointmentRepo.findById(appointmentId);

    for (const service of pendingServices) {
      await consultedServiceRepo.update(service.id, {
        appointmentId,
        consultationDate: appointment.appointmentDateTime, // Set ngày tư vấn
        updatedById: currentUser?.employeeId,
      });
    }

    return { success: true, count: pendingServices.length };
  },
};
```

### Validation Schema Updates

```typescript
// src/shared/validation/consulted-service.schema.ts

// Frontend schema - Không cần flag gì, backend tự detect
export const CreateConsultedServiceRequestSchema = z.object({
  customerId: z.string().uuid(),
  clinicId: z.string().uuid(),
  dentalServiceId: z.string().uuid(),
  quantity: z.number().int().min(1),
  preferentialPrice: z.number().int().min(0),
  // ... other fields
  // NOTE: appointmentId được backend tự động set dựa vào check-in status
});

// Backend schema
export const CreateConsultedServiceBackendSchema =
  CreateConsultedServiceRequestSchema.extend({
    appointmentId: z.string().uuid().nullable(), // Resolved by backend
  });
```

---

## 📊 Migration Plan

### Phase 1: Database Migration

```prisma
// prisma/migrations/XXX_make_appointment_optional/migration.sql

-- Make appointmentId nullable
ALTER TABLE "ConsultedService"
  ALTER COLUMN "appointmentId" DROP NOT NULL;

-- Add index for finding online consultations
CREATE INDEX "ConsultedService_customerId_appointmentId_idx"
  ON "ConsultedService"("customerId", "appointmentId");
```

### Phase 2: Data Migration (if needed)

```typescript
// scripts/migrate-consulted-services.ts

// Nếu có data cũ với appointmentId invalid
// Có thể set null cho các records không còn appointment

async function migrateOrphanedServices() {
  const orphaned = await prisma.consultedService.findMany({
    where: {
      appointment: null, // FK không tồn tại
    },
  });

  for (const service of orphaned) {
    await prisma.consultedService.update({
      where: { id: service.id },
      data: { appointmentId: null },
    });
  }

  console.log(`Migrated ${orphaned.length} orphaned services`);
}
```

### Phase 3: Feature Rollout

1. ✅ Backend: Update service logic (appointment optional)
2. ✅ Backend: Add new APIs (bindToAppointment, convertLeadToCustomer)
3. ✅ Frontend: Update ConsultedServicesTab (dùng chung cho Lead và Customer)
4. ✅ Frontend: Add conversion UI in Appointment Daily View
5. ✅ Testing: Test all flows (Lead, Customer online/offline)

---

## 📝 Implementation Checklist

### Database

- [ ] Make ConsultedService.appointmentId nullable
- [ ] Make ConsultedService.consultationDate nullable, remove @default(now())
- [ ] Run migration
- [ ] Add index for (customerId, appointmentId) queries

### Backend (Services)

- [x] Update consultedServiceService.create() - auto-detect appointmentId + consultationDate from check-in status
- [x] Create consultedServiceService.autoBindPendingServices() - bind all pending services to appointment
- [x] Update appointmentService.create() - call autoBindPendingServices after check-in (walk-in flow)
- [x] Update appointmentService.update() - call autoBindPendingServices after check-in (pre-booked flow)

### Backend (Validation)

- [ ] appointmentId và consultationDate được backend tự động set, không có trong request schema
- [ ] Frontend chỉ gửi: customerId, clinicId, dentalServiceId, quantity, preferentialPrice...

### Frontend (Customer & Lead - Dùng chung component)

- [x] Update ConsultedServicesTab - dynamic button với màu + text thay đổi
- [x] Button chưa check-in: `danger` prop (Ant Design red), text "Thêm dịch vụ tư vấn online"
- [x] Button đã check-in: `type="primary"` (blue), text "Thêm dịch vụ tư vấn tại phòng khám"
- [x] Component dùng CHUNG cho Lead và Customer (chỉ khác todayCheckIn prop)
- [x] Helper text động: Dùng Tooltip với title "Dịch vụ sẽ gắn với lịch hẹn hôm nay" / "Dịch vụ tạo online (chưa có lịch hẹn)"
- [x] Disable "Chốt" button for services with appointmentId = null (✅ Implemented in permissions)

### Frontend (Appointments)

- [x] useCreateAppointment: Invalidate ["consulted-services"] khi checkInTime có (walk-in flow)
- [x] useUpdateAppointment: Invalidate ["consulted-services"] khi check-in (pre-booked flow)
- [x] Check-in success message: "Đã check-in thành công!" (không hiển thị số services đã bind)

### Testing

- [ ] Test Lead online consultation flow
- [ ] Test Customer online consultation flow (chưa check-in)
- [ ] Test Customer offline consultation flow (đã check-in)
- [ ] Test auto-binding: Check-in → All pending services bind tự động

### Documentation

- [ ] Update 009 Consulted-Service.md
- [ ] Update 120.2 ConsultedService Refactor.md
- [ ] Add this spec (020) to requirements folder

---

## 🎯 Success Criteria

- ✅ Lead có thể tạo ConsultedService không cần check-in (appointmentId = null)
- ✅ Customer có thể tạo ConsultedService online không cần check-in (appointmentId = null)
- ✅ Check-in tự động bind tất cả pending services (silent, không cần user action)
- ✅ consultationDate được set khi bind appointment (không duplicate createdAt)
- ✅ UI/UX đơn giản: 1 dynamic button, backend xử lý tất cả
- ✅ Không break existing flows (Customer offline consultation)
