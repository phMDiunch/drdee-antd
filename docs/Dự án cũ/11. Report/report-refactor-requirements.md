# Reports Feature - Requirements để Refactor

## 1. Overview

Feature Reports là hệ thống báo cáo tổng hợp với 2 loại chính:

- **Revenue (Doanh thu):** Tiền thực thu từ PaymentVoucher
- **Sales (Doanh số):** Giá trị dịch vụ từ ConsultedService (serviceStatus = "Đã chốt")

**Key Difference:**

- Revenue = Số tiền đã thanh toán (PaymentVoucherDetail.amount)
- Sales = Giá trị dịch vụ đã chốt (ConsultedService.finalPrice)

---

## 2. Database Schema (Không có schema mới)

Reports feature KHÔNG có bảng riêng. Nó aggregate data từ:

- **PaymentVoucher** + **PaymentVoucherDetail** → Revenue reports
- **ConsultedService** (với serviceStatus="Đã chốt") → Sales reports
- **Employee** → Employee performance reports
- **Customer** → Customer source analysis

---

## 3. Business Rules

### 3.1 Revenue Calculation

**Source:** PaymentVoucher + PaymentVoucherDetail

**Metrics:**

- `totalRevenue` = SUM(PaymentVoucherDetail.amount) trong date range
- `totalTransactions` = COUNT(PaymentVoucher) trong date range
- `averageTransaction` = totalRevenue / totalTransactions

**Breakdown:**

- **By Payment Method:** Categorize theo paymentMethod (Tiền mặt, Quẹt thẻ thường, Visa, Chuyển khoản)
- **By Time:** Daily breakdown trong date range
- **By Employee:** Group theo consultingSale, consultingDoctor, treatingDoctor từ ConsultedService
- **By Clinic:** Group theo ConsultedService.clinicId

**Date Filter:** `PaymentVoucher.paymentDate` trong range

### 3.2 Sales Calculation

**Source:** ConsultedService với serviceStatus = "Đã chốt"

**Metrics:**

- `totalSales` = SUM(ConsultedService.finalPrice) trong date range
- `totalServices` = COUNT(ConsultedService) trong date range

**Breakdown:**

- **By Source:** Group theo Customer.source (Facebook, Website, Giới thiệu, etc.)
- **By Employee:** Group theo consultingDoctor hoặc consultingSale
- **Service Details:** Include consultedServiceName, customerName, finalPrice, serviceConfirmDate

**Date Filter:** `ConsultedService.serviceConfirmDate` trong range

### 3.3 Comparison Logic

**3 types of comparison:**

1. **Previous Period:** Cùng khoảng thời gian nhưng trước đó

   - Nếu current = 1-31/10 → previous = 1-30/9
   - Nếu current = 10-20/10 → previous = 30/9-10/10

2. **Previous Month:** Tháng trước (full month)

   - Nếu current = 10/2024 → previous = 9/2024

3. **Previous Year:** Cùng tháng năm trước
   - Nếu current = 10/2024 → previous = 10/2023

**Growth Formula:**

```typescript
growth = ((current - previous) / previous) * 100;
// Nếu previous = 0 → growth = current > 0 ? 100 : 0
```

### 3.4 Permission Rules

**Admin:**

- Xem reports của TẤT CẢ clinics
- Switch giữa các clinics qua tabs
- Chọn time range tùy ý (month hoặc custom range)
- Export data

**Non-admin:**

- CHỈ xem reports của clinic mình
- Chỉ chọn month (KHÔNG được chọn custom range)
- Không có tabs clinic
- Export data của clinic mình

**Backend:** Không validate clinicId scope (frontend filter)

### 3.5 Treatment Revenue Reports

**2 loại:**

1. **Treatment Revenue (For Self)** - `/api/reports/treatment-revenue`

   - Chỉ show payment details của services mà user là treatingDoctor
   - Filter: `ConsultedService.treatingDoctorId = currentUserId`
   - Used by: Treating doctors để xem doanh thu điều trị của mình

2. **Treatment Revenue Doctor (For Admin)** - `/api/reports/treatment-revenue-doctor`
   - Show TẤT CẢ payment details với treatingDoctor info
   - Admin xem doanh thu điều trị của từng bác sĩ
   - Group by treatingDoctorId để phân tích

---

## 4. Backend Architecture

### 4.1 API Routes

#### GET /api/reports/revenue

**Query Params:**

- `startDate`: YYYY-MM-DD (required)
- `endDate`: YYYY-MM-DD (required)
- `clinicId`: string (optional, nhưng không dùng để filter - deprecated)

**Logic:**

1. Fetch PaymentVouchers trong date range với includes: details, consultedService, customer, cashier
2. Nếu có clinicId param: Filter vouchers.details theo `ConsultedService.clinicId`
3. Fetch ConsultedServices (serviceStatus="Đã chốt") trong date range
4. Calculate metrics:

   - totalRevenue: sum của details.amount
   - totalSales: sum của consultedService.finalPrice
   - totalTransactions: count của vouchers
   - averageTransaction: totalRevenue / totalTransactions

5. Breakdown by payment method:

   - Normalize payment method strings (handle Vietnamese diacritics)
   - Categorize: Tiền mặt, Quẹt thẻ thường, Visa, Chuyển khoản

6. Daily breakdown (byTime):

   - Group payment details theo paymentDate
   - Group consulted services theo serviceConfirmDate
   - Merge vào Map với date key
   - Sort by date

7. Employee breakdown (byEmployee):

   - Extract consultingSale, consultingDoctor, treatingDoctor từ ConsultedService
   - Map payment details → employee revenue
   - Map consulted services → employee sales
   - Aggregate vào Map với employeeId key

8. Clinic breakdown (byClinic):
   - Group theo ConsultedService.clinicId
   - Calculate revenue + sales per clinic

**Response:**

```typescript
{
  totalRevenue: number,
  totalSales: number,
  totalTransactions: number,
  averageTransaction: number,
  byPaymentMethod: { cash, cardNormal, cardVisa, transfer },
  byTime: [{ date, revenue, sales, transactions, cash, cardNormal, cardVisa, transfer }],
  byEmployee: [{ employeeId, employeeName, role, revenue, sales, transactions }],
  byClinic: [{ clinicId, clinicName, revenue, sales, transactions }]
}
```

#### GET /api/reports/sales

**Query Params:**

- `timeRange`: "month" | "range"
- `selectedMonth`: YYYY-MM (for month mode)
- `startDate`: YYYY-MM-DD (for range mode)
- `endDate`: YYYY-MM-DD (for range mode)
- `clinicId`: string (optional)

**Logic:**

1. Calculate date range từ timeRange params
2. Fetch ConsultedServices với:
   - `serviceStatus = "Đã chốt"`
   - `serviceConfirmDate` trong range
   - Include: customer, consultingDoctor, consultingSale
3. Calculate current period data:

   - totalSales: sum finalPrice
   - totalServices: count
   - details: map services với customer info

4. Calculate comparison periods:
   - previousMonth: Tháng trước (full month)
   - previousYear: Cùng tháng năm trước
   - Calculate growth % cho sales và services

**Response:**

```typescript
{
  current: {
    totalSales: number,
    totalServices: number,
    details: SalesDetailData[]
  },
  previousMonth: {
    data: SalesData,
    periodLabel: string,
    growth: { sales: number, services: number }
  },
  previousYear: {
    data: SalesData,
    periodLabel: string,
    growth: { sales: number, services: number }
  }
}
```

**SalesDetailData:**

```typescript
{
  id: string,
  customerId: string,
  customerSource: string | null,
  sourceNotes: string | null,
  customerCode: string | null,
  customerName: string,
  serviceName: string,
  finalPrice: number,
  serviceConfirmDate: string,
  clinicId: string,
  consultingDoctorId: string | null,
  consultingDoctorName: string | null,
  consultingSaleId: string | null,
  consultingSaleName: string | null
}
```

#### GET /api/reports/treatment-revenue

**Headers:** `x-employee-id` (required)

**Query Params:**

- `month`: "current" | "YYYY-MM"
- `clinicId`: string (optional)

**Logic:**

1. Get currentUserId từ header
2. Calculate date range từ month param
3. Fetch PaymentVouchers với:
   - paymentDate trong range
   - Include details WHERE `ConsultedService.treatingDoctorId = currentUserId`
   - Filter vouchers với details.length > 0

**Response:**

```typescript
PaymentVoucher[] với includes: customer, details, consultedService, treatingDoctor
```

#### GET /api/reports/treatment-revenue-doctor

**Query Params:**

- `timeRange`: "month" | "range"
- `selectedMonth`: YYYY-MM
- `startDate`: YYYY-MM-DD
- `endDate`: YYYY-MM-DD
- `clinicId`: string (optional, không dùng)

**Logic:**

1. Calculate date range từ params
2. Fetch PaymentVoucherDetail với:
   - `paymentVoucher.paymentDate` trong range
   - Include: paymentVoucher, customer, consultedService, treatingDoctor
3. Format response với treating doctor info

**Response:**

```typescript
{
  totalRevenue: number,
  totalPayments: number,
  details: [{
    id: string,
    customerId: string,
    customerCode: string | null,
    customerName: string,
    serviceName: string,
    treatingDoctorId: string | null,
    treatingDoctorName: string | null,
    amountReceived: number,
    paymentDate: string,
    paymentMethod: string,
    clinicId: string
  }]
}
```

### 4.2 No Repository/Service Layer

Reports feature hiện tại KHÔNG có repo/service layer. Logic nằm trực tiếp trong API routes.

**Refactor cần:**

- Tạo `reportRepository.ts` với functions:

  - `getRevenueData(startDate, endDate, clinicId?)`
  - `getSalesData(startDate, endDate, clinicId?)`
  - `getTreatmentRevenueForDoctor(employeeId, startDate, endDate, clinicId?)`
  - `getTreatmentRevenueByDoctor(startDate, endDate)`

- Tạo `reportService.ts` với business logic:
  - Categorize payment methods
  - Calculate growth percentages
  - Format response data
  - Handle comparison periods

---

## 5. Frontend Architecture

### 5.1 Types

```typescript
// src/features/reports/type.ts

type RevenueData = {
  totalRevenue: number;
  totalSales: number;
  totalTransactions: number;
  averageTransaction: number;
  byPaymentMethod: { cash; cardNormal; cardVisa; transfer };
  byTime: Array<{
    date;
    revenue;
    sales;
    transactions;
    cash;
    cardNormal;
    cardVisa;
    transfer;
  }>;
  byEmployee: Array<{
    employeeId;
    employeeName;
    role;
    revenue;
    sales;
    transactions;
  }>;
  byClinic: Array<{ clinicId; clinicName; revenue; sales; transactions }>;
};

type SalesData = {
  totalSales: number;
  totalServices: number;
  details: SalesDetailData[];
};

type SalesComparisonData = {
  current: SalesData;
  previousMonth: {
    data: SalesData;
    periodLabel: string;
    growth: { sales; services };
  };
  previousYear: {
    data: SalesData;
    periodLabel: string;
    growth: { sales; services };
  };
};

type ReportsFilters = {
  timeRange: "month" | "range";
  selectedMonth?: string; // YYYY-MM
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  clinicId?: string;
};

type TreatmentRevenueDetailData = {
  id: string;
  customerId: string;
  customerCode: string | null;
  customerName: string;
  serviceName: string;
  treatingDoctorId: string | null;
  treatingDoctorName: string | null;
  amountReceived: number;
  paymentDate: string;
  paymentMethod: string;
  clinicId: string;
};

type TreatmentRevenueResponse = {
  totalRevenue: number;
  totalPayments: number;
  details: TreatmentRevenueDetailData[];
};
```

### 5.2 Hooks

#### useSimplifiedReportsData(filters: ReportsFilters)

**Purpose:** Fetch revenue data với client-side filtering

**Logic:**

1. Call `useReportsDataQuery(filters)` để fetch từ API
2. Nếu có `filters.clinicId`:
   - Filter `revenueData` theo clinicId (client-side)
   - Filter `comparisonData` cho các periods
3. Return: `{ loading, error, revenueData, comparisonData, refetch }`

**Note:** API không filter theo clinicId (return all), frontend filter sau

#### useSimplifiedSalesData(filters: ReportsFilters)

**Purpose:** Fetch sales data

**Logic:**

1. Call `useSalesReportsData(filters)` với API params
2. API đã filter theo clinicId (server-side)
3. Return: `{ loading, error, data: SalesComparisonData, refetch }`

#### useTreatmentRevenueDoctorData(filters: ReportsFilters)

**Purpose:** Fetch treatment revenue by doctor (admin only)

**Logic:**

1. Build query params từ filters
2. Call API `/api/reports/treatment-revenue-doctor`
3. Return: `{ loading, error, data: TreatmentRevenueResponse, refetch }`

#### useReportsPrefetch()

**Purpose:** Prefetch data cho navigation optimization

**Features:**

- `smartPrefetch(filters)` - Prefetch current selection
- `prefetchNextMonth()` - Prefetch tháng sau
- `prefetchPreviousMonth()` - Prefetch tháng trước

### 5.3 Components

#### RevenueFilters

**Props:** `filters, onFiltersChange, loading, onRefresh`

**Features:**

- Time range selector: "month" | "range"
  - Month mode: MonthPicker (default)
  - Range mode: RangePicker (admin only)
- Clinic selector (admin only)
  - Fetch clinics từ `/api/clinics`
  - Tabs to switch giữa clinics
- Refresh button
- Auto-prefetch adjacent months

**Permission:**

- Non-admin: Force timeRange="month", hide range picker, hide clinic tabs
- Admin: Show all options

#### DailyRevenueTable

**Props:** `data: RevenueData.byTime[], loading`

**Features:**

- Table columns: date, revenue, sales, transactions, payment methods breakdown
- Sort by date descending
- Highlight max revenue day
- Export to Excel

#### SalesDetailTable

**Props:** `data: SalesDetailData[], loading`

**Features:**

- Table columns: date, customer, service, finalPrice, source, consultingDoctor, consultingSale
- Filter by source (client-side)
- Link to customer detail page
- Export to Excel

#### SalesByDoctorTable

**Props:** `data: SalesDetailData[], loading, selectedMonth`

**Features:**

- Group data theo consultingDoctorId
- Aggregate: totalSales, totalServices per doctor
- Sort by totalSales descending
- Show % of total sales

#### SalesBySaleTable

**Props:** `data: SalesDetailData[], loading, selectedMonth`

**Features:**

- Group data theo consultingSaleId
- Similar to SalesByDoctorTable nhưng cho Sales staff

#### TreatmentRevenueDoctorTable

**Props:** `data: TreatmentRevenueDetailData[], loading, selectedMonth`

**Features:**

- Group data theo treatingDoctorId
- Aggregate: totalRevenue, totalPayments per doctor
- Show payment method breakdown per doctor
- Export to Excel

#### RevenueChart (Optional)

**Props:** `data: RevenueData.byTime[]`

**Features:**

- Line chart cho revenue + sales over time
- Bar chart cho payment methods
- Chart type switcher

### 5.4 Pages

#### ReportsOverviewPage (`/reports`)

**Features:**

- Header với title + description
- RevenueFilters component
- Summary cards:
  - Total Sales (với comparison tags)
  - Total Revenue (với comparison tags)
- Tabs:
  1. **Doanh thu theo ngày:** DailyRevenueTable
  2. **Doanh số theo nguồn:** SalesDetailTable
  3. **Doanh số tư vấn bác sĩ:** SalesByDoctorTable
  4. **Doanh số tư vấn Sales:** SalesBySaleTable
  5. **Doanh thu điều trị bác sĩ:** TreatmentRevenueDoctorTable (admin only)

**State:**

```typescript
const [filters, setFilters] = useState<ReportsFilters>({ timeRange: "month" });

// Fetch data với hooks
const { revenueData, comparisonData } = useSimplifiedReportsData(filters);
const { data: salesData } = useSimplifiedSalesData(filters);
const { data: treatmentRevenue } = useTreatmentRevenueDoctorData(filters);
```

**Permission Logic:**

```typescript
// Admin tabs
if (employeeProfile?.role === "admin") {
  // Show clinic tabs in filters
  // Show all 5 tabs
}

// Non-admin
else {
  // Force month mode
  // Hide clinic selector
  // Hide treatment revenue doctor tab
}
```

---

## 6. Constants

```typescript
// src/features/reports/constants.ts

export const REPORT_TIME_RANGES = [
  { label: "Chọn tháng", value: "month" },
  { label: "Chọn khoảng thời gian", value: "range" }, // Admin only
];

export const REPORT_TYPES = [
  {
    label: "Doanh thu",
    value: "revenue",
    description: "Số tiền thực thu",
    color: "#52c41a",
    icon: "💰",
  },
  {
    label: "Doanh số",
    value: "sales",
    description: "Giá trị dịch vụ",
    color: "#1890ff",
    icon: "📊",
  },
];

export const EMPLOYEE_ROLES_FOR_REPORTS = [
  { label: "Sale tư vấn", value: "consultingSale", field: "consultingSaleId" },
  {
    label: "Bác sĩ tư vấn",
    value: "consultingDoctor",
    field: "consultingDoctorId",
  },
  {
    label: "Bác sĩ điều trị",
    value: "treatingDoctor",
    field: "treatingDoctorId",
  },
];

export const PAYMENT_METHOD_COLORS = {
  "Tiền mặt": "#52c41a",
  "Quẹt thẻ thường": "#1890ff",
  "Quẹt thẻ Visa": "#722ed1",
  "Chuyển khoản": "#fa8c16",
};

export const CHART_COLORS = [
  "#52c41a",
  "#1890ff",
  "#722ed1",
  "#fa8c16",
  "#eb2f96",
  "#13c2c2",
  "#faad14",
  "#f5222d",
];
```

---

## 7. Utilities

```typescript
// src/features/reports/utils/dataFilter.ts

export function filterRevenueDataByClinic(
  data: RevenueData,
  clinicId: string
): RevenueData;
// Filter byTime, byEmployee, byClinic arrays theo clinicId
// Recalculate totals từ filtered data
// Return new RevenueData object

export function categorizePaymentMethods(details: PaymentVoucherDetail[]);
// Normalize payment method strings
// Group by method type
// Return { cash, cardNormal, cardVisa, transfer }

export function calculateGrowth(current: number, previous: number): number;
// Return percentage growth
// Handle previous = 0 case
```

---

## 8. Key Implementation Points

### 8.1 Payment Method Normalization

**Problem:** Payment methods có inconsistent naming (diacritics, variations)

**Solution:**

```typescript
const normalizedMethod = method.toLowerCase().trim();

if (normalizedMethod.includes("tiền") && normalizedMethod.includes("mặt")) {
  return "cash";
} else if (
  normalizedMethod.includes("pos") ||
  (normalizedMethod.includes("thẻ") && normalizedMethod.includes("thường"))
) {
  return "cardNormal";
} else if (normalizedMethod.includes("visa")) {
  return "cardVisa";
} else if (
  normalizedMethod.includes("chuyển") &&
  normalizedMethod.includes("khoản")
) {
  return "transfer";
} else {
  return "cash"; // Default
}
```

### 8.2 Client-side vs Server-side Filtering

**Revenue API:**

- Server returns ALL data (no clinicId filtering in final response)
- Frontend filters theo clinicId using `filterRevenueDataByClinic()`
- Reason: Legacy implementation, có thể refactor để server filter

**Sales API:**

- Server filters theo clinicId trực tiếp trong query
- Frontend chỉ display data

**Recommendation:** Refactor revenue API để filter server-side like sales API

### 8.3 Date Range Calculation

**Month Mode:**

```typescript
const dateStart = dayjs(selectedMonth).startOf("month").toDate();
const dateEnd = dayjs(selectedMonth).endOf("month").toDate();
```

**Range Mode:**

```typescript
const dateStart = dayjs(startDate).startOf("day").toDate();
const dateEnd = dayjs(endDate).endOf("day").toDate();
```

**Comparison Periods:**

```typescript
// Previous month
const prevMonthStart = dayjs(currentStart)
  .subtract(1, "month")
  .startOf("month")
  .toDate();
const prevMonthEnd = dayjs(currentStart)
  .subtract(1, "month")
  .endOf("month")
  .toDate();

// Previous year (same month)
const prevYearStart = dayjs(currentStart)
  .subtract(1, "year")
  .startOf("month")
  .toDate();
const prevYearEnd = dayjs(currentStart)
  .subtract(1, "year")
  .endOf("month")
  .toDate();
```

### 8.4 Employee Performance Aggregation

**Challenge:** Một service có thể có 3 employees (consultingSale, consultingDoctor, treatingDoctor)

**Logic:**

```typescript
const employees = [
  {
    id: service.consultingSaleId,
    name: service.consultingSale?.fullName,
    role: "consultingSale",
  },
  {
    id: service.consultingDoctorId,
    name: service.consultingDoctor?.fullName,
    role: "consultingDoctor",
  },
  {
    id: service.treatingDoctorId,
    name: service.treatingDoctor?.fullName,
    role: "treatingDoctor",
  },
].filter((emp) => emp.id && emp.name);

// Mỗi employee được credit FULL revenue/sales của service đó
employees.forEach((emp) => {
  employeeStats.get(emp.id).revenue += detail.amount;
  employeeStats.get(emp.id).sales += service.finalPrice;
});
```

**Note:** Tổng của all employees > total revenue/sales (vì overlap)

### 8.5 Comparison Data Structure

```typescript
{
  current: { totalRevenue, totalSales, ... },
  previousMonth: {
    data: { totalRevenue, totalSales, ... },
    periodLabel: "09/2024",
    growth: {
      revenue: 15.5, // %
      sales: 20.3,
      transactions: 10.2
    }
  },
  previousYear: { ... },
  previousPeriod: { ... }
}
```

**Display:**

```tsx
<Tag
  color={growth > 0 ? "success" : "error"}
  icon={growth > 0 ? <RiseOutlined /> : <FallOutlined />}
>
  {growth > 0 ? "+" : ""}
  {growth.toFixed(1)}%
</Tag>
```

---

## 9. Permission & Scope Logic

### Frontend Permission Check

```typescript
const isAdmin = employeeProfile?.role === "admin";

// Filter display
if (!isAdmin) {
  // Force month mode
  if (filters.timeRange === "range") {
    setFilters({ ...filters, timeRange: "month" });
  }

  // Force own clinic only
  const clinicId = employeeProfile?.clinicId;
  setFilters({ ...filters, clinicId });
}

// Tabs visibility
const tabs = [
  { key: "revenue", label: "Doanh thu theo ngày" },
  { key: "sales", label: "Doanh số theo nguồn" },
  { key: "sales-doctor", label: "Doanh số tư vấn bác sĩ" },
  { key: "sales-sale", label: "Doanh số tư vấn Sales" },
  ...(isAdmin
    ? [{ key: "treatment-revenue", label: "Doanh thu điều trị bác sĩ" }]
    : []),
];
```

### Backend Permission (Treatment Revenue)

```typescript
// /api/reports/treatment-revenue
const employeeId = request.headers.get("x-employee-id")
if (!employeeId) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

// Filter services where treatingDoctorId = employeeId
const vouchers = await prisma.paymentVoucher.findMany({
  where: { ... },
  include: {
    details: {
      where: {
        consultedService: {
          treatingDoctorId: employeeId
        }
      }
    }
  }
})
```

---

## 10. Export Functionality (Optional)

### Excel Export

**Features:**

- Export table data to Excel
- Include summary row with totals
- Format currency columns
- Add filters + date range to filename

**Libraries:**

- `xlsx` hoặc `exceljs`
- Reuse utility từ `src/utils/excelExport.ts`

**Implementation:**

```typescript
const handleExport = () => {
  const dataToExport = tableData.map((row) => ({
    Ngày: row.date,
    "Doanh thu": row.revenue,
    "Doanh số": row.sales,
    "Giao dịch": row.transactions,
    // ... more columns
  }));

  exportToExcel(
    dataToExport,
    `bao-cao-doanh-thu-${filters.selectedMonth}.xlsx`
  );
};
```

---

## 11. Checklist để Code lại

### Backend

- [ ] Tạo `reportRepository.ts` với functions:
  - [ ] `getRevenueData(startDate, endDate, clinicId?)`
  - [ ] `getSalesData(startDate, endDate, clinicId?)`
  - [ ] `getTreatmentRevenueForDoctor(employeeId, startDate, endDate, clinicId?)`
  - [ ] `getTreatmentRevenueByDoctor(startDate, endDate)`
- [ ] Tạo `reportService.ts` với:
  - [ ] `categorizePaymentMethods(details)`
  - [ ] `calculateGrowth(current, previous)`
  - [ ] `calculateComparisonPeriods(currentStart, currentEnd)`
  - [ ] `aggregateEmployeeStats(services, paymentDetails)`
- [ ] Refactor API routes để dùng service layer
- [ ] Add Zod validation cho query params
- [ ] Implement server-side clinicId filtering cho revenue API (như sales API)
- [ ] Add proper error handling + logging

### Frontend

- [ ] Refactor hooks để consistent naming
- [ ] Implement proper React Query với:
  - [ ] Query keys structure
  - [ ] Cache invalidation strategy
  - [ ] Loading states
  - [ ] Error handling
- [ ] Refactor components:
  - [ ] Consistent props interface
  - [ ] Extract common table logic
  - [ ] Implement proper memoization
- [ ] Test permission logic:
  - [ ] Admin can see all clinics + range picker
  - [ ] Non-admin forced to month mode + own clinic
  - [ ] Treatment revenue doctor tab visibility
- [ ] Implement export functionality
- [ ] Add loading skeletons
- [ ] Add empty states

### Testing

- [ ] Test date range calculations (month, range, comparison periods)
- [ ] Test payment method normalization với various inputs
- [ ] Test employee stats aggregation (overlap handling)
- [ ] Test client-side filtering performance với large datasets
- [ ] Test permission logic (admin vs non-admin)
- [ ] Test growth calculation với edge cases (division by zero)

### Optimization

- [ ] Implement data prefetching cho adjacent months
- [ ] Add pagination cho large tables
- [ ] Optimize clinicId filtering (move to server-side)
- [ ] Cache employee lookup data
- [ ] Implement virtual scrolling cho large tables

---

## 12. Data Flow Diagrams

### Revenue Report Flow

```
User selects filters (month/range, clinic) →
Frontend: useSimplifiedReportsData(filters) →
API: GET /api/reports/revenue?startDate&endDate&clinicId →
Backend:
  1. Fetch PaymentVouchers trong date range
  2. Filter details theo clinicId (if provided)
  3. Fetch ConsultedServices trong date range
  4. Calculate totals + breakdowns
  5. Return RevenueData
Frontend:
  1. Client-side filter theo clinicId (if needed)
  2. Render DailyRevenueTable
  3. Render summary cards với comparison tags
```

### Sales Report Flow

```
User selects filters (month/range, clinic) →
Frontend: useSimplifiedSalesData(filters) →
API: GET /api/reports/sales?timeRange&selectedMonth&clinicId →
Backend:
  1. Calculate date range từ params
  2. Fetch ConsultedServices (serviceStatus="Đã chốt", clinicId) trong range
  3. Calculate current period data
  4. Calculate comparison periods (previous month, previous year)
  5. Return SalesComparisonData
Frontend:
  1. Render SalesDetailTable
  2. Render SalesByDoctorTable (group by consultingDoctorId)
  3. Render SalesBySaleTable (group by consultingSaleId)
  4. Show growth indicators
```

### Treatment Revenue Flow (For Doctor)

```
Doctor opens treatment revenue page →
Frontend: useTreatmentRevenueForDoctor(filters) →
API: GET /api/reports/treatment-revenue (with x-employee-id header) →
Backend:
  1. Get currentUserId từ header
  2. Fetch PaymentVouchers trong date range
  3. Include ONLY details where ConsultedService.treatingDoctorId = currentUserId
  4. Filter vouchers với details.length > 0
  5. Return PaymentVoucher[]
Frontend:
  1. Display payment vouchers với treatment details
  2. Show total revenue for doctor
```

---

## 13. Key Differences Summary

| Aspect           | Revenue                                   | Sales                                      |
| ---------------- | ----------------------------------------- | ------------------------------------------ |
| **Source**       | PaymentVoucher + PaymentVoucherDetail     | ConsultedService (serviceStatus="Đã chốt") |
| **Metric**       | Tiền đã thu (amount)                      | Giá trị dịch vụ (finalPrice)               |
| **Date Field**   | paymentDate                               | serviceConfirmDate                         |
| **Filter Scope** | Client-side (frontend filter)             | Server-side (backend filter)               |
| **Breakdown**    | By payment method, time, employee, clinic | By source, employee, service detail        |
| **Comparison**   | Revenue, Sales, Transactions growth       | Sales, Services growth                     |

**Important:** Revenue ≠ Sales vì:

- Sales = Giá trị dịch vụ khi confirmed (có thể chưa thanh toán)
- Revenue = Tiền đã thu (có thể partial payment)
- Example: Service 10M (sales), đã thu 3M (revenue), còn nợ 7M

---

**Tổng kết:** Reports feature là read-only aggregation từ PaymentVoucher và ConsultedService. Không có CRUD operations, chỉ có complex queries với nhiều breakdowns (time, employee, clinic, payment method). Key challenges: Payment method normalization, employee overlap handling, client vs server filtering, permission-based data scoping.
