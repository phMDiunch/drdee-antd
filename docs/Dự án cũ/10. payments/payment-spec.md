# Payment Spec (End-to-End)

Nguồn tham chiếu duy nhất cho nghiệp vụ, API và UI/UX của tính năng Thu tiền (Payment Voucher), bao gồm mối liên hệ với Consulted Service và Customer.

---

## 1) Phạm vi & Mục tiêu
- Tạo phiếu thu cho các dịch vụ tư vấn đã chốt, theo từng khách hàng và chi nhánh.
- Quản lý chi tiết phiếu thu: dịch vụ, số tiền thu, phương thức thanh toán, ghi chú.
- In phiếu thu, xem danh sách phiếu thu theo ngày/chi nhánh, thống kê theo phương thức.
- Sửa/xóa có ràng buộc quyền và ngày; đồng bộ công nợ với Consulted Service.

## 2) Data Model (Prisma)
### PaymentVoucher
- id (uuid)
- paymentNumber (string, unique) — mã số phiếu tự sinh theo: PREFIX-YYMM-####
- customerId (string)
- paymentDate (DateTime, tz, default now)
- totalAmount (int)
- notes (string?)
- cashierId (string)
- clinicId (string?)
- createdById, updatedById (string)
- createdAt, updatedAt (timestamps)
- Quan hệ: `details: PaymentVoucherDetail[]`, `customer`, `cashier`, `createdBy`, `updatedBy`.

### PaymentVoucherDetail
- id (uuid)
- paymentVoucherId (string) → PaymentVoucher
- consultedServiceId (string) → ConsultedService (dịch vụ đã chốt)
- amount (int) — số tiền thu cho dòng này
- paymentMethod (string) — “Tiền mặt”, “Quẹt thẻ thường”, “Quẹt thẻ Visa”, “Chuyển khoản”
- createdAt (timestamp)
- createdById (string) → Employee

Ghi chú:
- Khi tạo/ghi phiếu, cần đồng bộ `ConsultedService.amountPaid` (+/-) tương ứng; `debt = finalPrice - amountPaid`.
- Số phiếu: PREFIX theo clinic (map: 450MK→MK, 143TDT→TDT, 153DN→DN; fallback "XX"), yyMM + số thứ tự 4 chữ số trong tháng. Dùng transaction + retry để đảm bảo unique.

## 3) Luật nghiệp vụ
- Chỉ thu cho các Consulted Service “Đã chốt” và còn nợ (outstanding > 0).
- Mỗi dòng detail: `0 < amount ≤ outstanding của service`.
- Tổng phiếu `totalAmount` = tổng `amount` các detail (FE/BE đều tính, BE là nguồn chuẩn).
- Đồng bộ công nợ Consulted Service:
  - Tạo phiếu: tăng `amountPaid` cho từng service theo `detail.amount`.
  - Sửa phiếu: rollback `amountPaid` cũ (giảm theo các detail cũ), xóa detail cũ, cập nhật voucher, tạo detail mới, tăng `amountPaid` mới theo detail mới.
  - Xóa phiếu: giảm `amountPaid` của từng service theo detail, xóa details, xóa voucher.
- Quyền & thời gian:
  - Xóa phiếu: chỉ Admin (403 nếu không phải admin).
  - Sửa phiếu:
    - Admin: sửa tự do.
    - Non‑admin: chỉ được sửa phiếu của “ngày hôm nay” và chỉ được đổi ghi chú voucher + phương thức thanh toán của từng detail (không được đổi số tiền, không được thêm/bớt dòng). Nếu vi phạm trả lỗi rõ ràng.

## 4) API Contract
Lưu ý:
- Thời gian ISO string; FE hiển thị định dạng VN.
- Lỗi `{ "error": "Thông báo tiếng Việt" }` với status (400/403/404/500) phù hợp.
- Dùng header `x-employee-role` để kiểm tra nhanh quyền admin ở một số endpoint.

### 4.1. List (phân trang + lọc)
GET `/api/payment-vouchers?page=1&pageSize=20[&search=...][&clinicId=][&startDate=ISO&endDate=ISO]`

- search theo: `paymentNumber`, `customer.fullName`, `customer.customerCode` (contains, insensitive).
- Lọc theo khoảng ngày (`paymentDate` in [startDate, endDate]) theo VN TZ; lọc theo `clinicId` (qua customer.clinicId).

Response 200:
```
{
  "vouchers": [
    {
      "id": "...",
      "paymentNumber": "MK-2503-0001",
      "paymentDate": "...",
      "totalAmount": 1200000,
      "customer": { "id": "...", "fullName": "...", "customerCode": "..." },
      "cashier": { "id": "...", "fullName": "..." },
      "details": [
        {
          "id": "...",
          "amount": 600000,
          "paymentMethod": "Tiền mặt",
          "consultedService": {
            "id": "...",
            "consultedServiceName": "Nhổ răng",
            "finalPrice": 1000000,
            "dentalService": { "name": "Nhổ răng" }
          }
        }
      ]
    }
  ],
  "total": 42,
  "page": 1,
  "pageSize": 20,
  "totalPages": 3
}
```

### 4.2. Tạo phiếu thu
POST `/api/payment-vouchers`

Body (ví dụ):
```
{
  "customerId": "cus-1",
  "totalAmount": 1200000,
  "notes": "Thu đợt 1",
  "cashierId": "emp-cashier", // thường = current employee
  "createdById": "emp-creator",
  "clinicId": "450MK", // nếu không gửi, backend suy ra từ employee createdById
  "details": [
    { "consultedServiceId": "svc-1", "amount": 600000, "paymentMethod": "Tiền mặt" },
    { "consultedServiceId": "svc-2", "amount": 600000, "paymentMethod": "Chuyển khoản" }
  ]
}
```

Xử lý:
- Sinh `paymentNumber` duy nhất với retry.
- Tạo voucher, tạo detail, tăng `ConsultedService.amountPaid` theo từng detail.
- Trả về voucher đầy đủ (include customer/cashier/details + consultedService + dentalService).

### 4.3. Lấy chi tiết phiếu thu
GET `/api/payment-vouchers/{id}` → trả voucher include đầy đủ (customer, cashier, createdBy, updatedBy, details + consultedService + dentalService).

### 4.4. Sửa phiếu thu
PUT `/api/payment-vouchers/{id}`

Body: `{ ...voucherData, details: [ { id?, consultedServiceId, amount, paymentMethod } ] }`

Quyền & ràng buộc:
- Non‑admin chỉ sửa phiếu của “hôm nay” và chỉ được:
  - Đổi `notes` của voucher.
  - Đổi `paymentMethod` của chi tiết; không được thêm/bớt dòng; không được đổi `amount`.
  - Nếu vi phạm (khác số dòng, có trường không được phép, amount thay đổi) → 400/403 với thông báo phù hợp.
- Admin: sửa tự do (BE rollback amountPaid cũ → xóa details cũ → cập nhật voucher → tạo details mới → tăng amountPaid mới).

Trả về 200: object voucher mới (có thể không include đầy đủ nếu route hiện tại trả id; tùy backend, FE có thể fetch lại để hiển thị chi tiết).

### 4.5. Xóa phiếu thu
DELETE `/api/payment-vouchers/{id}`

- Chỉ admin (403 nếu không phải admin).
- BE phải giảm `amountPaid` trên mỗi ConsultedService theo các detail trước khi xóa.
- Xóa details, xóa voucher.

Response 200: `{ success: true, message }`.

## 5) Frontend Behaviors

### 5.1. Daily Payments Page
- Điều hướng ngày (hôm qua/hôm nay/ngày mai), admin có Tabs chọn clinic.
- Tải phiếu thu theo ngày (params startDate/endDate ISO), pageSize lớn cho daily view.
- Tính tổng và breakdown theo phương thức bằng `categorizePaymentMethods`.
- In báo cáo ngày: tổng số phiếu, tổng tiền, breakdown.
- Bảng PaymentVoucherTable:
  - Columns: số phiếu, khách hàng (link), ngày thu, tổng tiền, thu ngân, số dịch vụ, actions.
  - Actions: In (mọi user), Sửa (admin hoặc phiếu ngày hôm nay), Xóa (chỉ admin).
- Modal PaymentVoucherModal: add/edit phiếu thu, edit tuân thủ rule quyền.

### 5.2. Payment Voucher Form
- Chọn khách hàng (tải từ store + cung cấp `currentCustomer` khi mở từ Customer).
- Tải các consulted services còn nợ (`/api/customers/{id}/outstanding-services`) khi chọn khách; render bảng chọn dịch vụ.
- Chọn dịch vụ để thu: nhập số tiền (<= outstanding), chọn phương thức; cập nhật tổng.
- Chế độ sửa:
  - Admin: chỉnh tất cả.
  - Non‑admin: chỉ đổi ghi chú và phương thức (khóa số tiền, số dòng theo phiếu cũ). Hiển thị cảnh báo.

### 5.3. Printable Receipt
- In một phiếu thu với mẫu đơn giản, hỗ trợ mở cửa sổ in và auto print.

### 5.4. Customer Integration
- Tab “Phiếu thu” trong Customer Detail hiển thị danh sách phiếu của khách; cho phép Add/Edit/View/Delete theo quyền.
- Khi mở tạo từ Customer, truyền `customerId` và `currentCustomer`; Outstanding services tính riêng theo khách đó.

## 6) Phân quyền & Clinic Scope
- Non‑admin thao tác trong clinic của profile; admin có thể chọn clinic ở Daily.
- API một số nơi dùng header `x-employee-role` để phân quyền nhanh.

## 7) Lỗi & mapping phổ biến
- 400: dữ liệu không hợp lệ (amount vượt outstanding, thêm/bớt detail trái phép khi non‑admin, sai tham số).
- 403: không đủ quyền (xóa phiếu, sửa ngoài phạm vi cho phép).
- 404: không tìm thấy phiếu.
- 409 (tùy): trùng số phiếu sau tối đa retry.
- 500: lỗi máy chủ (ghi log đầy đủ; trả message VN thân thiện).

## 8) Checklist triển khai
- [ ] Zod Schemas: Create/Update/Response cho PaymentVoucher/VoucherDetail; Query list.
- [ ] Repo/Service: sinh số phiếu có retry; đồng bộ amountPaid khi create/update/delete.
- [ ] API Routes: enforce quyền (admin delete, non‑admin edit hôm nay chỉ notes + methods).
- [ ] FE Daily: thống kê + in; lọc theo clinic; pagination hợp lý.
- [ ] Form: nạp outstanding services; validate amount; tính tổng; chế độ edit theo quyền.
- [ ] Customer tab: tích hợp modal add/edit; fetch lại khi xong.
- [ ] Tests: số phiếu unique; rollback/reapply amountPaid; non‑admin edit guard; admin delete.

