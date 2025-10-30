# Appointment Spec (End-to-End)

Nguồn tham chiếu duy nhất cho toàn bộ nghiệp vụ, API và UI/UX của feature Lịch hẹn, bao gồm phần chính (feature appointments) và phần tích hợp trong Customer.

---

## 1) Phạm vi & Mục tiêu

- Quản lý lịch hẹn theo dạng Calendar (tháng/tuần/ngày) và danh sách theo ngày (Daily).
- Hành động: Tạo, Sửa, Xóa, Xác nhận, Check‑in, Check‑out, Walk‑in (Đến đột xuất).
- Tích hợp trong Customer: xem/điều khiển lịch của một khách, quick check‑in, ràng buộc với consulted services (dịch vụ tư vấn).

## 2) Data Model (Prisma)

Model `Appointment` (tóm tắt trường chính):

- id (uuid)
- customerId (string)
- appointmentDateTime (DateTime, tz)
- duration (int, mặc định 30 phút)
- notes (string?)
- primaryDentistId (string)
- secondaryDentistId (string?)
- clinicId (string)
- status (string) — các trạng thái sử dụng: “Chờ xác nhận”, “Đã xác nhận”, “Đã đến”, “Đến đột xuất”, “Không đến”, “Đã hủy”
- checkInTime (DateTime?)
- checkOutTime (DateTime?)
- createdById, updatedById (string)
- createdAt, updatedAt (timestamps)

Quan hệ: Customer, Employee (primary/secondary), TreatmentLog[], ConsultedService[] (gắn appointmentId khi đã check‑in).

## 3) Trạng thái & Quy tắc chuyển trạng thái

- Cho phép Check‑in khi status ∈ {“Chờ xác nhận”, “Đã xác nhận”, “Không đến”}.
- Chặn Check‑in khi status ∈ {“Đã đến”, “Đã hủy”}.
- Bảng chuyển trạng thái hợp lệ (STATUS_TRANSITIONS):
  - “Chờ xác nhận” → “Đã xác nhận”, “Đã hủy”
  - “Đã xác nhận” → “Đã đến”, “Không đến”, “Đã hủy”
  - “Đã đến” → (không chuyển tiếp)
  - “Không đến” → “Đã đến”
  - “Đã hủy” → (không chuyển tiếp)
  - “Đến đột xuất” → (không chuyển tiếp)
- No‑show chỉ sau thời điểm hẹn; nếu đã check‑in thì không được No‑show.

### 5.13. Quick Check‑in từ Customer

POST `/api/customers/{id}/checkin`

Body: `{ "primaryDentistId": "emp-11", "notes": "...", "updatedById": "emp-1" }`

Hành vi:

- Nếu đã có lịch hôm nay:
  - 400 nếu đã check‑in.
  - Kiểm tra `status` allowed; set `checkInTime=now`, `status="Đã đến"`. Nếu `notes` trống có thể auto‑fill note check‑in.
- Nếu chưa có lịch hôm nay (walk‑in): bắt buộc `primaryDentistId`; tạo lịch với `appointmentDateTime=now`, `duration=30`, `status="Đến đột xuất"`, `checkInTime=now`, `clinicId` theo customer.

### 5.14. Customers – list có include lịch trong ngày

GET `/api/customers?page=&pageSize=&clinicId=&includeAppointments=true&date=YYYY-MM-DD[&search=]`

Response 200: `{ customers: [{ id, fullName, customerCode, todayAppointment: { ... } }], total }`.

## 6) Frontend Behaviors

### 6.2. Daily List

- Điều hướng ngày (hôm qua/hôm nay/ngày mai), admin có Tabs theo clinic.
- Bảng hiển thị cột MÃ KH, tên KH (link trang KH), giờ hẹn, ghi chú, bác sĩ, trạng thái; có thêm cột check‑in/out time khi bật.
- Hành động theo điều kiện:
  - Confirm: khi status = “Chờ xác nhận” và lịch tương lai.
  - Check‑in: lịch hôm nay và chưa check‑in (backend vẫn enforce status).
  - Check‑out: đã check‑in và chưa check‑out.
  - No‑show: sau 17:00 ngày hẹn hoặc với ngày quá khứ, khi status = “Đã xác nhận”.
  - Sửa/Xóa: disable nếu lịch quá khứ hoặc đã check‑in.
- Sắp xếp trạng thái (ưu tiên theo thứ tự): “Chờ xác nhận”, “Đã xác nhận”, “Đã đến”, “Không đến”, “Đã hủy”.
- React Query: dùng `setQueryData`/`invalidateQueries` để cập nhật nhanh.

### 6.4. Customer Integration

- Tab “Lịch hẹn” (trong Customer Detail): hiển thị bảng lịch của khách (ẩn cột khách), hỗ trợ Add/Edit/Delete/Check‑in/Check‑out.
- Sau tạo/sửa/xóa: cập nhật state customer và refetch chi tiết.

### 6.5. Quick Check‑in từ Customer List

- Danh sách khách ngày chọn dùng `includeAppointments=true&date=` để có `todayAppointment`.
- Nút Check‑in mở modal: nếu đã có lịch trong ngày → check‑in; nếu chưa → yêu cầu chọn `primaryDentistId` và tạo walk‑in.

## 8) Quan hệ với Consulted Services

- Tạo consulted service chỉ khi khách đã check‑in trong ngày; API lookup appointment check‑in và gắn `appointmentId` của lịch đã check‑in.
- Trong Customer, nếu chưa check‑in thì cảnh báo trước khi cho tạo consulted service.
