# Appointment Spec (End-to-End)

Nguồn tham chiếu duy nhất cho toàn bộ nghiệp vụ, API và UI/UX của feature Lịch hẹn, bao gồm phần chính (feature appointments) và phần tích hợp trong Customer.

---

## 1) Phạm vi & Mục tiêu
- Quản lý lịch hẹn theo dạng Calendar (tháng/tuần/ngày) và danh sách theo ngày (Daily).
- Hành động: Tạo, Sửa, Xóa, Xác nhận, Check‑in, Check‑out, Đánh dấu Không đến (No‑show), Walk‑in (Đến đột xuất).
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

Ràng buộc nghiệp vụ: 1 khách chỉ có 1 lịch/1 ngày (loại trừ lịch có status “Đã hủy”).

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

## 4) Validation & Ràng buộc
- Không được tạo/đặt lại lịch vào quá khứ (so theo phút đối với thời điểm cụ thể; so theo ngày với thao tác xóa/sửa ngày quá khứ).
- 1 khách/1 ngày: enforce khi tạo mới và khi đổi `appointmentDateTime` (trừ lịch “Đã hủy”).
- Lịch “hôm nay” khi edit: chặn sửa các field nhạy cảm: `customerId`, `appointmentDateTime` (khác phút), `duration`, `clinicId`, `status`.
- Reschedule: nếu đổi `appointmentDateTime` và lịch chưa check‑in → reset `status = "Chờ xác nhận"`.
- Check‑out yêu cầu đã check‑in và chưa check‑out.

Timezone: luôn dùng Asia/Ho_Chi_Minh khi tính `startOf("day")`/`endOf("day")` để lọc theo ngày.

## 5) API Contract
Lưu ý chung:
- Tất cả thời gian là ISO string ở API; FE chịu trách nhiệm chuyển đổi hiển thị và locale.
- Payload ghi nên kèm `updatedById`; khi tạo mới kèm `createdById`, và `clinicId` theo profile (hoặc do admin chỉ định).
- Error chuẩn: `{ "error": "<thông báo tiếng Việt>" }` và status phù hợp (400/404/500).

### 5.1. List theo range (Calendar)
GET `/api/appointments?from=ISO&to=ISO[&clinicId=]`

Response 200:
```
[
  {
    "id": "...",
    "appointmentDateTime": "...",
    "duration": 30,
    "status": "Đã xác nhận",
    "customer": { "id": "...", "customerCode": "...", "fullName": "..." },
    "primaryDentist": { "id": "...", "fullName": "..." },
    "secondaryDentist": null
  }
]
```

### 5.2. List dạng bảng (phân trang)
GET `/api/appointments?page=1&pageSize=20[&clinicId=][&search=...]`

Response 200:
```
{ "appointments": [ { "id": "...", ... } ], "total": 120 }
```

### 5.3. List theo ngày (Daily)
GET `/api/appointments/today?date=YYYY-MM-DD[&clinicId=][&doctorId=]`

- Filter doctor theo primary hoặc secondary.
- Include customer/primary/secondary; sort tăng theo `appointmentDateTime`.

### 5.4. Lấy chi tiết
GET `/api/appointments/{id}` → 200 với include, 404 nếu không tồn tại.

### 5.5. Tạo mới
POST `/api/appointments`

Body (tối thiểu):
```
{
  "customerId": "cus-1",
  "primaryDentistId": "emp-11",
  "appointmentDateTime": "2025-03-12T09:00:00.000Z",
  "duration": 30,
  "notes": "...",
  "clinicId": "450MK",
  "status": "Chờ xác nhận",
  "createdById": "emp-creator",
  "updatedById": "emp-creator"
}
```

Validation lỗi 400:
- Thiếu trường bắt buộc.
- Đặt lịch trong quá khứ.
- Vi phạm quy tắc 1 khách/1 ngày (trả kèm thông tin lịch trùng nếu có).

Response 201: appointment include customer/primary/secondary.

### 5.6. Sửa
PUT `/api/appointments/{id}`

Quy tắc:
- Chặn sửa lịch quá khứ (theo ngày).
- Lịch hôm nay: chặn sửa `customerId`, `appointmentDateTime` (khác phút), `duration`, `clinicId`, `status`.
- Đổi `appointmentDateTime`: không quá khứ, kiểm tra trùng lịch cùng ngày (trừ chính nó); nếu chưa check‑in → reset status.

Response 200: appointment cập nhật.

### 5.7. Xóa
DELETE `/api/appointments/{id}` → Chặn xóa lịch quá khứ. 200 `{ success, message }`.

### 5.8. Xác nhận
PATCH `/api/appointments/{id}/confirm`

Body: `{ "updatedById": "emp-1" }`

Rules: Kiểm tra chuyển trạng thái hợp lệ; đặt `status = "Đã xác nhận"`.

### 5.9. Check‑in
PATCH `/api/appointments/{id}/checkin`

Body: `{ "updatedById": "emp-1" }`

Rules:
- 404 nếu không có lịch.
- 400 nếu đã check‑in.
- 400 nếu `status` không thuộc allowed ("Chờ xác nhận", "Đã xác nhận", "Không đến").
- Thành công: `checkInTime = now`, `status = "Đã đến"`.

### 5.10. Check‑out
PATCH `/api/appointments/{id}/checkout`

Body: `{ "updatedById": "emp-1" }`

Rules: 400 nếu chưa check‑in hoặc đã check‑out; thành công set `checkOutTime = now`.

### 5.11. No‑show
PATCH `/api/appointments/{id}/no-show`

Body: `{ "updatedById": "emp-1" }`

Rules: chỉ sau thời điểm hẹn; chặn nếu đã check‑in; kiểm tra bảng chuyển trạng thái; đặt `status = "Không đến"`.

### 5.12. Kiểm tra xung đột (1 khách/1 ngày)
GET `/api/appointments/check-conflict?customerId=&date=YYYY-MM-DD[&excludeId=]`

Response 200: `{ "hasConflict": boolean, "existingAppointment": Appointment|null }`.

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

### 6.1. Calendar (Appointments)
- Lấy events theo range; map màu theo status.
- Tooltip hiển thị: tên khách, thời gian, duration, bác sĩ chính/phụ, trạng thái, ghi chú.
- Tạo nhanh bằng chọn slot → mở modal tạo với `appointmentDateTime` preset.
- Drag/Drop/Resize:
  - Chặn nếu event đã check‑in (revert + toast cảnh báo).
  - Gửi PUT cập nhật `appointmentDateTime` (và `duration` khi resize). Lỗi → revert; thành công → invalidate cache range.

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

### 6.3. Appointment Form
- Chặn chọn ngày/giờ quá khứ; nếu là ngày hôm nay, disable chọn giờ đã trôi qua (disable hours/minutes <= hiện tại).
- Sửa lịch “hôm nay”: disable đổi `customerId`, `appointmentDateTime`.
- Khi đổi ngày: gọi `GET /api/appointments/check-conflict` để cảnh báo xung đột.
- Trường form: customer, appointmentDateTime (minuteStep 15), duration, primary/secondary dentist, clinic, status, notes.

### 6.4. Customer Integration
- Tab “Lịch hẹn” (trong Customer Detail): hiển thị bảng lịch của khách (ẩn cột khách), hỗ trợ Add/Edit/Delete/Check‑in/Check‑out.
- Sau tạo/sửa/xóa: cập nhật state customer và refetch chi tiết.

### 6.5. Quick Check‑in từ Customer List
- Danh sách khách ngày chọn dùng `includeAppointments=true&date=` để có `todayAppointment`.
- Nút Check‑in mở modal: nếu đã có lịch trong ngày → check‑in; nếu chưa → yêu cầu chọn `primaryDentistId` và tạo walk‑in.

## 7) Phân quyền & Clinic Scope
- Nhân viên (non‑admin) chỉ thao tác trong `clinicId` của profile; admin có thể chọn clinic ở Daily; Calendar/queries tự động truyền `clinicId` theo vai trò.

## 8) Quan hệ với Consulted Services
- Tạo consulted service chỉ khi khách đã check‑in trong ngày; API lookup appointment check‑in và gắn `appointmentId` của lịch đã check‑in.
- Trong Customer, nếu chưa check‑in thì cảnh báo trước khi cho tạo consulted service.

## 9) Phi chức năng & UX
- Locale UI tiếng Việt, thông báo thân thiện, thống nhất wording.
- Sử dụng timezone VN cho xử lý day‑range.
- Bảng/Calendar hiệu năng tốt với React Query (prefetch/invalidate hợp lý).

## 10) Mã lỗi & Mapping thông dụng
- 400: thiếu dữ liệu, quá khứ, conflict 1/1 ngày, chuyển trạng thái không hợp lệ, chưa/đã check‑in/out.
- 404: không tìm thấy lịch/khách.
- 409 (tuỳ chọn): conflict logic nâng cao.
- 500: lỗi máy chủ; log chi tiết server, trả message thân thiện.
- Mapping lỗi P2002 (Prisma unique) nên hiển thị tên trường tiếng Việt: customerId, primaryDentistId, appointmentDateTime.

## 11) Checklist triển khai (gợi ý)
- [ ] Zod Schemas: Create/Update/Response/Query cho Appointment.
- [ ] Service/Repo: enforce tất cả validations trên.
- [ ] API Routes: theo contract, trả lỗi tiếng Việt.
- [ ] FE Calendar: drag/drop/resize + tooltip + guard check‑in.
- [ ] FE Daily: actions theo điều kiện; sort/filter; clinic tabs (admin).
- [ ] FE Form: disable hôm nay; conflict check; timezone.
- [ ] Customer: tab “Lịch hẹn” + quick check‑in trong Customer List.
- [ ] E2E happy paths + tests transitions: check‑in/out, no‑show, 1/1 ngày, reschedule reset status.

