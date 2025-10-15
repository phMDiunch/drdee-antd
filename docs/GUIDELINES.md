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
- Data access: `src/server/repos/*` (Prisma thuần).
- Feature module: `src/features/<feature>/{api,components,hooks,views}` + `constants.ts` (không cần `types.ts`, `index.ts` chính).
- Barrel exports: `src/features/<feature>/{api,hooks}/index.ts` (export từ subfolder).
- Layout: `src/layouts/AppLayout/*` (Header, Sider, Content, menu, theme).

## 4) Next.js & Supabase

- `cookies()` là async; trong server/route luôn `const supabase = await createClient()`.
- Session Supabase qua HttpOnly cookie (không lưu token ở JS).
- `(private)/layout.tsx` (SSR) gọi `getSessionUser()` để inject `currentUser`.
- Middleware bảo vệ `(private)`; chặn truy cập nếu chưa đăng nhập.

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

## 13) Naming & Zod Schemas

- Request: `<Feature><Action>RequestSchema` (vd: `CreateClinicRequestSchema`).
- Response (1 item): `<Feature>ResponseSchema`.
- Response (list): `<Feature>ListResponseSchema` hoặc `<Feature>sResponseSchema`.
- Query/Params: `<Action>QuerySchema`, `<Action>ParamsSchema`.
- Types: `import type { z } from "zod"; type X = z.infer<typeof XSchema>` (dùng trực tiếp trong component/hook, không tạo file types.ts riêng).
