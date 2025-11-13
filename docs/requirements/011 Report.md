# 🧩 Requirements: Reports & Analytics System

> **📋 STATUS: 🔄 IN PROGRESS** - Backend + Frontend implementation needed  
> **🔗 Implementation**: `src/features/reports/`  
> **🔧 Last Updated**: 2025-11-13 - Streamlined version

## 📊 Tham khảo

- Prisma Models: `PaymentVoucher`, `PaymentVoucherDetail`, `ConsultedService`
- Old Spec: `docs/Dự án cũ/11. Report/`
- Related: `009 Consulted-Service.md`, `010 Payment.md`

## 🎯 Mục Tiêu

- Tổng hợp báo cáo tài chính: Doanh thu thực thu (Revenue) và Doanh số dịch vụ (Sales)
- Phân tích theo thời gian, chi nhánh, nhân sự, phương thức thanh toán
- So sánh tăng trưởng theo tháng trước và năm trước
- Báo cáo chuyên biệt cho bác sĩ điều trị
- Export Excel cho các báo cáo

---

## 🎲 Decision Log

### Business Rules

- ✅ **Revenue vs Sales**:
  - **Revenue (Doanh thu)**: Tiền thực thu từ `PaymentVoucherDetail.amount` (theo `paymentDate`)
  - **Sales (Doanh số)**: Giá trị dịch vụ từ `ConsultedService.finalPrice` với `serviceStatus = "Đã chốt"` (theo `serviceConfirmDate`)
- ✅ **No Database Schema**: Reports aggregate data từ existing tables, không có bảng riêng
- ✅ **Date Filtering**:
  - Revenue: Theo `PaymentVoucher.paymentDate`
  - Sales: Theo `ConsultedService.serviceConfirmDate`
  - UTC parse chuẩn, display VN timezone ở FE
- ✅ **Comparison Periods**:
  - Previous Period: Cùng độ dài khoảng thời gian nhưng trước đó
  - Previous Month: Toàn bộ tháng trước (full month)
  - Previous Year: Cùng tháng năm trước

### Payment Method Standardization

**Database Values** (từ `payment-voucher.schema.ts`):

```typescript
export const PAYMENT_METHODS = [
  "Tiền mặt",
  "Quẹt thẻ thường",
  "Quẹt thẻ Visa",
  "Chuyển khoản",
] as const;
```

**Note**:

- ✅ Data đã được chuẩn hóa trong database (user chọn từ dropdown, không nhập tay)
- ✅ Không cần normalization logic phức tạp
- ✅ Reports chỉ cần map trực tiếp theo value chuẩn
- ⚠️ Legacy data có thể có variations khác → cần migration script nếu cần

**Mapping cho Reports**:

```typescript
// Sử dụng trực tiếp từ constant
export const PAYMENT_METHOD_COLORS = {
  "Tiền mặt": "#52c41a", // Green
  "Quẹt thẻ thường": "#1890ff", // Blue
  "Quẹt thẻ Visa": "#722ed1", // Purple
  "Chuyển khoản": "#fa8c16", // Orange
} as const;
```

### Permission Rules

**Admin**:

- Xem reports của TẤT CẢ clinics
- Switch giữa các clinics qua tabs
- Chọn tháng để xem báo cáo
- Export data

**Non-admin**:

- CHỈ xem reports của clinic mình (`employeeProfile.clinicId`)
- Chọn tháng để xem báo cáo
- Không có tabs clinic
- Export data của clinic mình

**Backend**: Không validate clinicId scope (frontend filter qua hooks)

### Architecture

- ✅ **No Repository Pattern**: Reports logic nằm trực tiếp trong API routes (aggregate queries)
- ✅ **Hybrid Approach**: GET qua API Routes (React Query caching)
- ✅ **Client-side Filtering**: Revenue API trả all data, FE filter theo clinic (có thể refactor)
- ✅ **Server-side Filtering**: Sales API filter theo clinic tại query level

---

## 1. 📊 Core Metrics & Calculations

### 1.1 Revenue Metrics

**Source**: `PaymentVoucher` + `PaymentVoucherDetail`

**Base Query**:

```typescript
// Fetch vouchers trong date range
const vouchers = await prisma.paymentVoucher.findMany({
  where: {
    paymentDate: {
      gte: startDate, // T00:00:00.000Z
      lte: endDate, // T23:59:59.999Z
    },
  },
  include: {
    details: {
      include: {
        consultedService: {
          include: {
            consultingDoctor: true,
            consultingSale: true,
            treatingDoctor: true,
            clinic: true,
          },
        },
      },
    },
    customer: true,
    cashier: true,
  },
});

// Filter details: chỉ tính khi có consultedService
const validDetails = vouchers.flatMap((v) =>
  v.details.filter((d) => d.consultedService !== null)
);
```

**Metrics**:

| Metric               | Formula                                   | Description          |
| -------------------- | ----------------------------------------- | -------------------- |
| `totalRevenue`       | `SUM(detail.amount)`                      | Tổng tiền thực thu   |
| `totalTransactions`  | `COUNT(DISTINCT voucher)` với revenue > 0 | Số giao dịch         |
| `averageTransaction` | `totalRevenue / totalTransactions`        | Trung bình/giao dịch |

**Breakdowns**:

1. **By Payment Method** (`byPaymentMethod`):

   - Group by payment method value (đã chuẩn hóa): `"Tiền mặt" | "Quẹt thẻ thường" | "Quẹt thẻ Visa" | "Chuyển khoản"`
   - Sum amount per method

2. **By Time** (`byTime`):

   - Group by `paymentDate` (date only, format YYYY-MM-DD)
   - Per day: `{ date, revenue, sales, transactions, byPaymentMethod }`

3. **By Employee** (`byEmployee`):

   - From `consultedService`: `consultingDoctorId`, `consultingSaleId`, `treatingDoctorId`
   - Aggregate revenue + sales per employee (overlap: 1 service → 3 employees credited)

4. **By Clinic** (`byClinic`):
   - From `consultedService.clinicId`
   - Per clinic: `{ clinicId, clinicName, revenue, sales, transactions }`

### 1.2 Sales Metrics

**Source**: `ConsultedService` với `serviceStatus = "Đã chốt"`

**Base Query**:

```typescript
const services = await prisma.consultedService.findMany({
  where: {
    serviceStatus: "Đã chốt",
    serviceConfirmDate: {
      gte: startDate,
      lte: endDate,
    },
    ...(clinicId && { clinicId }), // Server-side filter
  },
  include: {
    customer: true,
    consultingDoctor: true,
    consultingSale: true,
    clinic: true,
  },
});
```

**Metrics**:

| Metric          | Formula           | Description          |
| --------------- | ----------------- | -------------------- |
| `totalSales`    | `SUM(finalPrice)` | Tổng giá trị dịch vụ |
| `totalServices` | `COUNT(*)`        | Số dịch vụ đã chốt   |

**Details Array**: Full service data với customer info

```typescript
{
  id: string,
  consultedServiceName: string,
  finalPrice: number,
  serviceConfirmDate: string, // YYYY-MM-DD
  customerId: string,
  customerCode: string,
  customerName: string,
  customerSource: string | null,
  customerSourceNotes: string | null,
  clinicId: string,
  consultingDoctorId: string | null,
  consultingDoctorName: string | null,
  consultingSaleId: string | null,
  consultingSaleName: string | null
}
```

### 1.3 Comparison Calculation

**Growth Formula**:

```typescript
const growth =
  previous === 0
    ? current > 0
      ? 100
      : 0
    : ((current - previous) / previous) * 100;
```

**Period Labels**:

- Previous Month: "MM/YYYY" (e.g., "10/2024")
- Previous Year: "MM/YYYY" (e.g., "11/2023")

---

## 2. 📡 API Endpoints

### GET `/api/reports/revenue`

**Purpose**: Tổng hợp doanh thu thực thu với breakdowns

**Query Params**:

- `startDate`: YYYY-MM-DD (required)
- `endDate`: YYYY-MM-DD (required)
- `clinicId`: string (optional, **deprecated** - không filter server-side)

**Response**:

```typescript
{
  totalRevenue: number,
  totalSales: number, // từ consulted services đã chốt
  totalTransactions: number,
  averageTransaction: number,
  byPaymentMethod: {
    "Tiền mặt": number,
    "Quẹt thẻ thường": number,
    "Quẹt thẻ Visa": number,
    "Chuyển khoản": number
  },
  byTime: Array<{
    date: string, // YYYY-MM-DD
    revenue: number,
    sales: number,
    transactions: number,
    byPaymentMethod: { "Tiền mặt", "Quẹt thẻ thường", "Quẹt thẻ Visa", "Chuyển khoản" }
  }>,
  byEmployee: Array<{
    employeeId: string,
    employeeName: string,
    role: string, // "consultingDoctor" | "consultingSale" | "treatingDoctor"
    revenue: number,
    sales: number,
    transactions: number
  }>,
  byClinic: Array<{
    clinicId: string,
    clinicName: string,
    revenue: number,
    sales: number,
    transactions: number
  }>
}
```

**Notes**:

- API trả ALL data (no clinic filter)
- Frontend filter theo `clinicId` client-side
- Có thể refactor để filter server-side như Sales API

### GET `/api/reports/sales`

**Purpose**: Doanh số dịch vụ đã chốt với comparison

**Query Params**:

- `selectedMonth`: YYYY-MM (required)
- `clinicId`: string (optional)

**Response**:

```typescript
{
  current: {
    totalSales: number,
    totalServices: number,
    details: SalesDetailData[] // Array từ section 1.2
  },
  previousMonth: {
    data: {
      totalSales: number,
      totalServices: number
    },
    periodLabel: string, // "MM/YYYY"
    growth: {
      sales: number, // percentage
      services: number
    }
  },
  previousYear: {
    data: {
      totalSales: number,
      totalServices: number
    },
    periodLabel: string, // "MM/YYYY"
    growth: {
      sales: number,
      services: number
    }
  }
}
```

**Date Range Logic**:

```typescript
// Current month
const start = dayjs(selectedMonth).startOf("month");
const end = dayjs(selectedMonth).endOf("month");

// Previous Month
const prevMonthStart = dayjs(selectedMonth)
  .subtract(1, "month")
  .startOf("month");
const prevMonthEnd = dayjs(selectedMonth).subtract(1, "month").endOf("month");

// Previous Year (same month)
const prevYearStart = dayjs(selectedMonth).subtract(1, "year").startOf("month");
const prevYearEnd = dayjs(selectedMonth).subtract(1, "year").endOf("month");
```

### GET `/api/reports/treatment-revenue-doctor`

**Purpose**: Doanh thu điều trị theo bác sĩ (admin view)

**Query Params**:

- `selectedMonth`: YYYY-MM (required)
- `clinicId`: string (optional, không dùng)

**Response**:

```typescript
{
  totalRevenue: number,
  totalPayments: number,
  details: Array<{
    id: string, // PaymentVoucherDetail.id
    customerId: string,
    customerCode: string,
    customerName: string,
    consultedServiceName: string,
    treatingDoctorId: string | null,
    treatingDoctorName: string | null,
    amountReceived: number, // detail.amount
    paymentDate: string, // ISO format
    paymentMethod: string,
    clinicId: string
  }>
}
```

**Base Query**:

```typescript
const details = await prisma.paymentVoucherDetail.findMany({
  where: {
    paymentVoucher: {
      paymentDate: { gte: startDate, lte: endDate },
    },
  },
  include: {
    paymentVoucher: true,
    consultedService: {
      include: {
        treatingDoctor: true,
        customer: true,
        clinic: true,
      },
    },
  },
});
```

### GET `/api/reports/treatment-revenue`

**Purpose**: Doanh thu điều trị của bác sĩ hiện tại (self view)

**Headers**: `x-employee-id` (required)

**Query Params**:

- `month`: "current" | "YYYY-MM" (required)
- `clinicId`: string (optional)

**Response**:

```typescript
PaymentVoucher[] // with includes: customer, details, consultedService, treatingDoctor
```

**Filter Logic**:

```typescript
// Chỉ lấy vouchers có details với treatingDoctorId = currentUserId
const vouchers = await prisma.paymentVoucher.findMany({
  where: {
    paymentDate: { gte: monthStart, lte: monthEnd },
    details: {
      some: {
        consultedService: {
          treatingDoctorId: currentUserId,
        },
      },
    },
  },
});

// Filter details
vouchers.forEach((v) => {
  v.details = v.details.filter(
    (d) => d.consultedService?.treatingDoctorId === currentUserId
  );
});
```

---

## 3. 🎨 Frontend Components

### 3.1 Filters Component

**Component**: `RevenueFilters`

**Props**: `{ filters, onFiltersChange, loading, onRefresh }`

**Layout**:

```
┌─────────────────────────────────────────────────────────────┐
│ [Month: 11/2024 ▼] [Refresh 🔄]                             │
│                                                              │
│ Admin only:                                                  │
│ ┌──────────┬──────────┬──────────┬──────────┐              │
│ │ Tất cả   │ Clinic 1 │ Clinic 2 │ Clinic 3 │   (Tabs)     │
│ └──────────┴──────────┴──────────┴──────────┘              │
└─────────────────────────────────────────────────────────────┘
```

**Features**:

- **Month Picker**:

  - Format: "MM/YYYY"
  - Default: Tháng hiện tại

- **Clinic Selector** (Admin only):

  - Fetch clinics từ `/api/clinics`
  - Display as Tabs (first tab: "Tất cả" with clinicId = null)
  - Auto-select employee's clinic nếu non-admin

- **Refresh Button**:
  - Icon: `ReloadOutlined`
  - Trigger: `onRefresh()` → invalidate all queries

**Prefetch**: Auto-prefetch adjacent months khi hover MonthPicker

### 3.2 Overview Page

**Component**: `ReportsOverviewPage` (`/reports`)

**Structure**:

```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Báo cáo tài chính                                         │
│ Tổng hợp doanh thu và doanh số theo thời gian               │
├─────────────────────────────────────────────────────────────┤
│ <RevenueFilters />                                          │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│ │ Tổng doanh thu│ │ Tổng doanh số│ │ Giao dịch    │         │
│ │ 123,456,789đ │ │ 150,000,000đ │ │ 45           │         │
│ │ ↑ +15.3%     │ │ ↑ +8.2%      │ │ ↓ -2.1%      │         │
│ └──────────────┘ └──────────────┘ └──────────────┘         │
│                                                              │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│ │ Tiền mặt     │ │ Quẹt thẻ     │ │ Visa         │         │
│ └──────────────┘ └──────────────┘ └──────────────┘         │
├─────────────────────────────────────────────────────────────┤
│ ┌─ Tabs ────────────────────────────────────────────────┐  │
│ │ Doanh thu theo ngày │ Doanh số theo nguồn │ ...       │  │
│ ├───────────────────────────────────────────────────────┤  │
│ │                                                        │  │
│ │   <Table or Chart based on active tab>                │  │
│ │                                                        │  │
│ └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**State**:

```typescript
const [filters, setFilters] = useState<ReportsFilters>({
  selectedMonth: dayjs().format("YYYY-MM"),
  clinicId: employeeProfile.role === "admin" ? null : employeeProfile.clinicId,
});

const [activeTab, setActiveTab] = useState("revenue-daily");
```

**Data Hooks**:

```typescript
const {
  revenueData,
  comparisonData,
  loading: revenueLoading,
} = useSimplifiedReportsData(filters);

const { data: salesData, loading: salesLoading } =
  useSimplifiedSalesData(filters);

const { data: treatmentRevenue, loading: treatmentLoading } =
  useTreatmentRevenueDoctorData(filters); // Admin only
```

**Summary Cards**:

1. **Tổng doanh thu** (Revenue):

   - Value: `revenueData.totalRevenue` (format VND)
   - Comparison: Tag màu với `comparisonData.previousMonth.growth.revenue`
   - Color: Green (↑ positive) | Red (↓ negative)

2. **Tổng doanh số** (Sales):

   - Value: `salesData.current.totalSales` (format VND)
   - Comparison: Tag với `salesData.previousMonth.growth.sales`

3. **Giao dịch**:

   - Value: `revenueData.totalTransactions`
   - Comparison: Tag với growth calculation

4. **Trung bình/giao dịch**:
   - Value: `revenueData.averageTransaction` (format VND)
   - No comparison

**Payment Method Cards** (4 cards):

- Tiền mặt: `revenueData.byPaymentMethod["Tiền mặt"]`
- Quẹt thẻ thường: `revenueData.byPaymentMethod["Quẹt thẻ thường"]`
- Quẹt thẻ Visa: `revenueData.byPaymentMethod["Quẹt thẻ Visa"]`
- Chuyển khoản: `revenueData.byPaymentMethod["Chuyển khoản"]`

### 3.3 Tables

#### DailyRevenueTable

**Props**: `{ data: RevenueData.byTime[], loading }`

**Columns**:

| Column          | Width | Sort | Description                          |
| --------------- | ----- | ---- | ------------------------------------ |
| Ngày            | 120px | ✅   | `date` (DD/MM/YYYY)                  |
| Doanh thu       | 140px | ✅   | `revenue` (VND)                      |
| Doanh số        | 140px | ✅   | `sales` (VND)                        |
| Giao dịch       | 100px | -    | `transactions`                       |
| Tiền mặt        | 120px | -    | `byPaymentMethod["Tiền mặt"]`        |
| Quẹt thẻ thường | 120px | -    | `byPaymentMethod["Quẹt thẻ thường"]` |
| Quẹt thẻ Visa   | 120px | -    | `byPaymentMethod["Quẹt thẻ Visa"]`   |
| Chuyển khoản    | 120px | -    | `byPaymentMethod["Chuyển khoản"]`    |

**Features**:

- Sort by date descending (mới nhất trước)
- Highlight row với max revenue (background color)
- Export to Excel button

#### SalesDetailTable

**Props**: `{ data: SalesDetailData[], loading }`

**Columns**:

| Column        | Width | Filter | Description                             |
| ------------- | ----- | ------ | --------------------------------------- |
| Ngày chốt     | 120px | -      | `serviceConfirmDate` (DD/MM/YYYY)       |
| Khách hàng    | 180px | -      | Line 1: Tên (link)<br>Line 2: Mã (gray) |
| Nguồn         | 120px | ✅     | `customerSource`                        |
| Dịch vụ       | 200px | -      | `consultedServiceName`                  |
| Thành tiền    | 140px | -      | `finalPrice` (VND)                      |
| Bác sĩ tư vấn | 140px | ✅     | `consultingDoctorName`                  |
| Sale tư vấn   | 120px | ✅     | `consultingSaleName`                    |

**Features**:

- Link khách hàng → `/customers/{customerId}`
- Filter by source (client-side)
- Export to Excel

#### SalesByDoctorTable

**Props**: `{ data: SalesDetailData[], loading }`

**Logic**: Group data theo `consultingDoctorId`

**Columns**:

| Column     | Width | Description               |
| ---------- | ----- | ------------------------- |
| Bác sĩ     | 200px | `consultingDoctorName`    |
| Doanh số   | 140px | Sum `finalPrice` (VND)    |
| Số dịch vụ | 100px | Count                     |
| % Tổng     | 100px | Percentage of total sales |

**Sort**: By `totalSales` descending

#### SalesBySaleTable

Similar to `SalesByDoctorTable` but group by `consultingSaleId`

#### TreatmentRevenueDoctorTable

**Props**: `{ data: TreatmentRevenueDetailData[], loading }`

**Columns**:

| Column          | Width | Description                          |
| --------------- | ----- | ------------------------------------ |
| Bác sĩ điều trị | 180px | `treatingDoctorName`                 |
| Doanh thu       | 140px | Sum `amountReceived` (VND)           |
| Số thanh toán   | 100px | Count                                |
| Tiền mặt        | 120px | Sum where method = "Tiền mặt"        |
| Quẹt thẻ thường | 120px | Sum where method = "Quẹt thẻ thường" |
| Quẹt thẻ Visa   | 120px | Sum where method = "Quẹt thẻ Visa"   |
| Chuyển khoản    | 120px | Sum where method = "Chuyển khoản"    |

**Features**:

- Group by `treatingDoctorId`
- Show payment method breakdown per doctor
- Export to Excel

### 3.4 Charts (Optional)

**Component**: `RevenueChart`

**Props**: `{ data: RevenueData.byTime[] }`

**Types**:

1. **Line Chart**: Revenue + Sales over time
2. **Bar Chart**: Payment methods breakdown
3. **Switcher**: Toggle between chart types

**Library**: Recharts hoặc Chart.js

---

## 4. 🎣 Frontend Hooks

### useReportsDataQuery(filters)

**Purpose**: Fetch revenue data với smart caching

**Cache Strategy** (theo độ mới):

```typescript
const getCacheTime = (selectedDate: Date) => {
  const now = dayjs();
  const target = dayjs(selectedDate);

  if (target.isSame(now, "day")) {
    return { staleTime: 1 * 60 * 1000 }; // 1 phút
  }
  if (target.isSame(now, "month")) {
    return { staleTime: 5 * 60 * 1000 }; // 5 phút
  }
  if (target.diff(now, "month") > 3) {
    return { staleTime: 60 * 60 * 1000 }; // 60 phút
  }
  return { staleTime: 10 * 60 * 1000 }; // 10 phút
};
```

**Return**: `{ data: RevenueData, loading, error, refetch }`

### useSimplifiedReportsData(filters)

**Purpose**: Fetch + client-side filtering theo clinic

**Logic**:

```typescript
const { data: rawData, ...rest } = useReportsDataQuery(filters);

const filteredData = useMemo(() => {
  if (!filters.clinicId) return rawData;

  return {
    ...rawData,
    byTime: rawData.byTime, // All days
    byEmployee: rawData.byEmployee.filter(
      (e) => e.clinicId === filters.clinicId
    ),
    byClinic: rawData.byClinic.filter((c) => c.clinicId === filters.clinicId),
    // Recalculate totals từ filtered data
    totalRevenue: calculateTotal(filteredData.byClinic, "revenue"),
    totalSales: calculateTotal(filteredData.byClinic, "sales"),
  };
}, [rawData, filters.clinicId]);

return { revenueData: filteredData, ...rest };
```

**Note**: API trả all data, hook filter client-side

### useSalesReportsData(filters)

**Purpose**: Fetch sales data (server-side filtered)

**Query Key**: `['sales-reports', filters]`

**API Call**:

```typescript
const queryParams = new URLSearchParams({
  selectedMonth: filters.selectedMonth,
  ...(filters.clinicId && { clinicId: filters.clinicId }),
});

const response = await fetch(`/api/reports/sales?${queryParams}`);
```

**Return**: `{ data: SalesComparisonData, loading, error, refetch }`

### useTreatmentRevenueDoctorData(filters)

**Purpose**: Fetch treatment revenue by doctor (admin only)

**Permission Check**:

```typescript
const { employeeProfile } = useAuth();
const isAdmin = employeeProfile?.role === "admin";

const query = useQuery(
  ["treatment-revenue-doctor", filters],
  () => fetchTreatmentRevenueDoctor(filters),
  { enabled: isAdmin } // Only fetch if admin
);
```

**Return**: `{ data: TreatmentRevenueResponse, loading, error, refetch }`

### useReportsPrefetch()

**Purpose**: Prefetch adjacent months for smooth navigation

**Functions**:

```typescript
const { prefetchQuery } = useQueryClient();

const smartPrefetch = (filters: ReportsFilters) => {
  prefetchQuery(["revenue", filters], () => fetchRevenue(filters));
  prefetchQuery(["sales", filters], () => fetchSales(filters));
};

const prefetchNextMonth = () => {
  const nextMonth = dayjs(currentMonth).add(1, "month").format("YYYY-MM");
  smartPrefetch({ ...filters, selectedMonth: nextMonth });
};

const prefetchPreviousMonth = () => {
  const prevMonth = dayjs(currentMonth).subtract(1, "month").format("YYYY-MM");
  smartPrefetch({ ...filters, selectedMonth: prevMonth });
};

return { smartPrefetch, prefetchNextMonth, prefetchPreviousMonth };
```

---

## 5. 📋 Types

```typescript
// src/features/reports/types.ts

export type ReportsFilters = {
  selectedMonth: string; // YYYY-MM (required)
  clinicId?: string | null;
};

export type PaymentMethodBreakdown = {
  "Tiền mặt": number;
  "Quẹt thẻ thường": number;
  "Quẹt thẻ Visa": number;
  "Chuyển khoản": number;
};

export type DailyRevenueData = {
  date: string; // YYYY-MM-DD
  revenue: number;
  sales: number;
  transactions: number;
  byPaymentMethod: PaymentMethodBreakdown;
};

export type EmployeeRevenueData = {
  employeeId: string;
  employeeName: string;
  role: "consultingDoctor" | "consultingSale" | "treatingDoctor";
  revenue: number;
  sales: number;
  transactions: number;
};

export type ClinicRevenueData = {
  clinicId: string;
  clinicName: string;
  revenue: number;
  sales: number;
  transactions: number;
};

export type RevenueData = {
  totalRevenue: number;
  totalSales: number;
  totalTransactions: number;
  averageTransaction: number;
  byPaymentMethod: PaymentMethodBreakdown;
  byTime: DailyRevenueData[];
  byEmployee: EmployeeRevenueData[];
  byClinic: ClinicRevenueData[];
};

export type SalesDetailData = {
  id: string;
  consultedServiceName: string;
  finalPrice: number;
  serviceConfirmDate: string; // YYYY-MM-DD
  customerId: string;
  customerCode: string;
  customerName: string;
  customerSource: string | null;
  customerSourceNotes: string | null;
  clinicId: string;
  consultingDoctorId: string | null;
  consultingDoctorName: string | null;
  consultingSaleId: string | null;
  consultingSaleName: string | null;
};

export type SalesData = {
  totalSales: number;
  totalServices: number;
  details: SalesDetailData[];
};

export type SalesComparisonPeriod = {
  data: {
    totalSales: number;
    totalServices: number;
  };
  periodLabel: string; // "MM/YYYY"
  growth: {
    sales: number; // percentage
    services: number;
  };
};

export type SalesComparisonData = {
  current: SalesData;
  previousMonth: SalesComparisonPeriod;
  previousYear: SalesComparisonPeriod;
};

export type TreatmentRevenueDetailData = {
  id: string; // PaymentVoucherDetail.id
  customerId: string;
  customerCode: string;
  customerName: string;
  consultedServiceName: string;
  treatingDoctorId: string | null;
  treatingDoctorName: string | null;
  amountReceived: number;
  paymentDate: string; // ISO
  paymentMethod: string;
  clinicId: string;
};

export type TreatmentRevenueResponse = {
  totalRevenue: number;
  totalPayments: number;
  details: TreatmentRevenueDetailData[];
};
```

---

## 6. 🎨 Constants

```typescript
// src/features/reports/constants.ts

// Removed: REPORT_TIME_RANGES - không còn cần chọn time range

export const PAYMENT_METHOD_COLORS = {
  "Tiền mặt": "#52c41a", // Green
  "Quẹt thẻ thường": "#1890ff", // Blue
  "Quẹt thẻ Visa": "#722ed1", // Purple
  "Chuyển khoản": "#fa8c16", // Orange
} as const;

export const CHART_COLORS = [
  "#52c41a",
  "#1890ff",
  "#722ed1",
  "#fa8c16",
  "#eb2f96",
  "#13c2c2",
  "#faad14",
  "#f5222d",
] as const;

export const REPORT_TABS = [
  { key: "revenue-daily", label: "Doanh thu theo ngày" },
  { key: "sales-source", label: "Doanh số theo nguồn" },
  { key: "sales-doctor", label: "Doanh số theo bác sĩ" },
  { key: "sales-sale", label: "Doanh số theo sale" },
  {
    key: "treatment-doctor",
    label: "Doanh thu điều trị bác sĩ",
    adminOnly: true,
  },
] as const;
```

---

## 7. 🔧 Utilities

```typescript
// src/features/reports/utils/dataFilter.ts

export function filterRevenueDataByClinic(
  data: RevenueData,
  clinicId: string
): RevenueData {
  // Filter byEmployee, byClinic arrays
  // Recalculate totals from filtered data
  // Return new RevenueData object
}

// src/features/reports/utils/paymentMethod.ts

import { PAYMENT_METHODS } from "@/shared/validation/payment-voucher.schema";

export type PaymentMethodKey = (typeof PAYMENT_METHODS)[number];

/**
 * Validate payment method value
 * Data đã được chuẩn hóa trong DB, function này chỉ để validate
 */
export function isValidPaymentMethod(
  method: string
): method is PaymentMethodKey {
  return PAYMENT_METHODS.includes(method as PaymentMethodKey);
}

/**
 * Get payment method or default
 * Fallback to "Tiền mặt" nếu value không hợp lệ (legacy data)
 */
export function getPaymentMethodOrDefault(method: string): PaymentMethodKey {
  return isValidPaymentMethod(method) ? method : "Tiền mặt";
}

// src/features/reports/utils/growth.ts

export function calculateGrowth(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
}

// src/features/reports/utils/dateRange.ts

export function buildDateRange(filters: ReportsFilters) {
  return {
    startDate: dayjs(filters.selectedMonth).startOf("month").toISOString(),
    endDate: dayjs(filters.selectedMonth).endOf("month").toISOString(),
  };
}
```

---

## 8. 🧪 Testing Checklist

### Unit Tests

- [ ] `isValidPaymentMethod()`: Valid values từ PAYMENT_METHODS constant
- [ ] `getPaymentMethodOrDefault()`: Fallback to "Tiền mặt" cho legacy data
- [ ] `calculateGrowth()`: Positive, negative, zero, previous=0 cases
- [ ] `filterRevenueDataByClinic()`: Correct filtering + recalculation
- [ ] Date range builders: Month mode, previous periods

### Integration Tests

- [ ] Revenue API: Correct aggregation, payment method grouping (theo constant values)
- [ ] Sales API: Comparison periods correct, growth calculation
- [ ] Treatment revenue API: Correct doctor filtering
- [ ] Clinic scoping: Non-admin restricted to own clinic
- [ ] Legacy data handling: Fallback to "Tiền mặt" cho invalid payment methods

### E2E Tests

- [ ] Admin: Switch clinics → data updates
- [ ] Admin: Switch months → correct date filters
- [ ] Non-admin: Cannot see other clinics tabs
- [ ] Export Excel: All tables generate correct files
- [ ] Prefetch: Hover month picker → adjacent months loaded

---

## 9. 🚀 Implementation Phases

### Phase 1: Backend APIs ✅ (Exists in old project)

- [x] GET `/api/reports/revenue`
- [x] GET `/api/reports/sales`
- [x] GET `/api/reports/treatment-revenue-doctor`
- [x] GET `/api/reports/treatment-revenue`

**Refactor needed**:

- [ ] Extract repository functions (revenue, sales queries)
- [ ] Create service layer (aggregation logic)
- [ ] Standardize error responses

### Phase 2: Frontend Core

- [ ] Types (`types.ts`)
- [ ] Constants (`constants.ts`)
- [ ] Utilities (`utils/`)
- [ ] Hooks (`useReportsDataQuery`, `useSalesReportsData`, etc.)

### Phase 3: UI Components

- [ ] `RevenueFilters` (with permission logic)
- [ ] Summary cards
- [ ] `DailyRevenueTable`
- [ ] `SalesDetailTable`
- [ ] `SalesByDoctorTable`
- [ ] `SalesBySaleTable`
- [ ] `TreatmentRevenueDoctorTable`

### Phase 4: Integration & Polish

- [ ] `ReportsOverviewPage` assembly
- [ ] Charts (optional)
- [ ] Export Excel functionality
- [ ] Prefetch optimization
- [ ] Permission enforcement (client + server)

### Phase 5: Testing & Documentation

- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Feature documentation (`docs/features/011_Reports.md`)

---

## 10. 📝 Notes & Considerations

### Performance

- **Revenue API**: Potentially large dataset (all vouchers + details + relations)

  - Consider pagination for very large date ranges
  - Index on `PaymentVoucher.paymentDate` + `ConsultedService.serviceConfirmDate`

- **Caching**: Smart cache strategy crucial (staleTime based on date freshness)

- **Client-side filtering**: Revenue API returns all data → filter FE
  - Consider refactoring to server-side like Sales API

### Future Enhancements

- **Advanced Filters**:

  - By employee (select specific doctor/sale)
  - By service category
  - By customer source

- **Visualizations**:

  - Interactive charts (drill-down)
  - Heatmap by day of week
  - Trend analysis

- **Exports**:

  - PDF reports with charts
  - Scheduled email reports
  - Custom report builder

- **Real-time**:
  - WebSocket updates for today's data
  - Live dashboard mode

### Migration from Old Project

**Existing code locations** (old project):

- API Routes: `/api/reports/...`
- Components: Likely in `/components/reports/` or similar

**Migration strategy**:

1. Copy API routes → refactor with repo/service layers
2. Copy types → align with new Zod schemas
3. Copy hooks → update query keys, add caching
4. Rebuild components with Ant Design (current project uses Ant Design)
5. Add permission logic (missing in old project)

**Breaking changes**:

- None expected (backward compatible APIs)
- Frontend rebuild required (different component library)
