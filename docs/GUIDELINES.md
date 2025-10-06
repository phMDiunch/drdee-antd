# Project Guidelines (Single Source of Truth)

_Stack: Next.js 15 (App Router) · Ant Design · Supabase · React Query · Zod_

---

## 1) Chính sách dependency

- Không thêm thư viện khi chưa được duyệt. Ưu tiên: AntD, @tanstack/react-query, Supabase, dayjs, **Zod** (đã phê duyệt cho schema).
- Lý do Zod: chuẩn hoá **request/response schema** dùng chung client + server, giảm bug, dễ scale.

## 2) Kiến trúc & phân lớp (Frontend-driven)

**Luồng phát triển:** Requirements → UI/UX → Frontend → API Contract → Backend → Database

- **Feature module (Frontend)** → `src/features/<feature>/{views,components,hooks,api}` + `types.ts`+`constants.ts`+`index.ts`.
- **Schema (Zod)** → `src/shared/validation/` (API contract được định nghĩa từ frontend needs).
- **API routes** → `/api/v1/<feature>/` (implement theo contract đã định nghĩa).
- **Business logic (server)** → `src/server/services/` (ghép Supabase/Prisma, rule nghiệp vụ).
- **Data access (Prisma)** → `src/server/repos/` (nếu có).
- **AppShell** → `src/layouts/AppLayout/*` (Header, Sider, Content, menu config, theme).

## 3) Next.js 15 & Supabase

- `cookies()` là **async** → ở server/route luôn `const supabase = await createClient()`.
- Session do Supabase quản lý qua **HttpOnly cookie** (không lưu token ở JS).
- `(private)/layout.tsx` là **SSR**: gọi `getSessionUser()` để inject `currentUser` cho Header/AppLayout.
- **Middleware** bảo vệ `(private)`; không cho truy cập nếu chưa login.

## 4) Auth

- **Login**: `POST /api/v1/auth/login` → validate body bằng Zod → `supabase.auth.signInWithPassword` → Supabase set cookie → trả `{ user }`.
- **Logout**: `POST /api/v1/auth/logout` → `supabase.auth.signOut()` → xóa cookie.
- **Header**: **SSR inject** user (khuyến nghị). `/api/v1/auth/me` là optional khi cần client fetch.
- Chặn **open redirect** bằng `sanitizeNext()` – chỉ cho phép `?next=` bắt đầu bằng `/`.

## 5) API conventions

- Mọi route dưới `/api/v1/...`:
  - **Parse request** bằng Zod → `400` nếu invalid.
  - Map lỗi dịch vụ → `{ error: string }` với status hợp lý (401/403/404/409/500…).
  - Không redirect trong API; redirect ở UI/hook.
- **API client** (trong `features/<feature>/api`):
  - `fetch` → **parse response** bằng Zod; nếu !ok ném `Error(message)`.

## 6) React Query vs Zustand

- **React Query** (server-state):
  - `useQuery` cho GET, `useMutation` cho POST/PUT/PATCH/DELETE.
  - Quản lý loading/error/success + invalidate/prefetch.
  - Đừng dùng Zustand/Context để cache dữ liệu server.
- **Zustand** (UI-state): chỉ cho trạng thái giao diện cục bộ (toggle sider, filters, modal…). Không giữ session/dữ liệu server.

## 7) Ant Design & UI

- Hạn chế CSS ngoài; ưu tiên **token** của AntD trong `ConfigProvider`.
- Header **sticky**; Sider/Content **scroll độc lập**.
- Responsive: `Grid.useBreakpoint()`; mobile có hamburger + modal search.
- Menu: icon cấp 1; **children không icon**; `key` = path để sync `selectedKeys/openKeys`.

## 8) Validation & Error UX

- Client: form AntD có thể dùng rule + (tuỳ chọn) Zod field-level; trước khi gọi API nên parse Zod form-level.
- Server: mọi request parse bằng Zod; map lỗi Supabase/DB → thông điệp tiếng Việt thân thiện.
- Dùng `App.useApp().message` cho toast; tránh spam.

## 9) Tên, Imports, Tổ chức file

- Component: PascalCase (`LoginForm.tsx`), hook: camelCase (`useLogin.ts`).
- Dùng alias `@/` (không `../../..`) – cấu hình trong `tsconfig.json`.
- Mỗi feature có `index.ts` (barrel exports).

## 10) Bảo mật

- Không gửi secrets về client.
- Tránh **open redirect**.
- Role-based guard ở server (`requireRole()`), không tin role từ client.
- Log lỗi server hợp lý; không trả lỗi raw DB xuống client.

## 11) Ngày giờ

- DB lưu UTC; UI format theo `vi` (dayjs). Không hardcode offset; timezone mặc định: Asia/Bangkok.

## 12) Testing & PR

- Mỗi feature có `docs/features/<feature>.md` (overview, flow, API, validate, checklist).
- **Conventional commits**: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `test:`.
- PR: build ok, typecheck ok, lint ok; đính kèm ảnh/GIF UI nếu đổi UI.

## 13) Khi thêm feature mới (Luồng Frontend-first)

1. Viết `docs/requirements/<feature>.md` (yêu cầu nghiệp vụ).
2. Viết `docs/features/<feature>.md` (spec chi tiết UI/UX, flows).
3. **Frontend first**: tạo module `features/<feature>/{views,components,hooks,api}` + `types.ts`, `constants.ts`, `index.ts`.
4. Định nghĩa API contract: tạo schema Zod ở `shared/validation/<feature>.schema.ts` (dựa trên frontend needs).
5. **Backend implement theo contract**: route API dưới `/api/v1/<feature>/...`.
6. Thêm `server/services/<feature>.service.ts` (business logic server).
7. Thêm test checklist; review theo guideline này.

## 14) Naming & Schemas (Zod, API, Types) - Frontend-driven

1. Zod schemas (ở `src/shared/validation`) - **được định nghĩa dựa trên frontend needs**

- **Request body**: `<Feature><Action>RequestSchema`
  - Ví dụ: `LoginRequestSchema`, `CreateClinicRequestSchema`, `UpdateClinicRequestSchema`
  - Thiết kế dựa trên form fields và business logic của frontend
- **Response (1 item)**: `<Feature>ResponseSchema`
  - Ví dụ: `ClinicResponseSchema`, `UserResponseSchema`
  - Thiết kế dựa trên data cần hiển thị ở UI components
- **Response (list)**: `<Feature>ListResponseSchema` hoặc `<Feature>sResponseSchema`
  - Ví dụ: `ClinicsResponseSchema` (array của `ClinicResponseSchema`)
- **Query/Params**: `<Action>QuerySchema`, `<Action>ParamsSchema`
  - Ví dụ: `GetClinicsQuerySchema`, `ClinicIdParamsSchema`
- **Tên type**: dùng `z.infer` để sinh `Request/Response` tương ứng
  - Ví dụ: `export type ClinicResponse = z.infer<typeof ClinicResponseSchema>`

> Ghi chú: Tránh dùng hậu tố `Dto` cho Zod schema ở lớp API — vì `DTO` quá rộng. Nếu thật sự cần `DTO` (cho lớp service/repo), đặt ở **`server/`** và **không** dùng chung với schema API.

2. File đặt tên

- Schema theo feature: `src/shared/validation/clinic.schema.ts`, `auth.schema.ts`, ...
- Mỗi feature FE: `api/`, `components/`, `hooks/`, `views/`, `types.ts`, `constants.ts`, `index.ts`.
- Endpoint constants: `CLINIC_ENDPOINTS.*`, Query Keys: `CLINIC_QUERY_KEYS.*`.

3. Response chuẩn

- API trả về **response object** theo `<Feature>ResponseSchema`.
- Thông báo lỗi chuẩn: `{ error: string }` với status phù hợp (400/401/403/409/500).
