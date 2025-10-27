# Dashboard Spec (End-to-End)

Nguồn tham chiếu duy nhất cho nghiệp vụ, dữ liệu và UI/UX của Dashboard. Tài liệu này mô tả rõ các nguồn dữ liệu, bộ lọc, lịch làm tươi (polling), và hành vi điều hướng chi tiết.

---

## 1) Mục tiêu & Phạm vi
- Cung cấp cái nhìn nhanh trong ngày cho từng nhân viên: lịch hẹn hôm nay, dịch vụ tư vấn hôm nay, dịch vụ chưa chốt hôm qua.
- Cung cấp thống kê theo tháng: doanh số tư vấn theo tháng, doanh thu điều trị theo tháng.
- Cho phép nhấp vào thẻ thống kê để hiển thị bảng chi tiết bên dưới (section view).
- Tự động làm tươi các dữ liệu cần thời gian thực (appointments/services hôm nay).

## 2) Nguồn dữ liệu & APIs sử dụng
- Appointments hôm nay (theo bác sĩ):
  - GET `/api/appointments/today?date=YYYY-MM-DD&doctorId=<currentEmployeeId>`
  - Lấy lịch hẹn trong ngày cho bác sĩ (primary/secondary) hiện tại. FE refresh mỗi 30s.
- Consulted services hôm nay (theo nhân sự hiện tại):
  - GET `/api/consulted-services?date=YYYY-MM-DD&consultingDoctorId=<id>&consultingSaleId=<id>`
  - Trả cả đã chốt/chưa chốt. FE refresh mỗi 60s.
- Dịch vụ chưa chốt hôm qua:
  - GET `/api/consulted-services?date=<yesterday>&consultingDoctorId=<id>&consultingSaleId=<id>` → lọc `serviceStatus !== "Đã chốt"` ở FE.
- Doanh số tư vấn theo tháng (tạm thời client-filter):
  - GET `/api/consulted-services?consultingDoctorId=<id>&consultingSaleId=<id>` → FE lọc theo tháng đã chọn và chỉ lấy `serviceStatus === "Đã chốt"`, tính `sum(finalPrice)`.
  - Lưu ý: khi cần tối ưu, thêm API server-side filter theo tháng.
- Doanh thu điều trị theo tháng:
  - Dùng Reports hook: GET `/api/reports/treatment-revenue-doctor?timeRange=month&selectedMonth=...` (hoặc hook tương ứng), trả danh sách detail; FE tính tổng theo tháng.

## 3) Hooks & Caching/Refetch
- `useDashboardAppointments()`
  - queryKey: ["dashboard-appointments", employeeId]
  - staleTime: 2 phút; refetchInterval: 30s
- `useDashboardTodayServices()`
  - queryKey: ["dashboard-today-services", employeeId]
  - staleTime: 3 phút; refetchInterval: 60s
- `useDashboardUnconfirmedServices()`
  - queryKey: ["dashboard-unconfirmed-services", employeeId]
  - staleTime: 5 phút; không auto refetch (dữ liệu hôm qua)
- `useDashboardMonthlyRevenue(selectedMonth)`
  - queryKey: ["dashboard-monthly-revenue", employeeId, YYYY-MM]
  - staleTime: 10 phút; refetchOnWindowFocus: true
- `useDashboardTreatmentRevenue(selectedMonth)`
  - tương tự: query theo tháng, dựa trên Reports hook.

## 4) Thành phần UI & Hành vi
- `DashboardGreeting`
  - Hiển thị lời chào + thông tin cơ bản (tên nhân viên, ngày).
- `DashboardStatistics`
  - Hiển thị 2 nhóm thẻ thống kê:
    - Hôm nay: Lịch hẹn hôm nay; Dịch vụ chưa chốt hôm qua; Dịch vụ tư vấn hôm nay.
    - Theo tháng (chọn tháng bằng nút chuyển trái/phải, khóa vượt quá hiện tại): Doanh số tư vấn tháng; Doanh thu điều trị tháng.
  - Mỗi thẻ bấm được: kích hoạt section tương ứng bên dưới.
  - Formatter tiền tệ dùng `formatCurrency`; màu sắc và icon theo ngữ nghĩa.
- Sections chi tiết (render khi thẻ tương ứng được chọn):
  - `DashboardDailyAppointment`: bảng lịch hẹn trong ngày (theo doctor), lấy từ `/api/appointments/today`.
  - `DashboardUnconfirmedServices`: bảng dịch vụ chưa chốt hôm qua, lấy từ consulted-services (lọc FE).
  - `DashboardTodayServices`: bảng dịch vụ tư vấn hôm nay, lấy từ consulted-services.
  - `DashboardMonthlyRevenue`: bảng/summary dịch vụ tư vấn đã chốt trong tháng của user (lọc FE theo tháng), tổng tiền.
  - `DashboardTreatmentRevenue` (import từ Reports): bảng doanh thu điều trị theo tháng (detail theo payment voucher detail); tổng tiền.
- `DashboardPage`
  - Quản lý state `selectedMonth` và `activeSection`; truyền callback `onCardClick`/`onSelectedMonthChange` cho Statistic.

## 5) Phân quyền & Clinic Scope
- Dashboard dựa trên `employeeProfile` hiện tại (id). Các API ở trên đã áp dụng quy tắc clinic/role riêng (ví dụ consulted-services có thể cần filter clinic ở server; appointments today đã hỗ trợ doctorId).
- Mặc định, Dashboard hiển thị dữ liệu cá nhân (theo employeeId); không có selector clinic/global ở màn hình này.

## 6) Lịch trình làm tươi (polling) & Hiệu năng
- Appointments today: mỗi 30s.
- Today services: mỗi 60s.
- Unconfirmed yesterday: không auto refetch.
- Monthly summaries: không auto refetch; refetch on focus.
- Dùng staleTime phù hợp để giảm request thừa, vẫn đảm bảo tính mới cho dữ liệu ngày.

## 7) Hạn chế & Cải tiến đề xuất
- Monthly revenue đang lọc phía client từ `/api/consulted-services`. Có thể bổ sung API cho phép filter theo month + clinic để tối ưu dữ liệu và thống nhất logic với Reports.
- Có thể thêm selector clinic cho admin nếu cần phạm vi rộng (đồng bộ với Reports filters).
- Có thể thêm thẻ KPI khác (tỷ lệ chốt, số khách đến khám, ...).

## 8) Checklist triển khai
- [ ] Đảm bảo hooks lấy `employeeProfile.id` trước khi gọi API (enabled flags).
- [ ] Đồng bộ format ngày: DATE_FORMAT = YYYY-MM-DD.
- [ ] Tối ưu chọn tháng (không cho vượt tháng hiện tại); refetch đúng phần.
- [ ] Thêm unit tests tối thiểu cho format và filter FE (đặc biệt monthly revenue client-filter).
- [ ] Khi bổ sung API filter theo month/clinic, cập nhật hook monthly để gọi server-side cho chính xác và hiệu năng tốt hơn.

