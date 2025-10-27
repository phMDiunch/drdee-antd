# Treatment Care Spec (End-to-End)

Nguồn tham chiếu duy nhất cho nghiệp vụ, API và UI/UX của tính năng Chăm sóc sau điều trị (Treatment Care), hợp nhất từ backend tới frontend để tránh thiếu sót logic.

---

## 1) Phạm vi & Mục tiêu
- Ghi nhận chăm sóc khách hàng theo từng ngày điều trị, thời điểm gọi/chăm, nội dung chăm sóc và trạng thái.
- Hỗ trợ nhân viên chăm sóc (care staff) thao tác nhanh theo danh sách khách theo ngày; xem lịch sử chăm sóc 35 ngày gần nhất.
- Nhóm dữ liệu theo ngày hoặc theo khách hàng; đếm số lần chăm sóc trong ngày; hỗ trợ lọc chỉ bản thân (onlyMine) và theo chi nhánh.

## 2) Data Model (Prisma)
Model `TreatmentCare`:
- id (uuid)
- customerId (string) → Customer
- clinicId (string) — theo clinic của care staff (hoặc header)
- careStaffId (string) → Employee (người chăm sóc)
- treatmentDate (Date) — ngày điều trị (Date‑only)
- careAt (DateTime, tz) — thời điểm chăm sóc (thực tế)
- careContent (string)
- careStatus (enum TreatmentCareStatus): STABLE | UNREACHABLE | NEEDS_FOLLOW_UP
- Snapshot theo treatmentDate: treatmentServiceNames[], treatingDoctorNames[], treatingDoctorIds[], treatmentClinicIds[]
- Audit: createdById, updatedById, createdAt, updatedAt
- Indexes theo clinicId, careAt, careStaffId, customerId, treatmentDate

Enums: `TreatmentCareStatus` như trên.

## 3) Luật nghiệp vụ
- Tạo bản ghi chăm sóc yêu cầu:
  - `customerId`, `treatmentDate` (YYYY‑MM‑DD), `careAt` (ISO), `careStatus`, `careContent`.
  - Header phải có `x-employee-id` (care staff). `clinicId` lấy từ header `x-clinic-id` hoặc từ employee profile.
  - `careAt` phải cùng ngày hoặc sau `treatmentDate` (VN TZ).
  - Phải tồn tại ít nhất 1 TreatmentLog trong ngày `treatmentDate` của khách (VN TZ). Nếu không → 422 (không có cơ sở chăm sóc).
- Snapshot fields tính từ TreatmentLogs trong ngày đó (dịch vụ, bác sĩ, clinic).
- Xóa bản ghi:
  - Non‑admin: chỉ được xóa bản ghi của chính mình (careStaffId = employeeId) và chỉ trong cùng ngày VN với `careAt`.
  - Admin: xóa tự do.
- Lọc theo clinic:
  - Non‑admin: auto scope clinic theo profile; Admin: có thể chỉ định `clinicId` filter.

## 4) API Contract
- GET `/api/treatment-cares?from=YYYY-MM-DD&to=YYYY-MM-DD[&groupBy=day][&onlyMine=1|0][&clinicId=][&customerId=]`
  - Headers: `x-employee-role`, `x-employee-id`, `x-clinic-id`.
  - Nếu có `customerId` → trả danh sách (flat) bản ghi của khách theo `careAt` desc.
  - Nếu không có `customerId`: trả theo range (mặc định 35 ngày: to = hôm nay, from = to − 34 ngày), group theo day (mặc định) → `{ day, items[] }` hoặc flat khi groupBy khác.
  - Include: `customer { id, code, fullName, phone }`, `careStaff { id, fullName }`.

- GET `/api/treatment-cares/customers?date=YYYY-MM-DD[&keyword=][&clinicId=]`
  - Headers: như trên.
  - Trả danh sách khách có TreatmentLogs trong ngày `date`, gộp theo khách:
    - Fields: `customerId/code/name/phone`, `treatmentDate` (date), `treatmentServiceNames[]`, `treatingDoctorNames[]`, `careCount` (số bản ghi TreatmentCare trong ngày đó, theo clinic scope).
  - `keyword` filter theo code/name/phone (case‑insensitive).

- POST `/api/treatment-cares`
  - Headers: `x-employee-id` (bắt buộc), `x-clinic-id` (ưu tiên nếu có).
  - Body: `{ customerId, treatmentDate: YYYY-MM-DD, careAt: ISO, careStatus: enum|string, careContent }`.
  - Validate như luật nghiệp vụ; coerce `careStatus` khi gửi string (uppercased và check enum).
  - Tạo bản ghi với snapshots và audit (`createdById=updatedById=employeeId`), `careStaffId=employeeId`, `clinicId` lấy từ header hoặc employee profile.
  - Trả 201: bản ghi mới.

- DELETE `/api/treatment-cares/{id}`
  - Headers: `x-employee-role`, `x-employee-id`.
  - Non‑admin: chỉ xóa bản ghi của mình và chỉ trong ngày tạo (VN TZ). Admin: xóa tự do.
  - 404 nếu không tồn tại; 403 nếu không đủ quyền.

Lỗi: 400 thiếu dữ liệu/clinicId; 401 thiếu employeeId; 403 không đủ quyền; 404 không tìm thấy; 422 không có TreatmentLog trong ngày; 500 server.

## 5) Frontend – Hành vi & UI
- TreatmentCareCustomerTable (danh sách khách cần chăm sóc):
  - Chọn ngày (mặc định: hôm qua), di chuyển ngày, tìm kiếm theo từ khóa.
  - Bảng hiển thị mã KH, tên (link), biểu tượng phone, danh sách dịch vụ điều trị, danh sách bác sĩ, số lần CS trong ngày; nút “Chăm sóc” mở modal.
  - Modal TreatmentCareModal (tạo):
    - `careAt` mặc định now (disabled), `careStatus` radio theo constants, `careContent` textarea.
    - Submit gọi POST; đóng và reset form; invalidate queries `treatment-care-customers` và `treatment-care-records`.

- TreatmentCareTable (lịch sử 35 ngày hoặc theo khách):
  - Với chế độ tổng quan (không truyền `customerId`): filter onlyMine, chọn ngày “to” (from auto = to − 34), groupBy=day → flatten hiển thị list; cột: khách, thời gian, dịch vụ snapshot, bác sĩ snapshot, nhân viên CS, nội dung; actions xem/xóa.
  - Với chế độ per customer: truyền `customerId`, không group, không onlyMine, ẩn cột khách; hiển thị lịch sử CS của riêng khách.
  - Action Xem: mở TreatmentCareDetail; Xóa: gọi DELETE theo quyền; invalidate queries.

- Hooks:
  - useTreatmentCareCustomers({ date, keyword }): GET /customers (headers auth), cache key include date/keyword.
  - useTreatmentCareRecords({ from,to,groupBy,onlyMine,clinicId,customerId }): GET records; return grouped or flat; headers auth.
  - useCreateTreatmentCareRecord(): POST + invalidate queries.
  - useDeleteTreatmentCareRecord(): DELETE + invalidate queries.

## 6) Phân quyền & Clinic Scope
- FE gửi headers `x-employee-role`, `x-employee-id`, `x-clinic-id` (useAuthHeaders) để API enforce.
- Non‑admin luôn bị scope theo clinic từ profile; Admin có thể truyền clinicId filter.
- Non‑admin chỉ có thể xóa bản ghi của mình trong ngày tạo; Admin bỏ qua hạn chế.

## 7) Checklist triển khai
- [ ] Zod Schemas cho Create/Response/Query; coerce enum careStatus.
- [ ] Enforce VN TZ cho so sánh ngày; validate tồn tại TreatmentLog.
- [ ] FE: bảng khách + modal; bảng lịch sử theo 35 ngày/per‑customer; delete theo quyền.
- [ ] Tests: snapshot build (dịch vụ/bác sĩ/clinic) từ TreatmentLogs; onlyMine; coerce status; date-range 35 ngày; delete guard non‑admin.

