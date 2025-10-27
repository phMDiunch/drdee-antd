# Treatment Log Spec (End-to-End)

Nguồn tham chiếu duy nhất cho nghiệp vụ, API và UI/UX của tính năng Lịch sử điều trị (Treatment Log), bao gồm tương tác với Appointment và Consulted Service. Tài liệu hợp nhất từ backend tới frontend để tránh thiếu sót logic.

---

## 1) Phạm vi & Mục tiêu
- Ghi nhận buổi điều trị (treatment session) cho từng dịch vụ đã chốt của khách, theo từng lịch hẹn (nếu có) và chi nhánh.
- Quản lý nội dung điều trị, kế hoạch bước tiếp theo, trạng thái điều trị, ảnh và X‑quang (trường sẵn trong DB, FE hiện chưa nhập ảnh/xray).
- Gắn nhân sự: bác sĩ điều trị, điều dưỡng 1/2; tracking tạo/cập nhật.
- Xem theo 2 chế độ tại Customer: “Theo ngày hẹn” (by‑date) và “Theo dịch vụ” (by‑service).

## 2) Data Model (Prisma)
Model `TreatmentLog` (prisma/schema.prisma):
- id (uuid)
- customerId (string)
- consultedServiceId (string) — dịch vụ đã chốt đang điều trị
- appointmentId (string?) — lịch hẹn của buổi điều trị (có thể null)
- treatmentDate (DateTime, tz) — ngày điều trị (default now ở schema)
- treatmentNotes (string) — nội dung điều trị
- nextStepNotes (string?) — kế hoạch tiếp theo
- treatmentStatus (string) — “Đang tiến hành” | “Hoàn tất bước” | “Hoàn tất dịch vụ”
- imageUrls (string[]) — ảnh minh họa
- xrayUrls (string[]) — ảnh X‑quang
- dentistId (string), assistant1Id (string?), assistant2Id (string?)
- clinicId (string?)
- createdById, updatedById (string)
- createdAt, updatedAt (timestamps)

Quan hệ include (khi GET): Customer, ConsultedService (kèm treatingDoctor), Appointment (id/date/status), Dentist/Assistants, CreatedBy.

## 3) Luật nghiệp vụ & Ràng buộc
- Tạo treatment log yêu cầu:
  - `customerId`, `consultedServiceId`, `treatmentNotes`, `dentistId`, `createdById` là bắt buộc.
  - `consultedServiceId` phải thuộc về cùng `customerId`; nếu request không truyền `customerId`, dùng `consultedService.customerId` làm effective customer.
  - Nếu có `appointmentId` → appointment phải thuộc cùng customer; nếu không tồn tại → 422.
- Derive `clinicId` khi tạo:
  - Ưu tiên `clinicId` từ payload.
  - Nếu có `appointmentId` → lấy `appointment.clinicId`.
  - Nếu không → lấy từ `consultedService.clinicId`.
- Mặc định `treatmentStatus = "Đang tiến hành"` nếu không truyền.
- Update treatment log: yêu cầu `treatmentNotes`, `dentistId`, `updatedById`.
- Delete treatment log: không ràng buộc thêm (hiện hành, không kiểm tra quyền ở API; FE có thể hạn chế theo vai trò nếu cần).

## 4) API Contract
- GET `/api/appointments/checked-in?customerId=`
  - Trả danh sách appointment đã check‑in của khách, include:
    - customer (id, fullName, customerCode, consultedServices[] đã chốt kèm treatingDoctor và treatmentLogs)
    - primaryDentist
    - treatmentLogs của từng appointment (include consultedService.treatingDoctor, dentist/assistants, createdBy)
  - Sắp xếp appointments theo `appointmentDateTime` desc; treatmentLogs theo `createdAt` asc.

- GET `/api/treatment-logs?customerId=&appointmentId=`
  - Lọc theo customerId/appointmentId; include customer, consultedService(name, unit), appointment(id/date/status), dentist/assistants/createdBy.
  - Order `createdAt` asc (cũ trước).

- POST `/api/treatment-logs`
  - Body bắt buộc: `customerId` (hoặc suy ra từ consulted), `consultedServiceId`, `treatmentNotes`, `dentistId`, `createdById`.
  - Optional: `appointmentId`, `nextStepNotes`, `treatmentStatus`, `assistant1Id`, `assistant2Id`, `clinicId`.
  - Validate:
    - consultedService phải tồn tại và thuộc cùng customer.
    - Nếu có appointment → appointment thuộc cùng customer.
  - Derive `clinicId` như mục 3; set `updatedById = createdById`; `imageUrls = []`, `xrayUrls = []`.
  - Trả 201: treatment log include các liên kết cần thiết (customer, consultedService, appointment, nhân sự).

- GET `/api/treatment-logs/{id}`
  - Trả treatment log include customer, consultedService(name, unit), appointment, dentist/assistants/createdBy; 404 nếu không có.

- PUT `/api/treatment-logs/{id}`
  - Body bắt buộc: `treatmentNotes`, `dentistId`, `updatedById`.
  - Optional: `nextStepNotes`, `treatmentStatus`, `assistant1Id`, `assistant2Id`, `clinicId`.
  - Cập nhật và trả về log include liên kết như GET.

- DELETE `/api/treatment-logs/{id}`
  - Xóa log; trả `{ message }`.

Lỗi phổ biến: 400 thiếu dữ liệu; 422 sai tham chiếu (dịch vụ/lịch hẹn không hợp lệ); 404 không tìm thấy; 500 lỗi server.

## 5) Frontend – Hành vi & UI
- TreatmentLogTab (trong Customer):
  - Gọi `/api/appointments/checked-in?customerId=` khi mount để lấy khung dữ liệu: appointments đã check‑in + consultedServices đã chốt + treatmentLogs.
  - Toggle view:
    - by‑date: render danh sách appointments; mỗi ngày hiển thị các treatment logs thuộc ngày đó; có nút thêm/sửa/xóa log.
    - by‑service: group treatmentLogs theo consultedService; khởi tạo tất cả service đã chốt (kể cả chưa có log) và gắn logs nếu có; tính trạng thái tổng quát service theo logs.
  - Modal TreatmentLogModal:
    - Mode add: preset dentistId = current employee, clinicId = employee.clinicId, appointmentId = ngày đang thao tác (nếu từ by‑date), treatmentStatus default.
    - Mode edit: set các field từ initialData.
    - Dropdown consultedServices: lấy từ customer.consultedServices đã chốt (truyền từ parent); chỉ list dịch vụ “Đã chốt”.
    - Chọn bác sĩ/điều dưỡng từ danh sách activeEmployees; chọn clinic từ `/api/clinics` (đảm bảo clinic của employee có trong dropdown).
  - Lưu/xóa: gọi hooks `createTreatmentLog`, `updateTreatmentLog`, `deleteTreatmentLog`; sau thao tác refetch lại checked‑in appointments để cập nhật UI.
  - UX: loading spinner khi fetch; Empty khi chưa có dữ liệu; toast thông báo thành công/lỗi.

## 6) Tích hợp với các feature khác
- Appointment: nguồn “khung” by‑date; filter appointments có status “Đã đến” hoặc “Đến đột xuất”.
- Consulted Service: chỉ ghi log cho dịch vụ “Đã chốt”; hiển thị treatingDoctor và trạng thái điều trị tổng quan theo logs.
- Reports: Treatment revenue by doctor sử dụng PaymentVoucherDetail; treatment logs không ảnh hưởng trực tiếp revenue.

## 7) Phân quyền & Clinic Scope
- Hiện API không enforce quyền theo vai trò; FE có thể hạn chế theo yêu cầu (ví dụ chỉ bác sĩ/điều dưỡng liên quan được sửa/xóa).
- ClinicId của log được derive theo logic mục 3 để giữ đúng chi nhánh.

## 8) Checklist triển khai
- [ ] Zod Schemas cho Create/Update/Response; Query get list.
- [ ] Enforce validation: service belongs to customer; appointment belongs to same customer.
- [ ] Derive clinicId đúng ưu tiên (payload → appointment → service).
- [ ] FE Tab: by‑date/by‑service grouping; Modal preset/validation; reload sau thao tác.
- [ ] Tests: 422 khi mismatch customer/service/appointment; default status; grouping by‑service; derive clinicId; performance với nhiều logs.

