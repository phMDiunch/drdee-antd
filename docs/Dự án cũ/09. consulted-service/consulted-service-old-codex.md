# Consulted Service Spec (End-to-End)

Nguồn tham chiếu duy nhất cho nghiệp vụ, API và UI/UX của tính năng Dịch vụ tư vấn (Consulted Service), bao gồm tương tác với Lịch hẹn và các phần trong Customer.

---

## 1) Phạm vi & Mục tiêu
- Ghi nhận dịch vụ tư vấn cho khách, gắn với lịch hẹn đã check‑in trong ngày.
- Quản lý giá gốc, giá ưu đãi, số lượng, thành tiền, công nợ; chọn vị trí răng, ghi chú tình trạng; nhân sự liên quan (bác sĩ tư vấn, bác sĩ điều trị, sale).
- Duyệt/chốt dịch vụ (confirm) để cố định giá trị, phục vụ nghiệp vụ tài chính và điều trị.
- Quản lý và xem danh sách dịch vụ tư vấn theo ngày/chi nhánh; xem chi tiết, sửa, xóa (theo quyền); hiển thị trong tab của Customer.

## 2) Data Model (Prisma)
Model `ConsultedService` (chính):
- id (uuid)
- customerId (string)
- appointmentId (string?) — lịch hẹn gắn (có thể null, nhưng khi tạo từ UI yêu cầu check‑in để gắn)
- dentalServiceId (string) — master service
- clinicId (string)
- consultedServiceName (string) — sao chép tên dịch vụ tại thời điểm tư vấn
- consultedServiceUnit (string)
- toothPositions (string[]) — danh sách răng liên quan
- specificStatus (string?) — ghi chú tình trạng
- quantity (int, default 1)
- price (int) — đơn giá gốc (sao chép)
- preferentialPrice (int) — giá ưu đãi mỗi đơn vị (có thể 0)
- finalPrice (int) — preferentialPrice * quantity
- amountPaid (int, default 0)
- debt (int) — còn nợ (ban đầu = finalPrice)
- consultationDate (DateTime, default now)
- serviceConfirmDate (DateTime?)
- serviceStatus (string, default "Chưa chốt") — “Chưa chốt” | “Đã chốt”
- treatmentStatus (string, default "Chưa điều trị") — "Chưa điều trị" | "Đang điều trị" | "Hoàn thành"
- consultingDoctorId (string?)
- consultingSaleId (string?)
- treatingDoctorId (string?)
- createdById, updatedById (string)
- createdAt, updatedAt (timestamps)

Quan hệ: Customer, DentalService, Employee (consultingDoctor/consultingSale/treatingDoctor), Appointment?, TreatmentLog[], PaymentVoucherDetail[].

## 3) Luật nghiệp vụ cốt lõi
- Tạo consulted service yêu cầu khách đã check‑in trong ngày:
  - Tra cứu `appointment` hôm nay có `checkInTime != null` và gắn `appointmentId` vào service.
- Giá & tính tiền:
  - preferentialPrice: nếu gửi null/undefined → dùng `price` của DentalService; nếu gửi 0 → chấp nhận giá 0.
  - finalPrice = preferentialPrice * quantity.
  - debt = finalPrice (ban đầu, chưa thanh toán). `amountPaid` cập nhật bởi nghiệp vụ thanh toán sau này.
- Trạng thái dịch vụ:
  - `serviceStatus`: “Chưa chốt” → “Đã chốt” qua endpoint confirm.
  - Khi “Đã chốt”, giá trị coi là cố định cho downstream (tài chính/điều trị).
- Quyền sửa/xóa sau khi “Đã chốt”:
  - Non‑admin:
    - PUT: Nếu đã chốt, chỉ được sửa các field nhân sự (consultingDoctorId/consultingSaleId/treatingDoctorId) và chỉ trong 33 ngày kể từ `serviceConfirmDate`.
    - DELETE: Không được xóa dịch vụ “Đã chốt”.
  - Admin:
    - PUT: Có thể sửa mọi field, bỏ qua ràng buộc thời gian 33 ngày.
    - DELETE: Có thể xóa cả dịch vụ “Đã chốt” (có cảnh báo UI).

## 4) Validation & Ràng buộc
- Khi tạo:
  - Bắt buộc: `customerId`, `dentalServiceId`, `clinicId`.
  - Khách phải có lịch hẹn hôm nay đã check‑in (nếu không → 400 `{ needsCheckin: true }`).
  - Sao chép `consultedServiceName`, `consultedServiceUnit`, `price` từ DentalService.
  - Tính `preferentialPrice`, `finalPrice`, `debt` như mục 3.
- Khi cập nhật (PUT):
  - Áp dụng luật quyền theo “Đã chốt”/admin ở mục 3.
  - Cập nhật `updatedAt = now`.
- Khi chốt (PATCH):
  - Nếu đã chốt → 400.
  - Cập nhật `serviceStatus = "Đã chốt"`, `serviceConfirmDate = now`, metadata cập nhật.
- Khi xóa (DELETE):
  - Non‑admin chặn xóa nếu `serviceStatus = "Đã chốt"` → 403.
  - Admin được xóa — cần confirm mạnh ở UI.

## 5) API Contract
Lưu ý:
- Thời gian ISO string; FE hiển thị theo locale VN.
- Mapping lỗi tiếng Việt nhất quán.
- Header `x-employee-role` được dùng để suy ra role (admin/non‑admin) nhanh ở một số endpoint.

### 5.1. List theo ngày/khách/nhân sự
GET `/api/consulted-services?date=YYYY-MM-DD[&clinicId=][&customerId=][&consultingDoctorId=][&consultingSaleId=]`

- Cần `date` hoặc `customerId` hoặc `consultingDoctorId/consultingSaleId`.
- Trả mảng consulted services gồm include: `customer { id, customerCode, fullName, phone }`, `dentalService { id, name, unit }`, `consultingDoctor/treatingDoctor/consultingSale { id, fullName }`.
- Sort tăng theo `consultationDate`.
- Khi filter theo `customerId`, response bọc `{ data: [...] }` (giữ tương thích FE hiện tại).

### 5.2. Lấy chi tiết
GET `/api/consulted-services/{id}` → 200 include như trên; 404 nếu không tồn tại.

### 5.3. Tạo mới
POST `/api/consulted-services`

Body (ví dụ):
```
{
  "customerId": "cus-1",
  "dentalServiceId": "svc-1",
  "clinicId": "450MK",
  "quantity": 2,
  "preferentialPrice": 900000, // optional; nếu omit → dùng price
  "toothPositions": ["R16", "R26"],
  "consultingDoctorId": "emp-11",
  "consultingSaleId": "emp-22",
  "treatingDoctorId": null,
  "specificStatus": "Viêm nhẹ"
}
```

Rules khi tạo:
- Validate trường bắt buộc.
- Kiểm tra appointment hôm nay đã check‑in của khách; nếu không có → 400 `{ error, needsCheckin: true }`.
- Sao chép dữ liệu từ DentalService; tính toán giá/đơn vị theo mục 3; gắn `appointmentId` từ lịch check‑in.

Response 201: object service include customer/dentalService/nhân sự + `Appointment { id, appointmentDateTime, checkInTime }`.

### 5.4. Cập nhật (sửa)
PUT `/api/consulted-services/{id}`

Body: các trường cần cập nhật. Quyền:
- Non‑admin: nếu `serviceStatus = "Đã chốt"` → chỉ được sửa `consultingDoctorId|consultingSaleId|treatingDoctorId` và chỉ trong 33 ngày kể từ `serviceConfirmDate`.
- Admin: có thể sửa tất cả fields, bỏ qua giới hạn 33 ngày.

Response 200: object service updated (include như GET).

### 5.5. Xóa
DELETE `/api/consulted-services/{id}`

- Non‑admin: 403 nếu service đã chốt.
- Admin: xóa được cả service đã chốt; message rõ ràng.

Response 200: `{ success: true, message }`.

### 5.6. Chốt dịch vụ
PATCH `/api/consulted-services/{id}`

Body:
```
{ "updatedById": "emp-1" }
```

Rules:
- 400 nếu đã chốt.
- Set `serviceStatus = "Đã chốt"`, `serviceConfirmDate = now`, cập nhật metadata.

Response 200: object service sau khi chốt.

## 6) Frontend Behaviors

### 6.1. Daily Page (ConsultedServiceDailyPage)
- Điều hướng ngày, filter theo clinic (tab admin), nút refresh.
- Thống kê nhanh: tổng dịch vụ, đã chốt, chưa chốt, tổng giá trị đã chốt.
- Bảng `ConsultedServiceTable` hiển thị cột: mã KH + tên (nếu bật showCustomer), dịch vụ, SL, đơn giá, giá ưu đãi, thành tiền, trạng thái dịch vụ, bác sĩ/sale, ngày tư vấn, action.
- Hành động:
  - View: mở modal xem chi tiết.
  - Confirm: khi `serviceStatus !== "Đã chốt"` → PATCH confirm.
  - Edit: luôn cho mở (quyền sẽ enforce ở API và form enable/disable theo rule).
  - Delete: chỉ cho non‑admin khi chưa chốt; admin mọi trường hợp (UI cảnh báo rõ).

### 6.2. Form (ConsultedServiceForm)
- Chọn master `dentalService` → tự set `price`, `preferentialPrice` mặc định, `consultedServiceName`, `consultedServiceUnit`.
- Tính `finalPrice` = `quantity * preferentialPrice` realtime.
- Chọn răng qua modal; hiển thị tag danh sách răng đã chọn.
- Quyền chỉnh sửa:
  - Non‑admin:
    - Nếu chưa chốt → chỉnh mọi field.
    - Nếu đã chốt → chỉ chỉnh nhân sự; các field khác disabled; nếu quá 33 ngày kể từ `serviceConfirmDate` → cả nhân sự disabled.
  - Admin: chỉnh mọi field mọi lúc.

### 6.3. Modal (ConsultedServiceModal)
- Mode: add | edit | view.
- View: chỉ hiển thị `ConsultedServiceView` (read-only).
- Edit/Add: render `ConsultedServiceForm` với enable/disable phù hợp.

### 6.4. Customer Integration
- Trong trang Customer Detail (tab dịch vụ tư vấn):
  - Nút Add bị disable nếu khách chưa check‑in hôm nay.
  - Bảng & Modal hành vi giống Daily; showCustomerColumn = false ở tab Customer.

## 7) Phân quyền & Clinic Scope
- Non‑admin thao tác trong clinic trên profile; admin có tab chọn clinic ở Daily.
- API có thể dùng header `x-employee-role` để quyết định quyền nhanh; FE nên gửi khi cần (delete).

## 8) Liên quan Lịch hẹn, Điều trị, Thanh toán
- Lịch hẹn: yêu cầu check‑in để tạo service; gắn `appointmentId` của lịch check‑in hôm nay.
- Điều trị: TreatmentLog liên kết `consultedServiceId` cho buổi điều trị; (ngoài phạm vi tài liệu này, nhưng cần giữ tính nhất quán khi cập nhật).
- Thanh toán: PaymentVoucherDetail liên kết để tính `amountPaid`/`debt` (ngoài phạm vi tài liệu này). Khi payment phát sinh, `amountPaid` tăng và `debt` giảm.

## 9) Lỗi & mapping phổ biến
- 400: thiếu dữ liệu, chưa check‑in, đã chốt rồi vẫn chốt tiếp.
- 403: không đủ quyền (sửa/xóa sau khi đã chốt quá 33 ngày, non‑admin xoá đã chốt).
- 404: không tìm thấy dịch vụ.
- 500: lỗi máy chủ.

## 10) Checklist triển khai
- [ ] Zod Schemas: Create/Update/Confirm/Get/Query cho ConsultedService.
- [ ] Repo/Service: enforce rule check‑in, pricing, confirm, permission 33 ngày, admin override.
- [ ] API Routes: hoàn chỉnh contract, error VN.
- [ ] FE Daily: thống kê, table actions, admin clinic tabs, refresh.
- [ ] FE Form/Modal: enable/disable theo quyền, tính giá realtime, tooth modal.
- [ ] Customer tab: disable Add khi chưa check‑in; hành vi bảng tương tự Daily.
- [ ] Tests: tạo yêu cầu check‑in, confirm, permission 33 ngày, admin delete confirmed, preferentialPrice=0.

