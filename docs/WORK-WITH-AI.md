# Quy Tắc & Yêu Cầu Làm Việc Với AI

Tài liệu này giúp đội ngũ và AI phối hợp hiệu quả: code nhanh, chuẩn, dễ bảo trì. Dùng như checklist trước khi bắt đầu task.

## 1. Mục Tiêu & Phạm Vi

- Giảm trao đổi rườm rà; ra code theo chuẩn nhất quán.
- Mọi thay đổi bám theo docs trong repo (requirements, guidelines, structure).
- Ưu tiên an toàn & khả năng bảo trì thay vì “hack nhanh”.

## 2. Cách Giao Tiếp

- Giao task theo nhóm nhỏ và chọn luồng phát triển phù hợp:
  - API‑first (mặc định): requirements → database → API → backend → frontend
  - Frontend‑driven (khi cần): UI/UX → frontend → API contract → backend
- AI thực hiện theo luồng đã chọn; gửi đúng nhóm file theo thứ tự; chờ xác nhận trước khi làm tiếp nếu mơ hồ.
- Khi báo lỗi, vui lòng kèm log ngắn + code frame để AI xử lý nhanh.
- Cần thêm thư viện mới: phải hỏi. Không tự ý thêm.
- Trả lời ngắn‑gọn‑rõ, ưu tiên kết quả.

## 3. Tech Stack & Quy Ước Bắt Buộc

- Ant Design: UI‑only (layout, components, icons). Hạn chế CSS ngoài; ưu tiên props & token.
- React Hook Form + Zod: form state & validation (dùng `zodResolver(schema)`).
- React Query: quản lý server‑state (queries/mutations). Không dùng Zustand cho server‑state.
- SSR: `(private)/layout.tsx` inject `currentUser` + data layout‑wide khi phù hợp.
- Prisma + Supabase: DB & auth session phía server.
- Tuân thủ AntD v5 + React 19.

## 4. Cấu Trúc Thư Mục & Đặt Tên

- Feature pattern (linh hoạt theo luồng phát triển)

```
src/features/<feature>/
  views/        # page-level composition
  components/   # UI-only building blocks
  hooks/        # React Query (queries/mutations) + barrel export index.ts
  api/          # fetch wrappers + Zod parse (contract) + barrel export index.ts
  constants.ts  # endpoints, query keys, messages per-domain
  # ❌ Không cần: types.ts (dùng z.infer trực tiếp), index.ts chính
```

- Server

```
src/server/
  repos/        # Prisma + Zod types, 3 patterns chuẩn (Simple/Complex/Relations)
  services/     # Business logic, ServiceError, guards
```

- Validation dùng chung (single source of truth)

```
src/shared/validation/*.schema.ts  # Zod schemas FE/BE + types via z.infer
```

- Layouts: `src/layouts/AppLayout/*` (Header, Sidebar, menu.config.ts, AppLayout.tsx)
- Zod naming:
  - Request: `<Feature><Action>RequestSchema`
  - Response (1 item): `<Feature>ResponseSchema`
  - Response (list): `<Feature>ListResponseSchema` hoặc `<Feature>sResponseSchema`
  - Query: `<Action>QuerySchema` hoặc `Get<Feature>sQuerySchema`
- Query Keys (React Query):
  - List: `['<features>', { ...filters }]`
  - Detail: `['<feature>', id]`
- Types: `import type { z } from "zod"; type X = z.infer<typeof XSchema>` (trong component/hook, không tạo file types riêng)

## 5. Workflow Theo Feature

### API‑first (mặc định)

- Cập nhật docs trước:
  - `docs/requirements/<NNN Feature>.md` (yêu cầu nghiệp vụ)
  - `docs/features/<feature>.md` (spec/ghi chú sau khi implement)
- Backend: database design + API contract (Zod) + services + repos + routes
- Frontend: views + components + hooks + api (consume API đã sẵn sàng)
- Kiểm thử: acceptance (Given‑When‑Then) + edge cases (409, 403, 400…)

### Frontend‑driven (khi cần)

- Cập nhật docs trước (như trên)
- Frontend dựng UI + xác định data needs → định nghĩa API contract (Zod) → implement backend theo contract

## 6. API & Validation (chuẩn)

- API route (App Router): validate input (body/query) bằng Zod; gọi service; validate output (map DB + ResponseSchema) trước khi trả response.
- Client: mọi response phải parse bằng Zod ở API client (api/\*.ts) để phát hiện lệch hợp đồng sớm.

### 6.1 Repository Patterns (chuẩn hoá)

Repo types dựa trên Zod schemas với 3 patterns:

- **Simple** (Clinic): `API Schema = Repo Type`
- **Complex + Server Fields** (Customer, Dental Service): `API Schema + { createdById, updatedById }`
- **Complex + Relations** (Employee): `API Schema + { clinic: { connect }, createdBy: { connect } }`

Không duplicate types; luôn extend từ Zod schemas làm single source of truth.

### 6.2 Thông Báo & Lỗi (chuẩn hoá)

- Luôn dùng `useNotify()` thay vì gọi trực tiếp `App.useApp().message`.
- Dùng `COMMON_MESSAGES` cho fallback chung (`src/shared/constants/messages.ts`).
- Trên server (API routes):
  - Nếu `ServiceError` → `{ error, code }` + `status = httpStatus`.
  - Lỗi không xác định → dùng `COMMON_MESSAGES.SERVER_ERROR`.
  - Lỗi Zod/validation → dùng `COMMON_MESSAGES.VALIDATION_INVALID` hoặc lấy `issues[0].message`.

## 7. UI/UX Tiêu Chuẩn

- AntD UI‑only; hạn chế viết CSS ngoài.
- Field required có dấu `*` (set `required` trên Form.Item khi phù hợp).
- Tooltip + Icon cho action; Popconfirm cho xoá.
- Loading/Empty/Error states rõ ràng.
- Responsive bằng AntD Grid; không thêm CSS framework khác nếu chưa duyệt.

## 8. Performance & Testing

- Tránh gọi API thừa; cân nhắc pagination khi list lớn.
- React Query `staleTime` hợp lý; invalidate keys đúng chỗ.
- Acceptance theo Given‑When‑Then; kèm edge cases (409, 403, 404, 400).

## 9. Security & Quyền Hạn

- Ghi (create/update/delete/archive) = admin‑only (server‑side check).
- SSR inject session & data layout‑wide để tránh fetch thừa.
- Không tin dữ liệu role từ client; mọi guard đặt ở service.

## 10. Template Giao Task Cho AI (Ngắn)

```
[Task] Feature: <Tên> – <Mô tả ngắn>
Luồng: [API-first (mặc định) | Frontend-driven]
Mục tiêu: ...
Phạm vi: (gồm/không gồm)
Acceptance (Given‑When‑Then): ...

# Nếu chọn API-first:
Database: entities, relationships, constraints
API: endpoints + business logic requirements
UI: màn hình consume API, states (loading/empty/error)

# Nếu chọn Frontend-driven:
UI: màn hình/modal, states (loading/empty/error), responsive
API: endpoints + contracts (định nghĩa từ UI needs)

Files theo luồng:
- API-first: shared/validation → server/repos (chọn pattern) → server/services → api routes → frontend
- Frontend-driven: views/components/hooks/api → shared/validation → server/repos → server/services

Ghi chú kỹ thuật (nếu có)
```

## 11. TypeScript & Code Quality

- **Strict Mode**: Không sử dụng `any` type, thay bằng `unknown` + type guards khi cần.
- **Error Handling**: Trong API routes, sử dụng proper type checking:

  ```typescript
  // ✅ Correct
  if (typeof e === "object" && e !== null && "name" in e && e.name === "ZodError")

  // ❌ Wrong
  if (e?.name === "ZodError") // Error: Property 'name' does not exist on type '{}'
  ```

- **React Hooks**: Tuân thủ exhaustive-deps rule, sử dụng `useCallback`/`useMemo` đúng cách.
- **Next.js 15**: Luôn wrap `useSearchParams()` trong `<Suspense>` boundary.

## 12. Xin Thêm Thư Viện

- Bắt buộc hỏi trước khi thêm (ngoài AntD, RHF, Zod, React Query, Prisma, Supabase).
- Khi đã được duyệt, AI mới tách hạng mục & code theo.
