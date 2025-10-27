# Dashboard Feature - Requirements để Refactor

## 1. Overview

Feature Dashboard là **trang chủ hiển thị tổng quan dữ liệu** cho nhân viên sau khi đăng nhập, bao gồm lịch hẹn hôm nay, dịch vụ tư vấn, và thống kê doanh thu.

**Core Concept:**

- Dashboard là **view-only** - KHÔNG có tính năng CRUD
- Hiển thị data của **chính employee đang login** (personalized)
- 2 nhóm thống kê chính:
  - **Thống kê hôm nay:** Lịch hẹn, dịch vụ chưa chốt hôm qua, dịch vụ tư vấn hôm nay
  - **Thống kê theo tháng:** Doanh số tư vấn, doanh thu điều trị (có thể chọn tháng)
- Click vào thẻ thống kê → Hiển thị bảng chi tiết tương ứng

**Use Case:**

- Employee login → Xem dashboard
- Xem số lịch hẹn hôm nay (mà mình là bác sĩ chính/phụ)
- Xem dịch vụ tư vấn chưa chốt hôm qua (mà mình là BS tư vấn hoặc Sale)
- Xem dịch vụ tư vấn hôm nay (mà mình tham gia)
- Xem doanh số tư vấn theo tháng
- Xem doanh thu điều trị theo tháng

**Routing:**

- Path: `/` (private layout)
- Component: `DashboardPage` (từ `src/features/dashboard`)

---

## 2. Database Schema

Dashboard **KHÔNG có model riêng**. Nó query từ các models khác:

### Data Sources

1. **Appointment (Lịch hẹn hôm nay):**

   - Query: `WHERE appointmentDateTime = TODAY AND (primaryDentistId = employeeId OR secondaryDentistId = employeeId)`
   - Include: customer, primaryDentist, secondaryDentist

2. **ConsultedService (Dịch vụ tư vấn):**

   - **Hôm qua chưa chốt:** `WHERE consultationDate = YESTERDAY AND serviceStatus != "Đã chốt" AND (consultingDoctorId = employeeId OR consultingSaleId = employeeId)`
   - **Hôm nay:** `WHERE consultationDate = TODAY AND (consultingDoctorId = employeeId OR consultingSaleId = employeeId)`
   - **Tháng đã chốt:** `WHERE consultationDate IN month AND serviceStatus = "Đã chốt" AND (consultingDoctorId = employeeId OR consultingSaleId = employeeId)`
   - Include: customer, consultingDoctor, consultingSale, treatingDoctor

3. **PaymentVoucher + PaymentDetail (Doanh thu điều trị):**
   - Query: `WHERE paymentDate IN month AND details.consultedService.treatingDoctorId = employeeId`
   - Join: PaymentVoucher → PaymentDetail → ConsultedService → Customer, treatingDoctor

---

## 3. Business Rules

### 3.1 Data Filtering (Personalization)

**Core Rule:** Dashboard chỉ hiển thị data liên quan đến employee đang login.

**Filtering Logic:**

1. **Appointments (Lịch hẹn):**

   - Employee là `primaryDentistId` HOẶC `secondaryDentistId`
   - Chỉ hôm nay (date = today)

2. **ConsultedService (Dịch vụ tư vấn):**

   - Employee là `consultingDoctorId` HOẶC `consultingSaleId`
   - Filter theo date:
     - Chưa chốt: yesterday
     - Hôm nay: today
     - Tháng: month range

3. **TreatmentRevenue (Doanh thu điều trị):**
   - Employee là `treatingDoctorId` (trong ConsultedService)
   - Filter theo paymentDate trong tháng

**No Admin Override:**

- Dashboard KHÔNG có admin mode (không filter theo clinicId)
- Mỗi user chỉ thấy data của chính mình

### 3.2 Date Logic

**Timezone:** Asia/Ho_Chi_Minh (VN)

**Date Calculations:**

```typescript
// Today
const today = dayjs().tz(VN_TZ).format("YYYY-MM-DD");

// Yesterday
const yesterday = dayjs().tz(VN_TZ).subtract(1, "day").format("YYYY-MM-DD");

// Start/End of month
const monthStart = dayjs(selectedMonth)
  .tz(VN_TZ)
  .startOf("month")
  .format("YYYY-MM-DD");
const monthEnd = dayjs(selectedMonth)
  .tz(VN_TZ)
  .endOf("month")
  .format("YYYY-MM-DD");
```

**Date Range Validation:**

- Không cho chọn tháng trong tương lai (disable button nếu >= current month)

### 3.3 Auto-Refresh Logic

**Refresh Strategies:**

1. **Real-time data (Appointments, Today Services):**

   - `staleTime`: 2-3 minutes
   - `refetchInterval`: 30-60 seconds (only when page active)
   - Use case: Cập nhật khi có appointment mới hoặc check-in/out

2. **Recent data (Yesterday Unconfirmed):**

   - `staleTime`: 5 minutes
   - `refetchInterval`: false (no auto-refetch)
   - `refetchOnWindowFocus`: true
   - Use case: Data ít thay đổi (yesterday)

3. **Historical data (Monthly Revenue):**
   - `staleTime`: 10 minutes
   - `refetchInterval`: false
   - `refetchOnWindowFocus`: true
   - Use case: Data tĩnh (past data)

### 3.4 Card Click Interaction

**Pattern:**

- Click card → Toggle hiển thị bảng chi tiết
- Click card đang active → Hide bảng
- Chỉ 1 bảng được hiển thị tại 1 thời điểm (exclusive)

**State Management:**

```typescript
const [activeSection, setActiveSection] = useState<
  | "appointments"
  | "unconfirmed-services"
  | "today-services"
  | "monthly-revenue"
  | "treatment-revenue"
  | null
>(null);

const handleCardClick = (section) => {
  setActiveSection(activeSection === section ? null : section);
};
```

---

## 4. Backend Architecture

### 4.1 API Endpoints

Dashboard SỬ DỤNG các API endpoints có sẵn từ features khác:

#### GET /api/appointments/today

**Existing Endpoint** (đã có sẵn)

**Query Params:**

- `date`: YYYY-MM-DD (required)
- `doctorId`: string (required) - Filter by primary or secondary dentist

**Logic:**

```typescript
WHERE appointmentDateTime BETWEEN (date.startOfDay, date.endOfDay)
  AND (primaryDentistId = doctorId OR secondaryDentistId = doctorId)

Include: customer, primaryDentist, secondaryDentist
Order by: appointmentDateTime ASC
```

**Response:** `DashboardAppointment[]`

#### GET /api/consulted-services

**Existing Endpoint** (reused với filter params)

**Query Params:**

- `date`: YYYY-MM-DD (optional) - Filter by consultationDate
- `consultingDoctorId`: string (optional)
- `consultingSaleId`: string (optional)
- `serviceStatus`: string (optional) - "Đã chốt" | "Chưa chốt"

**Dashboard Usage:**

**Case 1: Yesterday Unconfirmed Services**

```typescript
GET /api/consulted-services?date=YESTERDAY&consultingDoctorId=${employeeId}&consultingSaleId=${employeeId}

// Frontend filter: serviceStatus !== "Đã chốt"
```

**Case 2: Today Services**

```typescript
GET /api/consulted-services?date=TODAY&consultingDoctorId=${employeeId}&consultingSaleId=${employeeId}

// Return tất cả (cả đã chốt và chưa chốt)
```

**Case 3: Monthly Revenue (Confirmed Services)**

```typescript
GET /api/consulted-services?consultingDoctorId=${employeeId}&consultingSaleId=${employeeId}

// Frontend filter:
// - consultationDate in selected month
// - serviceStatus === "Đã chốt"
```

**Note:** API hiện tại KHÔNG hỗ trợ filter theo tháng (month range) → Frontend phải filter sau khi fetch all data.

**Response:** `DashboardConsultedService[]`

#### GET /api/reports/treatment-revenue

**Existing Endpoint** (từ Reports feature)

**Query Params:**

- `month`: YYYY-MM (required)

**Headers:**

- `x-employee-id`: string (required) - Auto filter by treatingDoctorId

**Logic:**

```typescript
// Fetch PaymentVouchers in month
WHERE paymentDate IN (monthStart, monthEnd)

// Filter details: treatingDoctorId = employeeId
Include: PaymentDetail → ConsultedService → Customer, treatingDoctor

// Build TreatmentRevenueData[]
Map details to flat structure
```

**Response:** `TreatmentRevenueData[]`

### 4.2 No Custom Dashboard API

Dashboard **KHÔNG có API routes riêng**. Nó reuse các endpoints có sẵn.

**Refactor Consideration:**

- Nếu cần optimize performance (ví dụ: fetch all consulted-services rồi filter by month ở frontend tốn tài nguyên), có thể tạo dedicated endpoint:
  - `GET /api/dashboard/monthly-revenue?month=YYYY-MM&employeeId={id}`
  - Backend filter theo tháng trước khi return

---

## 5. Frontend Architecture

### 5.1 Types

```typescript
// src/features/dashboard/type.ts

export interface DashboardAppointment {
  id: string;
  appointmentDateTime: string;
  duration: number;
  notes?: string;
  status: string;
  checkInTime?: string;
  checkOutTime?: string;
  customer: {
    id: string;
    customerCode?: string;
    fullName: string;
    phone?: string;
  };
  primaryDentist: { id: string; fullName: string };
  secondaryDentist?: { id: string; fullName: string };
}

export interface DashboardConsultedService {
  id: string;
  consultedServiceName: string;
  consultedServiceUnit: string;
  quantity: number;
  price: number;
  preferentialPrice: number;
  finalPrice: number;
  amountPaid: number;
  debt: number;
  consultationDate: string;
  serviceConfirmDate?: string;
  serviceStatus: string; // "Chưa chốt" | "Đã chốt"
  treatmentStatus: string; // "Chưa điều trị" | "Đang điều trị" | "Hoàn thành"
  customer: {
    id: string;
    customerCode?: string;
    fullName: string;
    phone?: string;
  };
  consultingDoctor?: { id: string; fullName: string };
  consultingSale?: { id: string; fullName: string };
  treatingDoctor?: { id: string; fullName: string };
}

// From Reports feature
export interface TreatmentRevenueData {
  consultedServiceId: string;
  consultedServiceName: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  treatingDoctorName: string;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  paymentVoucherId: string;
  paymentDetailId: string;
}
```

### 5.2 Hooks (React Query)

#### useDashboardAppointments()

**Query Key:** `["dashboard-appointments", employeeId]`

**API:** `GET /api/appointments/today?date=${today}&doctorId=${employeeId}`

**Config:**

```typescript
{
  staleTime: 2 * 60 * 1000,        // 2 minutes
  refetchInterval: 30 * 1000,      // Auto refetch every 30 seconds
  refetchIntervalInBackground: false,
  enabled: !!employeeId
}
```

**Return:** `{ data: DashboardAppointment[], isLoading, error }`

**Implementation:**

```typescript
const fetchTodayAppointments = async (doctorId: string) => {
  const today = dayjs().format("YYYY-MM-DD");
  const response = await fetch(
    `/api/appointments/today?date=${today}&doctorId=${doctorId}`
  );
  if (!response.ok) throw new Error("Failed to fetch appointments");
  return response.json();
};
```

#### useDashboardUnconfirmedServices()

**Query Key:** `["dashboard-unconfirmed-services", employeeId]`

**API:** `GET /api/consulted-services?date=${yesterday}&consultingDoctorId=${employeeId}&consultingSaleId=${employeeId}`

**Frontend Filter:**

```typescript
const unconfirmedOnly = (data || []).filter(
  (service) => service.serviceStatus !== "Đã chốt"
);
```

**Config:**

```typescript
{
  staleTime: 5 * 60 * 1000,        // 5 minutes
  refetchInterval: false,          // No auto-refetch
  refetchOnWindowFocus: true,
  enabled: !!employeeId
}
```

**Return:** `{ data: DashboardConsultedService[], isLoading, error }`

#### useDashboardTodayServices()

**Query Key:** `["dashboard-today-services", employeeId]`

**API:** `GET /api/consulted-services?date=${today}&consultingDoctorId=${employeeId}&consultingSaleId=${employeeId}`

**Config:**

```typescript
{
  staleTime: 3 * 60 * 1000,        // 3 minutes
  refetchInterval: 60 * 1000,      // Auto refetch every 1 minute
  refetchIntervalInBackground: false,
  enabled: !!employeeId
}
```

**Return:** `{ data: DashboardConsultedService[], isLoading, error }`

#### useDashboardMonthlyRevenue(selectedMonth)

**Query Key:** `["dashboard-monthly-revenue", employeeId, selectedMonth.format("YYYY-MM")]`

**API:** `GET /api/consulted-services?consultingDoctorId=${employeeId}&consultingSaleId=${employeeId}`

**Frontend Processing:**

```typescript
// Filter by selected month and confirmed status
const selectedMonthServices = (data || []).filter((service) => {
  const serviceDate = dayjs(service.consultationDate);
  const isSelectedMonth = serviceDate.isSame(selectedMonth, "month");
  const isCompleted = service.serviceStatus === "Đã chốt";
  return isSelectedMonth && isCompleted;
});

// Calculate total revenue
const totalRevenue = selectedMonthServices.reduce(
  (sum, s) => sum + (s.finalPrice || 0),
  0
);

return {
  services: selectedMonthServices,
  totalRevenue,
  count: selectedMonthServices.length,
  month: selectedMonth.format("MM/YYYY"),
};
```

**Config:**

```typescript
{
  staleTime: 10 * 60 * 1000,       // 10 minutes
  refetchInterval: false,
  refetchOnWindowFocus: true,
  enabled: !!employeeId
}
```

**Return:** `{ data: { services, totalRevenue, count, month }, isLoading, error }`

#### useDashboardTreatmentRevenue(selectedMonth)

**Location:** `src/features/reports/hooks/useDashboardTreatmentRevenue.ts` (reused from Reports feature)

**Query Key:** `["dashboard-treatment-revenue", selectedMonth.format("YYYY-MM")]`

**API:** `GET /api/reports/treatment-revenue?month=${selectedMonth.format("YYYY-MM")}`

**Headers:** `{ ...authHeaders }` (includes x-employee-id)

**Frontend Processing:**

```typescript
// Map PaymentVouchers + Details to flat TreatmentRevenueData[]
vouchers.forEach((voucher) => {
  voucher.details.forEach((detail) => {
    treatmentRevenue.push({
      consultedServiceId: detail.consultedServiceId,
      consultedServiceName: detail.consultedService.consultedServiceName,
      customerId: detail.consultedService.customer.id,
      customerName: detail.consultedService.customer.fullName,
      customerCode: detail.consultedService.customer.customerCode,
      treatingDoctorName: detail.consultedService.treatingDoctor.fullName,
      paymentDate: voucher.paymentDate,
      amount: detail.amount,
      paymentMethod: detail.paymentMethod,
      paymentVoucherId: voucher.id,
      paymentDetailId: detail.id,
    });
  });
});
```

**Config:**

```typescript
{
  staleTime: 10 * 60 * 1000,       // 10 minutes
  gcTime: 15 * 60 * 1000
}
```

**Return:** `{ data: TreatmentRevenueData[], isLoading, error }`

### 5.3 Components

#### DashboardPage

**Location:** `src/features/dashboard/pages/DashboardPage.tsx`

**Purpose:** Main container component

**Structure:**

```tsx
const [selectedMonth, setSelectedMonth] = useState(dayjs())
const [activeSection, setActiveSection] = useState<"appointments" | ... | null>(null)

return (
  <Space direction="vertical" size="large">
    <DashboardGreeting />

    <DashboardStatistics
      onCardClick={handleStatisticClick}
      activeCard={activeSection}
      selectedMonth={selectedMonth}
      onSelectedMonthChange={setSelectedMonth}
    />

    {activeSection === "appointments" && <DashboardDailyAppointment />}
    {activeSection === "unconfirmed-services" && <DashboardUnconfirmedServices />}
    {activeSection === "today-services" && <DashboardTodayServices />}
    {activeSection === "monthly-revenue" && <DashboardMonthlyRevenue selectedMonth={selectedMonth} />}
    {activeSection === "treatment-revenue" && <DashboardTreatmentRevenue selectedMonth={selectedMonth} />}
  </Space>
)
```

#### DashboardGreeting

**Purpose:** Hiển thị lời chào + tên employee

**Implementation:**

```tsx
const employeeProfile = useAppStore((state) => state.employeeProfile);

return (
  <Title level={2}>Xin chào: {employeeProfile?.fullName || "Người dùng"}</Title>
);
```

#### DashboardStatistics

**Purpose:** Hiển thị 5 thẻ thống kê (clickable cards)

**Props:**

```typescript
{
  onCardClick: (section) => void,
  activeCard: "appointments" | ... | null,
  selectedMonth: Dayjs,
  onSelectedMonthChange: (month) => void
}
```

**Layout:**

```tsx
<Row gutter={[24, 16]}>
  {/* Column 1: Thống kê hôm nay */}
  <Col xs={24} lg={12}>
    <Title level={4}>📊 Thống kê hôm nay</Title>
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={24} md={8}>
        <StatisticCard
          title="Tổng lịch hẹn hôm nay"
          value={appointments.length}
          icon={<CalendarOutlined />}
          color="#1890ff"
          onClick={() => handleCardClick("appointments")}
          active={activeCard === "appointments"}
        />
      </Col>

      <Col xs={24} sm={24} md={8}>
        <StatisticCard
          title="Tổng dịch vụ chưa chốt hôm qua"
          value={unconfirmedServices.length}
          icon={<ExclamationCircleOutlined />}
          color="#faad14"
          onClick={() => handleCardClick("unconfirmed-services")}
          active={activeCard === "unconfirmed-services"}
        />
      </Col>

      <Col xs={24} sm={24} md={8}>
        <StatisticCard
          title="Tổng dịch vụ tư vấn hôm nay"
          value={todayServices.length}
          icon={<MedicineBoxOutlined />}
          color="#52c41a"
          onClick={() => handleCardClick("today-services")}
          active={activeCard === "today-services"}
        />
      </Col>
    </Row>
  </Col>

  {/* Column 2: Thống kê theo tháng */}
  <Col xs={24} lg={12}>
    <Flex justify="space-between" align="center">
      <Title level={4}>📈 Thống kê theo tháng</Title>
      <Space>
        <Button
          icon={<LeftOutlined />}
          onClick={() => setSelectedMonth(selectedMonth.subtract(1, "month"))}
        />
        <span>{selectedMonth.format("MM/YYYY")}</span>
        <Button
          icon={<RightOutlined />}
          onClick={() => setSelectedMonth(selectedMonth.add(1, "month"))}
          disabled={
            selectedMonth.isSame(dayjs(), "month") ||
            selectedMonth.isAfter(dayjs(), "month")
          }
        />
      </Space>
    </Flex>

    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12}>
        <StatisticCard
          title={`Doanh số tư vấn tháng ${selectedMonth.format("MM/YYYY")}`}
          value={monthlyRevenue?.totalRevenue || 0}
          icon={<MedicineBoxOutlined />}
          color="#722ed1"
          customFormatter={formatCurrency}
          onClick={() => handleCardClick("monthly-revenue")}
          active={activeCard === "monthly-revenue"}
        />
      </Col>

      <Col xs={24} sm={12}>
        <StatisticCard
          title={`Doanh thu điều trị tháng ${selectedMonth.format("MM/YYYY")}`}
          value={treatmentRevenue.reduce((sum, item) => sum + item.amount, 0)}
          icon={<MedicineBoxOutlined />}
          color="#13c2c2"
          customFormatter={formatCurrency}
          onClick={() => handleCardClick("treatment-revenue")}
          active={activeCard === "treatment-revenue"}
        />
      </Col>
    </Row>
  </Col>
</Row>;

{
  /* Instructions */
}
<div
  style={{
    textAlign: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 6,
    padding: 8,
  }}
>
  💡 Nhấp vào các thẻ thống kê để xem chi tiết bảng dữ liệu
</div>;
```

**Card Interaction:**

```tsx
const handleCardClick = (cardType) => {
  const newActiveCard = activeCard === cardType ? null : cardType;
  onCardClick(newActiveCard);
};
```

**StatisticCard Component:**

```tsx
type StatisticCardProps = {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
  onClick: () => void;
  active: boolean;
  customFormatter?: (value: number) => string;
};

const StatisticCard = ({
  title,
  value,
  icon,
  color,
  loading,
  onClick,
  active,
  customFormatter,
}) => (
  <Card
    hoverable
    onClick={onClick}
    style={{
      borderColor: active ? color : undefined,
      backgroundColor: active ? `${color}10` : undefined,
      cursor: "pointer",
    }}
  >
    <Statistic
      title={title}
      value={value}
      loading={loading}
      prefix={icon}
      valueStyle={{ color, fontSize: 24, fontWeight: "bold" }}
      formatter={
        customFormatter ? (val) => customFormatter(val as number) : undefined
      }
    />
  </Card>
);
```

#### DashboardDailyAppointment

**Purpose:** Bảng chi tiết lịch hẹn hôm nay

**Data Source:** `useDashboardAppointments()`

**Table Columns:**

- Mã KH (customerCode)
- Khách hàng (fullName + link to customer detail)
- Thời gian hẹn (HH:mm với tooltip duration)
- Bác sĩ chính
- Bác sĩ phụ
- Trạng thái (Tag với màu)
- Check-in time (HH:mm)
- Check-out time (HH:mm)

**Sorting:**

- Default: Sort by appointmentDateTime ASC (earliest first)
- Có sorting cho: thời gian hẹn, trạng thái, check-in, check-out

**Implementation:**

```tsx
const {
  data: appointments = [],
  isLoading,
  error,
} = useDashboardAppointments();

return (
  <Card title="📅 Lịch hẹn hôm nay">
    <Table
      dataSource={appointments}
      columns={columns}
      loading={isLoading}
      rowKey="id"
      pagination={false}
      size="small"
    />
  </Card>
);
```

#### DashboardUnconfirmedServices

**Purpose:** Bảng dịch vụ chưa chốt hôm qua

**Data Source:** `useDashboardUnconfirmedServices()`

**Table Columns:**

- Khách hàng (fullName + customerCode tag + link)
- Dịch vụ (name + unit)
- SL (quantity)
- Giá ưu đãi (preferentialPrice)
- Thành tiền (finalPrice, bold red)
- Trạng thái DV (serviceStatus tag)
- Trạng thái ĐT (treatmentStatus tag)

**Note:** Highlight unconfirmed status để staff notice → Cần chốt lại

#### DashboardTodayServices

**Purpose:** Bảng dịch vụ tư vấn hôm nay (cả đã chốt + chưa chốt)

**Data Source:** `useDashboardTodayServices()`

**Table Columns:** Giống DashboardUnconfirmedServices

**Difference:** Hiển thị cả đã chốt + chưa chốt (no filter)

#### DashboardMonthlyRevenue

**Purpose:** Bảng doanh số tư vấn theo tháng

**Props:**

```typescript
{
  selectedMonth: Dayjs;
}
```

**Data Source:** `useDashboardMonthlyRevenue(selectedMonth)`

**Display:**

- Group by date (collapsible cards per day)
- Mỗi card: Date + count + table
- Table columns:
  - Khách hàng (link + customerCode tag)
  - Tên dịch vụ
  - Thành tiền (finalPrice, bold green)
  - BS tư vấn
  - Sale tư vấn
  - Trạng thái DV
  - Trạng thái ĐT

**Summary:**

```tsx
<Card title={`💰 Doanh số tư vấn tháng ${selectedMonth.format("MM/YYYY")}`}>
  <div>
    Tổng: {formatCurrency(data.totalRevenue)} ({data.count} dịch vụ)
  </div>

  {Object.keys(groupedServices).map((date) => (
    <Card
      key={date}
      title={formatDate(date)}
      extra={`${groupedServices[date].length} dịch vụ`}
    >
      <Table dataSource={groupedServices[date]} columns={columns} />
    </Card>
  ))}
</Card>
```

#### DashboardTreatmentRevenue

**Location:** `src/features/reports/components/DashboardTreatmentRevenue.tsx` (reused from Reports)

**Purpose:** Bảng doanh thu điều trị theo tháng

**Props:**

```typescript
{
  selectedMonth: Dayjs;
}
```

**Data Source:** `useDashboardTreatmentRevenue(selectedMonth)`

**Table Columns:**

- Khách hàng (link)
- Dịch vụ điều trị
- Số tiền (amount)
- Phương thức thanh toán
- Ngày thanh toán
- BS điều trị

**Note:** Component này thuộc Reports feature nhưng được reuse trong Dashboard

---

## 6. Constants

```typescript
// src/features/dashboard/constants.ts

export const APPOINTMENT_STATUS_COLORS = {
  "Chờ xác nhận": "orange",
  "Đã xác nhận": "blue",
  "Đã đến": "green",
  "Không đến": "red",
  "Đã hủy": "red",
} as const;

export const SERVICE_STATUS_COLORS = {
  "Chưa chốt": "orange",
  "Đã chốt": "green",
} as const;

export const TREATMENT_STATUS_COLORS = {
  "Chưa điều trị": "orange",
  "Đang điều trị": "blue",
  "Hoàn thành": "green",
} as const;

export const TIME_FORMAT = "HH:mm";
export const DATE_FORMAT = "YYYY-MM-DD";
```

---

## 7. Key Implementation Points

### 7.1 Personalized Data (Per-Employee Filter)

**Why:**

- Dashboard là personalized view - mỗi employee chỉ thấy data của chính mình
- KHÔNG có admin override (khác với Reports feature)

**Implementation:**

```typescript
// Get employeeId from store
const employeeProfile = useAppStore((state) => state.employeeProfile);
const employeeId = employeeProfile?.id;

// Pass employeeId to hooks
const { data: appointments } = useDashboardAppointments(); // Auto use employeeId inside hook

// Hook implementation
export const useDashboardAppointments = () => {
  const employeeProfile = useAppStore((state) => state.employeeProfile);

  return useQuery({
    queryKey: ["dashboard-appointments", employeeProfile?.id],
    queryFn: () => fetchTodayAppointments(employeeProfile!.id),
    enabled: !!employeeProfile?.id, // Only fetch if employeeId exists
  });
};
```

### 7.2 Reusing Existing APIs

**Pattern:** Dashboard KHÔNG tạo custom API. Nó reuse các endpoints từ features khác.

**Benefits:**

- No code duplication
- Consistent data format
- Easier maintenance

**Trade-offs:**

- Có thể fetch more data than needed (e.g., fetch all consulted-services rồi filter by month ở frontend)
- Nếu performance issue → Consider tạo dedicated dashboard endpoint

**Refactor Recommendation:**

```typescript
// Option 1: Keep current approach (reuse existing APIs)
// Pros: Simple, no new code
// Cons: May fetch unnecessary data

// Option 2: Create dedicated dashboard endpoints
GET /api/dashboard/summary?employeeId={id}
// Return tất cả metrics trong 1 call
// Pros: Optimized, single request
// Cons: More backend code, coupling
```

### 7.3 Frontend Filtering vs Backend Filtering

**Current Approach:**

- Backend: Filter by employee (doctorId, consultingDoctorId, etc.)
- Frontend: Filter by date range, serviceStatus, etc.

**Example:**

```typescript
// useDashboardMonthlyRevenue
// Backend: Fetch all consulted-services of employee
const response = await fetch(
  `/api/consulted-services?consultingDoctorId=${employeeId}`
);

// Frontend: Filter by month + status
const selectedMonthServices = data.filter((service) => {
  const serviceDate = dayjs(service.consultationDate);
  const isSelectedMonth = serviceDate.isSame(selectedMonth, "month");
  const isCompleted = service.serviceStatus === "Đã chốt";
  return isSelectedMonth && isCompleted;
});
```

**Optimization:**

- Nếu employee có nhiều data (hàng nghìn records) → Performance issue
- Solution: Add month filter to API
  - `GET /api/consulted-services?from=YYYY-MM-01&to=YYYY-MM-31&consultingDoctorId=${employeeId}&serviceStatus=Đã chốt`

### 7.4 Auto-Refresh Strategy

**Pattern:** Khác nhau tùy loại data

**Real-time data (Appointments, Today Services):**

```typescript
{
  staleTime: 2 * 60 * 1000,        // 2-3 minutes
  refetchInterval: 30 * 1000,      // 30-60 seconds
  refetchIntervalInBackground: false  // Stop when user switches tab
}
```

**Recent data (Yesterday Unconfirmed):**

```typescript
{
  staleTime: 5 * 60 * 1000,        // 5 minutes
  refetchInterval: false,          // No auto-refresh
  refetchOnWindowFocus: true       // Refresh when user returns to tab
}
```

**Historical data (Monthly Revenue):**

```typescript
{
  staleTime: 10 * 60 * 1000,       // 10 minutes
  refetchInterval: false,
  refetchOnWindowFocus: true
}
```

**Why:**

- Real-time data cần frequent updates (appointments, today services)
- Historical data tĩnh → No need auto-refresh

### 7.5 Card Click Toggle Pattern

**State Management:**

```typescript
const [activeSection, setActiveSection] = useState<"appointments" | ... | null>(null)

const handleCardClick = (section) => {
  // Toggle: Click same card → Hide, click different card → Show
  const newActiveCard = activeCard === section ? null : section
  setActiveSection(newActiveCard)
}
```

**Visual Feedback:**

```tsx
<Card
  style={{
    borderColor: active ? color : undefined,
    backgroundColor: active ? `${color}10` : undefined  // Light tint
  }}
>
```

**Exclusive Display:**

```tsx
{
  /* Only 1 table visible at a time */
}
{
  activeSection === "appointments" && <DashboardDailyAppointment />;
}
{
  activeSection === "unconfirmed-services" && <DashboardUnconfirmedServices />;
}
// ...
```

### 7.6 Month Selector with Validation

**Pattern:** Disable future months

**Implementation:**

```tsx
<Button
  icon={<RightOutlined />}
  onClick={() => setSelectedMonth(selectedMonth.add(1, "month"))}
  disabled={
    selectedMonth.isSame(dayjs(), "month") || // Current month
    selectedMonth.isAfter(dayjs(), "month") // Future month
  }
/>
```

**Why:** Không có data cho tháng tương lai → Disable button

### 7.7 Cross-Feature Component Reuse

**Pattern:** DashboardTreatmentRevenue component từ Reports feature

**File Structure:**

```
src/features/
  reports/
    hooks/
      useDashboardTreatmentRevenue.ts  ← Used by Dashboard
    components/
      DashboardTreatmentRevenue.tsx   ← Imported into Dashboard
  dashboard/
    pages/
      DashboardPage.tsx               ← Imports from Reports
```

**Import:**

```tsx
import { DashboardTreatmentRevenue } from "@/features/reports/components/DashboardTreatmentRevenue";
import { useDashboardTreatmentRevenue } from "@/features/reports/hooks/useDashboardTreatmentRevenue";
```

**Benefits:**

- Code reuse
- Consistent UI/UX giữa Dashboard và Reports

**Trade-offs:**

- Coupling giữa features (Dashboard depends on Reports)
- Refactor Reports → Có thể affect Dashboard

---

## 8. Checklist để Code lại

### Backend

- [ ] **Optimize ConsultedService API:**

  - [ ] Add `from`, `to` params để filter by date range (avoid fetching all data)
  - [ ] Add `serviceStatus` filter param
  - [ ] Add index on `consultationDate` cho performance

- [ ] **Consider dedicated dashboard endpoint:**

  - [ ] `GET /api/dashboard/summary?employeeId={id}` - Return all metrics in 1 call
  - [ ] Pros: Single request, optimized query
  - [ ] Cons: More code, tightly coupled

- [ ] **Add caching:**
  - [ ] Cache layer cho dashboard queries (Redis?)
  - [ ] TTL: 2-5 minutes cho real-time data, 10+ minutes cho historical

### Frontend

- [ ] **Refactor hooks:**

  - [ ] Consolidate similar hooks (useDashboardUnconfirmedServices + useDashboardTodayServices có logic giống nhau)
  - [ ] Extract common fetching logic to utility function
  - [ ] Add error retry logic

- [ ] **Improve UI:**

  - [ ] Add skeleton loading cho cards
  - [ ] Add empty states với illustrations
  - [ ] Add error states với retry button
  - [ ] Responsive design - mobile optimization

- [ ] **Performance:**

  - [ ] Lazy load detail tables (only fetch when card clicked)
  - [ ] Virtual scrolling cho large tables
  - [ ] Debounce month selector

- [ ] **Accessibility:**
  - [ ] Keyboard navigation cho card selection
  - [ ] Screen reader support cho statistics
  - [ ] ARIA labels

### Testing

- [ ] Test personalization (employee A không thấy data của employee B)
- [ ] Test auto-refresh logic (real-time vs historical data)
- [ ] Test card toggle interaction
- [ ] Test month selector validation (disable future months)
- [ ] Test empty states (no appointments, no services)
- [ ] Test error handling (API failures)

### Integration

- [ ] Link to detail pages (click appointment → Appointment detail, click service → ConsultedService detail)
- [ ] Add quick actions (e.g., từ appointment card → Check-in button)
- [ ] Add notifications (e.g., "You have 3 appointments in next 30 minutes")

---

## 9. Data Flow Diagrams

### Page Load Flow

```
User navigates to "/" (Dashboard) →
DashboardPage mounts →
Get employeeId from Zustand store →

Parallel fetch:
  1. useDashboardAppointments()
     → GET /api/appointments/today?date=TODAY&doctorId={employeeId}
     → Display count in card

  2. useDashboardUnconfirmedServices()
     → GET /api/consulted-services?date=YESTERDAY&consultingDoctorId={employeeId}
     → Frontend filter: serviceStatus !== "Đã chốt"
     → Display count in card

  3. useDashboardTodayServices()
     → GET /api/consulted-services?date=TODAY&consultingDoctorId={employeeId}
     → Display count in card

  4. useDashboardMonthlyRevenue(selectedMonth)
     → GET /api/consulted-services?consultingDoctorId={employeeId}
     → Frontend filter: month + "Đã chốt"
     → Calculate totalRevenue
     → Display in card

  5. useDashboardTreatmentRevenue(selectedMonth)
     → GET /api/reports/treatment-revenue?month={YYYY-MM}
     → Headers: x-employee-id (auto filter)
     → Map vouchers to flat data
     → Display total in card

Render 5 statistic cards với loading states →
Show instruction: "Click card to view details"
```

### Card Click Flow

```
User clicks "Lịch hẹn hôm nay" card →
handleStatisticClick("appointments") →
setActiveSection("appointments") →
Render <DashboardDailyAppointment /> component →

Component mounts →
useDashboardAppointments() already cached (from initial load) →
Render table with appointments →
Sort by appointmentDateTime ASC →
Display columns: Mã KH, Khách hàng, Thời gian, BS chính, BS phụ, Trạng thái, Check-in, Check-out
```

### Month Selector Flow

```
User clicks next month button →
onSelectedMonthChange(selectedMonth.add(1, "month")) →
setSelectedMonth(new month) →

Dependent queries refetch:
  1. useDashboardMonthlyRevenue(newMonth)
     → Re-fetch + re-filter by new month
     → Update totalRevenue card

  2. useDashboardTreatmentRevenue(newMonth)
     → Re-fetch với new month param
     → Update treatment revenue card

If activeSection === "monthly-revenue" or "treatment-revenue" →
  Re-render detail table với new data
```

### Auto-Refresh Flow

```
DashboardPage is active (user on page) →

Every 30 seconds (if not in background):
  useDashboardAppointments() refetches
  → Update "Lịch hẹn hôm nay" count
  → If detail table visible → Update table

Every 60 seconds:
  useDashboardTodayServices() refetches
  → Update "Dịch vụ tư vấn hôm nay" count

On window focus (user returns to tab):
  - useDashboardUnconfirmedServices() refetches
  - useDashboardMonthlyRevenue() refetches
  - useDashboardTreatmentRevenue() refetches
```

---

## 10. Future Enhancements

### Dashboard Customization

- Allow user to choose which cards to display
- Drag & drop to reorder cards
- Save layout preference per user

### More Metrics

- **Today metrics:**
  - Pending payments (debt today)
  - New customers registered today
  - Treatment logs created today
- **Monthly metrics:**
  - Average revenue per day
  - Top performing services (by count, by revenue)
  - Customer retention rate

### Data Visualization

- Charts: Line chart for revenue trend, bar chart for service distribution
- KPI indicators: Arrow up/down compared to last month
- Heatmap: Busy hours of the day

### Quick Actions

- From appointment card → Quick check-in button
- From unconfirmed service card → Quick confirm button
- From today service card → Quick add treatment log button

### Notifications & Alerts

- Badge count on cards (e.g., "3 new appointments")
- Toast notification when new appointment added
- Alert when debt exceeds threshold

### Export & Reports

- Export dashboard summary to PDF
- Email daily summary report
- Weekly/Monthly summary email

### Filters

- Date range selector (not just today/yesterday)
- Clinic filter (for admin who manages multiple clinics)
- Status filter (e.g., only show "Chờ xác nhận" appointments)

### Comparison Mode

- Compare this month vs last month
- Compare this week vs last week
- Year-over-year comparison

---

**Tổng kết:** Dashboard là **view-only personalized homepage** hiển thị 5 loại thống kê (appointments hôm nay, unconfirmed services hôm qua, today services, monthly consulting revenue, monthly treatment revenue). Không có CRUD operations, chỉ fetch và display data. Reuse các API endpoints từ Appointments, ConsultedServices, Reports features. Key patterns: Personalization (per-employee filter), auto-refresh strategies, card toggle interaction, frontend filtering for optimization. Future improvements: More metrics, charts, customization, quick actions.
