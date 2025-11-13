# 🩺 User Stories: Treatment Care (Chăm sóc sau điều trị)

> **📋 STATUS: 📝 DRAFT** - User stories for Treatment Care feature  
> **🔗 Related**: `014 Treatment Care.md` (Technical Requirements)  
> **🔧 Last Updated**: 2025-01-13

---

## User Story 1: Xem danh sách khách hàng cần chăm sóc

**Là một:** Nhân viên chăm sóc khách hàng (Customer Care Staff)

**Tôi muốn:** Xem danh sách các khách hàng đã điều trị trong một ngày cụ thể

**Để:** Gọi điện thoại chăm sóc và theo dõi tình trạng sức khỏe của họ sau điều trị

### Acceptance Criteria:

#### Kịch bản 1: Xem danh sách khách hàng điều trị hôm qua

**Given (Biết rằng):** Nhân viên đang ở màn hình "Chăm sóc sau điều trị", tab "Khách cần chăm sóc"

**When (Khi):** Màn hình được mở

**Then (Thì):**

- Hệ thống hiển thị danh sách khách hàng đã có lịch sử điều trị (TreatmentLog) vào **hôm qua** (mặc định)
- Mỗi khách hàng hiển thị:
  - Mã khách hàng
  - Họ tên (có link đến trang chi tiết khách hàng)
  - Số điện thoại (có icon để copy)
  - Danh sách dịch vụ đã điều trị (hiển thị dạng tags)
  - Danh sách bác sĩ điều trị (ngăn cách bởi dấu phẩy)
  - Badge số lần đã chăm sóc trong ngày đó
  - Button "Chăm sóc"

**And (Và):** Danh sách được sắp xếp theo tên khách hàng từ A-Z

#### Kịch bản 2: Chọn ngày khác để xem

**Given (Biết rằng):** Nhân viên đang xem danh sách khách cần chăm sóc

**When (Khi):** Nhân viên chọn ngày khác từ DatePicker hoặc nhấn nút "< Prev Day" / "Next Day >"

**Then (Thì):**

- Hệ thống cập nhật danh sách khách hàng theo ngày mới được chọn
- Badge "Số lần CS" được cập nhật theo số lần chăm sóc trong ngày đó

**And (Và):** URL được cập nhật với tham số ngày mới (để có thể bookmark)

#### Kịch bản 3: Tìm kiếm khách hàng

**Given (Biết rằng):** Nhân viên đang xem danh sách khách cần chăm sóc với nhiều khách hàng

**When (Khi):** Nhân viên nhập từ khóa vào ô tìm kiếm (mã KH, tên, hoặc số điện thoại)

**Then (Thì):**

- Hệ thống lọc danh sách real-time, chỉ hiển thị khách hàng có thông tin khớp với từ khóa
- Tìm kiếm không phân biệt hoa thường
- Các thông tin khác (dịch vụ, bác sĩ, số lần CS) vẫn hiển thị chính xác

**And (Và):** Nếu không có kết quả, hiển thị thông báo "Không tìm thấy khách hàng"

#### Kịch bản 4: Không có khách hàng điều trị trong ngày

**Given (Biết rằng):** Nhân viên chọn một ngày không có lịch sử điều trị

**When (Khi):** Hệ thống truy vấn dữ liệu

**Then (Thì):**

- Hiển thị Empty State với icon và message "Không có khách hàng điều trị trong ngày này"
- Gợi ý: "Thử chọn ngày khác hoặc kiểm tra lại dữ liệu điều trị"

---

## User Story 2: Ghi nhận chăm sóc khách hàng

**Là một:** Nhân viên chăm sóc khách hàng

**Tôi muốn:** Ghi lại nội dung cuộc gọi chăm sóc và trạng thái sức khỏe của khách hàng

**Để:** Theo dõi quá trình hồi phục và có cơ sở để chăm sóc tiếp theo nếu cần

### Acceptance Criteria:

#### Kịch bản 1: Tạo bản ghi chăm sóc thành công

**Given (Biết rằng):**

- Nhân viên đang xem danh sách khách cần chăm sóc
- Khách hàng Nguyễn Văn A có lịch sử điều trị ngày 12/01/2025

**When (Khi):**

- Nhân viên click button "Chăm sóc" của khách hàng Nguyễn Văn A
- Modal "Tạo bản ghi chăm sóc" hiển thị

**Then (Thì):**

- Form hiển thị các thông tin:
  - Khách hàng: "KH001 - Nguyễn Văn A - 0901234567" (readonly)
  - Ngày điều trị: "12/01/2025" (readonly)
  - Thời gian chăm sóc: "13/01/2025 14:30" (mặc định = hiện tại, disabled)
  - Trạng thái: Radio group với 3 options (required)
    - ⚪ Ổn định
    - ⚪ Không liên lạc được
    - ⚪ Cần theo dõi
  - Nội dung chăm sóc: Textarea (required, placeholder: "Ghi chú tình trạng khách hàng sau điều trị...")

**And (Và):** Nhân viên điền form:

- Chọn trạng thái: "Ổn định"
- Nhập nội dung: "Khách phản hồi không đau, không sưng, ăn uống bình thường"

**When (Khi):** Nhân viên click button "Lưu"

**Then (Thì):**

- Hệ thống validate thành công
- Tạo bản ghi TreatmentCare mới với:
  - `careStaffId` = ID nhân viên hiện tại
  - `clinicId` = Chi nhánh của nhân viên
  - Snapshot các dịch vụ và bác sĩ từ TreatmentLog ngày 12/01/2025
- Modal đóng lại
- Hiển thị message success: "Tạo bản ghi chăm sóc thành công"
- Badge "Số lần CS" của khách Nguyễn Văn A tăng lên 1

**And (Và):** Bản ghi mới xuất hiện trong tab "Lịch sử chăm sóc"

#### Kịch bản 2: Validation - Thiếu thông tin bắt buộc

**Given (Biết rằng):** Nhân viên đang ở modal "Tạo bản ghi chăm sóc"

**When (Khi):**

- Nhân viên KHÔNG chọn trạng thái
- Hoặc KHÔNG nhập nội dung chăm sóc
- Click button "Lưu"

**Then (Thì):**

- Hệ thống hiển thị lỗi validation bên dưới field bị thiếu:
  - "Vui lòng chọn trạng thái chăm sóc"
  - "Nội dung chăm sóc không được để trống"
- Form không submit
- Modal vẫn mở

**And (Và):** Focus vào field đầu tiên bị lỗi

#### Kịch bản 3: Backend validation - Khách không có lịch sử điều trị

**Given (Biết rằng):**

- Nhân viên mở modal chăm sóc cho khách hàng X với ngày điều trị 10/01/2025
- Tất cả TreatmentLog của khách X trong ngày 10/01/2025 bị xóa (do admin) TRONG KHI modal đang mở

**When (Khi):** Nhân viên điền form đầy đủ và click "Lưu"

**Then (Thì):**

- Backend validate và phát hiện không có TreatmentLog
- Trả về error 422: "Không tìm thấy TreatmentLog cho ngày điều trị"
- Frontend hiển thị modal error với message rõ ràng
- Gợi ý: "Vui lòng kiểm tra lại dữ liệu hoặc chọn ngày khác"

**And (Và):** Modal form vẫn mở, data được giữ nguyên

#### Kịch bản 4: Chăm sóc nhiều lần trong ngày

**Given (Biết rằng):**

- Khách hàng B đã được chăm sóc 1 lần vào 09:00 sáng
- Badge hiển thị "1"

**When (Khi):**

- Nhân viên gọi lại khách B lúc 15:00 chiều
- Tạo thêm 1 bản ghi chăm sóc mới

**Then (Thì):**

- Hệ thống cho phép tạo bản ghi thứ 2 thành công
- Badge "Số lần CS" tăng lên "2"
- Cả 2 bản ghi đều xuất hiện trong lịch sử, sắp xếp theo thời gian gọi (mới nhất trước)

---

## User Story 3: Xem lịch sử chăm sóc (35 ngày gần nhất)

**Là một:** Quản lý/Nhân viên chăm sóc

**Tôi muốn:** Xem tổng quan lịch sử chăm sóc khách hàng trong 35 ngày gần nhất

**Để:** Đánh giá hiệu quả công việc chăm sóc và theo dõi xu hướng

### Acceptance Criteria:

#### Kịch bản 1: Xem lịch sử mặc định (35 ngày)

**Given (Biết rằng):** Nhân viên đang ở tab "Lịch sử chăm sóc"

**When (Khi):** Tab được mở

**Then (Thì):**

- Hệ thống hiển thị lịch sử chăm sóc từ (hôm nay - 34 ngày) đến hôm nay
- Dữ liệu được group theo ngày, hiển thị dạng Collapse panels
- Mỗi panel hiển thị:
  - Header: Ngày (DD/MM/YYYY) - Số bản ghi
  - Ví dụ: "13/01/2025 - 8 bản ghi"
- Panel hôm nay mở sẵn (expanded), các ngày cũ hơn đóng lại (collapsed)

**And (Và):** Mỗi bản ghi trong panel hiển thị columns:

- Ngày chăm sóc (thời gian chính xác: DD/MM/YYYY HH:mm)
- Khách hàng (mã - tên, có link)
- Điện thoại (với icon phone)
- Dịch vụ điều trị (tags từ snapshot)
- Bác sĩ điều trị (comma-separated từ snapshot)
- Nhân viên CS
- Trạng thái (Tag màu: Xanh/Đỏ/Cam)
- Nội dung (truncate 50 ký tự, có tooltip full text)
- Actions: View, Delete

#### Kịch bản 2: Lọc "Chỉ của tôi"

**Given (Biết rằng):** Nhân viên Nguyễn Văn C đang xem lịch sử chăm sóc của tất cả mọi người

**When (Khi):** Nhân viên check vào checkbox "✓ Chỉ của tôi"

**Then (Thì):**

- Hệ thống lọc và chỉ hiển thị bản ghi có `careStaffId` = ID của Nguyễn Văn C
- Các panel không có bản ghi nào sẽ bị ẩn
- URL được cập nhật với param `?onlyMine=true`

**And (Và):** Khi uncheck, hiển thị lại tất cả bản ghi

#### Kịch bản 3: Chọn ngày kết thúc khác

**Given (Biết rằng):** Nhân viên muốn xem lịch sử chăm sóc đến ngày 10/01/2025 (thay vì hôm nay)

**When (Khi):** Nhân viên chọn ngày "10/01/2025" từ DatePicker "Đến ngày"

**Then (Thì):**

- Hệ thống tự động tính `from = 10/01/2025 - 34 ngày`
- Hiển thị lịch sử chăm sóc từ 07/12/2024 đến 10/01/2025
- Panel ngày 10/01/2025 được mở sẵn

#### Kịch bản 4: Không có dữ liệu trong khoảng thời gian

**Given (Biết rằng):** Nhân viên chọn khoảng thời gian không có bản ghi chăm sóc nào

**When (Khi):** Hệ thống query dữ liệu

**Then (Thì):**

- Hiển thị Empty State: "Không có bản ghi chăm sóc trong khoảng thời gian này"
- Gợi ý: "Thử điều chỉnh bộ lọc hoặc chọn khoảng thời gian khác"

---

## User Story 4: Xem chi tiết bản ghi chăm sóc

**Là một:** Nhân viên/Quản lý

**Tôi muốn:** Xem đầy đủ thông tin của một bản ghi chăm sóc

**Để:** Hiểu rõ nội dung cuộc gọi và tình trạng khách hàng

### Acceptance Criteria:

#### Kịch bản 1: Xem chi tiết từ lịch sử

**Given (Biết rằng):** Nhân viên đang ở tab "Lịch sử chăm sóc"

**When (Khi):** Nhân viên click icon "View" (mắt) ở cột Actions

**Then (Thì):** Modal "Chi tiết bản ghi chăm sóc" hiển thị với layout:

**Thông tin chăm sóc:**

- Khách hàng: KH001 - Nguyễn Văn A - 0901234567
- Ngày điều trị: 12/01/2025
- Thời gian chăm sóc: 13/01/2025 14:30
- Nhân viên CS: Trần Thị B
- Trạng thái: Tag "Ổn định" (màu xanh)

**Chi tiết điều trị:**

- Dịch vụ điều trị: [Tag: Nhổ răng khôn] [Tag: Làm sạch vết thương]
- Bác sĩ điều trị: BS. Lê Văn C, BS. Phạm Thị D

**Nội dung chăm sóc:**

- "Khách phản hồi không đau, không sưng, ăn uống bình thường. Đã tuân thủ hướng dẫn của bác sĩ về chế độ ăn uống và vệ sinh răng miệng."

**Metadata:**

- Tạo bởi: Trần Thị B
- Tạo lúc: 13/01/2025 14:30
- Sửa bởi: Trần Thị B
- Sửa lúc: 13/01/2025 14:30

**And (Và):** Footer có button "Đóng"

**And (Và):** Modal chỉ READ-ONLY, không có chức năng edit

---

## User Story 5: Xóa bản ghi chăm sóc

**Là một:** Nhân viên chăm sóc

**Tôi muốn:** Xóa bản ghi chăm sóc nếu nhập nhầm hoặc trùng lặp

**Để:** Đảm bảo dữ liệu chính xác

### Acceptance Criteria:

#### Kịch bản 1: Nhân viên xóa bản ghi của mình trong ngày

**Given (Biết rằng):**

- Nhân viên Nguyễn Văn A tạo bản ghi chăm sóc lúc 14:00 hôm nay
- Nhân viên phát hiện nhập sai nội dung

**When (Khi):**

- Nhân viên click icon "Delete" (thùng rác) ở cột Actions
- Popconfirm hiển thị: "Xác nhận xoá?"

**And (Và):** Nhân viên click "OK"

**Then (Thì):**

- Hệ thống xóa bản ghi thành công (hard delete)
- Hiển thị message: "Xóa bản ghi chăm sóc thành công"
- Bản ghi biến mất khỏi danh sách
- Badge "Số lần CS" giảm đi 1

#### Kịch bản 2: Nhân viên không thể xóa bản ghi của người khác

**Given (Biết rằng):**

- Nhân viên Nguyễn Văn A đang xem lịch sử
- Có bản ghi do nhân viên Trần Thị B tạo

**When (Khi):** Nhân viên A di chuột vào icon "Delete" của bản ghi của B

**Then (Thì):**

- Icon Delete bị disable (màu xám)
- Tooltip hiển thị: "Chỉ xóa được bản ghi của mình trong ngày"

**And (Và):** Click vào icon không có tác dụng

#### Kịch bản 3: Nhân viên không thể xóa bản ghi cũ (ngày khác)

**Given (Biết rằng):**

- Hôm nay là 15/01/2025
- Nhân viên Nguyễn Văn A có bản ghi chăm sóc ngày 14/01/2025

**When (Khi):** Nhân viên A muốn xóa bản ghi ngày 14/01

**Then (Thì):**

- Icon Delete bị disable
- Tooltip: "Chỉ xóa được bản ghi trong ngày tạo"
- Backend trả về 403 nếu attempt xóa: "Chỉ có thể xóa bản ghi trong ngày tạo"

#### Kịch bản 4: Admin xóa bất kỳ bản ghi nào

**Given (Biết rằng):** Admin đang xem lịch sử chăm sóc

**When (Khi):** Admin click "Delete" bất kỳ bản ghi nào (của ai, ngày nào)

**Then (Thì):**

- Popconfirm hiển thị: "Xác nhận xoá bản ghi chăm sóc?"
- Khi confirm, hệ thống xóa thành công
- Không có giới hạn về ownership hay timeline

---

## User Story 6: Xem lịch sử chăm sóc của một khách hàng cụ thể

**Là một:** Nhân viên/Bác sĩ

**Tôi muốn:** Xem toàn bộ lịch sử chăm sóc của một khách hàng cụ thể

**Để:** Nắm rõ quá trình hồi phục và phản hồi của khách hàng qua các lần chăm sóc

### Acceptance Criteria:

#### Kịch bản 1: Xem lịch sử từ trang chi tiết khách hàng

**Given (Biết rằng):**

- Nhân viên đang ở trang "Chi tiết khách hàng" của Nguyễn Văn A
- Khách hàng này có 5 bản ghi chăm sóc trong quá khứ

**When (Khi):** Nhân viên chọn tab "Lịch sử chăm sóc"

**Then (Thì):**

- Hiển thị bảng với 5 bản ghi, không có grouping theo ngày
- Sắp xếp theo thời gian chăm sóc giảm dần (mới nhất trước)
- Columns:
  - Ngày điều trị
  - Ngày chăm sóc (thời gian chính xác)
  - Dịch vụ điều trị (tags)
  - Bác sĩ điều trị
  - Nhân viên CS
  - Trạng thái (Tag màu)
  - Nội dung (full text, không truncate)
  - Actions: View, Delete

**And (Và):** KHÔNG có cột "Khách hàng" (vì đã biết rõ khách hàng)

#### Kịch bản 2: Không có lịch sử chăm sóc

**Given (Biết rằng):** Khách hàng mới, chưa được chăm sóc lần nào

**When (Khi):** Nhân viên mở tab "Lịch sử chăm sóc"

**Then (Thì):**

- Empty State: "Khách hàng chưa có lịch sử chăm sóc"
- Gợi ý: "Bản ghi chăm sóc sẽ hiển thị sau khi khách hàng được điều trị và chăm sóc"

#### Kịch bản 3: Theo dõi xu hướng trạng thái

**Given (Biết rằng):** Khách hàng có nhiều bản ghi chăm sóc với các trạng thái khác nhau

**When (Khi):** Nhân viên xem lịch sử

**Then (Thì):**

- Có thể thấy rõ xu hướng cải thiện:
  - 15/01: "Cần theo dõi" (Cam)
  - 14/01: "Không liên lạc được" (Đỏ)
  - 13/01: "Ổn định" (Xanh)
- Giúp đánh giá hiệu quả điều trị và chăm sóc

---

## Business Rules Summary

### Timeline & Date Rules

1. **Default Date for "Customers Needing Care"**: Yesterday (hôm qua)

   - Logic: Khách điều trị hôm qua → Gọi chăm sóc hôm nay

2. **Default Range for History**: 35 days (from today - 34 days to today)

3. **Care Time Validation**: `careAt >= treatmentDate` (cùng ngày hoặc sau)

4. **Timezone**: All dates use Vietnam timezone (Asia/Ho_Chi_Minh)

### Permission Rules

| Action | Employee                                  | Admin          |
| ------ | ----------------------------------------- | -------------- |
| CREATE | ✅ Own clinic + customer has TreatmentLog | ✅ Any clinic  |
| VIEW   | ✅ Own clinic (with onlyMine filter)      | ✅ All clinics |
| DELETE | ⚠️ Own records + same VN day only         | ✅ Any record  |

### Data Rules

1. **TreatmentLog Dependency**: Must have TreatmentLog on `treatmentDate` to create care record

2. **Multiple Records**: Same customer can have multiple care records on same treatment date

3. **Immutable**: No update endpoint (current implementation)

4. **Snapshot Data**: Service names, doctor names/IDs, clinic IDs copied from TreatmentLogs

   - Trade-off: Data may be stale if TreatmentLog edited/deleted after

5. **Care Count Badge**: Real-time count of care records per customer per treatment date

### Status Options

- **STABLE** (Ổn định): Green tag
- **UNREACHABLE** (Không liên lạc được): Red tag
- **NEEDS_FOLLOW_UP** (Cần theo dõi): Orange tag

---

## UI/UX Notes

### Tab Structure

**2 Main Tabs:**

1. **"Khách cần chăm sóc"** (Customers Needing Care)

   - Default date: Yesterday
   - Focus: Action-oriented (call customers)
   - Shows care count badge

2. **"Lịch sử chăm sóc"** (Care History)
   - Default range: 35 days
   - Focus: Review & tracking
   - Grouped by day with collapse panels

### Modal Patterns

1. **CreateTreatmentCareModal**:

   - Simple form
   - Context from customer table
   - Read-only customer info + treatment date

2. **TreatmentCareDetailModal**:
   - Read-only view
   - Full information display
   - Structured sections

### Empty States

- No customers on selected date
- No care history in date range
- No care history for specific customer

All with helpful messages and suggestions.

---

## Technical Notes

### API Endpoints

- `GET /api/v1/treatment-cares` - List/grouped history
- `GET /api/v1/treatment-cares/customers` - Customers needing care
- `POST /api/v1/treatment-cares` - Create (via Server Action)
- `DELETE /api/v1/treatment-cares/{id}` - Delete (via Server Action)

### Query Parameters

- `date`: YYYY-MM-DD (for customers endpoint)
- `from`, `to`: YYYY-MM-DD (for history endpoint)
- `groupBy`: "day" (optional)
- `onlyMine`: "true"|"false" (optional)
- `keyword`: string (search in customers)
- `customerId`: UUID (filter by customer)

### Error Codes

- **400**: Missing fields, invalid careAt
- **401**: Missing auth headers
- **403**: Permission denied (delete restrictions)
- **404**: Record not found
- **422**: No TreatmentLog found on treatmentDate
- **500**: Server error

---

## Related Documentation

- **Technical Requirements**: `014 Treatment Care.md`
- **Prisma Model**: `prisma/schema.prisma` → TreatmentCare
- **Related Features**: `012 Treatment Log.md`, `007 Customer.md`
