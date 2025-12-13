# 🎯 Phase 0.1.2: Lead Management System - New Feature

> **Date**: 2025-12-13  
> **Status**: 📝 PROPOSAL - Waiting for approval  
> **Parent**: 119 FINAL Implementation Plan  
> **Dependencies**: 120.1 Customer Updates (must be deployed first)  
> **Scope**: Complete new Lead feature with separate backend and frontend

---

## 📊 OVERVIEW

Implement **Lead management system** - tính năng mới hoàn toàn cho Sale Online/Telesale workflow.

**Goals:**

1. ✅ Use Customer table with `type="LEAD"` (shared table, separate logic)
2. ✅ Create complete `leadService` (works with `type="LEAD"`)
3. ✅ Build Lead management workflow (telesale) - Frontend `/leads/daily`
4. ✅ Separate from Customer feature completely
5. ✅ Phone duplicate validation (check both LEAD and CUSTOMER)

### Business Logic Flow

**LEAD Creation (Telesale):**

- ☎️ Telesale nhận lead từ marketing channels (Facebook, Google, etc.)
- 📞 **Bắt buộc**: phone, fullName, city
- ❓ **Chưa biết** khách sẽ đến phòng khám nào → `clinicId = NULL` (không sử dụng, không hiển thị trong form)
- 🎯 Lưu vào Customer table với `type = "LEAD"` để follow up sau

**Lead Assignment:**

- 🏪 Lead **không sử dụng** `clinicId` (luôn NULL - chưa xác định clinic, không hiển thị trong form)
- 📞 Sale tư vấn qua điện thoại, chưa biết khách đến cơ sở nào

**Convert to CUSTOMER (Check-in):**

- ✅ Khách xác nhận đến phòng khám → **MUST** specify `clinicId`
- � **Update** record: `type = "CUSTOMER"`
- 🎫 Auto-generate `customerCode`
- 📅 Set `firstVisitDate`
- ✅ Same record, just change type

---

## 🗄️ DATABASE CONTEXT

**Reference:** See [120.1 Customer Updates.md](120.1%20Customer%20Updates.md) for complete schema changes and migration.

### Customer Model (Lead Context)

Lead uses Customer table with these field constraints:

| Field            | LEAD Value                |
| ---------------- | ------------------------- |
| `type`           | `"LEAD"`                  |
| `phone`          | Required                  |
| `city`           | Required                  |
| `fullName`       | Required                  |
| `customerCode`   | NULL                      |
| `firstVisitDate` | NULL                      |
| `clinicId`       | NULL (not used/not shown) |
| `source`         | Optional                  |
| `sourceNotes`    | Optional                  |
| `note`           | Optional                  |

**Key Points:**

- Schema migration done in [120.1 Customer Updates.md](120.1%20Customer%20Updates.md)
- Lead backend filters by `type="LEAD"`
- Lead doesn't use `clinicId`, `customerCode`, `firstVisitDate` fields

## 🔧 BACKEND CHANGES

### 1. New Lead Validation Schemas (`src/shared/validation/lead.schema.ts`)

```typescript
import { z } from "zod";
import { CustomerResponseSchema } from "@/shared/validation/customer.schema";
import type { CustomerResponse } from "@/shared/validation/customer.schema";

// ⭐ Lead Create Schema
export const LeadCreateSchema = z.object({
  phone: z.string().min(10).max(15), // REQUIRED
  fullName: z.string().min(1), // REQUIRED
  city: z.string().min(1), // REQUIRED - Backend validation (nullable in DB)
  note: z.string().optional(),
  source: z.string().optional(),
  sourceNotes: z.string().optional(),
  serviceOfInterest: z.string().optional(),
  primaryContactId: z.string().uuid().optional(),
  primaryContactRole: z.string().optional(),
  // clinicId: Always NULL for LEAD - not in schema
});

export type LeadCreateInput = z.infer<typeof LeadCreateSchema>;

// ⭐ Lead Update Schema
export const LeadUpdateSchema = z.object({
  phone: z.string().min(10).max(15).optional(),
  fullName: z.string().min(1).optional(),
  city: z.string().optional(),
  note: z.string().optional(),
  source: z.string().optional(),
  sourceNotes: z.string().optional(),
  serviceOfInterest: z.string().optional(),
  primaryContactId: z.string().uuid().optional(),
  primaryContactRole: z.string().optional(),
  // clinicId: Cannot be changed for LEAD (always NULL)
});

export type LeadUpdateInput = z.infer<typeof LeadUpdateSchema>;

// ⭐ Lead Response Schema
// ✅ NO NEED to create separate schema - just reuse CustomerResponseSchema!
// Both LEAD and CUSTOMER use the same table, same fields, same schema.
// The only difference is field VALUES based on `type`:
// - LEAD: customerCode=null, firstVisitDate=null, clinicId=null
// - CUSTOMER: customerCode=auto-generated, firstVisitDate=auto-set, clinicId=required

export type LeadResponse = CustomerResponse; // ✅ Same as CustomerResponse

// ⭐ Convert Lead to Customer Schema
export const ConvertLeadSchema = z.object({
  // From Lead (pre-filled, already required)
  phone: z.string().min(10).max(15),
  fullName: z.string().min(1), // REQUIRED (inherited from Lead)
  city: z.string().min(1), // REQUIRED - Backend validation

  // Additional Customer fields
  clinicId: z.string().uuid(), // REQUIRED
  dateOfBirth: z.coerce.date().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
  email: z.string().email().optional(),
  // Primary Contact (preserved from Lead)
  primaryContactId: z.string().uuid().optional(),
  primaryContactRole: z.string().optional(),
  // ... other Customer fields
});

export type ConvertLeadInput = z.infer<typeof ConvertLeadSchema>;
```

---

### 2. New Lead Repository (`src/server/repos/lead.repo.ts`)

> **Note**: Works with Customer table, filters by `type="LEAD"`

```typescript
import { prisma } from "@/server/db";
import type { Prisma } from "@prisma/client";

export const leadRepo = {
  // Create Lead (type="LEAD")
  async create(data: Prisma.CustomerCreateInput) {
    return prisma.customer.create({
      data: {
        ...data,
        type: "LEAD", // Always LEAD
        customerCode: null, // NULL for LEAD
        firstVisitDate: null, // NULL for LEAD
        clinicId: null, // NULL for LEAD (no clinic assigned)
      },
      include: {
        clinic: { select: { id: true, name: true, code: true } },
        createdBy: { select: { id: true, fullName: true } },
      },
    });
  },

  // Find Lead by ID
  async findById(id: string) {
    return prisma.customer.findFirst({
      where: {
        id,
        type: "LEAD", // Filter by type
      },
      include: {
        clinic: { select: { id: true, name: true, code: true } },
        createdBy: { select: { id: true, fullName: true } },
        updatedBy: { select: { id: true, fullName: true } },
      },
    });
  },

  // Find Lead by phone
  async findByPhone(phone: string) {
    return prisma.customer.findFirst({
      where: {
        phone,
        type: "LEAD", // Filter by type
      },
      include: {
        clinic: { select: { id: true, name: true, code: true } },
      },
    });
  },

  // List Leads with filters
  async list(params: {
    search?: string;
    page: number;
    pageSize: number;
    sortField?: string;
    sortDirection?: "asc" | "desc";
  }) {
    const where: Prisma.CustomerWhereInput = {
      type: "LEAD", // Always filter LEAD
    };

    if (params.search) {
      where.OR = [
        { phone: { contains: params.search, mode: "insensitive" } },
        { fullName: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          clinic: { select: { id: true, name: true, code: true } },
          createdBy: { select: { id: true, fullName: true } },
        },
        orderBy: {
          [params.sortField || "createdAt"]: params.sortDirection || "desc",
        },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      prisma.customer.count({ where }),
    ]);

    return { items, total };
  },

  // Update Lead
  async update(id: string, data: Prisma.CustomerUpdateInput) {
    return prisma.customer.update({
      where: { id },
      data,
      include: {
        clinic: { select: { id: true, name: true, code: true } },
        updatedBy: { select: { id: true, fullName: true } },
      },
    });
  },

  // Delete Lead
  async delete(id: string) {
    return prisma.customer.delete({
      where: { id },
    });
  },
};
```

---

---

### 3. New Lead Service (`src/server/services/lead.service.ts`)

```typescript
import { leadRepo } from "@/server/repos/lead.repo";
import { customerRepo } from "@/server/repos/customer.repo";
import { customerService } from "./customer.service";
import {
  LeadCreateSchema,
  LeadUpdateSchema,
  ConvertLeadSchema,
} from "@/shared/validation/lead.schema";
import { ServiceError } from "@/server/utils/errors";
import type { UserCore } from "@/server/utils/sessionCache";

export const leadService = {
  // Create Lead
  async create(currentUser: UserCore | null, body: unknown) {
    if (!currentUser?.employeeId) {
      throw new ServiceError("UNAUTHORIZED", "Unauthorized", 401);
    }

    const parsed = LeadCreateSchema.safeParse(body);
    if (!parsed.success) {
      throw new ServiceError(
        "VALIDATION_ERROR",
        "Invalid input",
        400,
        parsed.error
      );
    }

    const data = parsed.data;

    // Check phone duplicate (both Lead and Customer)
    const [existingLead, existingCustomer] = await Promise.all([
      leadRepo.findByPhone(data.phone),
      customerRepo.findByPhone(data.phone),
    ]);

    if (existingLead) {
      throw new ServiceError(
        "PHONE_EXISTS",
        "Số điện thoại đã tồn tại trong danh sách Lead",
        409,
        { existingLead }
      );
    }

    if (existingCustomer) {
      throw new ServiceError(
        "PHONE_EXISTS",
        "Số điện thoại đã tồn tại trong danh sách Khách hàng",
        409,
        { existingCustomer }
      );
    }

    // Create Lead
    const lead = await leadRepo.create({
      ...data,
      createdById: currentUser.employeeId,
      updatedById: currentUser.employeeId,
    });

    return lead;
  },

  // Get by ID
  async getById(currentUser: UserCore | null, id: string) {
    const lead = await leadRepo.findById(id);
    if (!lead) {
      throw new ServiceError("NOT_FOUND", "Lead not found", 404);
    }
    return lead;
  },

  // List Leads
  async list(currentUser: UserCore | null, query: unknown) {
    // Parse query params (page, pageSize, search)
    const result = await leadRepo.list({
      search: query.search,
      page: query.page || 1,
      pageSize: query.pageSize || 10,
      sortField: query.sortField,
      sortDirection: query.sortDirection,
    });

    return result;
  },

  // Update Lead
  async update(currentUser: UserCore | null, id: string, body: unknown) {
    if (!currentUser?.employeeId) {
      throw new ServiceError("UNAUTHORIZED", "Unauthorized", 401);
    }

    const parsed = LeadUpdateSchema.safeParse(body);
    if (!parsed.success) {
      throw new ServiceError(
        "VALIDATION_ERROR",
        "Invalid input",
        400,
        parsed.error
      );
    }

    const lead = await leadRepo.findById(id);
    if (!lead) {
      throw new ServiceError("NOT_FOUND", "Lead not found", 404);
    }

    // Check if already converted to CUSTOMER
    if (lead.type === "CUSTOMER") {
      throw new ServiceError(
        "ALREADY_CONVERTED",
        "Lead đã được chuyển thành Khách hàng, không thể sửa",
        400
      );
    }

    const updated = await leadRepo.update(id, {
      ...parsed.data,
      updatedById: currentUser.employeeId,
    });

    return updated;
  },

  // Convert Lead to Customer (type: LEAD → CUSTOMER)
  async convertToCustomer(
    currentUser: UserCore | null,
    leadId: string,
    body: unknown
  ) {
    if (!currentUser?.employeeId) {
      throw new ServiceError("UNAUTHORIZED", "Unauthorized", 401);
    }

    const parsed = ConvertLeadSchema.safeParse(body);
    if (!parsed.success) {
      throw new ServiceError(
        "VALIDATION_ERROR",
        "Invalid input",
        400,
        parsed.error
      );
    }

    const lead = await leadRepo.findById(leadId);
    if (!lead) {
      throw new ServiceError("NOT_FOUND", "Lead not found", 404);
    }

    // ⭐ Generate Customer Code
    const customerCode = await generateCustomerCode(parsed.data.clinicId);

    // ⭐ Update: type LEAD → CUSTOMER
    const customer = await prisma.customer.update({
      where: { id: leadId },
      data: {
        type: "CUSTOMER", // ⭐ Change type
        customerCode, // ⭐ Generate code
        fullName: parsed.data.fullName, // ⭐ Required for Customer
        clinicId: parsed.data.clinicId, // ⭐ Required for Customer
        firstVisitDate: new Date(), // ⭐ Set first visit date
        updatedById: currentUser.employeeId,
        updatedAt: new Date(),
      },
      include: {
        clinic: { select: { id: true, name: true, code: true } },
        createdBy: { select: { id: true, fullName: true } },
        updatedBy: { select: { id: true, fullName: true } },
      },
    });

    return customer;
  },

  // Delete Lead
  async delete(currentUser: UserCore | null, id: string) {
    if (!currentUser?.employeeId) {
      throw new ServiceError("UNAUTHORIZED", "Unauthorized", 401);
    }

    const lead = await leadRepo.findById(id);
    if (!lead) {
      throw new ServiceError("NOT_FOUND", "Lead not found", 404);
    }

    await leadRepo.delete(id);
    return { success: true };
  },
};
```

---

---

### 4. New Lead Server Actions (`src/server/actions/lead.actions.ts`)

```typescript
"use server";

import { getSessionUser } from "@/server/utils/sessionCache";
import { leadService } from "@/server/services/lead.service";
import type {
  LeadCreateInput,
  LeadUpdateInput,
  ConvertLeadInput,
} from "@/shared/validation/lead.schema";

/**
 * Create new lead (telesale workflow)
 */
export async function createLeadAction(data: LeadCreateInput) {
  const user = await getSessionUser();
  return await leadService.create(user, data);
}

/**
 * Get lead by ID
 */
export async function getLeadAction(id: string) {
  const user = await getSessionUser();
  return await leadService.getById(user, id);
}

/**
 * Update existing lead
 */
export async function updateLeadAction(id: string, data: LeadUpdateInput) {
  const user = await getSessionUser();
  return await leadService.update(user, id, data);
}

/**
 * Convert lead to customer (check-in workflow)
 */
export async function convertLeadToCustomerAction(
  leadId: string,
  data: ConvertLeadInput
) {
  const user = await getSessionUser();
  return await leadService.convertToCustomer(user, leadId, data);
}

/**
 * Delete lead (only if not converted)
 */
export async function deleteLeadAction(id: string) {
  const user = await getSessionUser();
  return await leadService.delete(user, id);
}
```

---

### 5. New Lead API Routes (`src/app/api/v1/leads/route.ts`)

> **Note**: Chỉ có GET routes cho queries. Mutations dùng Server Actions.

```typescript
import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/utils/sessionCache";
import { leadService } from "@/server/services/lead.service";

/**
 * GET /api/v1/leads
 * List leads with filters
 */
export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams);

    const data = await leadService.list(user, query);

    return NextResponse.json(data, { status: 200 });
  } catch (e: unknown) {
    // ... error handling
  }
}
```

**Get Lead by ID route:** `src/app/api/v1/leads/[id]/route.ts`

```typescript
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    const data = await leadService.getById(user, params.id);
    return NextResponse.json(data, { status: 200 });
  } catch (e: unknown) {
    // ... error handling
  }
}
```

---

## 🎨 FRONTEND CHANGES

### 1. New Lead Feature (`src/features/leads/`)

**Complete separation from Customer feature**

#### Directory Structure

```
src/features/leads/
├── components/
│   ├── LeadStatistics.tsx     // Statistics cards
│   ├── LeadFilters.tsx        // Search and filters
│   ├── LeadTable.tsx          // Lead list table
│   ├── CreateLeadModal.tsx    // Create lead
│   ├── UpdateLeadModal.tsx    // Edit lead
│   └── ConvertLeadModal.tsx   // Convert to customer
├── views/
│   ├── LeadDailyView.tsx      // Main daily view
│   └── LeadDetailView.tsx     // Single lead detail
├── hooks/
│   ├── useLeads.ts            // List leads query
│   ├── useLeadStats.ts        // Statistics query
│   ├── useLeadMutation.ts     // Create/update/delete
│   └── useConvertLead.ts      // Convert to customer
├── api.ts                     // Query functions (GET)
└── constants.ts               // Lead-specific constants
```

---

### 2. Main View Structure (`/leads/daily`)

**Route:** `/leads/daily` - Role: Sale Online, Telesale

#### 🎨 UI Wireframe

```
┌─────────────────────────────────────────────────────────────────────┐
│ 📋 Quản lý Lead                                    [Tạo Lead +]      │
│                                                                      │
│ [📅 Hôm nay ▼] [Từ: 13/12/2025] → [Đến: 13/12/2025]                │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ 📊 Tổng Lead     │ │ ✅ Đã chuyển     │ │ ⏳ Chờ xử lý     │
│                  │ │                  │ │                  │
│    245           │ │    87            │ │    158           │
│ +12 hôm nay      │ │ +5 hôm nay       │ │ +7 hôm nay       │
└──────────────────┘ └──────────────────┘ └──────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ Bộ lọc                                                               │
│                                                                      │
│ [🔍 Tìm SĐT hoặc tên...]                                            │
│                                                                      │
│ Trạng thái: [Tất cả ▼]  Nguồn: [Tất cả ▼]  Tỉnh/TP: [Tất cả ▼]    │
│                                                                      │
│                                          [Đặt lại] [Lọc]            │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ SĐT          │ Họ tên      │ Tỉnh/TP  │ Nguồn    │ TT   │ Ngày tạo  │
├─────────────────────────────────────────────────────────────────────┤
│ 0912345678   │ Nguyễn Văn A│ TP.HCM   │ Facebook │ LEAD │ 13/12     │ [✏️] [🗑️]
│ 0987654321   │ Trần Thị B  │ Hà Nội   │ Google   │ KH   │ 12/12     │ [-] [-]
│ 0909123456   │ Lê Văn C    │ Đà Nẵng  │ Zalo     │ LEAD │ 13/12     │ [✏️] [🗑️]
│ ...          │ ...         │ ...      │ ...      │ ...  │ ...       │
└─────────────────────────────────────────────────────────────────────┘
                                                    ← 1 2 3 ... 10 →
```

**Layout Components (theo cấu trúc standard):**

1. **Header with Date Range**

   - RangePicker với presets: Hôm nay, 7 ngày, 30 ngày
   - Button "Tạo Lead" (primary)

2. **Statistics Cards** (`LeadStatistics`)

   - Card 1: Tổng Lead (total + todayNew)
   - Card 2: Đã chuyển khách (converted + todayConverted)
   - Card 3: Chờ xử lý (pending)

3. **Filters Section** (`LeadFilters`)

   - Search input: Số điện thoại hoặc tên
   - Dropdown: Trạng thái (LEAD/CUSTOMER)
   - Dropdown: Nguồn (Facebook, Google, Zalo, Website, Referral, Other)
   - Dropdown: Tỉnh/Thành phố
   - Buttons: Đặt lại, Lọc

4. **Table** (`LeadTable`)
   - Columns: SĐT, Họ tên, Tỉnh/TP, Nguồn, Trạng thái, Ngày tạo, Thao tác
   - Actions: Sửa (disabled if converted), Xóa (disabled if converted)
   - ⚠️ **NO Clinic column** (LEADs don't have clinic)

#### 🎨 CreateLeadModal / UpdateLeadModal UI

```
┌────────────────────────────────────────────────────────────────────────┐
│ ➕ Tạo Lead mới                                                    [✖]  │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Row 1: Họ và tên (full width)                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ Họ và tên *                                                       │ │
│  │ [Nguyễn Văn A_______________________________________________]     │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  Row 2: Phone (8 cols) | City (8 cols) | District (8 cols)            │
│  ┌─────────────────────┬─────────────────────┬───────────────────────┐ │
│  │ Số điện thoại *     │ Tỉnh/Thành phố *    │ Quận/Huyện *          │ │
│  │ [0912345678_______] │ [TP. HCM ▼________] │ [Quận 1 ▼_________]   │ │
│  └─────────────────────┴─────────────────────┴───────────────────────┘ │
│  ⚠️  SĐT đã tồn tại: LEAD - Nguyễn Văn B (0912345678)                  │
│  [Xem thông tin] [Cập nhật lead này]                                   │
│                                                                         │
│  Row 3: Source (8 cols) | Source Notes (16 cols)                       │
│  ┌─────────────────────┬───────────────────────────────────────────┐   │
│  │ Nguồn               │ Ghi chú nguồn                             │   │
│  │ [Facebook ▼_______] │ [Link FB post hoặc mã chiến dịch...____] │   │
│  └─────────────────────┴───────────────────────────────────────────┘   │
│                                                                         │
│  Row 4: Service of Interest (12 cols) | Note (12 cols)                 │
│  ┌───────────────────────────────┬─────────────────────────────────┐   │
│  │ Dịch vụ quan tâm              │ Ghi chú                         │   │
│  │ [Niềng răng ▼_______________] │ [_____________________________] │   │
│  └───────────────────────────────┴─────────────────────────────────┘   │
│                                                                         │
│                                          [Hủy]  [Tạo Lead]             │
└────────────────────────────────────────────────────────────────────────┘

**Form Layout (following CustomerFormModal pattern):**
- Modal width: 65% viewport
- Max body height: 60vh with scroll
- Grid: Row with gutter={12}, Col with responsive sizes (xs, lg)
- Row 1: fullName (24 cols full width)
- Row 2: phone (8 cols) | city (8 cols) | district (8 cols)
- Row 3: source (8 cols) | sourceNotes (16 cols)
- Row 4: serviceOfInterest (12 cols) | note (12 cols)
```

**CreateLeadModal / UpdateLeadModal Fields:**

- Phone (required)
- Full Name (required)
- City (required)
- Source, Source Notes, Service of Interest, Note (optional)
- ⚠️ **Clinic field NOT shown** (always NULL for LEAD)
- Phone duplicate check: Block submit if exists

**Server Actions:**

- `createLeadAction()` - Create new lead
- `updateLeadAction()` - Update existing lead
- `deleteLeadAction()` - Delete lead (only if not converted)

---

---

### 3. Permissions (`src/shared/permissions/lead.permissions.ts`)

```typescript
export const leadPermissions = {
  canCreateLead: (user: UserCore) =>
    ["admin", "sale_online", "telesale"].includes(user.role),
  canUpdateLead: (user: UserCore) =>
    ["admin", "sale_online", "telesale"].includes(user.role),
  canDeleteLead: (user: UserCore) => ["admin"].includes(user.role),
  canConvertLead: (user: UserCore) =>
    ["admin", "reception", "sale_offline"].includes(user.role),
};
```

---

### 4. Key Feature Characteristics

**Lead Feature (`/leads/daily`):**

- **User Role**: Sale Online, Telesale
- **Model**: Customer table with `type="LEAD"`
- **List Query**: `GET /api/v1/leads`
- **Create Action**: `createLeadAction()`
- **Required Fields**: phone, fullName, city
- **Optional Fields**: source, sourceNotes, serviceOfInterest, note
- **Clinic Field**: NULL (not used, not shown in form)
- **Customer Code**: NULL (no code for leads)
- **After Create**: Stay in `/leads/daily`

**Convert to Customer:**

- Handled by Reception in Customer feature
- See [120.1 Customer Updates.md](120.1%20Customer%20Updates.md)

---

### 5. Phone Duplicate Handling

**In Lead Form (CreateLeadModal/UpdateLeadModal):**

- Check phone exists in both LEAD and CUSTOMER tables
- Block submit if duplicate found
- Show alert with "Xem thông tin" or "Cập nhật lead này" actions

**Backend Validation:**

```typescript
// leadService.create() checks both tables
const [existingLead, existingCustomer] = await Promise.all([
  leadRepo.findByPhone(data.phone),
  customerRepo.findByPhone(data.phone),
]);

if (existingLead || existingCustomer) {
  throw new ServiceError("PHONE_EXISTS", "...", 409);
}
```

**Backend Safety Net:**

```typescript
// Both leadService.create() and customerService.create()
const existing = await customerRepo.findByPhone(data.phone);
if (existing) {
  throw new ServiceError("PHONE_EXISTS", "Số điện thoại đã tồn tại", 409);
}
```

---

### 6. Type Inference

> **Note**: All types inferred from Zod schemas (single source of truth)

```typescript
import type {
  LeadCreateInput,
  LeadUpdateInput,
  LeadResponse,
  ConvertLeadInput,
} from "@/shared/validation/lead.schema";
import type { CustomerResponse } from "@/shared/validation/customer.schema";
```

---

### 7. Implementation Summary

**New Components:**

- `LeadStatistics.tsx` - Statistics cards (Total, Converted, Pending)
- `LeadFilters.tsx` - Filter form (Search, Status, Source, City)
- `LeadTable.tsx` - Lead listing table
- `CreateLeadModal.tsx` - Create lead form
- `UpdateLeadModal.tsx` - Edit lead form
- `LeadDailyView.tsx` - Main daily view combining all components
- `LeadDetailView.tsx` - Single lead detail page

**Patterns to Follow:**

- View structure: `CustomerDailyView`, `AppointmentDailyView`, `TreatmentLogDailyView`
- Component naming: `[Feature]Statistics`, `Create[Feature]Modal`, `[Feature]DailyView`
- Form handling: react-hook-form + Zod validation
- Data fetching: @tanstack/react-query
- Phone duplicate: Check both LEAD and CUSTOMER tables
- Action restrictions: Disable edit/delete for converted leads (type=CUSTOMER)

**Customer Feature Updates:**

- See [120.1 Customer Updates.md](120.1%20Customer%20Updates.md) for:
  - Phone search integration
  - ConvertLeadModal component
  - Table column updates
  - Detail view updates

---

## 🧪 TESTING STRATEGY

### Unit Tests

```typescript
// lead.service.test.ts
describe("LeadService", () => {
  it("should create lead", async () => {
    const lead = await leadService.create(user, {
      phone: "0912345678",
      city: "Hồ Chí Minh",
    });

    expect(lead.phone).toBe("0912345678");
    expect(lead.type).toBe("LEAD");
  });

  it("should block duplicate phone", async () => {
    await expect(
      leadService.create(user, { phone: "0912345678" })
    ).rejects.toThrow("PHONE_EXISTS");
  });

  it("should prevent editing converted leads", async () => {
    // Lead converted to customer
    const converted = { ...lead, type: "CUSTOMER" };

    await expect(
      leadService.update(user, converted.id, { fullName: "New Name" })
    ).rejects.toThrow("ALREADY_CONVERTED");
  });
});
```

**Convert Feature Tests:**

See [120.1 Customer Updates.md](120.1%20Customer%20Updates.md) for `convertLeadToCustomer` tests.

---

## 📦 ROLLOUT PLAN

**Prerequisites:**

- [ ] Deploy [120.1 Customer Updates.md](120.1%20Customer%20Updates.md) FIRST
- [ ] Verify Customer schema migration completed
- [ ] Backup production database

### Phase 1: Backend (Day 1)

- [ ] Implement Lead schemas (`lead.schema.ts`)
- [ ] Implement Lead repo (`lead.repo.ts`)
- [ ] Implement Lead service (`lead.service.ts`)
- [ ] Implement Lead server actions (`lead.actions.ts`)
- [ ] Add API routes (`/api/v1/leads/`)
- [ ] Write unit tests
- [ ] Deploy backend

**Verification:**

```sql
-- Check data integrity
SELECT type, COUNT(*) FROM "Customer" GROUP BY type;

-- Test Lead query
SELECT * FROM "Customer" WHERE "type" = 'LEAD' LIMIT 5;
```

### Phase 2: Frontend (Day 2)

- [ ] Create Lead feature directory (`src/features/leads/`)
- [ ] Implement components (Statistics, Filters, Table, Modals)
- [ ] Implement views (LeadDailyView, LeadDetailView)
- [ ] Implement hooks (useLeads, useLeadStats, useLeadMutation)
- [ ] Add route `/leads/daily` to app router
- [ ] Deploy frontend

### Phase 3: Testing & Monitoring (Day 3-7)

- [ ] Test Lead creation workflow
- [ ] Test phone duplicate validation
- [ ] Test edit/delete restrictions for converted leads
- [ ] Monitor error logs
- [ ] User feedback
- [ ] Performance monitoring

---

## 📋 IMPLEMENTATION CHECKLIST

**Before Starting:**

- [ ] Approve this design document
- [ ] Deploy [120.1 Customer Updates.md](120.1%20Customer%20Updates.md) first
- [ ] Confirm Lead workflow requirements
- [ ] Backup production database

**Backend Implementation:**

- [ ] Lead validation schemas (`lead.schema.ts`)
- [ ] Lead repository (`lead.repo.ts`)
- [ ] Lead service (`lead.service.ts`)
- [ ] Lead server actions (`lead.actions.ts`)
- [ ] Lead API routes (`/api/v1/leads/`)
- [ ] Unit tests

**Frontend Implementation:**

- [ ] Lead components (Statistics, Filters, Table, Modals)
- [ ] Lead views (DailyView, DetailView)
- [ ] Lead hooks (useLeads, useLeadStats, useLeadMutation)
- [ ] Lead API client (`api.ts`)
- [ ] Route setup (`/leads/daily`)
- [ ] Permissions integration

**Testing:**

- [ ] Unit tests (service, repo)
- [ ] Integration tests (API routes, actions)
- [ ] E2E tests (create → edit → delete workflows)
- [ ] Phone duplicate validation tests

**Deployment:**

- [ ] Deploy to staging
- [ ] Test all Lead workflows
- [ ] Deploy to production
- [ ] Monitor logs and performance

---

## 🚀 SUMMARY

**Scope:** Complete new Lead feature for telesale workflow

**Dependencies:** [120.1 Customer Updates.md](120.1%20Customer%20Updates.md) must be deployed first

**Estimated time:** 2-3 days

**Key Deliverables:**

- Lead management at `/leads/daily`
- Phone duplicate validation across LEAD and CUSTOMER
- Backend services using Customer table with `type="LEAD"`
- Separate from Customer feature completely

**READY TO IMPLEMENT?** 🚀
