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
- Feature module: `src/features/<feature>/{api,components,hooks,views}` + `constants.ts` + **`index.ts`** (barrel export tổng).
- Layout: `src/layouts/AppLayout/*` (Header, Sider, Content, menu, theme).

## 3.1) Barrel Exports Pattern - Single index.ts

Mỗi feature có **1 file `index.ts` duy nhất** ở root làm Public API. Các subfolder (`api/`, `hooks/`, `components/`, `views/`) **KHÔNG CÓ** `index.ts`.

**Template:**

```typescript
// src/features/customers/index.ts

// ===== VIEWS =====
export { default as CustomerDailyView } from "./views/CustomerDailyView";

// ===== COMPONENTS =====
export { default as CustomerTable } from "./components/CustomerTable";

// ===== HOOKS =====
export * from "./hooks/useCustomers";
export * from "./hooks/useCreateCustomer";

// ===== CONSTANTS =====
export * from "./constants";

// NOTE: API layer KHÔNG export (internal - hooks wrap them)
```

**Import Rules:**

```typescript
// ✅ External → Feature barrel
import { CustomerDailyView, useCustomers } from "@/features/customers";

// ✅ Internal → Specific file
import { useCustomers } from "../hooks/useCustomers";

// ❌ External → Deep path
import { useCustomers } from "@/features/customers/hooks/useCustomers"; // BAD
```

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

## 7.1) React Hooks Best Practices

- **Memoization**: Objects/arrays trong dependencies của `useEffect`/`useCallback`/`useMemo` phải được memoize để tránh infinite re-render.

- **Form defaultValues Pattern**: Khi dùng `useForm` với dynamic `defaultValues` + `useEffect` reset, luôn inline logic trong `useMemo`:

  ```typescript
  const defaultValues = useMemo(
    () => ({
      field1: initialData?.field1 || "",
      field2: initialData?.field2 || "",
    }),
    [initialData]
  );

  useEffect(() => {
    if (open) reset(defaultValues);
  }, [open, reset, defaultValues]);
  ```

## 8) Ant Design & UI

- Hạn chế CSS ngoài; ưu tiên token trong `ConfigProvider`.
- Header sticky; Sider/Content scroll độc lập. Responsive bằng `Grid.useBreakpoint()`.
- Menu: icon cấp 1; children không icon; `key` = path để sync state.
- **Modal**: Luôn dùng `destroyOnHidden` (thay vì `destroyOnClose` - deprecated trong AntD v5.21+).

## 8.1) Daily View Pattern

**Cấu trúc chuẩn cho `<Feature>DailyView`** (áp dụng cho Customer, Appointment, etc.):

1. **PageHeaderWithDateNav** (`src/shared/components`) - Date navigation với prev/today/next
2. **ClinicTabs** (`src/shared/components`) - Tab switcher cho admin (ẩn nếu ≤1 clinic)
3. **Statistics Component** - Cards hiển thị metrics (tổng, trạng thái, etc.)
4. **Filters Component** - Search bar + action buttons (Create, Export, etc.)
5. **Table Component** - Data table với actions

```typescript
export default function FeatureDailyView() {
  const { user } = useCurrentUser();
  const { selectedDate, goToPreviousDay, goToToday, goToNextDay, handleDateChange } = useDateNavigation();
  const [selectedClinicId, setSelectedClinicId] = useState(user?.clinicId);

  return (
    <div>
      <PageHeaderWithDateNav {...dateNavProps} />
      <ClinicTabs value={selectedClinicId} onChange={setSelectedClinicId} />
      <FeatureStatistics data={data} loading={isLoading} />
      <FeatureFilters onCreate={...} dailyCount={total} />
      <FeatureTable data={data} loading={isLoading} />
      <CreateModal ... />
    </div>
  );
}
```

## 8.2) Table Actions Column Pattern

**Cột "Thao tác" chuẩn** với 2 nhóm button có phân cách:

```typescript
{
  title: "Thao tác",
  key: "actions",
  width: 250-300, // Tùy số lượng buttons + text
  fixed: "right",
  render: (_, record) => (
    <Space split={<Divider type="vertical" />}>
      {/* Group 1: Quick Actions - text + icon, có màu */}
      <Space size="small">
        {condition1 && (
          <Button type="primary" size="small" icon={<Icon1 />} onClick={...}>
            Action Text
          </Button>
        )}
        {condition2 && (
          <Button type="default" size="small" icon={<Icon2 />} onClick={...}>
            Action Text
          </Button>
        )}
      </Space>

      {/* Group 2: Edit & Delete - icon only */}
      <Space size="small">
        <Tooltip title="Sửa">
          <Button icon={<EditOutlined />} onClick={...} />
        </Tooltip>
        <Popconfirm title="..." description="..." onConfirm={...}>
          <Tooltip title="Xóa">
            <Button danger icon={<DeleteOutlined />} />
          </Tooltip>
        </Popconfirm>
      </Space>
    </Space>
  ),
}
```

**Rules:**

- ✅ **2 nhóm button phân biệt**: Quick Actions (text + icon) | Edit & Delete (icon only)
- ✅ **Divider phân cách**: `<Space split={<Divider type="vertical" />}>`
- ✅ **Nhóm 1 - Quick Actions**: Text + icon, có màu `type="primary"/"default"`, `size="small"`
- ✅ **Nhóm 2 - Edit/Delete**: Icon-only với Tooltip, always visible, cuối cùng
- ✅ **Fixed right** để cột luôn hiển thị khi scroll
- ✅ **Popconfirm** cho actions nguy hiểm (delete, status change)
- ✅ **Loading state** riêng cho async actions

## 8.3) Table Columns Memoization

**Luôn wrap `columns` trong `useMemo`** để tránh Ant Design CSS-in-JS warning "cleanup function after unmount".

```typescript
const columns = React.useMemo<ColumnsType<DataType>>(
  () => [
    {
      title: "Name",
      filters: dynamicFilters.map((item) => ({ text: item, value: item })),
      sorter: (a, b) => a.name.localeCompare(b.name),
      // ...
    },
    // ...
  ],
  [dynamicFilters, onEdit, onDelete, actionLoading]
);
```

**Rules:**

- ✅ Dependencies: dynamic filters/sorters, handlers, loading states
- ❌ KHÔNG include `data` prop (chỉ dùng trong render functions)

## 8.4) Select Search Pattern (Debounce + Loading)

**Remote search Select** với debounce và loading states.

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
  notFoundContent={
    isFetching ? (
      <Spin size="small" />
    ) : debounced.length >= 2 ? (
      "Không tìm thấy"
    ) : debounced.length > 0 ? (
      "Nhập ít nhất 2 ký tự"
    ) : (
      "Nhập để tìm kiếm"
    )
  }
  options={data.map((i) => ({ label: i.name, value: i.id }))}
/>;
```

**Rules:**

- ✅ Debounce 500ms, 4 states (loading/no-results/partial/empty), `filterOption={false}`

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

### Repository Method Naming

- **`list()`**: Paginated list với filters/search/sort
- **`listDaily()`**: Daily view (date range filter), return `{ items, count }`
- **`create()`, `update()`, `delete()`**: CRUD operations
- **`getById()`, `findById()`**: Single record by ID

**Daily View Pattern**:

```typescript
// ✅ Repo: Nhận dateStart/dateEnd (no business logic)
async listDaily(params: { clinicId: string; dateStart: Date; dateEnd: Date }) {
  return prisma.model.findMany({
    where: { clinicId, createdAt: { gte: dateStart, lt: dateEnd } },
  });
  return { items, count: items.length };
}

// ✅ Service: Tính toán time range
const dateStart = new Date(date); dateStart.setHours(0,0,0,0);
const dateEnd = new Date(date); dateEnd.setHours(23,59,59,999);
await repo.listDaily({ clinicId, dateStart, dateEnd });
```

**Rules**:

- Repo chỉ query, không tính toán logic (separation of concerns)
- Daily view return `{ items, count }` (consistent API shape)
- Filter dùng `gte/lt` (không `lte` để tránh overlap)

## 14) Validation Layers

**Validation chỉ ở 3 nơi**:

1. **Frontend form** (`CreateCustomerFormSchema`) - User input validation
2. **API Route** (Zod schema) - Request/response validation at boundary
3. **Service layer** (Business logic) - Email uniqueness, FK existence, state transitions

**Quy tắc**:

- ✅ Validate ở boundaries: API routes, external input
- ✅ Validate business rules ở Service layer
- ❌ KHÔNG validate internal transformations: Mappers, repo results, type conversions

**Mapper Pattern** (`src/server/services/<feature>/_mappers.ts`):

```typescript
// ✅ Transform only - NO validation
export function mapCustomerToResponse(row: Customer): CustomerResponse {
  return {
    id: row.id,
    dob: row.dob ? row.dob.toISOString() : null, // Date → ISO
  };
}
```

## 15) Naming & Zod Schemas

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
