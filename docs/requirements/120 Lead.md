# 🎯 Phase 0.1.2: Lead Management System - New Feature

> **Date**: 2025-12-13  
> **Status**: ✅ COMPLETED - Lead management and conversion fully implemented  
> **Parent**: 119 FINAL Implementation Plan  
> **Dependencies**: 120.1 Customer Updates ✅ COMPLETED  
> **Scope**: Complete Lead feature with backend service and ConvertLeadModal integration

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

  // List Leads for daily view
  async listDaily(params: {
    date: string; // YYYY-MM-DD format
    search?: string;
    page?: number;
    pageSize?: number;
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

  // List Leads for daily view
  async listDaily(currentUser: UserCore | null, query: unknown) {
    // Parse query params (date, search, page, pageSize)
    const result = await leadRepo.listDaily({
      date: query.date || new Date().toISOString().split("T")[0], // Default to today
      search: query.search,
      page: query.page || 1,
      pageSize: query.pageSize || 100, // Show all leads in one page
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
 * GET /api/v1/leads/daily
 * List leads for daily view
 */
export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams);

    const data = await leadService.listDaily(user, query);

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
│   ├── LeadFilters.tsx        // Daily count + create button
│   ├── LeadTable.tsx          // Lead list table
│   └── LeadFormModal.tsx      // Create/Edit lead (mode: "create" | "edit")
├── views/
│   └── LeadDailyView.tsx      // Main daily view
├── hooks/
│   ├── useLeadsDaily.ts       // List leads for daily view
│   ├── useLeadStats.ts        // Statistics calculation (client-side)
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
│ 📋 Quản lý Lead - Hôm nay                                           │
│                                                                      │
│           [📅 13/12/2025 ▼]   [◀] [Hôm nay] [▶]                    │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ 📊 Tổng Lead     │ │ 🦷 Niềng răng    │ │ 🔩 Implant       │ │ 🏥 Tổng quát   │
│                  │ │                  │ │                  │ │                  │
│    245           │ │    127           │ │    89            │ │    29            │
└──────────────────┘ └──────────────────┘ └──────────────────┘ └──────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ 245 lead mới trong ngày                           [➕ Tạo Lead]    │
└─────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────┐
│ Họ tên       │ SĐT         │ Tỉnh/TP   │ Dịch vụ quan tâm │ Nguồn    │ Ngày tạo    │
├────────────────────────────────────────────────────────────────────────────────────┤
│ Nguyễn Văn A │ 0912345678  │ TP.HCM    │ Niềng răng       │ Facebook │ 13/12 14:30 │
│ Trần Thị B   │ 0987654321  │ Hà Nội    │ Implant          │ Google   │ 13/12 10:15 │
│ Lê Văn C     │ 0909123456  │ Đà Nẵng   │ Tổng quát        │ Zalo     │ 13/12 09:20 │
│ ...          │ ...         │ ...       │ ...              │ ...      │ ...         │
└────────────────────────────────────────────────────────────────────────────────────┘
```

**Layout Components (theo cấu trúc standard):**

1. **Header with Date Navigation** (`PageHeaderWithDateNav` - Shared Component)

   - Component: `PageHeaderWithDateNav` từ `@/shared/components`
   - Hook: `useDateNavigation()` từ `@/shared/hooks`
   - Navigation: Previous Day | Today | Next Day + DatePicker
   - Format: YYYY-MM-DD (ISO) gửi lên API
   - Display: "Quản lý Lead - [Hôm nay / Hôm qua / dd/MM/yyyy]"

2. **Statistics Cards** (`LeadStatistics` - Same Pattern as `CustomerStatistics`)

   - Component tính toán từ data array (không cần API riêng)
   - 4 Cards hiển thị:
     - **Tổng Lead**: Count tất cả items
     - **Lead niềng răng**: Count `serviceOfInterest === "nieng_rang"`
     - **Lead implant**: Count `serviceOfInterest === "implant"`
     - **Lead tổng quát**: Count `serviceOfInterest === "tong_quat"`
   - Pattern: Giống `CustomerStatistics.tsx` - filter client-side từ data prop

3. **Filters Section** (`LeadFilters` - Same Pattern as `CustomerFilters`)

   - Display: Daily count ("{count} lead mới trong ngày")
   - Action: Button "Tạo Lead" (primary, icon: PlusOutlined)
   - Pattern: Giống `CustomerFilters.tsx` - simple layout, no complex filters

4. **Table** (`LeadTable` - Same Pattern as `CustomerTable`)

   - Component: Simple data display (no complex actions)
   - Data source: API `GET /api/v1/leads/daily?date={date}`
   - Sort: Fixed `createdAt desc` (mới nhất trước)
   - No pagination: Show all leads in one page (pageSize=100)
   - Loading state: Skeleton/Spin

   **Table Columns:**

   | Column           | Width | Type | Description                            |
   | ---------------- | ----- | ---- | -------------------------------------- |
   | Họ tên           | Auto  | Link | `fullName` - Link to `/customers/{id}` |
   | SĐT              | 140px | Text | `phone`                                |
   | Tỉnh/TP          | 120px | Text | `city`                                 |
   | Dịch vụ quan tâm | 160px | Tag  | Label từ `SERVICES_OF_INTEREST`        |
   | Nguồn            | 120px | Tag  | Label từ `CUSTOMER_SOURCES`            |
   | Ngày tạo         | 160px | Text | `createdAt` format "DD/MM/YYYY HH:mm"  |

   **Notes:**

   - ⚠️ **NO Clinic column** (LEADs don't have clinic)
   - ⚠️ **NO customerCode column** (always NULL for leads)
   - ⚠️ **NO action buttons** (keep simple like CustomerTable)
   - ✅ **Click lead name** → Navigate to `/customers/{id}` (reuse CustomerDetailView)
   - Pattern: Copy from `CustomerTable.tsx`, remove customer-specific columns

#### 🎨 LeadFormModal UI (Create/Edit Mode)

```
┌────────────────────────────────────────────────────────────────────────┐
│ ➕ Tạo Lead mới                                                    [✖]  │
<!-- Title: "Tạo Lead mới" (create mode) | "Cập nhật Lead" (edit mode) -->
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

**LeadFormModal Props & Behavior:**

**Props:**

- `open: boolean` - Modal visibility
- `mode: "create" | "edit"` - Form mode
- `initialData?: LeadResponse` - Pre-fill data for edit mode
- `confirmLoading?: boolean` - Submit button loading state
- `onCancel: () => void` - Close modal handler
- `onSubmit: (data, leadId?) => void` - Form submit handler

**Fields:**

- Phone (required) - Validated format
- Full Name (required) - Min 1 character
- City (required) - Dropdown selection
- District (optional) - Dependent on city selection
- Source (optional) - Dropdown from `CUSTOMER_SOURCES`
- Source Notes (optional) - Text input
- Service of Interest (optional) - Dropdown from `SERVICES_OF_INTEREST`
- Note (optional) - Text area

**Validations:**

- ⚠️ **Clinic field NOT shown** (always NULL for LEAD)
- Phone duplicate check: Block submit if phone exists in LEAD or CUSTOMER tables
- Zod schema validation: `LeadCreateSchema` (create) | `LeadUpdateSchema` (edit)

**Server Actions:**

- `createLeadAction(data)` - Create new lead
- `updateLeadAction(id, data)` - Update existing lead

**Pattern Reference:**

- Copy from `CustomerFormModal.tsx`
- Same structure: mode prop, initialData handling, form validation
- Remove customer-specific fields (clinic, customerCode, etc.)

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
- **List Query**: `GET /api/v1/leads/daily?date={date}`
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

- `LeadStatistics.tsx` - Statistics cards (4 cards: Tổng/Niềng răng/Implant/Tổng quát) - Same pattern as CustomerStatistics
- `LeadFilters.tsx` - Daily count + create button - Same pattern as CustomerFilters
- `LeadTable.tsx` - Lead listing table - Same pattern as CustomerTable (link to `/customers/{id}`)
- `LeadFormModal.tsx` - Create/Edit lead form (single modal with mode prop) - Same pattern as CustomerFormModal
- `LeadDailyView.tsx` - Main daily view combining all components

**Reused Components:**

- `CustomerDetailView` - Lead detail reuses existing customer detail view (handles `type="LEAD"` automatically)

**Patterns to Follow:**

- View structure: `CustomerDailyView`, `AppointmentDailyView`, `TreatmentLogDailyView`
- Component naming: `[Feature]Statistics`, `Create[Feature]Modal`, `[Feature]DailyView`
- Form handling: react-hook-form + Zod validation
- Data fetching: @tanstack/react-query
- Phone duplicate: Check both LEAD and CUSTOMER tables
- Action restrictions: Disable edit/delete for converted leads (type=CUSTOMER)

**Customer Feature Updates:**

✅ See [120.1 Customer Updates.md](120.1%20Customer%20Updates.md) for complete implementation:

- ✅ ConvertLeadModal component (6 rows, 16 fields matching CustomerFormModal)
- ✅ CustomerDetailView integration (type badge, convert button)
- ✅ Phone duplicate validation (LEAD vs CUSTOMER)
- ✅ Table column updates (type, note, firstVisitDate)
- ✅ Backend validation (ConvertLeadRequestSchema)
- ✅ Lead service convertToCustomer() method
- ✅ Clinic permissions (admin can select any, employee locked to their clinic)

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
- [ ] Add API routes (`/api/v1/leads/daily/`, `/api/v1/leads/[id]/`)
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
- [ ] Implement components (LeadStatistics, LeadFilters, LeadTable, LeadFormModal)
- [ ] Implement views (LeadDailyView - no separate detail view)
- [ ] Implement hooks (useLeadsDaily, useCreateLead, useUpdateLead, useDeleteLead)
- [ ] Update LeadTable to link to `/customers/{id}` (reuse CustomerDetailView)
- [ ] Add route `/leads/daily` to app router
- [ ] Verify CustomerDetailView handles `type="LEAD"` correctly
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

**Prerequisites:** ✅ COMPLETED

- ✅ [120.1 Customer Updates.md](120.1%20Customer%20Updates.md) fully deployed
- ✅ ConvertLeadModal integrated with CustomerDetailView
- ✅ Backend validation and service complete

**Backend Implementation:** ✅ COMPLETED

- ✅ Lead validation schemas (CreateLeadRequestSchema, UpdateLeadRequestSchema, ConvertLeadRequestSchema)
- ✅ Lead repository (leadRepo works with type="LEAD")
- ✅ Lead service (create, update, delete, convertToCustomer with clinic validation)
- ✅ Lead server actions (createLeadAction, updateLeadAction, deleteLeadAction)
- ✅ Phone duplicate validation (checks both LEAD and CUSTOMER)

**Frontend Implementation:** ✅ COMPLETED

- ✅ Lead components (LeadStatistics, LeadFilters, LeadTable, LeadFormModal)
- ✅ Lead views (LeadDailyView at `/leads/daily`)
- ✅ Lead hooks (useLeadsDaily, useCreateLead, useUpdateLead, useDeleteLead)
- ✅ CustomerDetailView integration (type badge, convert button)
- ✅ ConvertLeadModal (6 rows, 16 fields, clinic permissions)
- ✅ Route permissions and navigation

**Phone Validation:** ✅ COMPLETED

- ✅ Distinguishes LEAD vs CUSTOMER duplicates
- ✅ Blocks Customer creation when phone exists as LEAD
- ✅ Frontend and backend validation aligned

**Conversion Feature:** ✅ COMPLETED

- ✅ ConvertLeadModal matches CustomerFormModal exactly
- ✅ All fields editable except phone
- ✅ Clinic permissions (admin can change, employee cannot)
- ✅ Source data merging (sourceEmployee/sourceCustomer)
- ✅ Automatic customerCode generation
- ✅ Page refresh after conversion

---

## 🚀 SUMMARY

**Status:** ✅ FULLY IMPLEMENTED

**Scope:** Complete Lead management system with conversion workflow

**Key Achievements:**

- ✅ Lead management at `/leads/daily` (create, edit, delete)
- ✅ Phone duplicate validation (LEAD vs CUSTOMER distinction)
- ✅ Backend services using Customer table with type="LEAD"
- ✅ ConvertLeadModal (6 rows, 16 fields matching CustomerFormModal)
- ✅ Clinic permissions (admin/employee access control)
- ✅ Automatic customerCode generation on conversion
- ✅ Complete data flow: LEAD → CUSTOMER with all fields

**Integration:**

- Backend: leadService.convertToCustomer() with full validation
- Frontend: CustomerDetailView + ConvertLeadModal
- Validation: ConvertLeadRequestSchema matching CustomerFormModal exactly

**Dependencies:**

- ✅ [120.1 Customer Updates.md](120.1%20Customer%20Updates.md) completed and integrated

**READY TO IMPLEMENT?** 🚀
