# Sales Dashboard - Modern Analytics Dashboard

Dashboard doanh số hiện đại được xây dựng với React, Next.js và Ant Design.

## 📁 Cấu trúc thư mục

```
src/features/reports/sales/
├── components/
│   ├── SalesDashboard.tsx        # Main dashboard component
│   ├── FilterBar.tsx              # Filter controls (month, clinic, sale, doctor)
│   ├── KpiCards.tsx               # KPI metric cards (4 cards)
│   ├── DailyRevenueChart.tsx      # Line chart - daily revenue
│   ├── RevenueBySourceChart.tsx   # Pie chart - revenue by source
│   ├── RevenueByServiceBar.tsx    # Bar chart - revenue by service
│   ├── SaleTable.tsx              # Sales performance table
│   └── TabsDetail.tsx             # Detail tabs (5 tabs)
├── types.ts                        # TypeScript type definitions
└── mockData.ts                     # Mock data for development
```

## 🚀 Cài đặt

### 1. Install dependencies

```bash
npm install antd dayjs chart.js react-chartjs-2
# hoặc
yarn add antd dayjs chart.js react-chartjs-2
```

### 2. Import vào page/layout

```tsx
// app/dashboard/page.tsx
import SalesDashboard from "@/features/reports/sales/components/SalesDashboard";

export default function DashboardPage() {
  return <SalesDashboard />;
}
```

### 3. Configure Chart.js (nếu cần)

Thêm vào `next.config.ts`:

```typescript
const nextConfig = {
  // ... other config
  transpilePackages: ["chart.js"],
};
```

## 🎨 Features

### 1. Filter Bar

- **Month Picker**: Chọn tháng báo cáo
- **Clinic Select**: Lọc theo chi nhánh (admin view)
- **Sale Select**: Lọc theo sale tư vấn
- **Doctor Select**: Lọc theo bác sĩ tư vấn
- **Export Buttons**: Export to Excel/PDF

### 2. KPI Cards (4 cards)

- **Tổng doanh số**: Total sales với growth %
- **Số ca chốt**: Closed deals count với growth %
- **Doanh số TB/ca**: Average per deal
- **Khách mới vs Cũ**: New vs returning customer revenue

### 3. Charts

#### Daily Revenue Line Chart

- Line chart với gradient fill
- Hiển thị xu hướng doanh số theo ngày
- Interactive tooltips với VND format

#### Revenue by Source Pie Chart

- 5 nguồn khách: Facebook Ads, TikTok, Referral, Walk-in, Sale Online
- Color-coded by source
- Percentage breakdown

#### Revenue by Service Bar Chart

- Horizontal bar chart
- Sortable by revenue
- Top services highlighted

### 4. Sales Performance Table

- 8 columns: Ranking, Sale, Assigned, Consulted, Closed, Revenue, Avg, Closing Rate
- Color-coded ranking (Top 3 highlighted)
- Sortable columns
- Closing rate color indicators

### 5. Detail Tabs (5 tabs)

#### Tab 1: Theo ngày

Bảng chi tiết từng ngày với columns:

- Ngày, Ca đến, Ca tư vấn, Ca chốt
- Doanh số, Giá trị/ca
- Dịch vụ top, Sale top, Bác sĩ top

#### Tab 2: Theo nguồn

Phân tích theo nguồn khách:

- Ca đến, Ca tư vấn, Ca chốt
- Doanh số, ROI
- Color-coded ROI indicators

#### Tab 3: Theo dịch vụ

Group theo nhóm dịch vụ:

- Doanh số, Ca chốt
- Giá trị trung bình
- % Đóng góp

#### Tab 4: Theo sale tư vấn

Chi tiết performance từng sale:

- Ca được phân, Ca tư vấn, Ca chốt
- Doanh số, Tỷ lệ chốt
- Dịch vụ chính

#### Tab 5: Theo bác sĩ tư vấn

Performance bác sĩ:

- Ca tư vấn, Ca đồng ý, Ca chốt
- Doanh số
- Tỷ lệ đồng ý phác đồ

## 🎯 Sử dụng

### Basic Usage

```tsx
import SalesDashboard from "@/features/reports/sales/components/SalesDashboard";

export default function MyPage() {
  return <SalesDashboard />;
}
```

### Custom Styling

Dashboard sử dụng inline styles, có thể customize:

```tsx
// Thay đổi background color
<div style={{ background: "#f5f5f5" }}>
  <SalesDashboard />
</div>
```

### Integrate với API

Thay thế `mockDashboardData` bằng API call:

```tsx
// hooks/useDashboardData.ts
export function useDashboardData(filters: DashboardFilters) {
  return useQuery({
    queryKey: ["dashboard", filters],
    queryFn: () => fetch("/api/reports/sales").then((r) => r.json()),
  });
}

// SalesDashboard.tsx
const { data, loading } = useDashboardData(filters);
```

## 🎨 Customization

### Colors

Màu chính được định nghĩa:

- Primary: `#1890ff` (Blue)
- Success: `#52c41a` (Green)
- Warning: `#fa8c16` (Orange)
- Error: `#ff4d4f` (Red)
- Purple: `#722ed1`

### Typography

- Headings: 16px, font-weight: 600
- KPI values: 28px, bold
- Body text: 14px
- Small text: 12px

### Spacing

- Card padding: 24px
- Grid gutter: 24px
- Component margins: 24px
- Small spacing: 16px

## 📱 Responsive

Dashboard responsive trên tất cả devices:

- **Desktop (lg)**: 4 columns KPI, 2 columns charts
- **Tablet (md)**: 2 columns KPI, 1 column charts
- **Mobile (xs)**: 1 column all

## 🔧 Mock Data

Mock data được define trong `mockData.ts`:

```typescript
export const mockDashboardData: DashboardData = {
  kpi: { ... },
  dailyRevenue: [ ... ],
  revenueBySource: [ ... ],
  // ... more data
};
```

Dữ liệu mẫu bao gồm:

- 30 ngày revenue data
- 5 nguồn khách hàng
- 5 dịch vụ chính
- 4 sales performance
- Chi tiết theo từng dimension

## 📊 Export Functionality

Export buttons đã được tích hợp (UI only):

```tsx
const handleExport = (type: "excel" | "pdf") => {
  console.log(`Exporting to ${type}...`);
  // TODO: Implement với thư viện như:
  // - xlsx (Excel)
  // - jspdf (PDF)
};
```

### Implement Excel Export

```bash
npm install xlsx
```

```tsx
import * as XLSX from "xlsx";

const exportToExcel = () => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sales Report");
  XLSX.writeFile(wb, "sales-report.xlsx");
};
```

## 🚀 Performance Tips

1. **Chart.js Configuration**: Use `maintainAspectRatio: false` for better responsive
2. **Table Pagination**: Enable pagination for large datasets
3. **Lazy Loading**: Consider lazy loading tabs content
4. **Memoization**: Use `useMemo` for expensive calculations

## 🐛 Troubleshooting

### Chart không hiển thị

- Check Chart.js đã được register đúng components
- Verify data format đúng structure

### TypeScript errors

- Ensure tất cả types được import từ `types.ts`
- Check mock data match với type definitions

### Styling issues

- Verify Ant Design CSS được import
- Check responsive breakpoints

## 📝 TODO / Roadmap

- [ ] Connect với real API
- [ ] Implement Excel export
- [ ] Implement PDF export
- [ ] Add date range comparison
- [ ] Add drill-down functionality
- [ ] Add chart interactions (click to filter)
- [ ] Add print functionality
- [ ] Add favorites/bookmarks
- [ ] Add scheduled reports
- [ ] Add email notifications

## 📄 License

MIT

## 👥 Contributors

Your Team
