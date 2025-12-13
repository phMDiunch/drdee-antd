# 🎯 FINAL ARCHITECTURE & IMPLEMENTATION PLAN

> **Date**: 2025-12-12  
> **Status**: ✅ FINALIZED - Merged from Gemini + GitHub Copilot discussions  
> **Related**: 118 Service-based Tracking, 110 Follow-up, 111 Lead

---

## 📊 EXECUTIVE SUMMARY

Sau khi thảo luận với **Gemini** và **GitHub Copilot**, đã đạt được consensus về architecture sau:

### ✅ DECISIONS FINALIZED

| Decision                 | Details                                                                  |
| ------------------------ | ------------------------------------------------------------------------ |
| **Source Tracking**      | Service-level (`ConsultedService.source`) instead of customer-level      |
| **Lead + Customer**      | **MERGE into 1 model** with `type: "LEAD" \| "CUSTOMER"`                 |
| **Follow-up Logic**      | **BY CUSTOMER** to avoid fragmentation, but link to `consultedServiceId` |
| **Sales Opportunity**    | `ConsultedService` = Sales Opportunity/Deal                              |
| **Kanban View**          | Display layer only (no separate Board/List/Card tables)                  |
| **Appointment Type**     | Add enum: `CONSULTATION` vs `TREATMENT` vs `RE_EXAM`                     |
| **Multiple Sales Roles** | `saleOnlineId`, `consultingSaleId`, `treatingDoctorId`                   |

---

## 🏗️ SCHEMA CHANGES SUMMARY

### 1. Customer Model

**Key Changes:**

- ✅ Add `type: "LEAD" | "CUSTOMER"`
- ✅ Make `customerCode` nullable (only for CUSTOMER)
- ✅ Add `firstVisitDate: DateTime?` (ngày đến phòng khám lần đầu)
- 🟡 Keep existing `source`, `sourceNotes`, `serviceOfInterest` (migrate later)

```prisma
model Customer {
  // ⭐ NEW fields
  type           String    // "LEAD" | "CUSTOMER" (set by app)
  firstVisitDate DateTime? // Ngày đến phòng khám lần đầu

  // 🟡 KEEP existing fields (migrate later)
  customerCode       String?  @unique
  source             String?  // Keep for now
  sourceNotes        String?  // Keep for now
  serviceOfInterest  String?  // Keep for now

  // ... other existing fields

  @@index([type, clinicId, createdAt])
}
```

### 2. ConsultedService Model

**Key Changes:**

- ✅ Add `source: String` (REQUIRED) - Nguồn của dịch vụ này
- ✅ Add `sourceNotes: String?`
- ✅ Add `stage: String` - For Kanban view
- ✅ Add `saleOnlineId: String?` - Sale online (telesale)
- ✅ Add `lostReason: String?` - Lý do thất bại

```prisma
model ConsultedService {
  // ⭐ NEW: Source per service
  source       String  // REQUIRED
  sourceNotes  String?

  // ⭐ NEW: Pipeline stage (for Kanban)
  stage String // "NEW" | "CONTACTED" | "CONSULTING" | "QUOTED" | "WON" | "LOST" (set by app)

  // ⭐ NEW: Multiple sale roles
  saleOnlineId String? // Sale Online (telesale)
  saleOnline   Employee? @relation("SaleOnline", fields: [saleOnlineId], references: [id])

  // Existing: consultingSaleId (sale offline tại quầy)
  // Existing: consultingDoctorId, treatingDoctorId

  // ⭐ NEW: Lost tracking
  lostReason  String?

  // ... existing fields

  @@index([source, serviceStatus])
  @@index([stage, clinicId])
  @@index([saleOnlineId, stage])
}
```

### 3. Appointment Model

**Key Changes:**

- ✅ Add `type: "CONSULTATION" | "TREATMENT" | "RE_EXAM"`
- ✅ Add `consultedServiceId: String?` - Link to opportunity

```prisma
model Appointment {
  type               String // "CONSULTATION" | "TREATMENT" | "RE_EXAM" (set by app)
  consultedServiceId String?
  consultedService   ConsultedService? @relation(fields: [consultedServiceId], references: [id])

  // ... existing fields

  @@index([type, clinicId, appointmentDateTime])
}
```

### 4. CustomerFollowUp Model (NEW)

**Key Design:**

- ✅ BY CUSTOMER (not by service) - Avoid fragmentation
- ✅ Link to `consultedServiceId` - Track which service is being followed
- ✅ Dual assignment: `assignedToSaleId` + `consultingDoctorId`
- ✅ Auto-reassignment logic based on service sale/doctor

```prisma
model CustomerFollowUp {
  id String @id @default(uuid())

  // BY CUSTOMER
  customerId String
  customer   Customer @relation(fields: [customerId], references: [id])

  // Link to service being followed
  consultedServiceId String
  consultedService   ConsultedService @relation(fields: [consultedServiceId], references: [id])

  // Assignment (dual: sale + doctor)
  assignedToSaleId     String?
  consultingDoctorId   String?
  manuallyReassigned   Boolean @default(false)

  assignedToSale   Employee? @relation("FollowUpSale", fields: [assignedToSaleId], references: [id])
  consultingDoctor Employee? @relation("FollowUpDoctor", fields: [consultingDoctorId], references: [id])

  // Status & Priority
  status   String // "pending" | "in_progress" | "success" | "give_up"
  priority String @default("medium") // "high" | "medium" | "low"

  // Dates
  nextFollowUpDate DateTime?
  completedAt      DateTime?

  // Metadata
  clinicId    String
  clinic      Clinic @relation(fields: [clinicId], references: [id])
  createdById String
  updatedById String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  archivedAt  DateTime?

  createdBy Employee @relation("CreatedFollowUps", fields: [createdById], references: [id])
  updatedBy Employee @relation("UpdatedFollowUps", fields: [updatedById], references: [id])

  activities FollowUpActivity[]

  @@index([customerId, status])
  @@index([assignedToSaleId, status, nextFollowUpDate])
  @@index([consultedServiceId])
}

model FollowUpActivity {
  id String @id @default(uuid())

  followUpId String
  followUp   CustomerFollowUp @relation(fields: [followUpId], references: [id])

  activityType  String // "call" | "sms" | "zalo" | "meeting" | "note"
  contactResult String? // "interested" | "callback_later" | "not_interested" | "no_contact"
  notes         String // Có thể mention nhiều services
  nextContactDate DateTime?

  createdById String
  createdBy   Employee @relation(fields: [createdById], references: [id])
  createdAt   DateTime @default(now())

  @@index([followUpId, createdAt])
  @@index([nextContactDate])
}
```

---

## 📋 IMPLEMENTATION PLAN

> **Estimated Timeline**: 3-4 tuần full-time

### Phase 0: Database Schema ⚡ (2-3 days)

**Priority**: 🔥 HIGHEST - Must complete first

> **Note**: Không dùng Prisma enum cho type/stage. Dùng String + validation ở app layer để linh hoạt hơn.

#### Tasks:

- [ ] Backup production database
- [ ] Update `prisma/schema.prisma`:
  - [ ] Update Customer model (add type, firstVisitDate, firstSource)
  - [ ] Update ConsultedService model (add source, stage, saleOnlineId, etc.)
  - [ ] Update Appointment model (add type, consultedServiceId)
  - [ ] Add CustomerFollowUp model
  - [ ] Add FollowUpActivity model
- [ ] Create migration: `npx prisma migrate dev --name service-based-tracking`
- [ ] Test migration on dev database
- [ ] Write data migration script (see below)
- [ ] Test data migration
- [ ] Deploy to staging
- [ ] Deploy to production

#### Data Migration Script:

```sql
-- ============================================
-- MIGRATION: Service-based Tracking
-- ============================================

BEGIN;

-- Step 1: Customer - Add new columns
ALTER TABLE "Customer"
  ADD COLUMN "type" TEXT,
  ADD COLUMN "firstVisitDate" TIMESTAMPTZ;

-- Step 2: Customer - Set type for existing records
UPDATE "Customer"
SET
  "type" = 'CUSTOMER',  -- Existing customers are all CUSTOMER type
  "firstVisitDate" = "createdAt"  -- Assume existing customers visited on creation date
WHERE "customerCode" IS NOT NULL;

-- Mark customers without customerCode as LEADs (if any)
UPDATE "Customer"
SET "type" = 'LEAD'
WHERE "customerCode" IS NULL;

-- Make type NOT NULL after setting values
ALTER TABLE "Customer"
  ALTER COLUMN "type" SET NOT NULL;

-- Note: Keep existing source, sourceNotes, serviceOfInterest columns (migrate later)

-- Step 4: ConsultedService - Add new columns
ALTER TABLE "ConsultedService"
  ADD COLUMN "source" TEXT,
  ADD COLUMN "sourceNotes" TEXT,
  ADD COLUMN "stage" TEXT,
  ADD COLUMN "saleOnlineId" TEXT,
  ADD COLUMN "lostReason" TEXT;

-- Step 5: ConsultedService - Migrate source from customer
UPDATE "ConsultedService" cs
SET
  "source" = c."source",
  "sourceNotes" = c."sourceNotes"
FROM "Customer" c
WHERE cs."customerId" = c.id;

-- Step 6: ConsultedService - Set stage based on serviceStatus
UPDATE "ConsultedService"
SET "stage" = CASE
  WHEN "serviceStatus" = 'Đã chốt' THEN 'WON'
  ELSE 'QUOTED'
END;

-- Step 7: ConsultedService - Make source and stage NOT NULL
ALTER TABLE "ConsultedService"
  ALTER COLUMN "source" SET NOT NULL,
  ALTER COLUMN "stage" SET NOT NULL;

-- Step 8: Appointment - Add new columns
ALTER TABLE "Appointment"
  ADD COLUMN "type" TEXT,
  ADD COLUMN "consultedServiceId" TEXT;

-- Set type for existing appointments
UPDATE "Appointment"
SET "type" = 'TREATMENT';  -- Assume all existing are treatment

-- Make type NOT NULL
ALTER TABLE "Appointment"
  ALTER COLUMN "type" SET NOT NULL;

-- Step 9: Add indexes
CREATE INDEX "Customer_type_clinicId_createdAt_idx" ON "Customer"("type", "clinicId", "createdAt");
CREATE INDEX "ConsultedService_source_serviceStatus_idx" ON "ConsultedService"("source", "serviceStatus");
CREATE INDEX "ConsultedService_stage_clinicId_idx" ON "ConsultedService"("stage", "clinicId");
CREATE INDEX "ConsultedService_saleOnlineId_stage_idx" ON "ConsultedService"("saleOnlineId", "stage");
CREATE INDEX "Appointment_type_clinicId_appointmentDateTime_idx" ON "Appointment"("type", "clinicId", "appointmentDateTime");

COMMIT;
```

---

### Phase 1: Backend Services (3-4 days)

#### 1.1. Validation Schemas

**Files to update:**

- `src/shared/validation/customer.schema.ts`
- `src/shared/validation/consulted-service.schema.ts`
- Create `src/shared/validation/follow-up.schema.ts`

**Tasks:**

- [ ] Add `type` field to Customer schemas
- [ ] Add `LeadCreateSchema` (loose validation: phone + name optional)
- [ ] Add `CustomerCreateSchema` (strict validation: all required)
- [ ] Add `ConvertLeadSchema` (fill missing fields)
- [ ] Keep existing `source`, `sourceNotes`, `serviceOfInterest` in schemas
- [ ] Add `source`, `stage`, `saleOnlineId` to ConsultedService schemas
- [ ] Create CustomerFollowUp & FollowUpActivity schemas

#### 1.2. Repositories

**Files to update:**

- `src/server/repos/customer.repo.ts`
- `src/server/repos/consulted-service.repo.ts`
- Create `src/server/repos/follow-up.repo.ts`

**Tasks:**

- [ ] Add `findLeads()`, `findCustomers()` methods
- [ ] Add `convertLeadToCustomer()` method
- [ ] Add `findByPhone()` for deduplication
- [ ] Update ConsultedService queries (add source, stage filters)
- [ ] Add follow-up CRUD methods
- [ ] Update sales-report queries (use `consultedService.source`)

#### 1.3. Services

**Files to update:**

- `src/server/services/customer.service.ts`
- `src/server/services/consulted-service.service.ts`
- Create `src/server/services/follow-up.service.ts`
- `src/server/services/sales-report.service.ts`
- `src/server/services/revenue-report.service.ts`

**Tasks:**

- [ ] Add lead creation logic
- [ ] Add lead conversion logic (generate customerCode)
- [ ] Add deduplication check before create
- [ ] Auto-create follow-up when ConsultedService created
- [ ] Auto-update follow-up status when service confirmed
- [ ] Update report services to use `consultedService.source`

#### 1.4. API Routes

**Tasks:**

- [ ] `POST /api/v1/leads` - Create lead
- [ ] `POST /api/v1/customers` - Create customer
- [ ] `POST /api/v1/leads/:id/convert` - Convert lead to customer
- [ ] `PATCH /api/v1/consulted-services/:id/stage` - Update pipeline stage
- [ ] `GET /api/v1/consulted-services?stage=NEW` - Filter by stage
- [ ] CRUD for `/api/v1/follow-ups`
- [ ] CRUD for `/api/v1/follow-ups/:id/activities`

---

### Phase 2: Generic Kanban Component (2-3 days)

**Goal**: Create reusable Kanban for multiple features

#### Files to create:

- `src/shared/components/Kanban/KanbanBoard.tsx`
- `src/shared/components/Kanban/KanbanColumn.tsx`
- `src/shared/components/Kanban/KanbanCard.tsx`
- `src/shared/components/Kanban/types.ts`
- `src/shared/components/Kanban/hooks/useDragDrop.ts`

#### Tasks:

- [ ] Install drag-drop library: `npm install @dnd-kit/core @dnd-kit/sortable`
- [ ] Create generic KanbanBoard component
- [ ] Props: `data`, `columns`, `groupByField`, `renderCard`, `onDragEnd`
- [ ] Add permission props: `canDrag`, `canEdit`
- [ ] Handle drag & drop events
- [ ] Responsive design (collapse to list on mobile)
- [ ] Loading & empty states
- [ ] Column statistics (count, sum)

---

### Phase 3: Sales Pipeline View (3-4 days)

**Goal**: Kanban view for ConsultedService

#### Files to create:

- `src/app/(private)/sales/pipeline/page.tsx`
- `src/features/consulted-services/views/PipelineView.tsx`
- `src/features/consulted-services/components/DealCard.tsx`
- `src/features/consulted-services/components/PipelineFilters.tsx`
- `src/features/consulted-services/hooks/usePipeline.ts`
- `src/features/consulted-services/constants/pipelineStages.ts`

#### Tasks:

- [ ] Create route `/sales/pipeline`
- [ ] Fetch consulted services grouped by `stage`
- [ ] Define stage columns:
  ```typescript
  const STAGES = [
    { key: "NEW", label: "Mới", color: "blue" },
    { key: "CONTACTED", label: "Đã liên hệ", color: "cyan" },
    { key: "CONSULTING", label: "Đang tư vấn", color: "orange" },
    { key: "QUOTED", label: "Đã báo giá", color: "purple" },
    { key: "WON", label: "Thành công", color: "green" },
    { key: "LOST", label: "Thất bại", color: "red" },
  ];
  ```
- [ ] Render KanbanBoard with DealCard
- [ ] DealCard shows: customer name, service, price, source, sale, doctor
- [ ] Handle drag & drop → Call API to update stage
- [ ] Add filters: clinic, sale, source, date range, service type
- [ ] Add column statistics (count, total revenue per stage)
- [ ] Add quick actions: Edit, Delete, View detail
- [ ] Permissions: Check who can drag/edit each card

---

### Phase 4: Lead & Customer Management (2-3 days)

#### 4.1. Customer Form Updates

**Files to update:**

- `src/features/customers/components/CustomerFormModal.tsx`
- `src/features/customers/hooks/useCustomerForm.ts`

**Tasks:**

- [ ] Add `mode` prop: `"TELESALE" | "RECEPTION" | "EDIT"`
- [ ] If mode = TELESALE:
  - Hide customerCode
  - Set type = LEAD
  - Loose validation (phone + name optional)
  - Focus on firstSource
- [ ] If mode = RECEPTION:
  - Show all fields
  - Set type = CUSTOMER
  - Auto-generate customerCode
  - Strict validation
- [ ] Update field labels: `source` → `firstSource`
- [ ] Add deduplication check before submit

#### 4.2. Lead Conversion

**Files to create:**

- `src/features/customers/components/ConvertLeadModal.tsx`
- `src/features/customers/hooks/useConvertLead.ts`

**Tasks:**

- [ ] Add "Check-in / Chuyển khách" button in Customer detail (when type = LEAD)
- [ ] Modal to fill missing required fields (address, DOB, etc.)
- [ ] Auto-generate customerCode
- [ ] Call conversion API
- [ ] Update UI after conversion
- [ ] Show success toast

#### 4.3. Deduplication Flow

**Files to create:**

- `src/features/customers/components/DuplicateCheckModal.tsx`

**Tasks:**

- [ ] When creating lead/customer, check phone existence
- [ ] If exists, show modal: "Số điện thoại đã tồn tại"
- [ ] Options:
  - View existing customer detail
  - Create new ConsultedService for existing customer
  - Cancel and re-enter
- [ ] Prevent duplicate customers

---

### Phase 5: Follow-up System (4-5 days)

#### 5.1. Follow-up List & Detail

**Files to create:**

- `src/app/(private)/follow-ups/page.tsx`
- `src/features/follow-ups/views/FollowUpListView.tsx`
- `src/features/follow-ups/components/FollowUpTable.tsx`
- `src/features/follow-ups/components/FollowUpDetailModal.tsx`
- `src/features/follow-ups/components/ActivityTimeline.tsx`
- `src/features/follow-ups/components/AddActivityModal.tsx`
- `src/features/follow-ups/hooks/useFollowUps.ts`

**Tasks:**

- [ ] Create route `/follow-ups`
- [ ] List view with filters:
  - Status: pending, in_progress, success, give_up
  - Priority: high, medium, low
  - Assigned sale
  - Next follow-up date range
  - Clinic
- [ ] Table columns: Customer, Service, Status, Priority, Next Date, Assigned Sale
- [ ] Click row → Open detail modal
- [ ] Detail modal shows:
  - Customer info (name, phone, firstSource)
  - Service info (dentalService, price, status)
  - Timeline of activities (chronological)
  - Form to add new activity
- [ ] Add activity form:
  - Type: call, sms, zalo, meeting, note
  - Result: interested, callback_later, not_interested, no_contact
  - Notes (textarea)
  - Next contact date
- [ ] Auto-create follow-up when ConsultedService created with needsFollowUp
- [ ] Auto-update follow-up status when service confirmed
- [ ] Notification for overdue follow-ups

#### 5.2. Customer Detail Integration

**Files to update:**

- `src/features/customers/views/CustomerDetailView.tsx`
- Create `src/features/customers/components/detail-tabs/FollowUpTab.tsx`

**Tasks:**

- [ ] Add "Follow-ups" tab in Customer detail
- [ ] Show all follow-ups for this customer
- [ ] Group by service (1 follow-up per service)
- [ ] Show activity timeline per follow-up
- [ ] Quick add activity button
- [ ] Highlight overdue/due today

---

### Phase 6: Reports Update (2-3 days)

#### 6.1. Sales Report Changes

**Files to update:**

- `src/server/repos/sales-report.repo.ts` (lines 449-476)
- `src/server/services/sales-report/_mappers.ts`

**Tasks:**

- [ ] Change source query from `customer.source` → `consultedService.source`
- [ ] Update KPI calculations:
  - New customers: Count unique customers where `consultedService.source = X`
  - Revenue: Sum from `consultedService` where `source = X`
  - Conversion rate: `(Won services / Total services) * 100`
- [ ] Add new metrics:
  - Average deal size per source
  - Win rate per source
  - Average time to close per source
- [ ] Test with new data

#### 6.2. Revenue Report Changes

**Files to update:**

- `src/server/repos/revenue-report.repo.ts`
- `src/server/services/revenue-report/_mappers.ts`

**Tasks:**

- [ ] Change source attribution to `consultedService.source`
- [ ] Update revenue calculations
- [ ] Add pipeline stage breakdown

#### 6.3. New Reports

**Files to create:**

- `src/features/reports/views/SourcePerformanceReport.tsx`
- `src/features/reports/views/PipelineReport.tsx`
- `src/features/reports/views/FollowUpReport.tsx`

**Tasks:**

- [ ] Source Performance Report:
  - Table: Source, New Leads, Converted, Win Rate, Revenue, ROI
  - Chart: Revenue by source (bar chart)
- [ ] Pipeline Report:
  - Funnel chart: NEW → CONTACTED → CONSULTING → QUOTED → WON
  - Conversion rates between stages
  - Average time in each stage
- [ ] Follow-up Report:
  - By sale: Assigned, Completed, Pending, Success rate
  - By priority: High/Medium/Low distribution
  - Overdue follow-ups

---

### Phase 7: Dashboard Widgets (2-3 days)

**Files to update:**

- `src/app/(private)/dashboard/page.tsx`
- Create widget components

**Tasks:**

- [ ] "My Follow-ups" widget:
  - Pending count
  - Due today count
  - Overdue count (red badge)
  - Quick link to follow-up list
- [ ] "Pipeline Summary" widget:
  - Cards showing count & value per stage
  - Quick link to pipeline view
- [ ] "Conversion Funnel" chart:
  - Lead → Customer → Service → Won
  - Conversion rates between stages
- [ ] Update "Sales by Source" widget to use service-level source
- [ ] Update "Revenue by Source" widget

---

### Phase 8: Testing (3-4 days)

#### 8.1. Unit Tests

- [ ] Customer service tests (lead creation, conversion)
- [ ] ConsultedService service tests (source assignment)
- [ ] Follow-up service tests (auto-create, auto-update)
- [ ] Validation schema tests

#### 8.2. Integration Tests

- [ ] Lead creation → Follow-up auto-created
- [ ] Lead conversion → Customer code generated, type updated
- [ ] Service confirmed → Follow-up status updated
- [ ] Drag & drop in Kanban → Stage updated in DB
- [ ] Deduplication flow

#### 8.3. E2E Tests (Playwright)

- [ ] Full lead-to-customer journey
- [ ] Sales pipeline workflow
- [ ] Follow-up workflow
- [ ] Report generation

#### 8.4. UAT (User Acceptance Testing)

- [ ] Test with Sales Online team
- [ ] Test with Reception team
- [ ] Test with Doctors
- [ ] Collect feedback
- [ ] Fix bugs

---

### Phase 9: Documentation & Training (2-3 days)

**Tasks:**

- [ ] Update API documentation (Swagger/OpenAPI)
- [ ] Create user manual (Vietnamese):
  - How to create lead (for telesale)
  - How to convert lead (for reception)
  - How to use pipeline view (for sales)
  - How to use follow-up system (for sales + doctors)
- [ ] Record training videos:
  - Lead management workflow
  - Sales pipeline walkthrough
  - Follow-up system usage
- [ ] Create FAQ document
- [ ] Conduct training sessions with users

---

### Phase 10: Deployment (1-2 days)

#### 10.1. Pre-deployment

- [ ] Code review
- [ ] Run all tests
- [ ] Performance testing (load test with sample data)
- [ ] Security audit (check permissions)
- [ ] Backup production database (CRITICAL)

#### 10.2. Deployment

- [ ] Deploy to staging
- [ ] Run smoke tests on staging
- [ ] Data migration dry run on staging
- [ ] Deploy to production (off-peak hours)
- [ ] Run database migrations
- [ ] Run data migration script
- [ ] Verify all features work
- [ ] Check reports accuracy

#### 10.3. Post-deployment

- [ ] Monitor system performance (response times, errors)
- [ ] Monitor database query performance
- [ ] Collect user feedback
- [ ] Fix critical bugs immediately
- [ ] Schedule follow-up training sessions
- [ ] Plan for Phase 2 features (Timeline, Gantt, Advanced permissions)

---

## 📅 TIMELINE SUMMARY

| Phase                  | Duration | Start After   |
| ---------------------- | -------- | ------------- |
| Phase 0: Schema        | 2-3 days | None          |
| Phase 1: Backend       | 3-4 days | Phase 0       |
| Phase 2: Kanban UI     | 2-3 days | Phase 0       |
| Phase 3: Pipeline View | 3-4 days | Phase 1, 2    |
| Phase 4: Lead/Customer | 2-3 days | Phase 1       |
| Phase 5: Follow-up     | 4-5 days | Phase 1, 3    |
| Phase 6: Reports       | 2-3 days | Phase 1       |
| Phase 7: Dashboard     | 2-3 days | Phase 3, 5, 6 |
| Phase 8: Testing       | 3-4 days | All above     |
| Phase 9: Training      | 2-3 days | Phase 8       |
| Phase 10: Deployment   | 1-2 days | Phase 9       |

**Total: 26-37 days (3.5-5 weeks) full-time**

---

## 🎯 PRIORITY MATRIX

### ⚡ MUST HAVE (MVP)

1. Phase 0: Database schema changes
2. Phase 1: Backend services & APIs
3. Phase 3: Sales Pipeline Kanban view
4. Phase 6: Reports update (source attribution)

### 🟡 SHOULD HAVE

5. Phase 4: Lead management (telesale workflow)
6. Phase 5: Follow-up system
7. Phase 7: Dashboard widgets

### 🟢 NICE TO HAVE

8. Phase 2: Generic reusable Kanban (can use simple version first)
9. Timeline/Gantt views (future enhancement)
10. CASL/RBAC advanced permissions (future)
11. AI-powered follow-up suggestions (future)

---

## ⚠️ CRITICAL SUCCESS FACTORS

1. **✅ DO**: Làm theo thứ tự Phase (không nhảy cóc)
2. **✅ DO**: Test kỹ sau mỗi Phase trước khi sang Phase tiếp
3. **✅ DO**: Commit code thường xuyên với clear messages
4. **✅ DO**: Backup database trước mọi migration
5. **✅ DO**: Test migration script on staging first
6. **❌ DON'T**: Làm nhiều Phase cùng lúc
7. **❌ DON'T**: Skip testing
8. **❌ DON'T**: Deploy trực tiếp lên production without staging
9. **❌ DON'T**: Edit migration files after they've been applied

---

## 🔍 COMPARISON: Gemini vs GitHub Copilot Recommendations

### ✅ ALIGNED (Both Agree)

| Aspect               | Consensus                                           |
| -------------------- | --------------------------------------------------- |
| Source Tracking      | Service-level (ConsultedService.source) ✅          |
| Lead + Customer      | Merge into 1 model with type field ✅               |
| Follow-up Logic      | BY CUSTOMER, link to consultedServiceId ✅          |
| Sales Opportunity    | ConsultedService = Opportunity ✅                   |
| Kanban View          | Display layer only, no separate tables ✅           |
| Appointment Type     | Add CONSULTATION vs TREATMENT enum ✅               |
| Multiple Sales Roles | saleOnlineId, consultingSaleId, treatingDoctorId ✅ |

### 🔄 ADDITIONAL INSIGHTS FROM GEMINI

1. **Smart Container + Dumb Component Pattern**:

   - Gemini emphasized: Views (smart containers) should fetch data & handle business logic
   - Components (dumb) should only handle UI & emit events
   - Benefit: Reusability, easier testing

2. **Permission Handling**:

   - Pass `canDrag`, `canEdit` props to dumb components
   - Don't embed permission logic inside UI components
   - Keep RBAC in services/hooks

3. **Generic Kanban Design**:

   - Make it reusable for multiple features (not just sales pipeline)
   - Future: Can use for Treatment Care, Labo Orders, etc.

4. **Phased Implementation**:
   - Gemini suggested more detailed phases (0-5)
   - Emphasis on database schema first (Phase 0)
   - Then dumb components (Phase 1-2)
   - Then smart containers (Phase 3-5)

### 🆕 NEW CONSIDERATIONS (From Gemini)

1. **Timeline/Gantt View**:

   - Nice-to-have feature for visualizing appointments over time
   - Can be implemented in Phase 2 (after MVP)

2. **CASL/RBAC**:

   - Advanced permission library
   - Can be added later, don't block MVP

3. **Multiple Activities per Follow-up**:

   - Clear design: CustomerFollowUp has many FollowUpActivity
   - Activities can mention multiple services in notes

4. **Auto-reassignment Logic**:
   - When ConsultedService sale changes, update follow-up assignee
   - But respect manual reassignments (flag: `manuallyReassigned`)

---

## 🚀 NEXT STEPS

### Immediate Actions:

1. **Review this plan** - Confirm alignment with your vision
2. **Start Phase 0** - Database schema changes (highest priority)
3. **Set up staging environment** - If not already exists
4. **Prepare test data** - For migration verification

### Questions to Confirm:

- [ ] Timeline acceptable? (3.5-5 weeks)
- [ ] Priority order correct? (Phase 0 → 1 → 3 → 6 as MVP)
- [ ] Any features to add/remove?
- [ ] Ready to start Phase 0 schema changes?

---

**📞 BẠN SẴN SÀNG BẮT ĐẦU VỚI PHASE 0 CHƯA?**

Nếu OK, tôi sẽ:

1. Backup toàn bộ schema hiện tại
2. Update `prisma/schema.prisma` với tất cả thay đổi
3. Generate migration script
4. Tạo data migration SQL
5. Test trên dev database

Xác nhận để bắt đầu! 🎯
