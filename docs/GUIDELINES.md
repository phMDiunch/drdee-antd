# Project Guidelines (Single Source of Truth)

Stack: Next.js 15 (App Router) · Ant Design · Supabase · React Query · Zod

---

## 1) Chính Sách Dependency

- Không thêm thư viện khi chưa được duyệt. Ưu tiên: AntD, @tanstack/react-query, Supabase, dayjs, Zod.
- Dùng Zod để chuẩn hóa request/response schema dùng chung client + server (giảm bug, dễ scale).

## 2) Kiến Trúc & Luồng Phát Triển

- API‑first (mặc định): Requirements → Database → API Contract → Backend → Frontend.
- Frontend‑driven (khi cần): Requirements → UI/UX → Frontend → API Contract → Backend → Database.

## 3) Cấu Trúc Thư Mục

- Zod schemas: `src/shared/validation/*` (request/response, types via `z.infer`, tái dùng FE/BE).
- Business logic: `src/server/services/*` (Supabase/Prisma + rule nghiệp vụ).
- Data access: `src/server/repos/*` (Prisma + Zod types, 3 patterns chuẩn hoá).
- Feature module: `src/features/<feature>/{api,components,hooks,views}` + `constants.ts` (không cần `types.ts`, `index.ts` chính).
- Barrel exports: `src/features/<feature>/{api,hooks}/index.ts` (export từ subfolder).
- Layout: `src/layouts/AppLayout/*` (Header, Sider, Content, menu, theme).

## 4) Next.js & Supabase

- `cookies()` là async; trong server/route luôn `const supabase = await createClient()`.
- Session Supabase qua HttpOnly cookie (không lưu token ở JS).
- `(private)/layout.tsx` (SSR) gọi `getSessionUser()` để inject `currentUser`.
- Middleware bảo vệ `(private)`; chặn truy cập nếu chưa đăng nhập.
- **useSearchParams()**: Luôn wrap trong `<Suspense>` boundary (Next.js 15 requirement) để tránh pre-render errors.
- **User Context Pattern**: Server Component fetch user → `<Providers user={currentUser}>` → Client Components dùng `useCurrentUser()` (không cần loading state).

## 5) Auth

- Login: `POST /api/v1/auth/login` (Zod validate) → `supabase.auth.signInWithPassword` → set cookie → trả `{ user }`.
- Logout: `POST /api/v1/auth/logout` → `supabase.auth.signOut()`.
- Chặn open‑redirect bằng `sanitizeNext()` (chỉ chấp nhận đường dẫn nội bộ).

## 6) API Conventions

- Mọi route dưới `/api/v1/...`:
  - Parse request bằng Zod → trả 400 nếu invalid.
  - Map lỗi dịch vụ → `{ error: string }` + status phù hợp (401/403/404/409/500).
  - Không redirect trong API; redirect ở UI/hook.
- API client (`features/<feature>/api`): `fetch` + parse response bằng Zod; nếu `!ok` ném `Error(message)`.

## 7) React Query vs Zustand

- React Query (server‑state): `useQuery` cho GET, `useMutation` cho ghi; quản lý loading/error/success + invalidate.
- Không dùng Zustand/Context để cache dữ liệu server. Zustand chỉ cho UI‑state cục bộ (toggle, filters, modal…).

## 8) Ant Design & UI

- Hạn chế CSS ngoài; ưu tiên token trong `ConfigProvider`.
- Header sticky; Sider/Content scroll độc lập. Responsive bằng `Grid.useBreakpoint()`.
- Menu: icon cấp 1; children không icon; `key` = path để sync state.

## 9) Validation & Error UX

- Client: Form AntD có rule + (tuỳ chọn) Zod field‑level; trước khi gọi API nên parse Zod form‑level.
- Server: mọi request parse bằng Zod; map lỗi Supabase/DB → thông điệp tiếng Việt thân thiện.

## 10) Thông Báo & Lỗi (Client)

- Luôn dùng `useNotify()` (không gọi trực tiếp `App.useApp().message`).
- `useNotify` chuẩn hoá:
  - Ngôn ngữ: tiếng Việt end‑user; thời lượng mặc định 2.5s; dedupe ~2.5s.
  - API: `notify.success/info/warning(text)`, `notify.error(errOrText, { fallback?, duration? })`.
  - `notify.error` tự trích message từ `Error`, `{ error, code }`, `ZodError`, …
- Mẫu dùng với React Query:
  - `onSuccess: () => notify.success(MESSAGES.XYZ_SUCCESS)`
  - `onError: (e) => notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR })`

## 11) Thông Báo & Lỗi (Server)

- Ném `ServiceError(code, message, httpStatus)` cho lỗi nghiệp vụ.
- API Routes:
  - Nếu `ServiceError` → `{ error, code }` + `status = httpStatus`.
  - Lỗi không xác định → `{ error: COMMON_MESSAGES.SERVER_ERROR }`, `status = 500`.
  - Lỗi validation (Zod) → `COMMON_MESSAGES.VALIDATION_INVALID` hoặc `issues[0].message`.

## 12) Quy Ước Khi Implement Mới

- Không hardcode thông báo ở view/component; dùng constants theo domain hoặc truyền `fallback` cho `notify.error`.
- Dùng `COMMON_MESSAGES` cho thông điệp chung (`src/shared/constants/messages.ts`).
- Employees/Clinics: ưu tiên hooks đã chuẩn hoá; mutation mới follow pattern hiện có.

## 13) Repository Patterns (Chuẩn Hoá)

Repo types dựa trên Zod schemas (single source of truth) với 3 patterns:

### Simple Pattern (Master Data)

- **Use case**: Clinic, Settings (no server metadata needed)
- **Pattern**: `API Schema = Repo Type` (direct pass-through)

```typescript
async create(data: CreateClinicRequest) // Zod type trực tiếp
```

### Complex Pattern (Business Data)

- **Use case**: Customer, Dental Service (cần audit trail)
- **Pattern**: `API Schema + Server Fields = Repo Type`

```typescript
export type CustomerCreateInput = CreateCustomerRequest & {
  createdById: string; // Server-controlled metadata
  updatedById: string;
};
```

### Complex Pattern (Relations)

- **Use case**: Employee (có FK relations trong Prisma)
- **Pattern**: `API Schema + Prisma Relations = Repo Type`

```typescript
export type EmployeeCreateInput = Omit<CreateEmployeeRequest, "clinicId"> & {
  clinic: { connect: { id: string } }; // Prisma relation
  createdBy: { connect: { id: string } }; // FK validation
};
```

**Nguyên tắc**:

- Không duplicate type definitions → dùng Zod schemas làm base
- Server metadata (audit trail) không expose qua API schemas
- Relations dùng Prisma `{ connect }` cho FK validation

## 14) Naming & Zod Schemas

### Schema Organization (3-Layer Pattern)

Schemas tổ chức: **Shared Base → Frontend (nếu cần) → Backend**

**Layer 1: Base** – Common fields, exclude fields có type khác nhau FE/BE (VD: date).

```typescript
const CustomerCommonFieldsSchema = z.object({ fullName, gender, ... }); // NO dob
const validateConditionalFields = (data, ctx) => { /* reuse logic */ };
```

**Layer 2: Frontend** – Khi form có Date field (string) hoặc validation khác backend.

```typescript
// Create<Feature>FormSchema (FRONTEND)
export const CreateCustomerFormSchema = CustomerCommonFieldsSchema.extend({
  dob: z.string().min(1, "..."),
}) // STRING for DatePicker
  .superRefine(validateConditionalFields);
```

**Layer 3: Backend** – API schemas với Date, validate request/response.

```typescript
// <Feature>RequestBaseSchema, Create/Update<Feature>RequestSchema (BACKEND)
const CustomerRequestBaseSchema = CustomerCommonFieldsSchema
  .extend({ dob: z.coerce.date("...") }); // DATE for API
export const CreateCustomerRequestSchema = CustomerRequestBaseSchema.superRefine(validateConditionalFields);
export const CustomerResponseSchema = z.object({ id, fullName, dob: z.string().datetime().nullable(), ... });
```

**Naming:**

- Frontend: `Create<Feature>FormSchema` (khi cần tách)
- Backend Request: `Create<Feature>RequestSchema`, `Update<Feature>RequestSchema`
- Backend Response: `<Feature>ResponseSchema`, `<Feature>ListResponseSchema`
- Query: `Get<Feature>QuerySchema`

**Type Exports:**

```typescript
// Frontend
export type CreateCustomerFormData = z.infer<typeof CreateCustomerFormSchema>;
// Backend
export type CreateCustomerRequest = z.infer<typeof CreateCustomerRequestSchema>;
export type CustomerResponse = z.infer<typeof CustomerResponseSchema>;
```

**DRY Principles:**

- ✅ Extract base schema + validation functions để reuse
- ❌ Không duplicate field definitions hoặc validation logic

## 15) Naming Conventions (Backend to Frontend)

Quy ước đặt tên nhất quán từ Backend → Frontend cho mọi feature.

### Backend Layer

**Repository (`src/server/repos/<feature>.repo.ts`)**

- File: `<feature>.repo.ts` (singular, kebab-case)
- Export: `export const <feature>Repo = { ... }`
- Functions: `create`, `update`, `findById`, `list`, `delete`, `archive`, `unarchive`
- Types: `<Feature>CreateInput`, `<Feature>UpdateInput` (PascalCase, singular)

```typescript
// customer.repo.ts
export type CustomerCreateInput = CreateCustomerRequest & { createdById, updatedById, ... };
export const customerRepo = {
  async create(data: CustomerCreateInput) { ... },
  async findById(id: string) { ... },
};
```

**Service (`src/server/services/<feature>.service.ts`)**

- File: `<feature>.service.ts` (singular, kebab-case)
- Export: `export const <feature>Service = { ... }`
- Functions: `create`, `update`, `getById`, `list`, `delete` (business logic names)

```typescript
// customer.service.ts
export const customerService = {
  async create(currentUser, body) { ... },
  async getById(currentUser, id) { ... },
};
```

### API Routes

- Path: `/api/v1/<features>` (plural, kebab-case)
- Files: `route.ts` (Next.js convention)
- Endpoints: `GET /customers`, `POST /customers`, `GET /customers/[id]`, `PUT /customers/[id]`

### Frontend Layer

**API Client (`src/features/<features>/api/*.ts`)**

- Folder: `<features>` (plural, kebab-case)
- Files: `<action><Feature>.ts` (camelCase action + PascalCase singular)
- Functions: `<action><Feature>Api`

```typescript
// createCustomer.ts
export async function createCustomerApi(body: unknown) { ... }
// getCustomers.ts
export async function getCustomersApi(params?: GetCustomersQuery) { ... }
```

**React Query Hooks (`src/features/<features>/hooks/*.ts`)**

- Files: `use<Action><Feature>.ts` (PascalCase singular)
- Hooks: `use<Action><Feature>()` (query/mutation)

```typescript
// useCustomers.ts - Query
export function useCustomers(params?: GetCustomersQuery) {
  return useQuery({ queryKey: ["customers", params], ... });
}
// useCreateCustomer.ts - Mutation
export function useCreateCustomer() {
  return useMutation({ mutationFn: createCustomerApi, ... });
}
```

**Components (`src/features/<features>/components/*.tsx`)**

- Files: `<ComponentName>.tsx` (PascalCase)
- Naming: `Create<Feature>Modal`, `<Feature>Table`, `<Feature>Filters`

**Views (`src/features/<features>/views/*.tsx`)**

- Files: `<Feature><Context>View.tsx` (PascalCase singular + context)
- Export: `default function <Feature><Context>View()`
- Examples: `CustomerDailyView`, `CustomerListView`, `EmployeeListView`

**Constants (`src/features/<features>/constants.ts`)**

- Exports: `<FEATURE>_ENDPOINTS`, `<FEATURE>_QUERY_KEYS`, `<FEATURE>_MESSAGES`
- Options: `<OPTIONS_NAME>` (plural, UPPER_SNAKE_CASE): `PRIMARY_CONTACT_ROLES`

### Summary

| Layer           | Singular/Plural | Case                 | Example                   |
| --------------- | --------------- | -------------------- | ------------------------- |
| Repo file       | Singular        | kebab-case           | `customer.repo.ts`        |
| Repo export     | Singular        | camelCase            | `customerRepo`            |
| Service file    | Singular        | kebab-case           | `customer.service.ts`     |
| Service export  | Singular        | camelCase            | `customerService`         |
| API route       | Plural          | kebab-case           | `/api/v1/customers`       |
| Feature folder  | Plural          | kebab-case           | `features/customers/`     |
| API client file | Singular        | camelCase+PascalCase | `createCustomer.ts`       |
| API client fn   | Singular        | camelCase            | `createCustomerApi()`     |
| Hook file       | Singular        | PascalCase           | `useCreateCustomer.ts`    |
| Hook function   | Singular        | camelCase            | `useCreateCustomer()`     |
| Component file  | Singular        | PascalCase           | `CreateCustomerModal.tsx` |
| View file       | Singular        | PascalCase           | `CustomerDailyView.tsx`   |
| Constants file  | Singular        | lowercase            | `constants.ts`            |
