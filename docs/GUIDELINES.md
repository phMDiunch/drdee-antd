# Project Guidelines (Single Source of Truth)

# I. TỔNG QUAN

## 1. Stack Công Nghệ

- **Frontend**: Next.js 15 (App Router), React 18, TypeScript, Ant Design 5
- **State**: React Query (server), Zustand (UI state only)
- **Backend**: Next.js Server Actions, API Routes, Prisma ORM
- **Database**: Supabase (PostgreSQL), Prisma
- **Validation**: Zod (shared FE/BE)
- **Utils**: dayjs, lodash

## 2. Chính Sách Dependency

- ❌ Không thêm thư viện khi chưa được duyệt
- ✅ Ưu tiên: Ant Design, React Query, Supabase, dayjs, Zod
- ✅ Zod làm single source of truth cho schemas (client + server)

## 3. Kiến Trúc & Luồng Phát Triển

**2 Approaches:**

- **API-first** (mặc định): Requirements → Database → API Contract → Backend → Frontend
- **Frontend-driven** (khi cần UX trước): Requirements → UI/UX → Frontend → API Contract → Backend → Database

## 4. Cấu Trúc Thư Mục

```
src/
├── shared/
│   ├── validation/         # Zod schemas (FE + BE)
│   ├── permissions/        # Permission logic (FE + BE)
│   ├── components/         # Reusable UI
│   ├── constants/          # COMMON_MESSAGES, etc.
│   └── utils/
├── server/
│   ├── repos/              # Data access (Prisma)
│   ├── services/           # Business logic
│   ├── actions/            # Server Actions
│   └── utils/              # sessionCache.ts
├── features/<feature>/
│   ├── api.ts              # Query functions (GET)
│   ├── components/         # Feature UI
│   ├── hooks/              # React Query hooks
│   ├── views/              # Pages
│   ├── constants.ts        # Feature-specific
│   └── index.ts            # Barrel export
├── layouts/AppLayout/
└── app/
    ├── (auth)/             # Public routes
    ├── (private)/          # Protected routes
    └── api/v1/             # API routes
```

---

# II. LUỒNG PHÁT TRIỂN

## 1. Prisma Model

**Conventions:**

- PascalCase, singular (`Customer`, `Appointment`)
- Audit fields: `createdAt`, `updatedAt`, `createdById`, `updatedById`
- Soft delete: `deletedAt DateTime?`
- Relations: `@@index` cho FK, composite indexes cho queries thường dùng

**Performance - Database Indexes:**

- Single-column: Unique fields hoặc search fields (`phone`, `email`)
- Composite: Common query patterns (`[clinicId, createdAt]`, `[clinicId, status]`)
- Foreign keys: Luôn index FK để JOIN nhanh (`clinicId`, `customerId`)

```prisma
model Customer {
  id          String    @id @default(cuid())
  fullName    String
  phone       String?
  clinicId    String
  clinic      Clinic    @relation(...)
  createdAt   DateTime  @default(now())
  createdById String

  @@index([clinicId, createdAt]) // Daily view queries
  @@index([phone])                // Search by phone
}
```

## 2. Zod Schema

**3-Layer Pattern:** Base → Frontend → Backend

**Layer 1 - Base (Shared):**

```typescript
const CustomerCommonFieldsSchema = z.object({
  fullName: z.string().min(1),
  gender: z.enum(["MALE", "FEMALE"]),
  // NO dob (khác type FE/BE)
});

const validateConditionalFields = (data, ctx) => {
  /* reuse */
};
```

**Layer 2 - Frontend (nếu cần):**

```typescript
export const CreateCustomerFormSchema = CustomerCommonFieldsSchema.extend({
  dob: z.string().min(1),
}) // STRING cho DatePicker
  .superRefine(validateConditionalFields);

export type CreateCustomerFormData = z.infer<typeof CreateCustomerFormSchema>;
```

**Layer 3 - Backend:**

```typescript
const CustomerRequestBaseSchema = CustomerCommonFieldsSchema.extend({
  dob: z.coerce.date(),
}); // DATE cho API

export const CreateCustomerRequestSchema =
  CustomerRequestBaseSchema.superRefine(validateConditionalFields);

export const CustomerResponseSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  dob: z.string().datetime().nullable(),
});

export type CreateCustomerRequest = z.infer<typeof CreateCustomerRequestSchema>;
export type CustomerResponse = z.infer<typeof CustomerResponseSchema>;
```

**Naming:**

- Frontend: `Create<Feature>FormSchema`
- Backend Request: `Create<Feature>RequestSchema`, `Update<Feature>RequestSchema`
- Backend Response: `<Feature>ResponseSchema`, `<Feature>ListResponseSchema`
- Query: `Get<Feature>QuerySchema`

**Response Schema - Nested Structure:**

✅ **Giữ nguyên cấu trúc nested objects** (không flatten):

```typescript
export const PaymentVoucherResponseSchema = z.object({
  customer: z.object({
    id: z.string(),
    fullName: z.string(),
  }),
  cashier: z.object({
    id: z.string(),
    fullName: z.string(),
  }),
  // ... nested objects
});
```

❌ **Không flatten thành flat fields**:

```typescript
// ❌ AVOID
customerName: z.string(),     // Flat
cashierName: z.string(),      // Flat
```

## 3. Backend Layer

**Hybrid Architecture Overview:**

```
Frontend
    ↓
┌─────────────────────────────────────┐
│ Queries (GET)    → API Routes       │ ← HTTP caching
│ Mutations (CUD)  → Server Actions   │ ← Type-safe RPC
└─────────────────────────────────────┘
    ↓
Service Layer (Business logic)
    ↓
Repository Layer (Prisma)
    ↓
Database (Supabase PostgreSQL)
```

**Tại sao dùng pattern này?**

- **API Routes (GET)**: Cache HTTP, tối ưu CDN, chuẩn REST, dễ tích hợp bên ngoài
- **Server Actions (CUD)**: Type-safe end-to-end, không cần tạo endpoint thủ công, code đơn giản hơn

### 3.1. Repository (`src/server/repos/<feature>.repo.ts`)

**3 Patterns dựa trên Zod schemas:**

**Pattern 1 - Simple (Master Data):**

```typescript
// API Schema = Repo Type (direct)
async create(data: CreateClinicRequest) { ... }
```

**Pattern 2 - Complex (Business Data):**

```typescript
// API Schema + Server Metadata
export type CustomerCreateInput = CreateCustomerRequest & {
  createdById: string;
  updatedById: string;
};

export const customerRepo = {
  async create(data: CustomerCreateInput) { ... },
  async findById(id: string) { ... },
  async list(filters) { ... },
  async listDaily(params: { clinicId, dateStart, dateEnd }) {
    return { items, count };
  },
};
```

**Pattern 3 - Relations:**

```typescript
// API Schema + Prisma Relations
export type EmployeeCreateInput = Omit<CreateEmployeeRequest, "clinicId"> & {
  clinic: { connect: { id: string } };
  createdBy: { connect: { id: string } };
};
```

**Method Naming:**

- `list()` - Paginated
- `listDaily()` - Date range, return `{ items, count }`
- `create()`, `update()`, `delete()`, `findById()`

### 3.2. Service (`src/server/services/<feature>.service.ts`)

**Responsibilities:** Business logic, validation, orchestration

```typescript
export const customerService = {
  async create(currentUser: SessionUser, body: CreateCustomerRequest) {
    // 1. Validate business rules
    const existing = await customerRepo.findByPhone(body.phone);
    if (existing) throw new ServiceError("DUPLICATE_PHONE", "...", 409);

    // 2. Prepare data
    const data: CustomerCreateInput = {
      ...body,
      createdById: currentUser.id,
      updatedById: currentUser.id,
    };

    // 3. Execute
    const created = await customerRepo.create(data);

    // 4. Map response
    return mapCustomerToResponse(created);
  },

  async listDaily(currentUser, date: string) {
    // Calculate time range
    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);

    const { items, count } = await customerRepo.listDaily({
      clinicId: currentUser.clinicId,
      dateStart,
      dateEnd,
    });

    return {
      items: items.map(mapCustomerToResponse),
      count,
    };
  },
};
```

**Error Handling:**

```typescript
throw new ServiceError("ERROR_CODE", "Message tiếng Việt", httpStatus);
```

### 3.3. Server Actions (`src/server/actions/<feature>.actions.ts`)

**Hybrid Architecture Pattern:**

- ✅ **Mutations** (POST/PUT/DELETE) → **Server Actions**
- ✅ **Queries** (GET) → **API Routes** (section 3.4)

**Tại sao dùng Server Actions cho Mutations?**

- Type-safe từ đầu đến cuối (TypeScript tự suy luận kiểu)
- Không cần tạo API endpoint thủ công
- Tự động serialize dữ liệu
- Đơn giản hơn API Routes cho các thao tác ghi

**Pattern:** Auth gate + delegate to service

```typescript
"use server";

import { getSessionUser } from "@/server/utils/sessionCache"; // ← Cached

export async function createCustomerAction(data: CreateCustomerRequest) {
  const user = await getSessionUser(); // Auth + cached
  return customerService.create(user, data);
}

export async function updateCustomerAction(
  id: string,
  data: UpdateCustomerRequest
) {
  const user = await getSessionUser();
  return customerService.update(id, user, data);
}

export async function deleteCustomerAction(id: string) {
  const user = await getSessionUser();
  return customerService.delete(id, user);
}
```

**3-Layer Responsibilities:**

| Layer         | Purpose                     | Example                    |
| ------------- | --------------------------- | -------------------------- |
| Server Action | Auth gate + RPC             | `getSessionUser()` + call  |
| Service       | Business logic + validation | Rules, Zod, multiple repos |
| Repo          | Data access (Prisma)        | `prisma.customer.create()` |

**Quy tắc:**

- ✅ Tất cả mutations (tạo/sửa/xóa) đều dùng Server Actions
- ✅ Gọi trực tiếp từ React Query mutation hooks
- ❌ KHÔNG gọi Service trực tiếp từ components

### 3.4. API Routes (`src/app/api/v1/<features>/route.ts`)

**Hybrid Architecture Pattern:**

- ✅ **Queries** (GET) → **API Routes** (có HTTP caching)
- ✅ **Mutations** (POST/PUT/DELETE) → **Server Actions** (section 3.3)

**Tại sao dùng API Routes cho Queries?**

- Có HTTP caching headers (Cache-Control, stale-while-revalidate)
- Tối ưu hóa CDN/Edge (Vercel)
- Chuẩn REST API
- Dễ tích hợp từ bên ngoài

**Standard Template:**

```typescript
/**
 * GET /api/v1/{feature} - Description
 * Query params: list of params
 * Used by: hook name
 * Validation: Handled by service layer
 * Cache: duration (if applicable)
 */
export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams);

    const data = await service.list(user, query);

    return NextResponse.json(data, {
      status: 200,
      headers: {
        /* cache headers if needed */
      },
    });
  } catch (e: unknown) {
    if (e instanceof ServiceError) {
      return NextResponse.json(
        { error: e.message, code: e.code },
        { status: e.httpStatus }
      );
    }
    return NextResponse.json(
      { error: COMMON_MESSAGES.SERVER_ERROR },
      { status: 500 }
    );
  }
}

// POST removed - Use create{Feature}Action() Server Action instead
```

**Caching Strategy:**

| Layer           | Data Type    | Server Cache | Client Cache | Example                                      |
| --------------- | ------------ | ------------ | ------------ | -------------------------------------------- |
| **API Route**   | Master Data  | 5 min        | -            | `dental-services`, `clinics`, `master-data`  |
| **API Route**   | All Others   | No cache     | -            | `customers`, `appointments`, `*/daily`, etc. |
| **React Query** | Master Data  | -            | Infinity     | Static data, ít thay đổi, chỉ admin thay đổi |
| **React Query** | Transactions | -            | 1-5 min      | Data động, thay đổi thường xuyên             |

**Server Cache Headers (API Routes):**

```typescript
// Master data only (5 minutes server cache)
"Cache-Control": "public, s-maxage=300, stale-while-revalidate=600"

// All other routes - no server cache
// (no headers needed)
```

**Client Cache Strategy (React Query Hooks):**

```typescript
// ✅ Master Data (clinics, dental-services, master-data, employees/working)
// Chỉ fetch lại khi user F5 hoặc vào app lại
staleTime: Infinity,              // Dữ liệu không bao giờ bị coi là "cũ"
gcTime: 1000 * 60 * 60 * 24,     // Giữ trong memory 24h
refetchOnWindowFocus: false,      // Chuyển tab không fetch lại
refetchOnMount: false,            // Component mount lại không fetch lại
refetchOnReconnect: false,        // Mất mạng có lại không fetch lại

// ✅ Transactional Data (customers, appointments, payments, etc.)
// Fetch lại thường xuyên hơn để đảm bảo data fresh
staleTime: 60 * 1000,             // 1 phút
gcTime: 5 * 60 * 1000,            // 5 phút
refetchOnWindowFocus: true,       // Có thể fetch lại khi chuyển tab
```

**Lưu ý quan trọng:**

- Admin thấy thay đổi **ngay lập tức** sau mutations vì React Query tự động invalidate cache
- User khác có thể thấy sau khi F5 (tradeoff chấp nhận được cho master data)
- Server cache (5 min) + Client cache (Infinity) = Performance tối ưu

**Key Principles:**

- ✅ **Service-centric validation** - No route validation
- ✅ **Standard JSDoc** - Document params, usage, cache
- ✅ **Clean error handling** - ServiceError + generic fallback
- ✅ **Consistent spacing** - Same format across all routes

## 4. Frontend Layer

**Client-Side Pattern:**

```
Components
    ↓
React Query Hooks
    ↓
┌─────────────────────────────────────────┐
│ Query hooks    → API Client (fetch)     │ ← Call API Routes
│ Mutation hooks → Server Actions (direct)│ ← Type-safe import
└─────────────────────────────────────────┘
```

### 4.1. API Client (`src/features/<features>/api.ts`)

**Single file pattern - CHỈ cho queries (GET):**

```typescript
// src/features/customers/api.ts
export async function getCustomersApi(params?: GetCustomersQuery) {
  const query = new URLSearchParams(params as any);
  const res = await fetch(`/api/v1/customers?${query}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getCustomerDetailApi(id: string) {
  const res = await fetch(`/api/v1/customers/${id}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
```

**Rules:**

- ✅ CHỈ queries (GET): `getCustomersApi()`, `getCustomerDetailApi()`, `searchCustomersApi()`
- ❌ KHÔNG có mutations: Không có `createCustomerApi()`, `updateCustomerApi()`, `deleteCustomerApi()`
- ✅ Mutations → import Server Actions trực tiếp: `import { createCustomerAction } from "@/server/actions/customer.actions"`

### 4.2. React Query Hooks (`src/features/<features>/hooks/`)

**Hook Naming Convention:**

| Hook Type      | Pattern                 | Example               |
| -------------- | ----------------------- | --------------------- |
| List (query)   | `use<FeaturePlural>()`  | `useClinics()`        |
| Detail (query) | `use<Feature>ById()`    | `useClinicById(id)`   |
| Create         | `useCreate<Feature>()`  | `useCreateClinic()`   |
| Update         | `useUpdate<Feature>()`  | `useUpdateClinic(id)` |
| Delete         | `useDelete<Feature>()`  | `useDeleteClinic()`   |
| Archive        | `useArchive<Feature>()` | `useArchiveClinic()`  |

**Query Keys Pattern:**

```typescript
// src/features/<feature>/constants.ts
export const <FEATURE>_QUERY_KEYS = {
  list: (params?) => ["<feature-plural>", params] as const,
  byId: (id: string) => ["<feature-singular>", id] as const,
} as const;

// Ví dụ:
export const CLINIC_QUERY_KEYS = {
  list: (includeArchived?: boolean) =>
    ["clinics", { includeArchived }] as const,
  byId: (id: string) => ["clinic", id] as const,
} as const;
```

**Query Hook - Master Data Pattern:**

```typescript
// useClinics.ts (Master Data)
export function useClinics(includeArchived?: boolean) {
  return useQuery({
    queryKey: CLINIC_QUERY_KEYS.list(includeArchived),
    queryFn: () => getClinicsApi(includeArchived),
    staleTime: Infinity, // Dữ liệu không bao giờ bị coi là "cũ"
    gcTime: 1000 * 60 * 60 * 24, // Giữ trong memory 24h
    refetchOnWindowFocus: false, // Chuyển tab không fetch lại
    refetchOnMount: false, // Component mount lại không fetch lại
    refetchOnReconnect: false, // Mất mạng có lại không fetch lại
  });
}
```

**Query Hook - Transactional Data Pattern:**

```typescript
// useCustomers.ts (Transactional Data)
export function useCustomers(params?: GetCustomersQuery) {
  return useQuery({
    queryKey: ["customers", params],
    queryFn: () => getCustomersApi(params),
    staleTime: 60 * 1000, // 1 phút
    gcTime: 5 * 60 * 1000, // 5 phút
    refetchOnWindowFocus: true, // Fetch lại khi chuyển tab
  });
}
```

**Mutation Hook:**

```typescript
export function useCreateCustomer() {
  return useMutation({
    mutationFn: createCustomerAction,
    onSuccess: () => {
      notify.success(CUSTOMER_MESSAGES.CREATE_SUCCESS);
      qc.invalidateQueries({
        queryKey: ["customers"],
        refetchType: "active", // ✅ Force refetch ngay lập tức
      });
    },
    onError: (e) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}

// Update: invalidate detail + list
qc.invalidateQueries({
  queryKey: CUSTOMER_QUERY_KEYS.byId(id),
  refetchType: "active",
});
qc.invalidateQueries({
  queryKey: ["customers"],
  refetchType: "active",
});

// Delete: invalidate list only
qc.invalidateQueries({
  queryKey: ["customers"],
  refetchType: "active",
});
```

**Caching Strategy Summary:**

| Data Type        | staleTime  | gcTime | refetchOnWindowFocus | refetchOnMount | refetchOnReconnect |
| ---------------- | ---------- | ------ | -------------------- | -------------- | ------------------ |
| **Master Data**  | `Infinity` | 24h    | `false`              | `false`        | `false`            |
| **Transactions** | 1 min      | 5 min  | `true`               | (default)      | (default)          |

**Quy tắc:**

- ✅ Pattern đơn giản (KHÔNG dùng optimistic updates) - đáng tin cậy, nhất quán, dễ debug
- ✅ Luôn dùng `useNotify()` (KHÔNG BAO GIỜ dùng `App.useApp().message`)
- ✅ Cấu trúc nhất quán cho tất cả mutations
- ✅ Dữ liệu luôn đồng bộ với server (đánh đổi: loading nhỏ để đảm bảo ổn định)

### 4.3. Components (`src/features/<features>/components/`)

**Naming:** `Create<Feature>Modal`, `<Feature>Table`, `<Feature>Filters`

**Table Columns Memoization:**

```typescript
const columns = React.useMemo<ColumnsType<CustomerResponse>>(
  () => [
    { title: "Họ tên", dataIndex: "fullName" },
    {
      title: "Thao tác",
      key: "actions",
      width: 250,
      fixed: "right",
      render: (_, record) => {
        // ✅ Calculate permissions/conditions once at function start
        const editPermission = canEdit(currentUser, record);
        const showQuickAction = record.status === "Active";

        return (
          <Space split={<Divider type="vertical" />}>
            {showQuickAction && <Button icon={<Icon />}>Action</Button>}
            <Tooltip
              title={editPermission.allowed ? "Sửa" : editPermission.reason}
            >
              <Button
                icon={<EditOutlined />}
                disabled={!editPermission.allowed}
              />
            </Tooltip>
          </Space>
        );
      },
    },
  ],
  [currentUser, onEdit]
);
```

**⚠️ TRÁNH IIFE trong render (gây CSS-in-JS warning):**

```typescript
// ❌ BAD - IIFE tạo function scope mỗi render
render: (_, record) => (
  <Space>
    {condition &&
      (() => {
        const permission = checkPermission(user, record);
        return <Tooltip>...</Tooltip>;
      })()}
  </Space>
);

// ✅ GOOD - Tính toán trước, conditional render đơn giản
render: (_, record) => {
  const permission = condition ? checkPermission(user, record) : null;
  return <Space>{permission && <Tooltip>...</Tooltip>}</Space>;
};
```

**Select Search Pattern (Debounce):**

```typescript
const [query, setQuery] = useState("");
const [debounced, setDebounced] = useState("");

useEffect(() => {
  const timer = setTimeout(() => setDebounced(query), 500);
  return () => clearTimeout(timer);
}, [query]);

const { data = [], isFetching } = useSearch({ q: debounced });

<Select
  showSearch
  filterOption={false}
  onSearch={setQuery}
  notFoundContent={isFetching ? <Spin /> : "Không tìm thấy"}
/>;
```

### 4.4. Views (`src/features/<features>/views/`)

**Daily View Pattern:**

```typescript
export default function CustomerDailyView() {
  const { user } = useCurrentUser();
  const { selectedDate, goToPreviousDay, goToToday, goToNextDay } = useDateNavigation();
  const [selectedClinicId, setSelectedClinicId] = useState(user?.clinicId);

  const { data, isLoading } = useCustomersDaily({
    clinicId: selectedClinicId,
    date: selectedDate,
  });

  return (
    <div>
      <PageHeaderWithDateNav {...dateNavProps} />
      <ClinicTabs value={selectedClinicId} onChange={setSelectedClinicId} />
      <CustomerStatistics data={data} loading={isLoading} />
      <CustomerFilters onCreate={...} dailyCount={data?.count} />
      <CustomerTable data={data?.items} loading={isLoading} />
      <CreateCustomerModal ... />
    </div>
  );
}
```

**Structure:**

1. `PageHeaderWithDateNav` - Date navigation
2. `ClinicTabs` - Clinic switcher (admin only)
3. Statistics - Metrics cards
4. Filters - Search + actions
5. Table - Data grid

### 4.5. Barrel Exports (`src/features/<features>/index.ts`)

**Pattern:** 1 file `index.ts` ở root feature - export public API

```typescript
// src/features/customers/index.ts
export { default as CustomerDailyView } from "./views/CustomerDailyView";
export { default as CustomerTable } from "./components/CustomerTable";
export * from "./hooks/useCustomers";
export * from "./constants";
// NOTE: KHÔNG export api.ts (internal)
```

**Rules:**

- ✅ Export: views, components, hooks, constants
- ❌ KHÔNG export: `api.ts` (internal)

**Usage:**

```typescript
// ✅ External: import { CustomerDailyView } from "@/features/customers"
// ✅ Internal: import { useCustomers } from "../hooks/useCustomers"
// ❌ Deep path: import from "@/features/customers/hooks/..."
```

---

# III. QUY ƯỚC & PATTERNS

## 1. Naming Conventions

| Layer        | Singular/Plural | Case       | Example                   |
| ------------ | --------------- | ---------- | ------------------------- |
| Repo file    | Singular        | kebab-case | `customer.repo.ts`        |
| Service file | Singular        | kebab-case | `customer.service.ts`     |
| API route    | Plural          | kebab-case | `/api/v1/customers`       |
| Feature dir  | Plural          | kebab-case | `features/customers/`     |
| Hook file    | Singular        | PascalCase | `useCreateCustomer.ts`    |
| Component    | Singular        | PascalCase | `CreateCustomerModal.tsx` |
| View         | Singular        | PascalCase | `CustomerDailyView.tsx`   |

## 2. Validation Strategy

**3 boundaries only:**

1. **Frontend form** - Zod + AntD rules
2. **API boundary** - Zod parse request/response
3. **Service layer** - Business rules (uniqueness, FK, state)

**Rules:**

- ✅ Validate at boundaries
- ❌ NO validation in: mappers, repos, type conversions (trust internal data)

## 3. Error Handling

**Client:**

```typescript
const notify = useNotify();

// Success
notify.success("Thêm thành công");

// Error (auto-extract)
notify.error(error, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR });
```

**Server:**

```typescript
throw new ServiceError("ERROR_CODE", "Message tiếng Việt", httpStatus);
```

**Rules:**

- ✅ ALWAYS `useNotify()` (single source of truth)
- ❌ NEVER `App.useApp().message` hoặc `message.success()`
- ❌ NEVER `import { App }` trong components (trừ `useNotify` hook)

## 4. Next.js & Supabase

- `cookies()` là async → `const supabase = await createClient()`
- Session qua HttpOnly cookie (không lưu token ở JS)
- Middleware bảo vệ `(private)` routes
- `useSearchParams()` → wrap trong `<Suspense>`
- User Context: Server fetch → `<Providers user={user}>` → `useCurrentUser()`

## 5. Auth

- Login: `POST /api/v1/auth/login` → `supabase.auth.signInWithPassword` → set cookie
- Logout: `POST /api/v1/auth/logout` → `supabase.auth.signOut()`
- Chặn open-redirect: `sanitizeNext()` (chỉ internal paths)

## 6. Shared Permissions

**Location:** `src/shared/permissions/<feature>.permissions.ts`

**Pattern:** Pure TypeScript, dùng chung FE + BE

```typescript
export const appointmentPermissions = {
  canEdit(user, appointment) {
    return { allowed: true / false, reason: string };
  },
  validateUpdateFields(user, existing, fields) {
    if (!allowed) throw new Error("...");
  },
};
```

**Frontend (0ms):**

```typescript
const permission = appointmentPermissions.canEdit(user, appointment);
<Button disabled={!permission.allowed} title={permission.reason}>
  Edit
</Button>;
```

**Backend:**

```typescript
try {
  appointmentPermissions.validateUpdateFields(user, existing, fields);
} catch (error) {
  throw new ServiceError("PERMISSION_DENIED", error.message, 403);
}
```

## 7. Session User Caching

**Problem:** Multiple `getSessionUser()` calls per request = N+1 DB queries

**Solution:** React `cache()` - Request-scoped memoization

```typescript
// src/server/utils/sessionCache.ts
import { cache } from "react";
import { getSessionUser as original } from "@/server/services/auth.service";

export const getSessionUser = cache(original);
```

**Usage:**

```typescript
// ✅ ALL Server Actions, API Routes, Server Components
import { getSessionUser } from "@/server/utils/sessionCache";

export async function createCustomerAction(data) {
  const user = await getSessionUser(); // First call: 30ms (DB query)
  return customerService.create(user, data);
}

export async function updateCustomerAction(id, data) {
  const user = await getSessionUser(); // Subsequent: 0ms (cached)
  return customerService.update(id, user, data);
}
```

**Performance Benefits:**

- Before: 3 server actions × 30ms auth = 90ms overhead per request
- After: 1 DB query (30ms) + 2 cache hits (0ms) = 30ms total
- **66% faster** auth checks, auto cleanup per request (no cross-user leakage)

**Rules:**

- ❌ NEVER import from `@/server/services/auth.service`
- ✅ ALWAYS import from `@/server/utils/sessionCache`

## 8. React Hooks Best Practices

**Memoization:**

- Objects/arrays trong deps → phải memoize (tránh infinite re-render)

**Form defaultValues:**

```typescript
const defaultValues = useMemo(
  () => ({ field1: initialData?.field1 || "" }),
  [initialData]
);

useEffect(() => {
  if (open) reset(defaultValues);
}, [open, reset, defaultValues]);
```

## 9. Ant Design

- Ưu tiên tokens trong `ConfigProvider` (hạn chế CSS ngoài)
- Header sticky, Sider/Content scroll độc lập
- Menu: icon cấp 1, children không icon, `key` = path
- Modal: `destroyOnHidden` (không dùng `destroyOnClose` - deprecated)

## 10. Demo & Prototypes

**Purpose**: Demo UI/UX với mock data để preview design trước khi implement backend

**Structure**:

```
src/
├── app/
│   └── (private)/
│       └── demo/                    # Demo pages (PHẢI trong (private) để auth)
│           └── layout.tsx           # Demo layout với warning banner
├── demos/                           # Demo-specific code (tách biệt khỏi features)
│   └── [demo-name]/
│       ├── components/              # Demo components
│       ├── types.ts                 # Demo types
│       ├── mockData.ts              # Demo mock data
│       └── hooks/                   # Demo hooks (if needed)
```

**Rules**:

1. ✅ **Mock Data Only**: Demo pages CHỈ dùng mock data, không call API
2. ✅ **Warning Banner**: Mọi demo page có Alert banner "Demo Mode" trong `demo/layout.tsx`
3. ✅ **Separated Folder**: Toàn bộ code demo trong `src/demos/`, KHÔNG trong `src/features/`
4. ✅ **Inside (private)**: Demo pages PHẢI ở trong `app/(private)/demo/` để có authentication
5. ✅ **Separated Menu**: Demo có menu riêng, tách biệt với production features
6. ❌ **No Complex Logic**: Không implement business logic phức tạp trong demo
7. ✅ **Keep After Migration**: Giữ lại demo pages sau khi migrate sang production (để reference)

**When to Use Demo**:

- ✅ Design new dashboard layouts
- ✅ Test UI libraries (Chart.js, D3, etc.)
- ✅ Prototype complex interactions
- ✅ Preview for stakeholders

**Migration to Production**:

1. Refactor/rewrite components từ `demos/` sang `features/` (clean code)
2. Tạo production page trong `/dashboard/` hoặc feature route
3. Replace mock data với API hooks (React Query)
4. Add loading/error states
5. Implement permissions & validation
6. Testing
7. ✅ Keep demo page trong `demos/` (không xóa - để reference/comparison)

---

# IV. CHECKLIST KHI IMPLEMENT FEATURE MỚI

## Backend

- [ ] Prisma model + migrations
- [ ] Zod schemas (request + response)
- [ ] Repo với 1 trong 3 patterns
- [ ] Service với business logic
- [ ] Server Actions (auth gate)
- [ ] API Routes (GET queries + cache headers)
- [ ] Error handling (`ServiceError`)

## Frontend

- [ ] API client (`api.ts`)
- [ ] Query hooks (với caching strategy)
- [ ] Mutation hooks (simplified pattern)
- [ ] Components (memoize columns)
- [ ] Views (Daily View pattern nếu cần)
- [ ] Constants (messages, endpoints)
- [ ] Barrel export (`index.ts`)

## Quality

- [ ] Validation ở 3 boundaries
- [ ] Error messages tiếng Việt
- [ ] `useNotify()` cho tất cả notifications
- [ ] Session cache (`getSessionUser`)
- [ ] Permissions (nếu cần shared logic)
- [ ] TypeScript strict mode
- [ ] No console.log/console.error

---

**Last Updated:** 2025-01-06

```

```
