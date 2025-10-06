# Quy tắc & Yêu cầu làm việc với AI (Project: Phần mềm quản lý nha khoa)

Tài liệu này tóm tắt cách mình (AI) và bạn phối hợp để code nhanh, đúng chuẩn và dễ bảo trì. Dùng làm “checklist” trước khi bắt đầu mỗi task.

## 1. Mục tiêu & Phạm vi hợp tác

- Giảm trao đổi rườm rà, ra code theo chuẩn thống nhất.
- Mọi thay đổi đều bám theo docs trong repo (requirements, guideline, structure).
- Ưu tiên an toàn & khả năng bảo trì hơn “hack nhanh”.

## 2. Cách giao tiếp (Communication Rules)

- Bạn giao task theo nhóm nhỏ (ví dụ: UI/views → components → hooks → api → backend).
  Mình gửi từng nhóm file theo thứ tự frontend-first, chờ bạn xác nhận rồi mới gửi nhóm kế tiếp.
- Khi báo lỗi, vui lòng đính kèm log ngắn + code frame để mình fix nhanh.
- Nếu cần thêm thư viện mới → mình sẽ hỏi. Bạn đồng ý thì mới tích hợp.
- Tránh khối lượng lớn trong một lần trả lời; ưu tiên ngắn-gọn-rõ.

## 3. Tech Stack & Quy ước bắt buộc

- Ant Design: dùng UI-only (layout, components, icons).
  Hạn chế CSS ngoài; ưu tiên props & token có sẵn của AntD.
- React Hook Form + Zod: form state & validation.
  --- Không dùng Form.Item rules của AntD để validate (trừ required để hiển thị dấu \*).
  --- Dùng zodResolver(schema); message lỗi lấy từ Zod.
- React Query: quản lý server-state (queries/mutations).
  --- Không dùng Zustand cho server-state; Zustand chỉ cho UI state cục bộ (nếu thật sự cần).
- SSR: (private)/layout.tsx inject currentUser và dữ liệu layout-wide (ví dụ currentClinic cho Header).
- Prisma + Supabase: DB & auth session bên server.
- Tương thích AntD v5 + React 19: tuân thủ cảnh báo/khuyến nghị của AntD (vd: destroyOnHidden thay destroyOnClose).

## 4. Cấu trúc thư mục & đặt tên (bắt buộc)

- Feature pattern (Frontend-first)

```
src/features/<feature>/
  views/        # page-level composition (bắt đầu từ đây)
  components/   # UI-only building blocks
  hooks/        # React Query (queries/mutations)
  api/          # fetch wrappers + parse response bằng Zod (contract)
  types.ts
  constants.ts  # endpoints, query keys,...
  index.ts

```

- Server

```
src/server/
  repos/        # Prisma truy vấn thuần
  services/     # Business logic, ServiceError, normalize/unique, guard quyền

```

- Validation dùng chung

```
src/shared/validation/*.schema.ts  # Zod schemas FE/BE (single source of truth)

```

- Layouts

```
src/layouts/AppLayout/* (Header, Sidebar, menu.config.ts, AppLayout.tsx)

```

- Đặt tên Zod schema
  --- Request: <Feature><Action>RequestSchema (vd: CreateClinicRequestSchema)
  --- Response (1 item): <Feature>ResponseSchema
  --- Response (list): <Feature>sResponseSchema
  --- Query: <Feature>QuerySchema hoặc Get<Feature>sQuerySchema
- Query Keys (React Query)
  --- List: ['<features>', { ...filters }]
  --- Detail: ['<feature>', id]

## 5. Quy trình phát triển theo feature (Workflow Frontend-first)

- Cập nhật docs trước:
  --- docs/requirements/<NNN Feature>.md (yêu cầu nghiệp vụ)
  --- docs/features/<feature>.md (spec chi tiết UI/UX)
  --- Ghi ADR ngắn vào docs/decisions.md nếu có thay đổi kỹ thuật.
- **Frontend first**: views → components → hooks → api (định nghĩa contract).
- **API contract**: Zod schemas (shared validation) dựa trên frontend needs.
- **Backend implement**: API routes → services → repos (implement theo contract).
- Kiểm thử: acceptance checklist (Given–When–Then) + edge cases (409, 403, 400…).

## 6. Quy tắc code quan trọng

- Form (RHF + Zod)
  --- Dùng zodResolver + mode: "onBlur" / reValidateMode: "onChange".
  --- AntD Input: value={field.value ?? ""} để tránh undefined/null.
  --- Optional fields (phone, email…): dùng z.preprocess để map "" → undefined.
- AntD Modal
  --- Chỉ mount modal khi mở hoặc dùng forceRender.
  --- Body scroll: styles={{ body: { maxHeight: '70vh', overflowY: 'auto' }}}.
  --- Kích thước: width={900} hoặc responsive (95vw/breakpoints).
- Header/Sidebar
  --- Không hardcode menu trong component; khai báo ở menu.config.ts.
  --- Header cố định; content cuộn; sidebar có scroll riêng.
- Error shape chuẩn: server trả { error: string, code?: string } + HTTP status.
- Unique & Delete rule: unique check tại service; delete chặn khi còn liên kết → yêu cầu archive.

## 7. Tài liệu & “single source of truth”

- Requirements: docs/requirements/<NNN Feature>.md (đầu bài & acceptance).
- Feature spec: docs/features/<feature>.md (luồng, structure, validate, UI notes).
- Guideline: docs/guideline.md (quy tắc chung).
- Decisions: docs/decisions.md (ADR ngắn).
- Project structure: docs/project_structure.md.

* Bất kỳ thay đổi behavior nào phải cập nhật docs trước, rồi mới code.

## 8. API & Validation (chuẩn)

- API route (App Router): validate input (body/query) bằng Zod; gọi service; validate output (map DB → ResponseSchema) trước khi trả response.
- Client: mọi response phải parse bằng Zod ở API client (api/\*.ts) để phát hiện lệch hợp đồng sớm.

## 9. UI/UX tiêu chuẩn

- AntD UI-only; hạn chế viết CSS ngoài.
- Field required có dấu \* (set required trên Form.Item).
- Tooltip + Icon cho action; Popconfirm cho xoá.
- Loading/Empty/Error states rõ ràng.
- Responsive bằng AntD Grid; không dùng CSS framework khác nếu chưa được duyệt.

## 10. Performance & Testing

- List nhỏ → không phân trang; tránh gọi API thừa.
- React Query staleTime hợp lý; invalidate keys đúng nơi.
- Acceptance theo Given–When–Then, kèm edge cases (409, 403, 404, 400).

## 11. Security & Quyền hạn

- Ghi (create/update/delete/archive) = admin-only (server-side check).
- SSR inject session & dữ liệu layout-wide để tránh fetch thừa.
- Không tin dữ liệu role từ client; mọi guard ở service.

## 12. Khi bạn giao task cho mình (Template ngắn)

```
[Task] Feature: <Tên> – <Mô tả ngắn>
Mục tiêu: ...
Phạm vi: (gồm/không gồm)
Acceptance (Given–When–Then): ...
UI: màn hình/modal, states (loading/empty/error), responsive
API: endpoint + contracts (link schema) - sẽ định nghĩa sau khi có UI
Files chạm (theo thứ tự): views/components/hooks/api → validation → server
Ghi chú kỹ thuật: (nếu có)

```

## 13. Khi cần mình nhớ “bối cảnh” nhanh

- Gửi context pack nhỏ (chỉ liên quan task):
  --- docs/requirements/<NNN>.md, docs/features/<feature>.md, docs/guideline.md, docs/decisions.md
  --- Folder src/features/<feature> (nếu đã có)
  --- Schemas liên quan ở shared/validation
  --- Server files liên quan ở server/{repos,services} & app/api/v1/...

## 14. Nguyên tắc “hỏi trước – làm sau”

- Bất kỳ thư viện mới (ngoài AntD, RHF, Zod, React Query, Prisma, Supabase) → mình hỏi bạn trước.
- Bạn đồng ý → mình mới tích hợp & code theo.
