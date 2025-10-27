# Payment Feature - Requirements để Refactor

## 1. Database Schema (Prisma)

### PaymentVoucher (Phiếu thu)

```prisma
model PaymentVoucher {
  id            String   @id @default(cuid())
  paymentNumber String   @unique // Format: {PREFIX}-YYMM-XXXX (VD: MK-2510-0001)
  customerId    String
  paymentDate   DateTime
  totalAmount   Float
  cashierId     String   // Thu ngân
  notes         String?
  clinicId      String
  createdById   String
  updatedById   String?
  createdAt     DateTime
  updatedAt     DateTime

  // Relations
  customer Customer
  cashier  Employee
  details  PaymentVoucherDetail[]
}

model PaymentVoucherDetail {
  id                   String   @id @default(cuid())
  paymentVoucherId     String
  consultedServiceId   String   // Dịch vụ được thanh toán
  amount               Float    // Số tiền thu cho dịch vụ này
  paymentMethod        String   // "Tiền mặt" | "Quẹt thẻ thường" | "Quẹt thẻ Visa" | "Chuyển khoản"
  createdById          String
  createdAt            DateTime

  // Relations
  paymentVoucher   PaymentVoucher
  consultedService ConsultedService
}
```

**Quan hệ với ConsultedService:**

- Khi tạo PaymentVoucherDetail → `ConsultedService.amountPaid` tăng lên
- Khi xóa PaymentVoucher → `ConsultedService.amountPaid` giảm xuống
- Outstanding = `ConsultedService.finalPrice - ConsultedService.amountPaid`

---

## 2. Business Rules

### 2.1 Payment Number Generation

- **Format:** `{PREFIX}-YYMM-XXXX`
  - PREFIX: Dựa vào clinicId (MK, TDT, DN)
  - YYMM: Năm-tháng hiện tại
  - XXXX: Số thứ tự 4 chữ số (0001, 0002, ...)
- **Logic:** Đếm số phiếu trong tháng với prefix tương ứng + retry logic để tránh duplicate
- **Unique constraint:** paymentNumber phải unique trong database

### 2.2 Payment Creation Flow

1. Fetch outstanding services của customer (API: `/api/customers/{id}/outstanding-services`)
2. User chọn service(s) + nhập số tiền thu + chọn payment method cho từng service
3. Validation:
   - Amount > 0
   - Amount ≤ outstanding của service đó
   - Ít nhất 1 service được chọn
4. Transaction:
   - Tạo PaymentVoucher với paymentNumber unique
   - Tạo PaymentVoucherDetail cho từng service
   - Update `ConsultedService.amountPaid` (increment)

### 2.3 Permission Rules

**Admin:**

- Tạo, sửa (mọi phiếu), xóa phiếu thu bất kỳ
- Sửa được: customerId, services, amounts, payment methods, notes

**Non-admin:**

- Tạo phiếu thu mới
- **Sửa phiếu thu trong ngày (paymentDate = today):**
  - Chỉ sửa được: `notes` và `paymentMethod` của details
  - KHÔNG sửa được: customerId, services, amounts
- **Xóa:** KHÔNG được xóa

**Backend validation:**

- Check `x-employee-role` header
- Check `isToday(paymentDate)` cho non-admin
- Reject nếu non-admin cố sửa restricted fields

### 2.4 Outstanding Services Logic

**API:** `/api/customers/{customerId}/outstanding-services`

**Logic:**

```typescript
consultedServices.filter((service) => {
  return (
    service.serviceStatus === "Đã chốt" && // Only confirmed services
    service.finalPrice - service.amountPaid > 0
  ); // Has outstanding
});
```

**Response:**

```typescript
{
  id: string;
  consultedServiceName: string;
  finalPrice: number;
  totalPaid: number; // Sum of paymentDetails.amount
  outstanding: number; // finalPrice - totalPaid
}
```

---

## 3. Backend Architecture

### 3.1 Zod Schemas (Validation)

```typescript
// src/features/payment/validation.ts

const PaymentVoucherDetailSchema = z.object({
  consultedServiceId: z.string().cuid(),
  amount: z.number().positive(),
  paymentMethod: z.enum([
    "Tiền mặt",
    "Quẹt thẻ thường",
    "Quẹt thẻ Visa",
    "Chuyển khoản",
  ]),
  id: z.string().cuid().optional(), // For edit mode
});

const CreatePaymentVoucherSchema = z.object({
  customerId: z.string().cuid(),
  cashierId: z.string().cuid(),
  totalAmount: z.number().positive(),
  notes: z.string().optional(),
  details: z.array(PaymentVoucherDetailSchema).min(1),
  createdById: z.string().cuid(),
});

const UpdatePaymentVoucherSchema = z.object({
  notes: z.string().optional(),
  details: z.array(PaymentVoucherDetailSchema).min(1),
  updatedById: z.string().cuid(),
  // Admin có thể sửa thêm customerId, totalAmount
});
```

### 3.2 Repository Layer

```typescript
// src/features/payment/repository.ts

async function generatePaymentNumber(
  clinicId: string,
  tx: PrismaTransaction
): Promise<string>;
// Logic: đếm số phiếu trong tháng + retry để tránh duplicate

async function createPaymentVoucher(
  data,
  tx: PrismaTransaction
): Promise<PaymentVoucher>;
// Tạo voucher + details + update ConsultedService.amountPaid

async function updatePaymentVoucher(
  id,
  data,
  tx: PrismaTransaction
): Promise<PaymentVoucher>;
// Hoàn lại tiền cũ + xóa details cũ + tạo mới + update lại amountPaid

async function deletePaymentVoucher(id, tx: PrismaTransaction): Promise<void>;
// Hoàn lại tiền + xóa details + xóa voucher

async function getPaymentVouchers(filters): Promise<{ vouchers; total }>;
// List với pagination, search, date range, clinicId filter

async function getPaymentVoucherById(id): Promise<PaymentVoucher | null>;
// Include customer, cashier, details, consultedService
```

### 3.3 Service Layer

```typescript
// src/features/payment/service.ts

async function createPaymentVoucher(input: CreatePaymentVoucherInput);
// 1. Validate với Zod
// 2. Generate paymentNumber
// 3. Transaction: tạo voucher + details + update amountPaid
// 4. Return voucher với includes

async function updatePaymentVoucher(id, input, userRole);
// 1. Check permission (admin vs non-admin)
// 2. Validate restricted fields cho non-admin
// 3. Transaction: update voucher + recreate details
// 4. Return updated voucher

async function deletePaymentVoucher(id, userRole);
// 1. Check admin only
// 2. Transaction: hoàn lại tiền + xóa voucher
```

### 3.4 API Routes

**GET /api/payment-vouchers**

- Query params: page, pageSize, search, clinicId, startDate, endDate
- Response: { vouchers, total, page, pageSize, totalPages }
- Include: customer, cashier, details với consultedService

**POST /api/payment-vouchers**

- Body: CreatePaymentVoucherInput
- Logic: Gọi service.createPaymentVoucher()
- Response: Created voucher

**GET /api/payment-vouchers/[id]**

- Response: Single voucher với full includes

**PUT /api/payment-vouchers/[id]**

- Headers: x-employee-role
- Body: UpdatePaymentVoucherInput
- Logic:
  - Check role từ header
  - Non-admin: validate isToday + restricted fields
  - Gọi service.updatePaymentVoucher()

**DELETE /api/payment-vouchers/[id]**

- Headers: x-employee-role
- Logic: Check admin only → delete

**GET /api/customers/[id]/outstanding-services**

- Response: { success, data: [...], total, totalOutstanding }
- Logic: Filter ConsultedService với serviceStatus="Đã chốt" và outstanding > 0

---

## 4. Frontend Architecture

### 4.1 Types

```typescript
// src/features/payment/type.ts

type PaymentVoucherWithDetails = {
  id: string;
  paymentNumber: string;
  customerId: string;
  paymentDate: string;
  totalAmount: number;
  cashierId: string;
  notes?: string;
  customer: { id; fullName; customerCode; phone };
  cashier: { id; fullName };
  details: PaymentVoucherDetail[];
};

type PaymentVoucherDetail = {
  id: string;
  consultedServiceId: string;
  amount: number;
  paymentMethod: string;
  consultedService: {
    consultedServiceName: string;
    finalPrice: number;
    dentalService: { name: string };
  };
};

type OutstandingService = {
  id: string;
  consultedServiceName: string;
  finalPrice: number;
  totalPaid: number;
  outstanding: number;
};
```

### 4.2 API Client (React Query)

```typescript
// src/features/payment/api/paymentApi.ts

async function fetchPaymentVouchers(params);
async function fetchPaymentVoucherById(id);
async function createPaymentVoucher(data);
async function updatePaymentVoucher(id, data);
async function deletePaymentVoucher(id);
async function fetchOutstandingServices(customerId);
```

### 4.3 Hooks

**usePaymentVouchers(filters)** - For listing page

- useQuery với pagination, date filter, clinic filter
- Return: { vouchers, isLoading, refetch }

**usePaymentVoucherMutations()** - For CUD operations

- useMutation cho create, update, delete
- Invalidate queries sau khi success

**useOutstandingServices(customerId)** - For form

- useQuery to fetch outstanding services
- Return: { services, isLoading }

### 4.4 Components

#### PaymentVoucherForm

**Props:** mode ("add" | "edit"), initialData, customerId, onFinish, loading

**Logic:**

- Fetch outstanding services nếu mode="add"
- Show existing details nếu mode="edit"
- Table để chọn services + nhập amount + chọn payment method
- Validation: amount > 0 && amount ≤ outstanding
- Calculate totalAmount từ selected services
- Permission check: disable amount input nếu non-admin edit

**Fields:**

- customerId (Select) - disabled trong edit mode
- Table: checkbox | serviceName | outstanding | amount input | payment method select
- notes (TextArea)
- totalAmount (Display only)

#### PaymentVoucherTable

**Props:** data, loading, onAdd, onEdit, onDelete, pagination

**Features:**

- Columns: paymentNumber, customer, paymentDate, totalAmount, cashier, số dịch vụ, actions
- Expandable rows để show chi tiết (details)
- Actions:
  - In (Print receipt)
  - Sửa (Show nếu admin hoặc isToday)
  - Xóa (Show nếu admin only)

#### PaymentVoucherModal

**Props:** open, mode, data, onCancel, onFinish

**Logic:**

- Wrap PaymentVoucherForm
- Handle modal open/close

#### PrintableReceipt

**Props:** voucher, clinicInfo

**Features:**

- Format A4 để in
- Header: clinic info, logo
- Body: payment details table
- Footer: signatures, total

### 4.5 Pages

#### PaymentDailyPage (`/payments/daily`)

**Features:**

- Date picker + navigation (previous/next/today)
- Summary cards: total amount, breakdown by payment method
- PaymentVoucherTable filtered by selected date
- Modal để tạo/sửa payment voucher
- Admin: Tabs để switch giữa các clinic

**Logic:**

```typescript
- fetchPaymentsByDate(date) với clinicId scope
- Calculate summary từ voucher.details (categorizePaymentMethods)
- Handle create/edit/delete with permission check
```

---

## 5. Integration với Customer Feature

### 5.1 Customer Detail Page

**Location:** `src/features/customers/pages/CustomerDetailPage.tsx`

**Integration:**

- Tab "Phiếu thu" hiển thị `customer.paymentVouchers`
- Component: `<PaymentVoucherTable>` từ payment feature
- Hook: `usePayment(customer, setCustomer)` từ `src/features/customers/hooks/usePayment.ts`

**Actions:**

- handleAddPayment: Mở modal với customerId pre-filled
- handleEditPayment: Fetch fresh data + mở modal edit
- handleViewPayment: Show payment detail
- handleDeletePayment: Admin only, với confirmation

### 5.2 usePayment Hook

**Location:** `src/features/customers/hooks/usePayment.ts`

**State:**

```typescript
const [paymentModal, setPaymentModal] = useState({
  open: boolean,
  mode: "add" | "edit" | "view",
  data: PaymentVoucherWithDetails,
});
```

**Functions:**

- `handleAddPayment()` - Open modal với mode="add"
- `handleEditPayment(voucher)` - Fetch fresh data + open modal
- `handleDeletePayment(voucher)` - Admin only, call DELETE API + refresh customer
- `handleFinishPayment(values)` - Call POST/PUT API + refresh customer

**Permission Logic:**

```typescript
if (isEdit && !isAdmin) {
  // Non-admin edit: only send notes + details with paymentMethod changes
  processedValues = { notes, details: [{ id, paymentMethod }] };
} else {
  // Admin or add: send full data
  processedValues = { ...values, customerId, cashierId, totalAmount, details };
}
```

### 5.3 Outstanding Services API

**Endpoint:** `/api/customers/[id]/outstanding-services`

**Used by:**

- PaymentVoucherForm khi mode="add" → Fetch để show available services
- CustomerDetailPage có thể hiển thị tổng outstanding (optional)

**Response:**

```typescript
{
  success: true,
  data: OutstandingService[],
  total: number,
  totalOutstanding: number
}
```

---

## 6. Payment Methods Constants

```typescript
// src/features/payment/constants.ts

export const PAYMENT_METHODS = [
  { value: "Tiền mặt", label: "💵 Tiền mặt", color: "green" },
  { value: "Quẹt thẻ thường", label: "💳 Quẹt thẻ thường", color: "blue" },
  { value: "Quẹt thẻ Visa", label: "💎 Quẹt thẻ Visa", color: "purple" },
  { value: "Chuyển khoản", label: "🏦 Chuyển khoản", color: "orange" },
];

export function categorizePaymentMethods(details: PaymentVoucherDetail[]) {
  return {
    cash: details
      .filter((d) => d.paymentMethod === "Tiền mặt")
      .reduce((sum, d) => sum + d.amount, 0),
    cardNormal: details
      .filter((d) => d.paymentMethod === "Quẹt thẻ thường")
      .reduce((sum, d) => sum + d.amount, 0),
    cardVisa: details
      .filter((d) => d.paymentMethod === "Quẹt thẻ Visa")
      .reduce((sum, d) => sum + d.amount, 0),
    transfer: details
      .filter((d) => d.paymentMethod === "Chuyển khoản")
      .reduce((sum, d) => sum + d.amount, 0),
  };
}
```

---

## 7. Key Implementation Points

### 7.1 Payment Number Generation với Retry

```typescript
let retryCount = 0;
while (retryCount < 10) {
  const count = await prisma.paymentVoucher.count({
    where: {
      paymentNumber: { startsWith: `${prefix}-${yymm}-` },
      createdAt: { gte: startOfMonth, lte: endOfMonth },
    },
  });

  const paymentNumber = `${prefix}-${yymm}-${String(
    count + 1 + retryCount
  ).padStart(4, "0")}`;

  const existing = await prisma.paymentVoucher.findUnique({
    where: { paymentNumber },
  });
  if (!existing) break;

  retryCount++;
}
```

### 7.2 Transaction Pattern cho Create/Update/Delete

```typescript
await prisma.$transaction(async (tx) => {
  // 1. Tạo/update PaymentVoucher
  // 2. Tạo/recreate PaymentVoucherDetail
  // 3. Update ConsultedService.amountPaid (increment/decrement)
});
```

### 7.3 Permission Check Pattern

```typescript
// Backend
const userRole = request.headers.get("x-employee-role");
const isAdmin = userRole === "admin";

if (!isAdmin) {
  const isToday = dayjs(voucher.paymentDate).isSame(dayjs(), "day");
  if (!isToday) throw new Error("Chỉ có thể sửa phiếu thu trong ngày!");

  // Check restricted fields
  const restrictedFields = Object.keys(data).filter(
    (k) => !["notes", "updatedById"].includes(k)
  );
  if (restrictedFields.length > 0)
    throw new Error("Bạn chỉ có thể sửa ghi chú!");
}

// Frontend
const canEdit =
  employeeProfile?.role === "admin" || isToday(voucher.paymentDate);
const canEditAmounts = employeeProfile?.role === "admin" || mode === "add";
```

### 7.4 Form State Management

```typescript
// PaymentVoucherForm
const [selectedServices, setSelectedServices] = useState([
  { consultedServiceId, serviceName, outstanding, amount, paymentMethod },
]);

// Calculate total
const totalAmount = selectedServices.reduce((sum, s) => sum + s.amount, 0);

// Validation
const isValid = selectedServices.every(
  (s) => s.amount > 0 && s.amount <= s.outstanding
);
```

---

## 8. Checklist để Code lại

### Backend

- [ ] Tạo Zod schemas cho validation
- [ ] Tạo repository functions (generatePaymentNumber, CRUD)
- [ ] Tạo service layer với business logic + permission checks
- [ ] Refactor API routes để dùng service layer
- [ ] Test payment number generation với concurrent requests
- [ ] Test transaction rollback khi có lỗi

### Frontend

- [ ] Tạo types cho PaymentVoucher, Detail, OutstandingService
- [ ] Tạo API client functions
- [ ] Tạo React Query hooks (usePaymentVouchers, useMutations, useOutstandingServices)
- [ ] Refactor PaymentVoucherForm với permission logic rõ ràng
- [ ] Refactor PaymentVoucherTable với expandable rows
- [ ] Refactor PaymentDailyPage với date navigation
- [ ] Test permission logic (admin vs non-admin, today vs past)

### Integration

- [ ] Test flow: Customer detail → Add payment → Refresh customer data
- [ ] Test flow: Edit payment trong ngày (non-admin)
- [ ] Test flow: Admin edit/delete bất kỳ payment nào
- [ ] Test outstanding services API với edge cases (no outstanding, partial payment)

### Edge Cases

- [ ] Concurrent payment creation với cùng customer
- [ ] Payment number collision handling
- [ ] Transaction rollback khi update ConsultedService.amountPaid fail
- [ ] Validation: amount > outstanding
- [ ] Non-admin cố sửa payment của ngày khác
- [ ] Delete payment → verify amountPaid được hoàn lại đúng

---

## 9. Flows Diagram

### Create Payment Flow

```
Customer Detail → Click "Tạo phiếu thu" →
Fetch outstanding services →
User chọn services + nhập amount + chọn payment method →
Validate (amount <= outstanding) →
Submit →
Backend: Generate payment number + Transaction (create voucher + details + update amountPaid) →
Success → Refresh customer data
```

### Edit Payment Flow (Non-admin, Today's Voucher)

```
Customer Detail → Click "Sửa" on today's voucher →
Fetch fresh voucher data →
Form shows: services (disabled), amounts (disabled), payment methods (editable), notes (editable) →
User chỉ sửa payment methods hoặc notes →
Submit →
Backend: Check isAdmin + isToday + validate restricted fields →
Transaction (update voucher + recreate details) →
Success
```

### Delete Payment Flow (Admin Only)

```
Admin → Click "Xóa" →
Confirmation →
Backend: Check isAdmin →
Transaction (decrement amountPaid + delete details + delete voucher) →
Success → Refresh data
```

---

**Tổng kết:** Feature payment là master-detail pattern với permission phức tạp (admin vs non-admin, today vs past). Key points: payment number generation với retry, transaction để đảm bảo consistency với ConsultedService.amountPaid, và form state management cho việc chọn services + nhập amounts. Integration với customer feature qua hook usePayment và outstanding services API.
