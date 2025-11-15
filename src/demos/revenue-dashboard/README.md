# Revenue Dashboard Demo

Demo trang Dashboard Doanh thu với mock data.

## 📁 Cấu trúc

```
src/demos/revenue-dashboard/
├── types.ts                      # TypeScript type definitions
├── mockData.ts                   # Mock transactions data
├── utils.ts                      # Aggregation & calculation functions
├── exportUtils.ts                # Export to Excel utilities
└── components/
    ├── RevenueDashboard.tsx      # Main dashboard component
    ├── FilterBar.tsx             # Filter controls (month, clinic, source, doctor, sale)
    ├── RevenueKpiCards.tsx       # 4 KPI cards
    ├── DailyRevenueLine.tsx      # Line chart - daily revenue
    ├── DailyRevenueStacked.tsx   # Stacked bar - payment methods
    ├── RevenueBySourceDonut.tsx  # Donut chart - revenue by customer source
    ├── RevenueByServiceBar.tsx   # Horizontal bar - revenue by service
    ├── PaymentMethodTable.tsx    # Table - payment method statistics
    └── RevenueTabs.tsx           # 4 tabs: Daily / Source / Service / Doctor
```

## 🎯 Mục đích

Demo giao diện Dashboard Doanh thu để:

- Preview UI/UX trước khi implement backend
- Test Chart.js integration
- Validate business logic & calculations
- Get stakeholder feedback

## 🚀 Truy cập

Route: `/demo/revenue-dashboard`

## 📊 Chức năng

### Filter Bar

- **MonthPicker**: Chọn tháng báo cáo
- **Select Chi nhánh**: Filter theo clinic
- **Multi-select Nguồn khách**: Filter theo Facebook, TikTok, Referral, Walk-in, Online
- **Select Sale**: Filter theo sale tư vấn
- **Select Bác sĩ**: Filter theo bác sĩ điều trị
- **Refresh**: Reload data
- **Export**: Xuất Excel (CSV format)

### KPI Cards (4 cards)

1. **Tổng doanh thu**: Hiển thị total revenue + % change vs previous month
2. **Số giao dịch**: Total transaction count
3. **Doanh thu TB/giao dịch**: Average transaction value
4. **Tỷ lệ thanh toán**: Breakdown by payment method (cash/card/visa/transfer)

### Charts

1. **DailyRevenueLine**: Line chart showing daily revenue trend
2. **DailyRevenueStacked**: Stacked bar chart by payment method
3. **RevenueBySourceDonut**: Donut chart by customer source
4. **RevenueByServiceBar**: Horizontal bar (top 10 services)

### Payment Method Table

Table showing:

- Loại giao dịch (Payment type)
- Số giao dịch (Transaction count)
- Doanh thu (Revenue)
- Tỷ lệ % (Percentage)
- Giá trị TB/giao dịch (Avg per transaction)

### Tabs Detail (4 tabs)

#### Tab A - Theo ngày

- Line chart + Stacked bar
- Table: Date | TX Count | Total | Cash | Card | Visa | Transfer | Top Service | Top Doctor

#### Tab B - Theo nguồn khách hàng

- Bar chart by source
- Table: Source | TX Count | Revenue | Avg Value | Conversion Rate

#### Tab C - Theo dịch vụ

- Table: Service Group | Service | TX Count | Revenue | % Contribution | Avg Value

#### Tab D - Theo bác sĩ

- Table: Doctor | Case Count | Revenue | Avg Value | Closing Rate

## 💾 Mock Data

Mock data được generate trong `mockData.ts`:

- 250-400 transactions/month
- Random distribution across:
  - 31 days of month
  - 4 payment types
  - 5 customer sources
  - 10 services in 5 groups
  - 5 doctors
  - 3 sales consultants

### Services Mock

- **Thẩm mỹ**: Tẩy trắng, Bọc răng sứ
- **Chỉnh nha**: Invisalign, Mắc cài
- **Phục hồi**: Implant, Trám răng
- **Nội nha**: Điều trị tủy
- **Nha khoa tổng quát**: Nhổ răng, Lấy cao răng, Tư vấn

## 🔧 Code Location

- **Demo pages**: `src/app/(private)/demo/revenue-dashboard/`
- **Reusable code**: `src/demos/revenue-dashboard/`

## 📈 Charting Library

Sử dụng **Chart.js** (react-chartjs-2) vì:

- ✅ Performance tốt với canvas-based rendering
- ✅ Highly customizable
- ✅ Responsive & mobile-friendly
- ✅ Rich tooltip & interaction support
- ✅ Bundle size nhỏ hơn Recharts

## 🎨 Styling

- **Theme**: White-Blue modern dashboard
- **Layout**: Responsive grid (desktop & mobile)
- **Typography**: Clear hierarchy with Ant Design
- **Spacing**: Consistent 16px gutter

## 🔄 Migration to Production

Khi backend ready:

1. **Keep components** in `demos/` hoặc refactor sang `features/reports/revenue/`
2. **Create production page** in `app/(private)/dashboard/revenue/`
3. **Replace mock data** with API hooks:

   ```typescript
   // Replace this:
   const transactions = getMockTransactionsForMonth(month);

   // With this:
   const { data: transactions } = useRevenueTransactions({ month });
   ```

4. **Add loading states**: Skeleton loaders
5. **Add error handling**: Error boundaries
6. **Implement real export**: Use xlsx library or backend API
7. **Add permissions**: Check user role for data access
8. **Add real filters**: Connect to backend filter APIs

## 📝 Notes

- Demo CHỈ dùng mock data - không call API
- Calculations are CLIENT-SIDE for demo purpose
- In production, aggregations should be SERVER-SIDE
- Export hiện tại là CSV (UTF-8 with BOM) - có thể upgrade sang xlsx
