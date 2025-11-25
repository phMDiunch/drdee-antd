# 🧩 Requirements: Customer Follow-up Management System

> **📋 STATUS: 🆕 NEW** - Documentation completed, implementation needed  
> **🔗 Implementation**: `src/features/customer-followups/`  
> **🔧 Last Updated**: 2025-11-11

## 📊 Tham khảo

- Prisma Model: `prisma/schema.prisma` → CustomerFollowUp
- Related: `009 Consulted-Service.md`, `007 Customer.md`, `005 Employee.md`
- Dashboard & KPIs: `010.1 Follow-up Dashboard.md`

## 🎯 Mục Tiêu

- Quản lý việc follow-up khách hàng sau khi tư vấn dịch vụ mà khách chưa chốt
- Ghi nhận các lần liên hệ (gọi điện, nhắn tin, gặp mặt)
- Theo dõi tiến trình chăm sóc khách hàng để chốt dịch vụ
- Phân công và quản lý công việc cho Sale/Tư vấn viên
- Tracking KPIs: Tỉ lệ chốt dịch vụ và tỉ lệ chốt khách hàng theo sale

---

## 🎲 Decision Log

### Business Flow

1. **Trigger**: Khi ConsultedService được tạo với DentalService có `needsFollowUp = true`
   - Nếu `serviceStatus = "Chưa chốt"` → Tạo follow-up với `status = "pending"`
   - Nếu `serviceStatus = "Đã chốt"` → Tạo follow-up với `status = "success"` (khách chốt ngay)
2. **Follow-up Process**:
   - Sale/Tư vấn viên liên hệ khách hàng (gọi điện, nhắn tin, gặp mặt)
   - Ghi nhận từng lần liên hệ với kết quả
   - Status tự động thay đổi theo activities và service status
3. **End Conditions**:
   - ✅ **Success (Auto)**: ConsultedService chuyển sang "Đã chốt" → Follow-up auto = "success"
   - ❌ **Give Up (Manual)**: User mark follow-up = "give_up" (khách từ chối/không liên lạc được)

### Database & Business Rules

#### Auto-Create Logic

**Trigger**: ConsultedService created hoặc updated

```typescript
// When creating ConsultedService
const dentalService = await getDentalService(input.dentalServiceId);

if (dentalService.needsFollowUp) {
  const followUpStatus =
    input.serviceStatus === "Đã chốt" ? "success" : "pending";

  await createFollowUp({
    customerId: input.customerId,
    consultedServiceId: service.id,
    assignedToSaleId: input.consultingSaleId, // Store sale assignment
    consultingDoctorId: input.consultingDoctorId, // Store doctor assignment
    manuallyReassigned: false, // Not manually reassigned yet
    clinicId: input.clinicId,
    status: followUpStatus,
    priority: "medium",
    nextFollowUpDate:
      followUpStatus === "pending" ? addDays(new Date(), 3) : null,
    completedAt: followUpStatus === "success" ? new Date() : null,
    createdById: input.createdById,
    updatedById: input.createdById,
  });
}
```

#### Status Flow Rules

**Principle**: Follow-up status chủ yếu là **AUTO**, chỉ có 2 actions manual:

1. Manual: User mark `status = "give_up"`
2. Manual: Tạo mới với `status = "pending"`

**All other transitions are AUTO**:

| Trigger                                   | Auto Action on FollowUp                                                     | Reason                  |
| ----------------------------------------- | --------------------------------------------------------------------------- | ----------------------- |
| First activity created                    | `status = "in_progress"`                                                    | Đã bắt đầu follow       |
| ConsultedService: "Chưa chốt" → "Đã chốt" | `status = "success"`, `completedAt = now()`                                 | Khách đã đồng ý         |
| ConsultedService: "Đã chốt" → "Chưa chốt" | `status = "in_progress"`, `completedAt = null`, `nextFollowUpDate = +1 day` | Revert, tiếp tục follow |
| ConsultedService deleted                  | `archivedAt = now()`                                                        | Soft delete cascade     |

**Status Diagram**:

```
pending (created manually or auto)
   ↓ (auto: first activity)
in_progress
   ↓ (auto: service confirmed)     ↓ (manual: user gives up)
success                          give_up
   ↓ (auto: service reverted)
in_progress (reopen)
```

#### needsFollowUp Configuration

- ✅ **Stored in**: `DentalService.needsFollowUp` (Boolean, default: false)
- ✅ **Inherited**: ConsultedService tự động copy từ DentalService khi tạo
- ✅ **Examples**:

  - needsFollowUp = **true**: Niềng răng, Implant, Răng sứ thẩm mỹ, Tẩy trắng răng
  - needsFollowUp = **false**: Cạo vôi, Trám răng đơn giản, Nhổ răng sữa

#### Assignment Logic - Hybrid Approach

**Problem**: Should we derive assignedTo from ConsultedService or store separately?

**Solution**: **Hybrid approach** - Store + Auto-sync with override control

**Schema Design**:

```prisma
model CustomerFollowUp {
  // Store both sale and doctor (not just assignedToId)
  assignedToSaleId     String?   // Current sale assignment
  consultingDoctorId   String?   // Current doctor assignment
  manuallyReassigned   Boolean   @default(false) // Control flag

  // Relations
  assignedToSale       Employee? @relation("FollowUpSale", fields: [assignedToSaleId], references: [id])
  consultingDoctor     Employee? @relation("FollowUpDoctor", fields: [consultingDoctorId], references: [id])
}
```

**Auto-Sync Rules**:

```typescript
// When ConsultedService updates assignment
async function syncFollowUpAssignment(
  consultedService: ConsultedService
): Promise<void> {
  const followUp = await getFollowUpByServiceId(consultedService.id);

  if (!followUp) return;

  // Only auto-sync if NOT manually reassigned
  if (!followUp.manuallyReassigned) {
    await updateFollowUp(followUp.id, {
      assignedToSaleId: consultedService.consultingSaleId,
      consultingDoctorId: consultedService.consultingDoctorId,
      updatedById: consultedService.updatedById,
    });
  }
  // If manually reassigned, do NOT auto-sync (preserve manual assignment)
}

// When user manually reassigns
async function reassignFollowUp(
  followUpId: string,
  newSaleId: string | null,
  newDoctorId: string | null,
  userId: string
): Promise<void> {
  await updateFollowUp(followUpId, {
    assignedToSaleId: newSaleId,
    consultingDoctorId: newDoctorId,
    manuallyReassigned: true, // Mark as manually reassigned
    updatedById: userId,
  });
}

// Reset to auto-sync
async function resetToAutoSync(
  followUpId: string,
  userId: string
): Promise<void> {
  const followUp = await getFollowUp(followUpId);
  const service = await getConsultedService(followUp.consultedServiceId);

  await updateFollowUp(followUpId, {
    assignedToSaleId: service.consultingSaleId,
    consultingDoctorId: service.consultingDoctorId,
    manuallyReassigned: false, // Reset flag
    updatedById: userId,
  });
}
```

**Benefits**:

- ✅ Store both sale and doctor (for KPI attribution to BOTH)
- ✅ Auto-sync when ConsultedService changes (unless manually overridden)
- ✅ Support manual override (for special cases)
- ✅ Can reset to auto-sync later
- ✅ Clear flag to know sync status

**Assignment Display Logic**:

```typescript
// Who to display as "assigned to" in UI
function getFollowUpAssignee(followUp: CustomerFollowUp): Employee | null {
  // Priority: Sale > Doctor
  return followUp.assignedToSale || followUp.consultingDoctor || null;
}
```

- ✅ **Follow-up Types**:
  - `phone`: Gọi điện thoại
  - `message`: Nhắn tin (Zalo, Facebook, SMS)
  - `meeting`: Gặp mặt trực tiếp
- ✅ **Priority Levels**:
  - `high`: Khách hàng tiềm năng cao
  - `medium`: Khách hàng cân nhắc
  - `low`: Khách hàng khó chốt
- ✅ **Activity Tracking**: Mỗi lần liên hệ tạo 1 activity record
  - Thời gian liên hệ
  - Loại liên hệ (phone/message/meeting)
  - Nội dung trao đổi
  - Kết quả (interested/not_interested/no_contact/callback_later)
  - Người thực hiện
  - **Auto-update status**: Khi tạo activity đầu tiên → Follow-up chuyển "pending" → "in_progress"

### Permission Rules

**Quyền dựa trên: Role + Clinic + Assignment**

#### CREATE

- ❌ **Manual Create Disabled**: Follow-up tự động tạo khi ConsultedService "Chưa chốt"
- ✅ **Create Activity**: Assignee hoặc Admin có thể tạo activity log

#### READ

- Employee: Xem follow-up được assign cho mình + cùng clinic
- Admin: Xem tất cả follow-up trong system

#### UPDATE

- Employee:
  - ✅ Cập nhật follow-up được assign cho mình
  - ✅ Thêm activity cho follow-up của mình
  - ❌ Không reassign cho người khác (chỉ Admin)
- Admin:
  - ✅ Cập nhật bất kỳ follow-up nào
  - ✅ Reassign cho người khác
  - ✅ Change priority/status

#### DELETE

- Employee: ❌ Không xóa
- Admin: ✅ Xóa follow-up (soft delete với archivedAt)

---

## 1. 📋 Follow-up Management

### 1.1 List View - Danh sách Follow-up

**URL**: `/followups`

**Filters**:

- Status: All/Pending/In Progress/Success/Give Up
- Priority: All/High/Medium/Low
- Assignee: All/Me/Specific Employee
- Date Range: Last 7 days/Last 30 days/Custom
- Clinic: (Admin only)

**Columns**:

- Customer Name (link to customer detail)
- Service Name
- Service Price
- Priority (badge with color)
- Assignee
- Last Contact Date
- Next Follow-up Date
- Status (badge)
- Activity Count
- Actions

**Actions**:

- 👁️ View Details (modal)
- ✏️ Add Activity (quick action)
- 📞 Mark as Contacted
- ✅ Mark as Success (convert to service confirmation)
- ❌ Mark as Give Up

**Sorting**:

- Default: Next Follow-up Date (ASC) + Priority (DESC)
- Options: Customer Name, Service Name, Last Contact, Priority

### 1.2 Detail View - Follow-up Details Modal

**Sections**:

#### A. Overview

- Customer Info: Name, Phone, Avatar
- Service Info: Name, Price, Consultation Date
- Current Status & Priority
- Assigned To: Display sale (priority) or doctor (fallback)
- Assignment Status: Show badge if "Manually Reassigned"
- Statistics: Total Contacts, Success Rate

#### B. Timeline Activities

- Chronological list of all contact activities
- Each activity shows:
  - Date & Time
  - Contact Type (icon + label)
  - Content/Notes
  - Result (badge)
  - Created By
- Quick add activity button at top

#### C. Actions

- Add New Activity (opens form)
- Schedule Next Follow-up
- Change Priority
- Reassign (Admin only) - with option to "Reset to Auto-sync"
- Mark as Success/Give Up

### 1.3 Add Activity Form

**Fields**:

- **Contact Type\*** (radio): Phone | Message | Meeting
- **Contact Date & Time\***: DateTime picker (default: now)
- **Contact Result\*** (select):
  - interested: Khách quan tâm
  - not_interested: Khách không quan tâm
  - no_contact: Không liên lạc được
  - callback_later: Gọi lại sau
- **Notes\*** (textarea): Chi tiết nội dung trao đổi (required, min 20 chars)
- **Next Follow-up Date** (date picker): Lịch follow-up tiếp theo (optional)

**Validation**:

- Contact Date không được ở tương lai quá 1 giờ
- Notes tối thiểu 20 ký tự
- Nếu result = "callback_later" → Next Follow-up Date required

**Success Actions**:

- Update Follow-up status to "in_progress" nếu đang pending
- Update lastContactDate
- Update nextFollowUpDate nếu có
- Show success toast
- Refresh timeline

### 1.4 Quick Actions

**From List View - Quick Contact Button**:

- Inline form mở ra dưới row
- Minimal fields: Contact Type, Result, Short Notes (50 chars)
- Quick save without full modal

**Bulk Actions** (Admin only):

- Select multiple follow-ups
- Reassign to another employee
- Change priority
- Mark as give up (with confirmation)

---

## 2. 🔔 Dashboard Integration

### 2.1 Follow-up Widget (Dashboard)

**Location**: Dashboard page - Follow-up Section

**Content**:

- **My Pending Tasks**: Count of pending + in_progress follow-ups assigned to current user
- **Due Today**: List of follow-ups with nextFollowUpDate = today
- **Overdue**: Follow-ups past nextFollowUpDate
- **This Week Success**: Count of follow-ups marked success this week

**Quick Actions**:

- View All Follow-ups (link to /followups)
- Add Activity (for due items)

### 2.2 Customer Detail Integration

**Location**: Customer Detail Page - Tab "Follow-ups"

**Content**:

- List of all follow-ups for this customer
- Group by ConsultedService
- Show status, priority, activities count
- Quick view timeline
- Quick add activity

---

## 3. 🔄 Auto Follow-up Creation & Sync Logic

### 3.1 Trigger Logic

**When**: ConsultedService created/updated

**Conditions for Auto-Create**:

```typescript
if (
  dentalService.needsFollowUp === true &&
  service.serviceStatus === "Chưa chốt" &&
  !existingFollowUp
) {
  // Create new follow-up task
}
```

**Auto Create CustomerFollowUp**:

```typescript
{
  customerId: service.customerId,
  consultedServiceId: service.id,
  assignedToSaleId: service.consultingSaleId,
  consultingDoctorId: service.consultingDoctorId,
  manuallyReassigned: false,
  clinicId: service.clinicId,
  status: "pending",
  priority: "medium", // Default, can be changed later
  nextFollowUpDate: addDays(service.consultationDate, 3), // 3 days after consultation
  createdById: service.createdById,
  updatedById: service.createdById
}
```

### 3.2 Status Synchronization Logic

**Auto-sync giữa ConsultedService ↔ CustomerFollowUp**

#### Case 1: ConsultedService "Chưa chốt" → "Đã chốt"

```typescript
// When confirming a service
async function confirmConsultedService(serviceId: string) {
  // 1. Update service
  await updateService(serviceId, {
    serviceStatus: "Đã chốt",
    serviceConfirmDate: new Date(),
  });

  // 2. Auto-complete follow-up (if exists)
  const followUp = await findFollowUpByServiceId(serviceId);
  if (followUp && followUp.status !== "give_up") {
    await updateFollowUp(followUp.id, {
      status: "success",
      completedAt: new Date(),
    });
  }
}
```

#### Case 2: ConsultedService "Đã chốt" → "Chưa chốt" (Revert)

```typescript
// When reverting a service confirmation
async function revertServiceConfirmation(serviceId: string) {
  // 1. Update service
  await updateService(serviceId, {
    serviceStatus: "Chưa chốt",
    serviceConfirmDate: null,
  });

  // 2. Reactivate follow-up (if needsFollowUp = true)
  const service = await getService(serviceId);
  if (service.needsFollowUp) {
    const followUp = await findFollowUpByServiceId(serviceId);
    if (followUp && followUp.status === "success") {
      await updateFollowUp(followUp.id, {
        status: "in_progress",
        completedAt: null,
        nextFollowUpDate: addDays(new Date(), 1), // Tomorrow
      });
    }
  }
}
```

#### Case 3: ConsultedService Assignment Changed

```typescript
// When ConsultedService changes sale or doctor assignment
async function updateConsultedServiceAssignment(
  serviceId: string,
  newSaleId: string | null,
  newDoctorId: string | null
) {
  // 1. Update service
  await updateService(serviceId, {
    consultingSaleId: newSaleId,
    consultingDoctorId: newDoctorId,
  });

  // 2. Auto-sync follow-up assignment (if not manually reassigned)
  const followUp = await findFollowUpByServiceId(serviceId);
  if (followUp && !followUp.manuallyReassigned) {
    await updateFollowUp(followUp.id, {
      assignedToSaleId: newSaleId,
      consultingDoctorId: newDoctorId,
    });
  }
}
```

### 3.3 Manual Follow-up Completion

**User có thể mark follow-up = "give_up" manually**:

- ConsultedService vẫn giữ status "Chưa chốt"
- Follow-up status = "give_up", completedAt = now()
- Lý do: Khách không quan tâm, không liên lạc được, hoặc quyết định không làm

**Flow**:

```
Follow-up "give_up" ≠ Service "Đã chốt"
→ Service vẫn "Chưa chốt" nhưng không follow nữa
→ Có thể reopen follow-up sau nếu khách liên hệ lại
```

---

## 4. 🎨 UI/UX Design

### Status Colors

| Status      | Color  | Background | Text       |
| ----------- | ------ | ---------- | ---------- |
| pending     | blue   | blue-50    | blue-700   |
| in_progress | orange | orange-50  | orange-700 |
| success     | green  | green-50   | green-700  |
| give_up     | gray   | gray-50    | gray-700   |

### Priority Colors

| Priority | Color  | Icon |
| -------- | ------ | ---- |
| high     | red    | 🔴   |
| medium   | yellow | 🟡   |
| low      | green  | 🟢   |

### Contact Type Icons

| Type    | Icon | Label    |
| ------- | ---- | -------- |
| phone   | 📞   | Gọi điện |
| message | 💬   | Nhắn tin |
| meeting | 🤝   | Gặp mặt  |

### Result Badges

| Result         | Badge          | Color  |
| -------------- | -------------- | ------ |
| interested     | Quan tâm       | green  |
| not_interested | Không quan tâm | red    |
| no_contact     | Không liên lạc | gray   |
| callback_later | Gọi lại sau    | orange |

### Assignment Status Badge

| Status              | Badge                 | Color  |
| ------------------- | --------------------- | ------ |
| Auto-sync           | Tự động đồng bộ       | blue   |
| Manually Reassigned | Đã phân công thủ công | purple |

---

## 5. 📊 Database Schema

### Model: CustomerFollowUp

```prisma
model CustomerFollowUp {
  id                   String    @id @default(uuid())

  // Relationships
  customerId           String
  consultedServiceId   String    @unique // One follow-up per consulted service

  // Assignment - HYBRID APPROACH: Store + Auto-sync
  assignedToSaleId     String?   // Current sale assignment
  consultingDoctorId   String?   // Current doctor assignment
  manuallyReassigned   Boolean   @default(false) // Control auto-sync

  clinicId             String    // For permission filtering

  // Status & Priority
  status               String    @default("pending") // "pending", "in_progress", "success", "give_up"
  priority             String    @default("medium")  // "high", "medium", "low"

  // Dates
  lastContactDate      DateTime? @db.Timestamptz
  nextFollowUpDate     DateTime? @db.Timestamptz
  completedAt          DateTime? @db.Timestamptz // When marked success/give_up

  // Metadata
  createdById          String
  updatedById          String
  createdAt            DateTime  @default(now()) @db.Timestamptz
  updatedAt            DateTime  @updatedAt @db.Timestamptz
  archivedAt           DateTime? @db.Timestamptz // Soft delete

  // Relations
  customer             Customer           @relation(fields: [customerId], references: [id])
  consultedService     ConsultedService   @relation(fields: [consultedServiceId], references: [id])
  assignedToSale       Employee?          @relation("FollowUpSale", fields: [assignedToSaleId], references: [id])
  consultingDoctor     Employee?          @relation("FollowUpDoctor", fields: [consultingDoctorId], references: [id])
  createdBy            Employee           @relation("CreatedFollowUps", fields: [createdById], references: [id])
  updatedBy            Employee           @relation("UpdatedFollowUps", fields: [updatedById], references: [id])

  // Activities
  activities           FollowUpActivity[]

  @@index([customerId])
  @@index([consultedServiceId])
  @@index([assignedToSaleId])
  @@index([consultingDoctorId])
  @@index([status])
  @@index([nextFollowUpDate])
  @@index([clinicId])
}

model FollowUpActivity {
  id                   String    @id @default(uuid())

  // Relationships
  followUpId           String

  // Activity Details
  contactType          String    // "phone", "message", "meeting"
  contactDate          DateTime  @db.Timestamptz
  contactResult        String    // "interested", "not_interested", "no_contact", "callback_later"
  notes                String    // Detailed notes about the contact
  nextFollowUpDate     DateTime? @db.Timestamptz // Suggested next follow-up

  // Metadata
  createdById          String
  createdAt            DateTime  @default(now()) @db.Timestamptz

  // Relations
  followUp             CustomerFollowUp @relation(fields: [followUpId], references: [id], onDelete: Cascade)
  createdBy            Employee         @relation("CreatedActivities", fields: [createdById], references: [id])

  @@index([followUpId])
  @@index([contactDate])
}
```

### Schema Updates

**DentalService**: Add needsFollowUp flag

```prisma
model DentalService {
  // ... existing fields
  needsFollowUp        Boolean   @default(false)
  // ... existing relations
}
```

**ConsultedService**: Add relation

```prisma
// In ConsultedService model, add:
followUp  CustomerFollowUp?
```

**Employee**: Add relations

```prisma
// In Employee model, add:
assignedFollowUpsSale   CustomerFollowUp[] @relation("FollowUpSale")
assignedFollowUpsDoctor CustomerFollowUp[] @relation("FollowUpDoctor")
createdFollowUps        CustomerFollowUp[] @relation("CreatedFollowUps")
updatedFollowUps        CustomerFollowUp[] @relation("UpdatedFollowUps")
followUpActivities      FollowUpActivity[] @relation("CreatedActivities")
```

**Customer**: Add relation

```prisma
// In Customer model, add:
followUps  CustomerFollowUp[]
```

---

## 6. 🔌 API Design

### 6.1 Server Actions

**Path**: `src/server/actions/followup-actions.ts`

```typescript
// Create activity for follow-up
export async function createFollowUpActivity(
  followUpId: string,
  data: CreateActivityInput
): Promise<ActionResult<FollowUpActivity>>;

// Update follow-up status
export async function updateFollowUpStatus(
  followUpId: string,
  data: UpdateFollowUpStatusInput
): Promise<ActionResult<CustomerFollowUp>>;

// Reassign follow-up (Admin only) - sets manuallyReassigned = true
export async function reassignFollowUp(
  followUpId: string,
  newSaleId: string | null,
  newDoctorId: string | null
): Promise<ActionResult<CustomerFollowUp>>;

// Reset to auto-sync (Admin only) - sets manuallyReassigned = false
export async function resetFollowUpToAutoSync(
  followUpId: string
): Promise<ActionResult<CustomerFollowUp>>;

// Mark as success (convert to service confirmation)
export async function markFollowUpSuccess(
  followUpId: string
): Promise<
  ActionResult<{ followUp: CustomerFollowUp; service: ConsultedService }>
>;

// Mark as give up
export async function markFollowUpGiveUp(
  followUpId: string,
  reason: string
): Promise<ActionResult<CustomerFollowUp>>;
```

### 6.2 API Routes (GET)

**Path**: `src/app/api/followups/route.ts`

```typescript
// GET /api/followups
// Query params: status, priority, assigneeId, clinicId, startDate, endDate, page, limit
// Returns: Paginated list of follow-ups with related data

// GET /api/followups/[id]
// Returns: Full follow-up details with activities timeline

// GET /api/followups/[id]/activities
// Returns: All activities for a follow-up

// GET /api/followups/stats
// Returns: Dashboard statistics (pending count, due today, overdue, success rate)
```

---

## 7. 📝 Business Rules & Validations

### Follow-up Rules

1. ✅ **Auto-create trigger**:
   - Khi ConsultedService được tạo với `DentalService.needsFollowUp = true`
   - Nếu `serviceStatus = "Chưa chốt"` → Follow-up với `status = "pending"`
   - Nếu `serviceStatus = "Đã chốt"` → Follow-up với `status = "success"` (instant close)
2. ✅ **Unique constraint**: Mỗi ConsultedService chỉ có tối đa 1 follow-up task

3. ✅ **Auto-update status**:
   - First activity created → `status = "in_progress"`
   - Service "Chưa chốt" → "Đã chốt" → `status = "success"`, `completedAt = now()`
   - Service "Đã chốt" → "Chưa chốt" (revert) → `status = "in_progress"`, `completedAt = null`
4. ✅ **Manual actions**:
   - User có thể mark `status = "give_up"` (service vẫn "Chưa chốt")
   - Chỉ pending và give_up là manual, còn lại AUTO
5. ✅ **needsFollowUp source**: Stored tại `DentalService`, không phải `ConsultedService`

   - Tính chất của loại dịch vụ, không phải từng case
   - VD: "Niềng răng" luôn = true, "Cạo vôi" luôn = false

6. ✅ **Assignment sync**:

   - Store both `assignedToSaleId` and `consultingDoctorId`
   - Auto-sync from ConsultedService when `manuallyReassigned = false`
   - Manual reassign sets `manuallyReassigned = true` (stops auto-sync)
   - Can reset to auto-sync later

7. ✅ **NextFollowUpDate**: Mặc định +3 ngày sau consultation date (cho status pending)

8. ✅ **Activity validation**:
   - Không thể tạo activity với contactDate trong tương lai (trừ < 1h buffer)
   - Result "callback_later" bắt buộc phải có nextFollowUpDate

### Permission Rules

1. ✅ Employee chỉ xem và edit follow-up của mình + cùng clinic
2. ✅ Admin xem và edit tất cả follow-up
3. ✅ Chỉ Admin mới reassign được follow-up
4. ✅ Assignee và Admin mới tạo activity được

### Data Integrity

1. ✅ Soft delete với archivedAt (không xóa vật lý)
2. ✅ Cascade delete activities khi xóa follow-up
3. ✅ Audit trail: Track createdBy, updatedBy cho mọi thay đổi

### KPI Calculation Rules

See: `010.1 Follow-up Dashboard.md` for detailed KPI logic

---

## 8. 🎯 Implementation Tasks

### Phase 1: Database & Backend (Priority: High)

- [ ] Update Prisma schema with CustomerFollowUp and FollowUpActivity models
- [ ] Add `assignedToSaleId`, `consultingDoctorId`, `manuallyReassigned` fields
- [ ] Create migration
- [ ] Implement auto-create follow-up hook when ConsultedService created
- [ ] Implement assignment sync logic (with manuallyReassigned check)
- [ ] Create repository layer (`followup-repo.ts`, `followup-activity-repo.ts`)
- [ ] Implement service layer with business logic
- [ ] Create server actions for mutations
- [ ] Create API routes for queries

### Phase 2: Frontend - Basic CRUD (Priority: High)

- [ ] Create feature folder structure: `src/features/customer-followups/`
- [ ] Implement follow-up list page with filters and sorting
- [ ] Create follow-up detail modal
- [ ] Show assignment status badge (Auto-sync vs Manually Reassigned)
- [ ] Implement add activity form
- [ ] Create reassign modal with "Reset to Auto-sync" option
- [ ] Create quick action components
- [ ] Add validation schemas (Zod)

### Phase 3: UI/UX Polish (Priority: Medium)

- [ ] Design and implement status/priority badges
- [ ] Add assignment status indicator
- [ ] Create timeline component for activities
- [ ] Add icons for contact types
- [ ] Implement quick contact inline form
- [ ] Add loading states and error handling
- [ ] Create empty states

### Phase 4: Integration (Priority: Medium)

- [ ] Add follow-up widget to dashboard
- [ ] Integrate with customer detail page (new tab)
- [ ] Add notification system for new assignments
- [ ] Implement bulk actions (Admin)

### Phase 5: Testing & Documentation (Priority: Low)

- [ ] Write unit tests for business logic
- [ ] Write integration tests for API routes
- [ ] Test assignment sync logic
- [ ] Test manual reassign override
- [ ] Create user guide documentation
- [ ] Add inline code documentation

---

## 9. 🔮 Future Enhancements

### Phase 2 Features (Post-MVP)

- [ ] **Auto-remind**: Gửi thông báo tự động khi đến nextFollowUpDate
- [ ] **WhatsApp/Zalo Integration**: Gửi tin nhắn trực tiếp từ system
- [ ] **Call Recording**: Lưu file ghi âm cuộc gọi (nếu có)
- [ ] **AI Suggestions**: Gợi ý thời điểm tốt nhất để follow-up dựa trên lịch sử
- [ ] **Email Templates**: Tạo template email/SMS cho các tình huống khác nhau
- [ ] **Mobile App**: App riêng cho sale để follow-up nhanh hơn
- [ ] **Customer Portal**: Khách hàng tự tra cứu và phản hồi

---

## 📚 References

### Related Documents

- [009 Consulted-Service.md](./009%20Consulted-Service.md) - Service tư vấn
- [007 Customer.md](./007%20Customer.md) - Quản lý khách hàng
- [005 Employee.md](./005%20Employee.md) - Quản lý nhân viên
- [010.1 Follow-up Dashboard.md](./010.1%20Follow-up%20Dashboard.md) - KPIs và báo cáo

### External Resources

- CRM Best Practices: https://www.salesforce.com/crm/what-is-crm/
- Follow-up Strategies: https://blog.hubspot.com/sales/follow-up-email-templates

---

**✍️ Document History**

- 2025-11-10: Initial requirements documentation
- 2025-11-11: Major updates:
  - **MOVED** `needsFollowUp` từ ConsultedService → DentalService (service type property)
  - **REDESIGNED** Status flow: Mostly AUTO (only pending & give_up are manual)
  - **UPDATED** Assignment logic: Hybrid approach with `assignedToSaleId`, `consultingDoctorId`, `manuallyReassigned`
  - **ADDED** Auto-sync logic with manual override capability
  - **ADDED** Instant-close scenario: Create follow-up with status=success when customer closes immediately
  - Complete status synchronization rules with code examples
  - Split into 2 files: Core + Dashboard
