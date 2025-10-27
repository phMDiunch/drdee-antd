# Reports Spec (End-to-End)

Nguồn tham chiếu duy nhất cho nghiệp vụ, API và UI/UX của tính năng Báo cáo (Reports), bao gồm Doanh thu (Revenue), Doanh số (Sales), và Doanh thu điều trị theo bác sĩ (Treatment Revenue by Doctor). Tài liệu này hợp nhất luồng từ backend đến frontend để tránh bỏ sót logic.

---

## 1) Phạm vi & Mục tiêu
- Tổng hợp số liệu theo khoảng thời gian và chi nhánh: doanh thu thực thu (revenue), doanh số dịch vụ (sales), số giao dịch, doanh thu theo phương thức thanh toán.
- Phân tích theo nhân sự (sale/bs tư vấn/bs điều trị), theo chi nhánh, và theo ngày để phục vụ biểu đồ/tables.
- So sánh tăng trưởng theo tháng trước và năm trước cùng kỳ.
- Báo cáo chuyên biệt: doanh thu điều trị theo bác sĩ (từ phiếu thu, chi tiết gắn bác sĩ điều trị).

## 2) Định nghĩa & Nguồn dữ liệu
- Revenue (Doanh thu):
  - Nguồn: PaymentVoucher + PaymentVoucherDetail trong khoảng ngày (paymentDate).
  - Liên chi nhánh: filter theo consultedService.clinicId trong detail (PaymentVoucher.clinicId có thể null); nếu không chọn clinic thì lấy tất cả.
  - Chỉ tính details có consultedService khác null.
- Sales (Doanh số):
  - Nguồn: ConsultedService đã chốt (serviceStatus = “Đã chốt”) theo serviceConfirmDate.
  - TotalSales = sum(finalPrice), TotalServices = số dịch vụ.
- Treatment Revenue by Doctor:
  - Nguồn: PaymentVoucherDetail + join ConsultedService.treatingDoctor, theo paymentDate.
  - Trả danh sách chi tiết khoản thu theo dịch vụ và bác sĩ điều trị.

## 3) Bộ lọc thời gian & Clinic Scope
- Thời gian:
  - timeRange: "month" | "range".
  - selectedMonth: YYYY-MM (khi timeRange="month").
  - range: startDate/endDate (YYYY-MM-DD; server build startOfDay/endOfDay); với revenue sử dụng T00:00:00.000Z/T23:59:59.999Z.
- Clinic scope:
  - Non‑admin: luôn scope theo clinicId của profile (ở FE/hook – truyền lên API).
  - Admin: có thể chọn clinicId hoặc bỏ trống để xem tất cả.

## 4) API Contract
- Các endpoint chính:
  - GET `/api/reports/revenue?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD[&clinicId=]`
    - Tính:
      - totalRevenue: sum(detail.amount)
      - totalSales: sum(service.finalPrice) (dịch vụ đã chốt trong khoảng ngày)
      - totalTransactions: số voucher có revenue > 0
      - averageTransaction: totalRevenue / totalTransactions
      - byPaymentMethod: cash | cardNormal | cardVisa | transfer (chuẩn hóa method bằng matching tiếng Việt/visa/pos)
      - byTime: mảng theo ngày (YYYY-MM-DD) gồm revenue/sales/transactions + breakdown payment methods
      - byEmployee (nếu cần): tổng hợp theo consultingSale/consultingDoctor/treatingDoctor (dựa trên consultedService trong details)
      - byClinic (nếu cần): tổng hợp theo clinicId
  - GET `/api/reports/sales?timeRange=month|range[&selectedMonth=YYYY-MM][&startDate=ISO&endDate=ISO][&clinicId=]`
    - Trả SalesComparisonData:
      - current: { totalSales, totalServices, details[] }
      - previousMonth: { data, periodLabel, growth{ sales, services } }
      - previousYear: tương tự
    - details: từng service đã chốt, gồm customer info (source, sourceNotes, code), serviceName, finalPrice, serviceConfirmDate (YYYY-MM-DD), clinicId, consultingDoctor/Sale ids/names.
  - GET `/api/reports/treatment-revenue-doctor?timeRange=...&selectedMonth=...&startDate=...&endDate=...&clinicId=...`
    - Trả { totalRevenue, totalPayments, details[] }, mỗi detail gồm: id (payment detail), customerId/code/name, serviceName, treatingDoctorId/name, amountReceived (detail.amount), paymentDate (ISO), paymentMethod, clinicId.
  - GET `/api/reports/treatment-revenue?month=current|YYYY-MM[&clinicId=]`
    - Trả danh sách vouchers (chỉ các detail có treatingDoctorId = employee hiện tại; xác định bằng header `x-employee-id`), để màn hình bác sĩ xem nhanh.

Lỗi chung: 400 (thiếu tham số), 500 (server). Doanh thu/sales xử lý theo UTC parse chuẩn và hiển thị VN ở FE.

## 5) Frontend – Hooks & Caching
- useReportsDataQuery (Revenue + Comparison): tính cache strategy theo độ mới (hôm nay → staleTime 1m, tháng hiện tại 5m, >3 tháng 60m). Tự build date range từ filters.
- useSalesReportsData (Sales + Comparison): giống revenue, trả SalesComparisonData; scoping clinic non‑admin.
- useTreatmentRevenueDoctorData: lấy dữ liệu doctor treatment revenue; filters đồng nhất.
- Prefetch utils: invalidate/prefetch theo queryKey và filters để điều hướng nhanh.

## 6) UI Components & Hành vi
- Filters (RevenueFilters): chọn timeRange (tháng/khoảng), MonthPicker (YYYY-MM), RangePicker (ngày), chọn clinic (admin); apply gọi setFilters.
- Tổng quan (ReportsOverviewPage):
  - Thống kê tổng: totalRevenue, totalSales, totalTransactions, averageTransaction; hiển thị growth vs previousMonth/previousYear (Tag màu tăng/giảm).
  - Breakdown theo phương thức thanh toán: 4 card (cash/cardNormal/cardVisa/transfer).
  - Tabs:
    - Revenue (theo ngày): `DailyRevenueTable` dùng `revenueData.byTime`.
    - Sales (theo nguồn): `SalesDetailTable` dùng `salesData.details` (có customerSource/sourceNotes).
    - Sales by Doctor: `SalesByDoctorTable` nhóm theo consultingDoctor.
    - Sales by Sale: `SalesBySaleTable` nhóm theo consultingSale.
    - Treatment Revenue by Doctor: `TreatmentRevenueDoctorTable` từ API tương ứng.
  - Nút refresh: refetch ba nguồn.
- Charts (RevenueChart): hiển thị tuyến tính theo ngày; màu theo CHART_COLORS.
- RevenueByEmployee/RevenueByPaymentMethod: hiển thị bảng/tổng hợp theo nhân sự/phương thức (nếu dùng); màu sắc theo PAYMENT_METHOD_COLORS.

## 7) Tính toán & Quy tắc đặc biệt
- Chuẩn hóa phương thức thanh toán bên server (revenue) để gom nhóm chính xác:
  - cash: chứa “tiền” và “mặt”.
  - cardNormal: chứa “pos” hoặc “thẻ thường”.
  - cardVisa: chứa “visa”.
  - transfer: chứa “chuyển” và “khoản”.
- Daily grouping: revenue theo paymentDate của voucher detail; sales theo serviceConfirmDate của consulted service. Mỗi ngày giữ struct chứa revenue/sales/transactions + breakdown methods.
- Transactions: số voucher có tổng revenue > 0 trong ngày.
- Growth %: ((current - previous) / previous) * 100; nếu previous = 0, current > 0 → 100, else 0.

## 8) Phân quyền & Clinic Scope FE
- Non‑admin: filters.clinicId = employeeProfile.clinicId (ẩn chọn clinic nếu muốn); admin: có selector clinic.
- API revenue lọc theo consultedService.clinicId trong details khi truyền clinicId.
- Sales API nhận clinicId filter trực tiếp trên consultedService.clinicId.

## 9) Lỗi & UX
- Thông báo tiếng Việt thân thiện khi fetch thất bại (toast), có retry logic ở React Query theo cacheStrategy.
- Loading tổng hợp (Spin) khi bất kỳ nguồn đang fetch; có indicators “đang cập nhật”.
- Các bảng có phân trang/scroll hợp lý; link sang Customer khi có customerId.

## 10) Checklist triển khai
- [ ] Đồng bộ filters (timeRange/month/range/clinic) đa nguồn.
- [ ] Revenue API: tính tổng/nhóm/chuẩn hóa payment methods; daily & employee breakdown.
- [ ] Sales API: details đầy đủ; comparison prevMonth/prevYear (label MM/YYYY); nhóm theo doctor/sale client-side.
- [ ] Treatment revenue doctor API: details đầy đủ; tổng hợp; respect clinicId khi cần.
- [ ] FE hooks: cache strategy theo độ mới; invalidate/prefetch tiện dụng.
- [ ] UI: Overview (cards, charts, tabs); filters có control; refresh đồng bộ; link sang Customer nơi phù hợp.
- [ ] Tests: revenue grouping & method normalization; sales comparison correctness; clinic scoping non‑admin; daily aggregation; performance (cache).

