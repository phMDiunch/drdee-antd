# 🎯 Requirements: Lead Management System

> **📋 STATUS: DRAFT** - Under discussion  
> **👥 Audience**: Sale Online Team, Marketing Team  
> **🔗 Related**: [007 Customer.md](./007%20Customer.md), [008 Appointment.md](./008%20Appointment.md), [010 Follow-up.md](./010%20Follow-up.md)

## 📖 Overview

Hệ thống quản lý **Lead** (khách hàng tiềm năng online) cho phép:

- Thu thập thông tin khách hàng online (chưa đến phòng khám)
- Bulk import danh sách số điện thoại từ Marketing
- Chăm sóc và follow-up hàng ngày
- Đặt lịch hẹn cho khách để convert → Customer offline
- Tracking conversion funnel từ lead → customer → service

## 📊 Tham Khảo

- Prisma Model: `prisma/schema.prisma` (Lead, LeadActivity)
- Validation Schema: `src/shared/validation/lead.schema.ts`
- Service: `src/server/services/lead.service.ts`
- Conversion Service: `src/server/services/lead-conversion.service.ts`

---

## 🎯 Business Context

### Volume Analysis

| Metric              | Lead (Online)        | Customer (Offline)  |
| ------------------- | -------------------- | ------------------- |
| **Daily Volume**    | 50-500 records       | 10-15 records       |
| **Monthly Volume**  | ~6,000-15,000        | ~300-450            |
| **Data Source**     | Bulk import + Manual | Manual input 1-by-1 |
| **Data Quality**    | Low (chưa verify)    | High (đã verify)    |
| **Conversion Rate** | 5-20%                | 100% (đã đến)       |

### Key Differences: Lead vs Customer

| Aspect              | Lead                    | Customer                       |
| ------------------- | ----------------------- | ------------------------------ |
| **Definition**      | Khách online chưa đến   | Khách đã đến phòng khám        |
| **CustomerCode**    | ❌ Không có             | ✅ Auto-generate khi tạo       |
| **Required Fields** | Phone + Name (optional) | Full info (DOB, address, etc.) |
| **Validation**      | Loose (bulk import)     | Strict (verified)              |
| **Owner**           | Sale Online Team        | Reception, Offline Team        |

### Lead Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                      LEAD LIFECYCLE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. NEW (Mới tạo)                                               │
│     - Import từ Marketing / Manual entry                        │
│     - Assign to Sale Online                                     │
│     ↓                                                            │
│                                                                  │
│  2. CONTACTED (Đã liên hệ)                                      │
│     - Sale đã gọi điện / nhắn tin                               │
│     - Ghi nhận kết quả liên hệ                                  │
│     ↓                                                            │
│                                                                  │
│  3. QUALIFIED (Đủ điều kiện)                                    │
│     - Khách có nhu cầu rõ ràng                                  │
│     - Sẵn sàng đặt lịch                                         │
│     ↓                                                            │
│                                                                  │
│  4. APPOINTMENT_BOOKED (Đã đặt lịch)                           │
│     - Tạo Appointment trong hệ thống                            │
│     - Chờ khách đến                                             │
│     ↓                                                            │
│                                                                  │
│  5. CONVERTED (Đã chuyển đổi)                                  │
│     - Khách đã đến phòng khám (check-in)                       │
│     - Tạo Customer record với CustomerCode                      │
│     - Link: Lead.convertedToCustomerId → Customer.id           │
│     ↓                                                            │
│                                                                  │
│  6. CUSTOMER JOURNEY                                            │
│     - Tư vấn dịch vụ → ConsultedService                        │
│     - Follow-up → CustomerFollowUp                             │
│     - Chốt dịch vụ → Success                                    │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│  ALTERNATIVE PATH: LOST                                         │
│     - Không liên hệ được                                        │
│     - Không có nhu cầu                                          │
│     - Đã đi nơi khác                                            │
│     - Reason: wrong_number, not_interested, competitor, etc.    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. 📋 Database Schema

### Model: Lead

```prisma
model Lead {
  id String @id @default(uuid())

  // Core Information
  phone               String  @unique // Primary phone (REQUIRED, UNIQUE)
  additionalPhones    String[] @default([]) // Additional phones (optional, for backup contact)
  name                String? // Tên khách (optional khi bulk import)
  serviceOfInterest   String? // Dịch vụ quan tâm (from SERVICES_OF_INTEREST)

  // Lead Tracking
  leadSource          String  // Nguồn lead: "facebook" | "google" | "zalo" | "website" | "tiktok" | "referral" | "other"
  leadStatus          String  // "new" | "contacted" | "qualified" | "appointment_booked" | "converted" | "lost"
  lostReason          String? // Lý do lost (nếu leadStatus = "lost")

  // Assignment & Clinic
  clinicId            String? // Chi nhánh (optional khi import, assign sau)
  assignedToId        String  // Sale Online ID (REQUIRED)

  // Conversion Tracking
  convertedToCustomerId String?   @unique // Customer ID sau khi convert
  convertedAt           DateTime? @db.Timestamptz // Thời điểm convert
  firstAppointmentId    String?   @unique // Appointment đầu tiên

  // Notes
  notes               String? // Ghi chú chung về lead

  // Metadata
  createdById String
  createdAt   DateTime  @default(now()) @db.Timestamptz
  updatedAt   DateTime  @updatedAt @db.Timestamptz
  archivedAt  DateTime? @db.Timestamptz // Soft delete

  // Relations
  clinic      Clinic?   @relation(fields: [clinicId], references: [id])
  assignedTo  Employee  @relation("AssignedLeads", fields: [assignedToId], references: [id])
  createdBy   Employee  @relation("CreatedLeads", fields: [createdById], references: [id])

  convertedToCustomer Customer? @relation("ConvertedFromLead", fields: [convertedToCustomerId], references: [id])
  firstAppointment    Appointment? @relation("LeadFirstAppointment", fields: [firstAppointmentId], references: [id])

  activities  LeadActivity[]

  // Indexes for Performance
  @@index([leadStatus, clinicId, assignedToId]) // Daily view filter
  @@index([phone]) // Search by phone
  @@index([createdAt]) // Sort by date
  @@index([assignedToId, leadStatus]) // My leads filter
}
```

### Model: LeadActivity

```prisma
model LeadActivity {
  id String @id @default(uuid())

  // Lead Reference
  leadId String
  lead   Lead   @relation(fields: [leadId], references: [id], onDelete: Cascade)

  // Activity Information
  activityType    String   // "call" | "sms" | "zalo" | "facebook" | "note" | "email"
  contactResult   String?  // "interested" | "callback_later" | "not_interested" | "no_contact" | "wrong_number"
  notes           String?  // Chi tiết cuộc liên hệ
  nextContactDate DateTime? @db.Date // Ngày hẹn liên hệ lại

  // Metadata
  createdById String
  createdBy   Employee @relation("CreatedLeadActivities", fields: [createdById], references: [id])
  createdAt   DateTime @default(now()) @db.Timestamptz

  // Indexes
  @@index([leadId, createdAt]) // Activity timeline
  @@index([nextContactDate]) // Follow-up reminder
  @@index([createdById, createdAt]) // My activities
}
```

### Model Updates: Customer

```prisma
model Customer {
  // ... existing fields ...

  // NEW: Conversion Tracking
  convertedFromLeadId String? @unique // Lead ID if converted from lead

  // NEW: Relations
  convertedFromLead Lead? @relation("ConvertedFromLead")

  // ... existing relations ...
}
```

### Model Updates: Appointment

```prisma
model Appointment {
  // ... existing fields ...

  // NEW: Lead Tracking
  leadFirstAppointment Lead? @relation("LeadFirstAppointment")

  // ... existing relations ...
}
```

### Model Updates: Employee

```prisma
model Employee {
  // ... existing fields ...

  // NEW: Lead Relations
  assignedLeads         Lead[]         @relation("AssignedLeads")
  createdLeads          Lead[]         @relation("CreatedLeads")
  createdLeadActivities LeadActivity[] @relation("CreatedLeadActivities")

  // NEW: Revenue Attribution (for sale online)
  leadSourceSaleServices ConsultedService[] @relation("LeadSourceSaleServices")

  // ... existing relations ...
}
```

### Model Updates: ConsultedService (CRITICAL)

```prisma
model ConsultedService {
  // ... existing fields ...

  // Thông tin Phân công
  consultingDoctorId String? // Bác sĩ tư vấn tại phòng khám
  consultingSaleId   String? // Sale offline tư vấn tại phòng khám
  leadSourceSaleId   String? // Sale online đã convert lead (NEW)
  treatingDoctorId   String?

  // Relations
  consultingDoctor Employee? @relation("ConsultingDoctorServices", fields: [consultingDoctorId], references: [id])
  consultingSale   Employee? @relation("ConsultingSaleServices", fields: [consultingSaleId], references: [id])
  leadSourceSale   Employee? @relation("LeadSourceSaleServices", fields: [leadSourceSaleId], references: [id]) // NEW
  treatingDoctor   Employee? @relation("TreatingDoctorServices", fields: [treatingDoctorId], references: [id])

  // ... existing relations ...

  // NEW Index for revenue queries
  @@index([leadSourceSaleId, consultationDate])
}
```

**Auto-fill Logic for leadSourceSaleId**:

```typescript
// When creating ConsultedService
async function createConsultedService(customerId: string, serviceData: any) {
  // 1. Check if customer converted from lead
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      convertedFromLead: {
        select: { assignedToId: true },
      },
    },
  });

  // 2. Auto-fill leadSourceSaleId if customer from lead
  const leadSourceSaleId = customer?.convertedFromLead?.assignedToId || null;

  // 3. Create service with attribution
  return await prisma.consultedService.create({
    data: {
      ...serviceData,
      customerId,
      leadSourceSaleId, // Auto from lead (sale online)
      consultingSaleId: serviceData.consultingSaleId, // Manual (sale offline)
      consultingDoctorId: serviceData.consultingDoctorId, // Manual (doctor)
    },
  });
}
```

**Revenue Attribution Rules**:

```typescript
/**
 * TRI-ATTRIBUTION MODEL for Revenue Tracking:
 *
 * 1. Sale Online (leadSourceSaleId):
 *    - Credit: Đưa khách từ online → phòng khám
 *    - KPI: Customer Lifetime Value (tất cả services của customer)
 *    - KPI: Lead-to-Revenue conversion
 *    - Auto-filled from Lead.assignedToId
 *
 * 2. Sale Offline (consultingSaleId):
 *    - Credit: Tư vấn trực tiếp tại phòng khám
 *    - KPI: Service conversion rate (chốt/tư vấn)
 *    - Manual assignment
 *
 * 3. Doctor (consultingDoctorId):
 *    - Credit: Tư vấn chuyên môn
 *    - KPI: Service conversion rate
 *    - Manual assignment
 *
 * Example:
 * - Lead "Nguyễn Văn A" do Sale Online "Trần B" convert
 * - Customer đến phòng khám, Sale Offline "Lê C" và Doctor "Phan D" tư vấn
 * - Service tạo ra sẽ có:
 *   leadSourceSaleId = "Trần B" (auto)
 *   consultingSaleId = "Lê C" (manual)
 *   consultingDoctorId = "Phan D" (manual)
 * - Revenue tính cho CẢ 3 người!
 */
```

---

## 2. 📝 Data Validation

### Lead Status Values

```typescript
export const LEAD_STATUSES = [
  "new", // Mới tạo, chưa liên hệ
  "contacted", // Đã liên hệ ít nhất 1 lần
  "qualified", // Có nhu cầu rõ ràng, sẵn sàng đặt lịch
  "appointment_booked", // Đã đặt lịch hẹn
  "converted", // Đã chuyển thành customer (đã đến phòng khám)
  "lost", // Mất lead (không liên hệ được, không quan tâm, etc.)
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];
```

### Lead Source Values

```typescript
export const LEAD_SOURCES = [
  { value: "facebook", label: "Facebook" },
  { value: "google", label: "Google Ads" },
  { value: "zalo", label: "Zalo" },
  { value: "tiktok", label: "TikTok" },
  { value: "website", label: "Website" },
  { value: "referral", label: "Giới thiệu" },
  { value: "seo", label: "SEO/Organic" },
  { value: "other", label: "Khác" },
] as const;
```

### Activity Type Values

```typescript
export const LEAD_ACTIVITY_TYPES = [
  { value: "call", label: "📞 Gọi điện" },
  { value: "sms", label: "💬 SMS" },
  { value: "zalo", label: "💙 Zalo" },
  { value: "facebook", label: "👥 Facebook" },
  { value: "email", label: "📧 Email" },
  { value: "note", label: "📝 Ghi chú" },
] as const;
```

### Contact Result Values

```typescript
export const LEAD_CONTACT_RESULTS = [
  { value: "interested", label: "✅ Quan tâm", color: "green" },
  { value: "callback_later", label: "📞 Gọi lại sau", color: "blue" },
  { value: "not_interested", label: "❌ Không quan tâm", color: "red" },
  { value: "no_contact", label: "📵 Không liên lạc được", color: "orange" },
  { value: "wrong_number", label: "⚠️ Sai số", color: "red" },
] as const;
```

### Lost Reason Values

```typescript
export const LEAD_LOST_REASONS = [
  { value: "wrong_number", label: "Sai số điện thoại" },
  { value: "no_contact", label: "Không liên lạc được" },
  { value: "not_interested", label: "Không có nhu cầu" },
  { value: "competitor", label: "Đã đi nơi khác" },
  { value: "too_expensive", label: "Giá cao" },
  { value: "location_far", label: "Địa điểm xa" },
  { value: "no_time", label: "Không có thời gian" },
  { value: "duplicate", label: "Trùng lặp" },
  { value: "other", label: "Lý do khác" },
] as const;
```

### Validation Rules

```typescript
// Create Lead Schema
export const CreateLeadSchema = z.object({
  phone: z
    .string()
    .regex(/^0[0-9]{9}$/, "Số điện thoại phải có 10 chữ số và bắt đầu bằng 0"),
  name: z.string().min(1).max(200).optional(),
  serviceOfInterest: z.enum(SERVICES_OF_INTEREST).optional(),
  leadSource: z.enum(LEAD_SOURCES),
  clinicId: z.string().uuid().optional(),
  assignedToId: z.string().uuid(),
  notes: z.string().max(1000).optional(),
});

// Bulk Import Schema
export const BulkImportLeadsSchema = z.object({
  leads: z
    .array(
      z.object({
        phone: z.string().regex(/^0[0-9]{9}$/),
        name: z.string().optional(),
        serviceOfInterest: z.string().optional(),
      })
    )
    .min(1)
    .max(1000), // Max 1000 leads per batch
  leadSource: z.enum(LEAD_SOURCES),
  clinicId: z.string().uuid().optional(),
  assignedToId: z.string().uuid(),
});

// Create Activity Schema
export const CreateLeadActivitySchema = z.object({
  leadId: z.string().uuid(),
  activityType: z.enum(LEAD_ACTIVITY_TYPES),
  contactResult: z.enum(LEAD_CONTACT_RESULTS).optional(),
  notes: z.string().max(1000).optional(),
  nextContactDate: z.string().date().optional(), // YYYY-MM-DD
});

// Update Lead Schema
export const UpdateLeadSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  serviceOfInterest: z.enum(SERVICES_OF_INTEREST).optional(),
  clinicId: z.string().uuid().optional(),
  assignedToId: z.string().uuid().optional(),
  notes: z.string().max(1000).optional(),
  // leadStatus updated via specific actions (markAsContacted, markAsLost, etc.)
});

// Mark as Lost Schema
export const MarkLeadAsLostSchema = z.object({
  lostReason: z.enum(LEAD_LOST_REASONS),
  notes: z.string().max(1000).optional(),
});
```

---

## 3. ✨ Core Features

### 3.1 Create Lead (Single)

**Permission**: Sale Online, Admin

**UI**: Modal form

**Fields**:

- ✅ **phone** (required): Input with format validation
- **name** (optional): Text input
- **serviceOfInterest** (optional): Select from SERVICES_OF_INTEREST
- ✅ **leadSource** (required): Select from LEAD_SOURCES
- **clinicId** (optional): Select - Admin only, Employee = null hoặc their clinic
- ✅ **assignedToId** (required): Select from Sale Online employees
- **notes** (optional): Textarea

**Validation**:

- Check phone uniqueness (both Lead and Customer tables)
- If phone exists in Customer → Error: "Khách hàng đã tồn tại"
- If phone exists in Lead:
  - If status = "lost" → Allow reactivate
  - Else → Error: "Lead đã tồn tại"

**Backend Logic**:

```typescript
async function createLead(currentUser, data) {
  // 1. Check phone in Customer table
  const existingCustomer = await prisma.customer.findUnique({
    where: { phone: data.phone },
  });
  if (existingCustomer) {
    throw new ServiceError(
      "DUPLICATE_PHONE",
      `Khách hàng đã tồn tại: ${existingCustomer.customerCode} - ${existingCustomer.fullName}`,
      400
    );
  }

  // 2. Check phone in Lead table
  const existingLead = await prisma.lead.findUnique({
    where: { phone: data.phone },
  });

  if (existingLead) {
    if (existingLead.leadStatus === "lost") {
      // Reactivate lead
      return await prisma.lead.update({
        where: { id: existingLead.id },
        data: {
          name: data.name || existingLead.name,
          serviceOfInterest:
            data.serviceOfInterest || existingLead.serviceOfInterest,
          leadSource: data.leadSource,
          leadStatus: "new",
          clinicId: data.clinicId || existingLead.clinicId,
          assignedToId: data.assignedToId,
          notes: data.notes,
          lostReason: null,
          archivedAt: null,
        },
      });
    } else {
      throw new ServiceError(
        "DUPLICATE_PHONE",
        "Lead đã tồn tại với số điện thoại này",
        400
      );
    }
  }

  // 3. Create new lead
  return await prisma.lead.create({
    data: {
      ...data,
      leadStatus: "new",
      createdById: currentUser.id,
    },
  });
}
```

### 3.2 Bulk Import Leads

**Permission**: Admin, Marketing Manager

**UI**:

- Upload Excel file (.xlsx, .csv)
- Map columns: Phone (required), Name (optional), Service Interest (optional)
- Preview before import (show first 10 rows)
- Select leadSource, clinicId, assignedToId for all

**File Format Example**:

```csv
Phone,Name,Service Interest
0901234567,Nguyễn Văn A,Niềng răng
0902345678,Trần Thị B,Implant
0903456789,,Bọc răng sứ
```

**Validation**:

- Max 1000 rows per file
- Phone format: 10 digits starting with 0
- Skip duplicate phones (within file and database)
- Show validation report before confirming

**Backend Logic**:

```typescript
async function bulkImportLeads(currentUser, data) {
  const { leads, leadSource, clinicId, assignedToId } = data;

  // 1. Extract all phones
  const phones = leads.map((l) => l.phone);

  // 2. Check existing in Customer
  const existingCustomers = await prisma.customer.findMany({
    where: { phone: { in: phones } },
    select: { phone: true, customerCode: true, fullName: true },
  });

  const customerPhones = new Set(existingCustomers.map((c) => c.phone));

  // 3. Check existing in Lead
  const existingLeads = await prisma.lead.findMany({
    where: {
      phone: { in: phones },
      leadStatus: { notIn: ["lost"] },
    },
    select: { phone: true, leadStatus: true },
  });

  const leadPhones = new Set(existingLeads.map((l) => l.phone));

  // 4. Filter valid leads
  const validLeads = leads.filter(
    (lead) => !customerPhones.has(lead.phone) && !leadPhones.has(lead.phone)
  );

  // 5. Bulk create
  const result = await prisma.lead.createMany({
    data: validLeads.map((lead) => ({
      phone: lead.phone,
      name: lead.name || null,
      serviceOfInterest: lead.serviceOfInterest || null,
      leadSource,
      leadStatus: "new",
      clinicId,
      assignedToId,
      createdById: currentUser.id,
    })),
    skipDuplicates: true,
  });

  return {
    total: leads.length,
    imported: result.count,
    skipped: leads.length - result.count,
    skippedReasons: {
      existingCustomers: existingCustomers.length,
      existingLeads: existingLeads.length,
    },
  };
}
```

### 3.3 Lead List View

**Route**: `/leads`

**Permission**:

- Sale Online: See only assigned leads
- Admin: See all leads

**Filters**:

- **Status**: All / New / Contacted / Qualified / Appointment Booked / Converted / Lost
- **Source**: All / Facebook / Google / Zalo / etc.
- **Assigned To**: All / Specific employee (Admin only)
- **Clinic**: All / Specific clinic (Admin only)
- **Date Range**: Created date, Custom range

**Columns**:
| Column | Description | Sortable |
|--------|-------------|----------|
| Phone | Phone number | ❌ |
| Name | Lead name | ✅ |
| Service | Service of interest | ❌ |
| Source | Lead source badge | ❌ |
| Status | Current status badge | ❌ |
| Assigned To | Sale name | ✅ |
| Last Activity | Time since last activity | ✅ |
| Next Contact | Next contact date | ✅ |
| Created At | Date created | ✅ |
| Actions | View / Edit / Delete | ❌ |

**Pagination**: 20 items per page

**Search**: By phone number or name

### 3.4 Lead Daily View

**Route**: `/leads/daily`

**Description**: Today's leads that need attention

**Widgets**:

```
┌─────────────────────────────────────────────────┐
│  MY LEADS TODAY                                 │
├─────────────────────────────────────────────────┤
│  🆕 New: 12                                     │
│  📞 Need Follow-up: 8                           │
│  ⚠️ Overdue: 3                                  │
│  ✅ Contacted Today: 15                         │
├─────────────────────────────────────────────────┤
│  This Week:                                     │
│  📅 Appointments Booked: 5                      │
│  🎉 Converted: 2                                │
│  ❌ Lost: 1                                     │
├─────────────────────────────────────────────────┤
│  [View All Leads →]                             │
└─────────────────────────────────────────────────┘
```

**Sections**:

1. **Need Follow-up Today** (nextContactDate = today)
2. **Overdue** (nextContactDate < today)
3. **New Leads** (status = "new", created today)

### 3.5 Lead Detail Page

**Route**: `/leads/[id]`

**Layout**: 2 columns

**Left Column** (Lead Info):

- Basic info (phone, name, service interest)
- Status badge
- Lead source
- Assignment (assigned to, clinic)
- Notes
- Created date
- [Edit Info] button

**Right Column** (Activity Timeline):

- List of activities (newest first)
- For each activity:
  - Activity type icon
  - Contact result badge
  - Notes
  - Next contact date
  - Created by + timestamp
- [Add Activity] button (floating)

**Actions**:

- ✅ Add Activity
- ✏️ Edit Lead Info
- 📅 Book Appointment → Convert flow
- ❌ Mark as Lost
- 🔄 Reassign

### 3.6 Add Activity

**UI**: Modal form

**Fields**:

- ✅ **activityType** (required): Radio buttons with icons
- **contactResult** (optional): Radio buttons (only if activityType = "call")
- **notes** (optional): Textarea
- **nextContactDate** (optional): Date picker

**Auto Status Update**:

```typescript
// When adding first activity for a "new" lead
if (lead.leadStatus === "new") {
  await prisma.lead.update({
    where: { id: leadId },
    data: { leadStatus: "contacted" },
  });
}
```

### 3.7 Book Appointment (Start Conversion)

**Trigger**: Click "Book Appointment" button on lead detail

**UI**: Multi-step modal

**Step 1: Appointment Details**

- Date & Time (DateTimePicker)
- Duration (default 30 mins)
- Notes

**Step 2: Confirm Lead Info**

- Review: phone, name, service interest
- Option to edit before creating customer

**Backend Logic**:

```typescript
async function bookAppointmentForLead(leadId, appointmentData) {
  return await prisma.$transaction(async (tx) => {
    const lead = await tx.lead.findUnique({ where: { id: leadId } });

    if (!lead) throw new Error("Lead not found");
    if (lead.leadStatus === "converted") {
      throw new Error("Lead already converted");
    }

    // 1. Create appointment (without customerId yet)
    const appointment = await tx.appointment.create({
      data: {
        appointmentDateTime: appointmentData.appointmentDateTime,
        duration: appointmentData.duration || 30,
        notes: appointmentData.notes,
        status: "confirmed",
        clinicId: lead.clinicId,
        // customerId: null, // Will link after conversion
        createdById: lead.assignedToId,
        updatedById: lead.assignedToId,
      },
    });

    // 2. Update lead status
    await tx.lead.update({
      where: { id: leadId },
      data: {
        leadStatus: "appointment_booked",
        firstAppointmentId: appointment.id,
      },
    });

    return appointment;
  });
}
```

**Note**: Customer record chưa được tạo ở bước này. Customer sẽ được tạo khi:

- Khách check-in appointment (receptionist converts lead → customer)
- Hoặc sale online manually converts lead → customer

### 3.8 Convert Lead to Customer

**Trigger**:

1. Khách check-in appointment (from appointment detail page)
2. Manual convert (from lead detail page, if appointment not needed)

**UI**: Modal form

**Fields** (bổ sung thông tin cho Customer):

- ✅ **fullName** (required if lead.name is empty)
- ✅ **dob** (required): Date picker
- ✅ **gender** (required): Radio (Male/Female)
- ✅ **address** (required): Text input
- ✅ **city** (required): Select
- ✅ **district** (required): Select (filtered by city)
- **email** (optional): Email input
- **occupation** (optional): Autocomplete

**Backend Logic**:

```typescript
async function convertLeadToCustomer(leadId, customerData) {
  return await prisma.$transaction(async (tx) => {
    // 1. Get lead
    const lead = await tx.lead.findUnique({
      where: { id: leadId },
      include: { firstAppointment: true },
    });

    if (!lead) throw new Error("Lead not found");
    if (lead.leadStatus === "converted") {
      throw new Error("Lead already converted");
    }

    // 2. Check phone uniqueness in Customer
    if (lead.phone) {
      const existing = await tx.customer.findUnique({
        where: { phone: lead.phone },
      });
      if (existing) {
        throw new Error(`Customer already exists: ${existing.customerCode}`);
      }
    }

    // 3. Generate customer code
    const customerCode = await generateCustomerCode(lead.clinicId);

    // 4. Create customer
    const customer = await tx.customer.create({
      data: {
        customerCode,
        phone: lead.phone,
        fullName: customerData.fullName || lead.name || "",
        dob: customerData.dob,
        gender: customerData.gender,
        address: customerData.address,
        city: customerData.city,
        district: customerData.district,
        email: customerData.email,
        occupation: customerData.occupation,
        clinicId: lead.clinicId,
        source: lead.leadSource,
        sourceNotes: `Converted from lead ${leadId}`,
        serviceOfInterest: lead.serviceOfInterest,
        convertedFromLeadId: leadId,
        createdById: lead.assignedToId,
        updatedById: lead.assignedToId,
      },
    });

    // 5. Update appointment (if exists)
    if (lead.firstAppointmentId) {
      await tx.appointment.update({
        where: { id: lead.firstAppointmentId },
        data: { customerId: customer.id },
      });
    }

    // 6. Update lead
    await tx.lead.update({
      where: { id: leadId },
      data: {
        leadStatus: "converted",
        convertedToCustomerId: customer.id,
        convertedAt: new Date(),
      },
    });

    return customer;
  });
}
```

### 3.9 Mark as Lost

**Trigger**: Click "Mark as Lost" on lead detail

**UI**: Modal form

**Fields**:

- ✅ **lostReason** (required): Select from LEAD_LOST_REASONS
- **notes** (optional): Textarea

**Backend Logic**:

```typescript
async function markLeadAsLost(leadId, data) {
  return await prisma.lead.update({
    where: { id: leadId },
    data: {
      leadStatus: "lost",
      lostReason: data.lostReason,
      notes: data.notes || null,
    },
  });
}
```

**Note**: Lost leads can be reactivated if phone number is re-imported

### 3.10 Reassign Lead

**Permission**: Admin, Team Lead

**UI**: Modal with employee select

**Logic**:

```typescript
async function reassignLead(leadId, newAssigneeId) {
  return await prisma.lead.update({
    where: { id: leadId },
    data: { assignedToId: newAssigneeId },
  });
}
```

---

## 4. 📊 KPIs & Reporting

### 4.1 Lead Performance Metrics

#### A. Conversion Rate (Lead → Customer)

**Formula**:

```typescript
Conversion Rate = (Leads converted / Total leads) × 100%
```

**Query**:

```sql
SELECT
  COUNT(CASE WHEN leadStatus = 'converted' THEN 1 END)::numeric /
  COUNT(*)::numeric * 100 as conversionRate
FROM "Lead"
WHERE
  createdAt >= :startDate
  AND createdAt < :endDate
  AND archivedAt IS NULL;
```

#### B. Average Time to Convert

**Formula**:

```typescript
Avg Time = AVG(convertedAt - createdAt) for converted leads
```

**Query**:

```sql
SELECT
  AVG(EXTRACT(EPOCH FROM (convertedAt - createdAt)) / 86400) as avgDaysToConvert
FROM "Lead"
WHERE
  leadStatus = 'converted'
  AND createdAt >= :startDate
  AND createdAt < :endDate;
```

#### C. Customer Lifetime Value (CLV) - NEW

**Definition**: Tổng doanh thu từ các khách hàng được convert từ lead

**Business Rule**:

- Sale online được tính revenue cho **TẤT CẢ services** của customer họ convert
- Track qua field `ConsultedService.leadSourceSaleId` (auto-fill khi tạo service)
- Bao gồm cả services "Chưa chốt" và "Đã chốt"

**Query**:

```sql
-- Customer Lifetime Value by Sale Online
WITH converted_customers AS (
  SELECT
    l.assignedToId as saleOnlineId,
    c.id as customerId,
    c.customerCode,
    c.fullName as customerName,
    l.convertedAt
  FROM "Lead" l
  JOIN "Customer" c ON c.convertedFromLeadId = l.id
  WHERE
    l.leadStatus = 'converted'
    AND l.convertedAt >= :startDate
    AND l.convertedAt < :endDate
),
customer_revenue AS (
  SELECT
    cs.customerId,
    cs.leadSourceSaleId as saleOnlineId,
    COUNT(cs.id) as totalServices,
    COUNT(CASE WHEN cs.serviceStatus = 'Đã chốt' THEN 1 END) as closedServices,
    SUM(cs.finalPrice) as totalRevenue,
    SUM(CASE WHEN cs.serviceStatus = 'Đã chốt' THEN cs.finalPrice ELSE 0 END) as closedRevenue
  FROM "ConsultedService" cs
  WHERE
    cs.leadSourceSaleId IS NOT NULL
    AND cs.consultationDate >= :startDate
    AND cs.consultationDate < :endDate
  GROUP BY cs.customerId, cs.leadSourceSaleId
)
SELECT
  e.id as employeeId,
  e.fullName as employeeName,
  COUNT(DISTINCT cc.customerId) as convertedCustomers,
  COALESCE(SUM(cr.totalServices), 0) as totalServices,
  COALESCE(SUM(cr.closedServices), 0) as closedServices,
  COALESCE(SUM(cr.totalRevenue), 0) as totalRevenue,
  COALESCE(SUM(cr.closedRevenue), 0) as closedRevenue,
  ROUND(
    COALESCE(SUM(cr.closedRevenue), 0)::numeric /
    NULLIF(COUNT(DISTINCT cc.customerId), 0)::numeric,
    0
  ) as avgRevenuePerCustomer,
  ROUND(
    COALESCE(SUM(cr.closedServices), 0)::numeric /
    NULLIF(SUM(cr.totalServices), 0)::numeric * 100,
    2
  ) as serviceConversionRate
FROM "Employee" e
JOIN converted_customers cc ON cc.saleOnlineId = e.id
LEFT JOIN customer_revenue cr ON cr.customerId = cc.customerId
WHERE e.jobTitle = 'Sale Online'
GROUP BY e.id, e.fullName
ORDER BY closedRevenue DESC;
```

#### D. Daily/Monthly Revenue - NEW

**Definition**: Doanh thu hàng ngày/tháng từ customers converted

**Use Case**: Sale online xem doanh thu từng ngày/tháng

**Query**:

```sql
-- Daily revenue breakdown for sale online (current user)
SELECT
  DATE(cs.consultationDate) as date,
  COUNT(cs.id) as totalServices,
  COUNT(CASE WHEN cs.serviceStatus = 'Đã chốt' THEN 1 END) as closedServices,
  SUM(cs.finalPrice) as totalRevenue,
  SUM(CASE WHEN cs.serviceStatus = 'Đã chốt' THEN cs.finalPrice ELSE 0 END) as closedRevenue,
  SUM(cs.amountPaid) as paidAmount
FROM "ConsultedService" cs
WHERE
  cs.leadSourceSaleId = :currentUserId
  AND cs.consultationDate >= :startDate
  AND cs.consultationDate < :endDate
GROUP BY DATE(cs.consultationDate)
ORDER BY date DESC;
```

#### E. Lead Quality by Source

**Query**:

```sql
SELECT
  leadSource,
  COUNT(*) as totalLeads,
  COUNT(CASE WHEN leadStatus = 'converted' THEN 1 END) as convertedLeads,
  ROUND(
    COUNT(CASE WHEN leadStatus = 'converted' THEN 1 END)::numeric /
    COUNT(*)::numeric * 100,
    2
  ) as conversionRate
FROM "Lead"
WHERE
  createdAt >= :startDate
  AND createdAt < :endDate
  AND archivedAt IS NULL
GROUP BY leadSource
ORDER BY conversionRate DESC;
```

### 4.2 Sale Online Performance

**Query**: Leads handled by each sale

```sql
SELECT
  e.id as employeeId,
  e.fullName as employeeName,
  COUNT(DISTINCT l.id) as totalLeads,
  COUNT(DISTINCT CASE WHEN l.leadStatus = 'converted' THEN l.id END) as convertedLeads,
  COUNT(DISTINCT la.id) as totalActivities,
  ROUND(
    COUNT(DISTINCT CASE WHEN l.leadStatus = 'converted' THEN l.id END)::numeric /
    NULLIF(COUNT(DISTINCT l.id), 0)::numeric * 100,
    2
  ) as conversionRate,
  ROUND(
    COUNT(DISTINCT la.id)::numeric /
    NULLIF(COUNT(DISTINCT l.id), 0)::numeric,
    2
  ) as avgActivitiesPerLead
FROM "Employee" e
LEFT JOIN "Lead" l ON l.assignedToId = e.id
  AND l.createdAt >= :startDate
  AND l.createdAt < :endDate
  AND l.archivedAt IS NULL
LEFT JOIN "LeadActivity" la ON la.leadId = l.id
WHERE
  e.jobTitle = 'Sale Online'
  AND e.archivedAt IS NULL
GROUP BY e.id, e.fullName
ORDER BY conversionRate DESC;
```

### 4.3 Dashboard Widgets

**Location**: `/dashboard` - Section "Lead Management"

```
┌─────────────────────────────────────────────────────────────┐
│  📊 LEAD PERFORMANCE - This Month                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Overview                                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Total Leads: 350                                    │   │
│  │ Converted: 42 (12%)                                 │   │
│  │ Appointment Booked: 28                              │   │
│  │ Lost: 65 (18.6%)                                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  By Source (Conversion Rate)                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Facebook: 120 leads → 18 converted (15%) ⬆         │   │
│  │ Google: 80 leads → 12 converted (15%)              │   │
│  │ Zalo: 60 leads → 6 converted (10%)                 │   │
│  │ TikTok: 50 leads → 4 converted (8%) ⬇              │   │
│  │ Other: 40 leads → 2 converted (5%) ⬇               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Top Performers                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Nguyễn A: 45 leads → 8 converted (17.8%) ⬆        │   │
│  │ Trần B: 38 leads → 6 converted (15.8%)            │   │
│  │ Lê C: 42 leads → 5 converted (11.9%) ➡            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [View Detailed Report →]                                   │
└─────────────────────────────────────────────────────────────┘
```

### 4.4 Sale Online Dashboard Widget (NEW)

**Location**: `/dashboard` (for Sale Online users)

**Purpose**: Show revenue from converted customers

```
┌─────────────────────────────────────────────────────────────────┐
│  💰 MY REVENUE PERFORMANCE - This Month                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Lead Conversion                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Total Leads: 45                                          │  │
│  │ Converted: 8 (17.8%)                                     │  │
│  │ Appointment Booked: 12                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Customer Revenue (from my converted customers)                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Customers: 8                                             │  │
│  │ Services Consulted: 15                                   │  │
│  │ Services Closed: 12 (80%)                                │  │
│  │                                                           │  │
│  │ 💰 Total Revenue: 45,000,000đ                           │  │
│  │ ✅ Closed Revenue: 38,000,000đ                          │  │
│  │ 📊 Avg per Customer: 4,750,000đ                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Today's Activity                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 📞 Calls Made: 12                                        │  │
│  │ 🆕 New Leads: 3                                          │  │
│  │ ✅ New Services Closed Today: 2 (5,500,000đ)            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  [View Detailed Report →] [View My Converted Customers →]       │
└─────────────────────────────────────────────────────────────────┘
```

**Query for Widget**:

```sql
-- Sale online dashboard summary
WITH my_leads AS (
  SELECT
    COUNT(*) as totalLeads,
    COUNT(CASE WHEN leadStatus = 'converted' THEN 1 END) as convertedLeads,
    COUNT(CASE WHEN leadStatus = 'appointment_booked' THEN 1 END) as appointmentBooked
  FROM "Lead"
  WHERE
    assignedToId = :currentUserId
    AND createdAt >= date_trunc('month', CURRENT_DATE)
    AND archivedAt IS NULL
),
my_customers AS (
  SELECT
    COUNT(DISTINCT c.id) as totalCustomers
  FROM "Customer" c
  JOIN "Lead" l ON l.convertedToCustomerId = c.id
  WHERE
    l.assignedToId = :currentUserId
    AND l.convertedAt >= date_trunc('month', CURRENT_DATE)
),
my_revenue AS (
  SELECT
    COUNT(cs.id) as totalServices,
    COUNT(CASE WHEN cs.serviceStatus = 'Đã chốt' THEN 1 END) as closedServices,
    SUM(cs.finalPrice) as totalRevenue,
    SUM(CASE WHEN cs.serviceStatus = 'Đã chốt' THEN cs.finalPrice ELSE 0 END) as closedRevenue
  FROM "ConsultedService" cs
  WHERE
    cs.leadSourceSaleId = :currentUserId
    AND cs.consultationDate >= date_trunc('month', CURRENT_DATE)
),
today_activity AS (
  SELECT
    COUNT(la.id) as callsMade,
    COUNT(DISTINCT la.leadId) as leadsContacted
  FROM "LeadActivity" la
  WHERE
    la.createdById = :currentUserId
    AND la.activityType = 'call'
    AND DATE(la.createdAt) = CURRENT_DATE
),
today_new_leads AS (
  SELECT COUNT(*) as newLeads
  FROM "Lead"
  WHERE
    assignedToId = :currentUserId
    AND DATE(createdAt) = CURRENT_DATE
),
today_closed_services AS (
  SELECT
    COUNT(cs.id) as closedToday,
    SUM(cs.finalPrice) as revenueToday
  FROM "ConsultedService" cs
  WHERE
    cs.leadSourceSaleId = :currentUserId
    AND cs.serviceStatus = 'Đã chốt'
    AND DATE(cs.serviceConfirmDate) = CURRENT_DATE
)
SELECT
  ml.*,
  mc.totalCustomers,
  mr.*,
  ta.callsMade,
  tnl.newLeads,
  tcs.closedToday,
  tcs.revenueToday
FROM my_leads ml
CROSS JOIN my_customers mc
CROSS JOIN my_revenue mr
CROSS JOIN today_activity ta
CROSS JOIN today_new_leads tnl
CROSS JOIN today_closed_services tcs;
```

### 4.5 "My Converted Customers" Page (NEW)

**Route**: `/customers?tab=converted` (for Sale Online)

**Description**: List of customers converted from leads assigned to current sale online

**Filters**:

- Date range (converted date)
- Service status: All / Has services / No services yet
- Revenue range

**Columns**:
| Column | Description | Sortable |
|--------|-------------|----------|
| Customer Code | Link to customer detail | ✅ |
| Name | Customer name | ✅ |
| Phone | Phone number | ❌ |
| Converted Date | When lead → customer | ✅ |
| Services | Total consulted | ✅ |
| Closed | Services closed | ✅ |
| Revenue | Total finalPrice of closed services | ✅ |
| Last Activity | Last consultation date | ✅ |
| Status | Badge: 🟢 Active / ⚪ No service / 🔴 Lost | ❌ |

**Query**:

```sql
SELECT
  c.id,
  c.customerCode,
  c.fullName,
  c.phone,
  l.convertedAt,
  COUNT(cs.id) as totalServices,
  COUNT(CASE WHEN cs.serviceStatus = 'Đã chốt' THEN 1 END) as closedServices,
  COALESCE(SUM(CASE WHEN cs.serviceStatus = 'Đã chốt' THEN cs.finalPrice ELSE 0 END), 0) as totalRevenue,
  MAX(cs.consultationDate) as lastActivityDate,
  CASE
    WHEN COUNT(cs.id) = 0 THEN 'no_service'
    WHEN COUNT(CASE WHEN cs.serviceStatus = 'Đã chốt' THEN 1 END) > 0 THEN 'active'
    ELSE 'no_closed'
  END as status
FROM "Customer" c
JOIN "Lead" l ON l.convertedToCustomerId = c.id
LEFT JOIN "ConsultedService" cs ON cs.customerId = c.id
WHERE
  l.assignedToId = :currentUserId
  AND l.leadStatus = 'converted'
  AND l.convertedAt >= :startDate
  AND l.convertedAt < :endDate
GROUP BY c.id, c.customerCode, c.fullName, c.phone, l.convertedAt
ORDER BY l.convertedAt DESC
LIMIT :limit OFFSET :offset;
```

---

## 5. 🔌 API Endpoints

### Lead Management

| Method | Endpoint                   | Description              | Permission                          |
| ------ | -------------------------- | ------------------------ | ----------------------------------- |
| POST   | `/api/leads`               | Create single lead       | Sale Online, Admin                  |
| POST   | `/api/leads/bulk-import`   | Bulk import from file    | Admin, Marketing                    |
| GET    | `/api/leads`               | List leads (paginated)   | Sale Online (assigned), Admin (all) |
| GET    | `/api/leads/daily`         | Daily view stats         | Sale Online, Admin                  |
| GET    | `/api/leads/:id`           | Get lead detail          | Owner, Admin                        |
| PATCH  | `/api/leads/:id`           | Update lead info         | Owner, Admin                        |
| DELETE | `/api/leads/:id`           | Soft delete lead         | Admin                               |
| POST   | `/api/leads/:id/reassign`  | Reassign to another sale | Admin, Team Lead                    |
| POST   | `/api/leads/:id/mark-lost` | Mark as lost             | Owner, Admin                        |

### Lead Activities

| Method | Endpoint                    | Description           | Permission   |
| ------ | --------------------------- | --------------------- | ------------ |
| POST   | `/api/leads/:id/activities` | Add activity          | Owner, Admin |
| GET    | `/api/leads/:id/activities` | Get activity timeline | Owner, Admin |

### Lead Conversion

| Method | Endpoint                          | Description         | Permission              |
| ------ | --------------------------------- | ------------------- | ----------------------- |
| POST   | `/api/leads/:id/book-appointment` | Book appointment    | Owner, Admin            |
| POST   | `/api/leads/:id/convert`          | Convert to customer | Owner, Admin, Reception |

### Reporting

| Method | Endpoint                               | Description                            | Permission         |
| ------ | -------------------------------------- | -------------------------------------- | ------------------ |
| GET    | `/api/reports/lead-performance`        | Lead performance metrics               | Admin, Manager     |
| GET    | `/api/reports/lead-sources`            | Performance by source                  | Admin, Manager     |
| GET    | `/api/reports/sale-online-performance` | Sale online KPIs                       | Admin, Manager     |
| GET    | `/api/reports/sale-online-revenue`     | Revenue from converted customers (NEW) | Sale Online, Admin |
| GET    | `/api/reports/sale-online-dashboard`   | Dashboard summary data (NEW)           | Sale Online        |

### Customer Views (NEW)

| Method | Endpoint                               | Description                 | Permission         |
| ------ | -------------------------------------- | --------------------------- | ------------------ |
| GET    | `/api/customers/converted`             | My converted customers list | Sale Online        |
| GET    | `/api/customers/converted/:id/revenue` | Revenue detail for customer | Sale Online, Admin |
| GET    | `/api/reports/sale-online-performance` | Sale online KPIs            | Admin, Manager     |

---

## 6. 🎨 UI/UX Guidelines

### Status Badge Colors

```typescript
export const LEAD_STATUS_COLORS = {
  new: "blue", // 🔵 Mới
  contacted: "cyan", // 🔷 Đã liên hệ
  qualified: "green", // 🟢 Đủ điều kiện
  appointment_booked: "purple", // 🟣 Đã đặt lịch
  converted: "lime", // 🟢 Đã chuyển đổi
  lost: "red", // 🔴 Mất
};
```

### Activity Icons

```typescript
export const ACTIVITY_TYPE_ICONS = {
  call: "📞",
  sms: "💬",
  zalo: "💙",
  facebook: "👥",
  email: "📧",
  note: "📝",
};
```

### Priority Indicators

```typescript
// Next contact date urgency
if (nextContactDate < today) {
  return <Tag color="red">⚠️ Overdue</Tag>;
} else if (nextContactDate === today) {
  return <Tag color="orange">📅 Today</Tag>;
} else if (nextContactDate <= today + 2 days) {
  return <Tag color="blue">📆 Soon</Tag>;
}
```

---

## 7. 🔐 Permissions

### Role-Based Access

| Feature              | Sale Online      | Admin  | Marketing Manager |
| -------------------- | ---------------- | ------ | ----------------- |
| Create Lead (single) | ✅ Own leads     | ✅ All | ✅ All            |
| Bulk Import          | ❌               | ✅     | ✅                |
| View Leads           | ✅ Assigned only | ✅ All | ✅ All            |
| Edit Lead            | ✅ Assigned only | ✅ All | ✅ All            |
| Add Activity         | ✅ Assigned only | ✅ All | ❌                |
| Book Appointment     | ✅ Assigned only | ✅ All | ❌                |
| Convert to Customer  | ✅ Assigned only | ✅ All | ❌                |
| Mark as Lost         | ✅ Assigned only | ✅ All | ❌                |
| Reassign             | ❌               | ✅     | ✅                |
| Delete               | ❌               | ✅     | ❌                |
| View Reports         | ❌               | ✅     | ✅                |

### Permission Implementation

```typescript
// src/shared/permissions/lead.permissions.ts

export const leadPermissions = {
  canCreate(user: UserCore): boolean {
    return ["admin", "sale_online", "marketing_manager"].includes(user.role);
  },

  canBulkImport(user: UserCore): boolean {
    return ["admin", "marketing_manager"].includes(user.role);
  },

  canView(user: UserCore, lead: Lead): boolean {
    if (user.role === "admin") return true;
    if (user.role === "marketing_manager") return true;
    return lead.assignedToId === user.id;
  },

  canEdit(user: UserCore, lead: Lead): boolean {
    if (user.role === "admin") return true;
    if (user.role === "marketing_manager") return true;
    return lead.assignedToId === user.id;
  },

  canReassign(user: UserCore): boolean {
    return ["admin", "marketing_manager"].includes(user.role);
  },

  canDelete(user: UserCore): boolean {
    return user.role === "admin";
  },
};
```

---

## 8. 🚀 Implementation Tasks

### Phase 1: Database & Core Logic (Priority: High)

- [ ] Update Prisma schema (Lead, LeadActivity models)
- [ ] Add relations to Customer, Appointment, Employee
- [ ] Run migration: `prisma migrate dev --name add_lead_models`
- [ ] Create validation schemas (lead.schema.ts)
- [ ] Create constants (lead-sources, statuses, etc.)
- [ ] Implement lead.service.ts (CRUD operations)
- [ ] Implement lead-conversion.service.ts (convert logic)
- [ ] Add indexes for performance

### Phase 2: API Layer (Priority: High)

- [ ] Create API routes for lead management
- [ ] Create API routes for activities
- [ ] Create API routes for conversion
- [ ] Add permission checks
- [ ] Error handling and logging
- [ ] Unit tests for services

### Phase 3: UI - List & Detail (Priority: High)

- [ ] Lead list page with filters
- [ ] Lead daily view with widgets
- [ ] Lead detail page (info + activity timeline)
- [ ] Create lead modal
- [ ] Edit lead modal
- [ ] Add activity modal
- [ ] Mark as lost modal
- [ ] Reassign modal

### Phase 4: Bulk Import (Priority: Medium)

- [ ] Upload file component
- [ ] Excel/CSV parser
- [ ] Column mapping UI
- [ ] Preview table (first 10 rows)
- [ ] Validation report
- [ ] Bulk import API
- [ ] Progress indicator
- [ ] Error handling

### Phase 5: Conversion Flow (Priority: High)

- [ ] Book appointment modal (from lead)
- [ ] Convert to customer modal
- [ ] Update appointment.service.ts (link to lead)
- [ ] Update customer.service.ts (track conversion)
- [ ] Check-in flow integration (auto-convert on check-in)
- [ ] Success notifications

### Phase 6: Reporting & Analytics (Priority: Medium)

- [ ] Lead performance queries
- [ ] Sale online performance queries
- [ ] Lead source analysis
- [ ] Dashboard widgets
- [ ] Charts (conversion funnel, source comparison)
- [ ] Export to Excel

### Phase 7: Testing & Polish (Priority: Low)

- [ ] Integration tests
- [ ] E2E tests (Playwright)
- [ ] Performance testing (bulk import 1000 leads)
- [ ] UI/UX polish
- [ ] Mobile responsive
- [ ] Documentation

---

## 9. 🔮 Future Enhancements

### Advanced Features

- [ ] **AI-powered Lead Scoring**: Predict conversion likelihood
- [ ] **Automated Lead Distribution**: Auto-assign based on workload
- [ ] **SMS/Zalo Integration**: Send messages directly from app
- [ ] **WhatsApp Integration**: Multi-channel communication
- [ ] **Call Recording**: Link phone calls to activities
- [ ] **Lead Nurturing Campaigns**: Automated email/SMS sequences
- [ ] **Duplicate Detection**: Smart merge suggestions
- [ ] **Lead Enrichment**: Auto-fill data from social profiles

### Integrations

- [ ] Facebook Lead Ads: Auto-import leads
- [ ] Google Ads: Track ad performance → lead quality
- [ ] Zalo OA: Two-way messaging
- [ ] VoIP Integration: Click-to-call from app

---

## 10. 📚 Related Documents

- [007 Customer.md](./007%20Customer.md) - Customer Management (post-conversion)
- [008 Appointment.md](./008%20Appointment.md) - Appointment booking flow
- [010 Follow-up.md](./010%20Follow-up.md) - Follow-up after consultation (different from lead follow-up)

---

## 11. ❓ Business Rules & Decisions

### 11.1 Backfill Historical Data

**Question**: ConsultedService hiện tại (chưa có leadSourceSaleId) xử lý thế nào?

**Decision**: ✅ **Chỉ track từ bây giờ**

- New services: Auto-fill leadSourceSaleId
- Old services: leadSourceSaleId = null
- Admin có thể manual update cho các services quan trọng

**Implementation**:

```typescript
// No automatic backfill
// Admin can manually set via UI if needed

// Admin edit form for ConsultedService:
// Field: leadSourceSaleId (Select employee, jobTitle = 'Sale Online')
```

### 11.2 Revenue Attribution Logic

**Question**: Chia % revenue giữa sale online, offline, doctor?

**Decision**: ✅ **100% credit cho tất cả** (Tri-Attribution)

- Sale Online: 100% credit (CLV của customer họ convert)
- Sale Offline: 100% credit (services họ tư vấn)
- Doctor: 100% credit (services họ tư vấn)
- **finalPrice** tự động từ ConsultedService
- Admin có thể chỉnh sửa attribution nếu cần

**Rationale**:

- Công bằng: Mỗi người đóng góp khác nhau
- Động lực: Sale online có động lực convert quality leads
- Tracking: Dễ dàng so sánh performance

**Admin Override**:

```typescript
// Admin can manually change leadSourceSaleId
// Example: Lead được chăm sóc bởi nhiều sales, credit cho người cuối
```

### 11.3 Commission Calculation

**Question**: Hoa hồng tính theo attribution nào?

**Decision**: ✅ **Không tính hoa hồng trong scope này**

- Phase 1: Chỉ track doanh thu (revenue)
- Future: Hoa hồng là module riêng nếu cần

### 11.4 Lead Source Sale Activity Requirement (CRITICAL)

**Question**: Lead convert 2 năm trước, service mới hôm nay → leadSourceSaleId có track?

**Decision**: ✅ **Chỉ track nếu sale online còn chăm sóc**

**Business Rule**:

```typescript
/**
 * leadSourceSaleId được set CHỈ KHI:
 *
 * 1. Customer converted from lead
 * AND
 * 2. Lead có activity từ sale online trong 3 THÁNG gần nhất
 *
 * Nếu không có activity trong 3 tháng:
 * → leadSourceSaleId = null
 * → Credit chỉ cho sale offline + doctor
 *
 * Rationale:
 * - Công bằng: Sale online phải actively chăm sóc mới được credit
 * - Tránh: Credit cho sales đã nghỉ việc / không làm gì
 */
```

**Auto-fill Logic Updated**:

```typescript
async function createConsultedService(customerId: string, serviceData: any) {
  // 1. Check if customer converted from lead
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      convertedFromLead: {
        select: {
          id: true,
          assignedToId: true,
          activities: {
            where: {
              createdAt: {
                gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 3 months ago
              },
            },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  // 2. Check if lead has activity in last 3 months
  let leadSourceSaleId = null;

  if (customer?.convertedFromLead) {
    const hasRecentActivity = customer.convertedFromLead.activities.length > 0;

    if (hasRecentActivity) {
      leadSourceSaleId = customer.convertedFromLead.assignedToId;
    }
    // Else: No recent activity → leadSourceSaleId = null (no credit)
  }

  // 3. Create service
  return await prisma.consultedService.create({
    data: {
      ...serviceData,
      customerId,
      leadSourceSaleId, // null if no recent activity
      consultingSaleId: serviceData.consultingSaleId,
      consultingDoctorId: serviceData.consultingDoctorId,
    },
  });
}
```

**UI Indication**:

```typescript
// In customer detail page, show badge:
if (customer.convertedFromLead) {
  const hasRecentActivity = await checkRecentLeadActivity(
    customer.convertedFromLeadId
  );

  if (hasRecentActivity) {
    return (
      <Badge color="green">🎯 Active Lead (Sale Online gets credit)</Badge>
    );
  } else {
    return <Badge color="gray">⏰ Inactive Lead (No sale online credit)</Badge>;
  }
}
```

### 11.5 Multiple Phone Numbers per Lead

**Question**: Khách hàng dùng 2 SĐT → 2 leads hay 1 lead?

**Decision**: ✅ **1 Lead với multiple phone numbers**

**Schema Update**:

```prisma
model Lead {
  id String @id @default(uuid())

  // Primary phone (required)
  phone String @unique

  // Additional phones (optional, JSON array)
  additionalPhones String[] @default([])

  // ... other fields
}
```

**Business Rules**:

```typescript
/**
 * Phone Number Management:
 *
 * 1. Primary Phone (required):
 *    - First phone number collected
 *    - UNIQUE constraint
 *    - Used for main contact
 *
 * 2. Additional Phones (optional):
 *    - Array of secondary numbers
 *    - No unique constraint (can overlap with other leads)
 *    - Used for backup contact
 *
 * 3. Duplicate Detection:
 *    - Check if new phone exists as primary in any lead
 *    - If yes: Show warning "Phone exists in Lead XXX"
 *    - Option to:
 *      a) Add as additional phone to existing lead
 *      b) Create new lead anyway (same person, different identity?)
 */
```

**UI Implementation**:

```typescript
// Create/Edit Lead Form
<Form>
  <Input name="phone" label="Primary Phone" required />

  <MultiInput
    name="additionalPhones"
    label="Additional Phones (Optional)"
    placeholder="Add another phone number"
  />
</Form>

// Lead Detail Page
<Card title="Contact Information">
  <div>Primary: {lead.phone}</div>
  {lead.additionalPhones.length > 0 && (
    <div>
      Additional:
      {lead.additionalPhones.map(p => <Tag key={p}>{p}</Tag>)}
    </div>
  )}
</Card>
```

**Duplicate Prevention**:

```typescript
async function createLead(data: CreateLeadInput) {
  // Check primary phone
  const existingPrimary = await prisma.lead.findUnique({
    where: { phone: data.phone },
  });

  if (existingPrimary) {
    throw new Error(
      `Lead already exists with this phone: ${existingPrimary.id}`
    );
  }

  // Check if phone exists in additional phones of other leads
  const existingAdditional = await prisma.lead.findFirst({
    where: {
      additionalPhones: {
        has: data.phone,
      },
    },
  });

  if (existingAdditional) {
    // Warning only, allow creation
    console.warn(
      `Phone exists as additional phone in lead: ${existingAdditional.id}`
    );
  }

  // Create lead
  return await prisma.lead.create({ data });
}
```

**Admin Override for Conflicting Attributions**:

**Question**: Nếu đã có 2 leads (tạo nhầm) → merge hay reassign?

**Decision**: ✅ **Admin có thể manual merge hoặc reassign**

**Scenario A: Merge Leads**

```typescript
// Admin action: Merge lead B into lead A
async function mergeLeads(keepLeadId: string, mergeLeadId: string) {
  return await prisma.$transaction(async (tx) => {
    const keepLead = await tx.lead.findUnique({ where: { id: keepLeadId } });
    const mergeLead = await tx.lead.findUnique({ where: { id: mergeLeadId } });

    // 1. Move activities from mergeLead to keepLead
    await tx.leadActivity.updateMany({
      where: { leadId: mergeLeadId },
      data: { leadId: keepLeadId },
    });

    // 2. Merge additional phones
    await tx.lead.update({
      where: { id: keepLeadId },
      data: {
        additionalPhones: [
          ...keepLead.additionalPhones,
          mergeLead.phone,
          ...mergeLead.additionalPhones,
        ],
      },
    });

    // 3. Archive mergeLead
    await tx.lead.update({
      where: { id: mergeLeadId },
      data: {
        leadStatus: "lost",
        lostReason: "duplicate",
        archivedAt: new Date(),
      },
    });

    return keepLead;
  });
}
```

**Scenario B: Manual Reassign leadSourceSaleId**

```typescript
// Admin can change leadSourceSaleId in ConsultedService
// Use case: Customer có 2 leads, admin chọn lead nào được credit

// UI: ConsultedService edit form (Admin only)
<Select
  label="Lead Source Sale (Override)"
  options={[
    { value: null, label: "None" },
    { value: saleOnlineId1, label: "Sale Online A (from Lead 1)" },
    { value: saleOnlineId2, label: "Sale Online B (from Lead 2)" },
  ]}
/>
```

---

## 12. ❓ Open Questions (Remaining)

1. **Lead Ownership Transfer**: Nếu sale online nghỉ việc, leads của họ sẽ reassign cho ai?

   - Option A: Auto-reassign to team lead
   - Option B: Admin manually reassign
   - Option C: Keep lead, mark sale as "inactive"

2. **Lead Expiration**: Leads "new" quá 30 ngày có tự động chuyển "lost" không?

   - Option A: Auto-expire (với reason = "no_contact_timeout")
   - Option B: Manual only (admin/sale marks as lost)

3. **Activity Reminders**: Gửi notification khi đến nextContactDate?

   - Email notification?
   - In-app notification?
   - SMS to sale online?

4. **Bulk Operations**: Update/delete nhiều leads cùng lúc?

   - Bulk reassign (chọn 10 leads, assign cho sale khác)
   - Bulk mark as lost
   - Bulk export

5. **Lead Import History**: Track lịch sử import files?

   - Store: file name, imported by, timestamp, imported count
   - Show import history in UI
   - Re-import protection

6. **Lead Scoring**: Có cần tính điểm lead (hot/warm/cold)?
   - Based on: activity count, last contact date, service interest
   - Auto-prioritize high-score leads
   - Future enhancement

---

**✍️ Document History**

- 2025-11-11: Initial draft - Lead Management System requirements
- 2025-11-11: Updated with revenue attribution and business rules decisions:
  - Backfill: Chỉ track từ bây giờ, admin manual update nếu cần
  - Revenue: 100% credit cho tất cả (tri-attribution), admin có thể override
  - Commission: Không tính trong scope này
  - Activity requirement: 3 tháng rule - chỉ credit nếu có activity gần đây
  - Multiple phones: 1 lead với primary + additional phones, admin có thể merge leads
