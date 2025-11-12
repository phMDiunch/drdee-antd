# 🧩 Requirements: Payment Voucher Management System

> **📋 STATUS: ✅ COMPLETED** - Backend + Frontend implementation completed  
> **🔗 Implementation**: `src/features/payments/`  
> **🔧 Last Updated**: 2025-11-12 - Completed with nested structure pattern

## 📊 Tham khảo

- Prisma Model: `prisma/schema.prisma` → PaymentVoucher, PaymentVoucherDetail
- Old Spec: `docs/Dự án cũ/10. payments/payment-spec.md`, `payment-refactor-requirements.md`
- Related: `009 Consulted-Service.md`, `007 Customer.md`, `008 Appointment.md` (datetime pattern reference)
- Guidelines: `docs/GUIDELINES.md` → Response Schema Nested Structure

## 🎯 Mục Tiêu

- ✅ Thu tiền cho các dịch vụ tư vấn đã chốt (serviceStatus = "Đã chốt")
- ✅ Quản lý phiếu thu: số phiếu tự động, phương thức thanh toán, ghi chú
- ✅ Đồng bộ công nợ với ConsultedService (amountPaid + debt)
- ✅ Daily View + Customer Detail integration
- ✅ In phiếu thu theo mẫu đơn giản
- ✅ Nested structure pattern compliance

---

## 🎲 Decision Log

### Database & Business Rules

- ✅ **Unpaid Service Dependency**: Chỉ thu cho ConsultedService "Đã chốt" và có debt > 0
- ✅ **Payment Number Format**: `{PREFIX}-YYMM-XXXX` (MK-2511-0001)
  - PREFIX: Derived từ clinic.clinicCode (450→MK, 143→TDT, 153→DN)
  - YYMM: Năm tháng (2 chữ số)
  - XXXX: Số thứ tự trong tháng (4 chữ số, 0001-9999)
- ✅ **Debt Synchronization**: Transaction-based với retry logic
  - Tạo phiếu: `ConsultedService.amountPaid += detail.amount`
  - Sửa phiếu: Rollback cũ → Apply mới
  - Xóa phiếu: Rollback tất cả detail amounts
- ✅ **Payment Methods**: "Tiền mặt", "Quẹt thẻ thường", "Quẹt thẻ Visa", "Chuyển khoản"
- ✅ **DateTime Storage**: `paymentDate` sử dụng `@db.Timestamptz` để lưu cả giờ phút và timezone
  - Format hiển thị: `DD/MM/YYYY HH:mm`
  - DatePicker có `showTime={{ format: "HH:mm" }}`
  - Backend convert ISO string → Date object: `new Date(parsed.paymentDate)`

### Repository Pattern

```typescript
// Complex + Server Fields pattern implemented
type PaymentVoucherCreateInput = CreatePaymentVoucherRequest & {
  createdById: string;
  updatedById: string;
  clinicId: string; // từ current user clinic
};
```

### Nested Structure Pattern

✅ **PaymentVoucherResponseSchema** uses nested objects:

```typescript
export const PaymentVoucherResponseSchema = z.object({
  customer: z.object({
    id: z.string(),
    fullName: z.string(),
    code: z.string(),
  }),
  cashier: z.object({
    id: z.string(),
    fullName: z.string(),
  }),
  createdBy: z.object({
    id: z.string(),
    fullName: z.string(),
  }),
  // ... other nested fields
});
```

### Permission Rules

**Quyền dựa trên: Role + Timeline (today) + Clinic**

#### CREATE

- Employee/Admin: Tạo cho clinic của mình
- **Ràng buộc**: Chỉ thu cho services đã chốt có debt > 0

#### UPDATE

| User Type | Condition | Allowed Fields                                                                     |
| --------- | --------- | ---------------------------------------------------------------------------------- |
| Admin     | Always    | ✅ Sửa tất cả (customer, services, amounts, methods, notes, **cashier, datetime**) |
| Non-admin | Today     | ⚠️ Chỉ sửa notes + paymentMethod của details                                       |
| Non-admin | Past      | ❌ Không sửa                                                                       |

**Admin Advanced Edit**: Admin có thể sửa Thu ngân (`cashierId`) và Ngày giờ thu (`paymentDate`) qua section "Chỉnh sửa nâng cao (Admin)" trong UpdateModal. Use case: sửa lại thông tin khi nhập nhầm hoặc điều chỉnh lịch sử.

#### DELETE

| User Type | Permission    |
| --------- | ------------- |
| Admin     | ✅ Xóa tất cả |
| Employee  | ❌ Không xóa  |

#### VIEW

- Employee: Clinic của mình
- Admin: Tất cả clinic

### Architecture

- ✅ **Hybrid**: GET qua API Routes + Mutations qua Server Actions
- ✅ **Modal Pattern**: 1 modal `PaymentVoucherModal` với mode (add/edit)
- ✅ **Outstanding Services**: API riêng `/api/customers/{id}/outstanding-services`
- ✅ **Receipt Printing**: Component `PrintableReceipt` với window.print()
- ❌ **No Cross-Clinic**: Payment thuộc 1 clinic cố định

---

## 1. ➕ Tạo Phiếu Thu

### Permissions

- Employee: Clinic của mình + services đã chốt có debt > 0
- Admin: Clinic đang chọn + services đã chốt có debt > 0
- Frontend: Disable nếu không có outstanding services
- Backend: Validate service đã chốt + debt > 0 → 400 với `{ insufficientDebt: true }`

### UI/UX

**Component**: `PaymentVoucherModal` (80% mobile, 70% desktop)

**Form Layout**:

```
Hàng 1: [* Khách hàng (Select)                           ] [Thu ngân (readonly)                ]
Hàng 2: [Services Table - Chọn dịch vụ để thu tiền                                           ]
Hàng 3: [Ghi chú (Textarea)                                                                   ]
Hàng 4: [                                                 ] [Tổng tiền (readonly, VND)       ]
```

**Outstanding Services Table**:

```
[☑] | Dịch vụ         | Thành tiền | Đã thu  | Còn nợ   | Thu (VND) | Phương thức
[ ] | Nhổ răng khôn   | 500,000   | 200,000 | 300,000  | [input]   | [select]
[☑] | Cạo vôi răng    | 200,000   | 0       | 200,000  | 200,000   | Tiền mặt
```

**Notes**:

- "\* Khách hàng": required với red asterisk, Select từ search API
- "Thu ngân": readonly, display current employee fullName
- Services table: checkbox để chọn, input amount <= outstanding, select payment method
- "Tổng tiền": readonly, auto-calculate từ selected services
- Button "Tạo phiếu thu": enabled khi có ít nhất 1 service selected với amount > 0

### Validation

**Required**:

- `customerId`: UUID (Select search customers)
- `details`: Array length >= 1
  - `consultedServiceId`: UUID (from table selection)
  - `amount`: Int, 1 ≤ amount ≤ outstanding
  - `paymentMethod`: String (enum values)

**Optional**:

- `notes`: String (textarea, placeholder: "Ghi chú thêm về phiếu thu...")

**Auto/Hidden**:

- `paymentNumber`: Auto-generated (backend)
- `paymentDate`: now() - **DateTime @db.Timestamptz** (có giờ phút)
- `totalAmount`: Sum of details amounts
- `cashierId`: Current employee ID
- `clinicId`: Current employee clinic hoặc admin selected clinic
- `createdById`: Current employee ID

### Outstanding Services Logic

**Frontend**:

- Query outstanding services: `useOutstandingServices(customerId)`
- API: `/api/customers/{id}/outstanding-services`
- Hiển thị table với checkbox để chọn services
- Validate amount input: `1 ≤ amount ≤ service.outstanding`

**Backend**:

- Filter: `serviceStatus = "Đã chốt" AND debt > 0`
- Calculate outstanding: `finalPrice - amountPaid`
- Return với service info để hiển thị

---

## 2. ✏️ Cập Nhật Phiếu Thu

### UI/UX

**Component**: `UpdatePaymentVoucherModal` (70% viewport width, scrollable)

**Permission-based Form**:

```
Hàng 1: [Khách hàng (disabled nếi non-admin past)]       [Thu ngân (readonly)                ]
Hàng 2: [Services Table (conditional disable)                                              ]
Hàng 3: [Ghi chú (enabled theo permission)                                                 ]
Hàng 4: [                                               ] [Tổng tiền (readonly)           ]
```

**Metadata Section** (Descriptions, 2 columns):

```
Hàng 5: [Số phiếu (readonly)              ] [Ngày tạo (readonly, DD/MM/YYYY HH:mm)       ]
Hàng 6: [Người tạo (readonly)             ] [Người sửa (readonly)                        ]
Hàng 7: [                                 ] [Ngày sửa (readonly, DD/MM/YYYY HH:mm)       ]
```

**Admin Advanced Edit Section** (Divider "Chỉnh sửa nâng cao (Admin)", chỉ hiển thị cho `role === "admin"`):

```
Hàng 8: [Thu ngân (Select from working employees)] [Ngày giờ thu (DatePicker, showTime, HH:mm)]
```

**DatePicker Configuration**:

- `showTime={{ format: "HH:mm" }}` - cho phép chọn giờ phút
- `format="DD/MM/YYYY HH:mm"` - hiển thị đầy đủ ngày giờ
- Value: ISO string (frontend) → Date object (backend via `new Date()`)

**Field Enable/Disable**: Theo permission matrix

**Warning Alerts** (trên form):

- Past date (Employee): Alert warning "Chỉ sửa ghi chú và phương thức thanh toán"
- Non-admin restrictions: Disable amount inputs và service selection
- Admin: Full access (no warnings), có thể sửa tất cả fields kể cả cashier và datetime

### Validation

**Áp dụng validation rules từ Section 1 (Create)**, với điểm khác biệt:

- **Field enable/disable** theo permission matrix
- **Admin fields** (`cashierId`, `paymentDate`) chỉ hiển thị và validate cho Admin
- **Backend validation**:
  - Non-admin past date chỉ cho phép sửa `notes` và `paymentMethod`
  - Admin có thể update `cashierId` và `paymentDate` (convert ISO string → Date object)
- **DateTime format**: DatePicker với `showTime={{ format: "HH:mm" }}`, format `DD/MM/YYYY HH:mm`

---

## 3. 🗑️ Xóa Phiếu Thu

### UI/UX

- Button: Delete icon (actions column)
- Popconfirm: "⚠️ Xóa phiếu thu sẽ hoàn lại tiền vào công nợ. Chắc chắn?"

### Rules

- Admin only: 403 cho Employee
- Hard delete với rollback debt
- Rollback logic: `ConsultedService.amountPaid -= detail.amount`

---

## 4. 📊 Daily View

### Structure

```
<PageHeaderWithDateNav />           // Shared component
<ClinicTabs />                      // Admin chọn clinic
<PaymentStatistics />               // 4 KPI cards
<PaymentFilters />                  // Search + Export + Refresh
<PaymentTable />                    // Data table với expandable rows
```

### Statistics (1 Main Card + 4 Method Cards)

**Main Card (Large)**:

| Metric        | Logic                                      |
| ------------- | ------------------------------------------ |
| Tổng tiền thu | Sum totalAmount (VND format) + count phiếu |

**Method Cards (Small)**:

| Metric          | Logic                                               |
| --------------- | --------------------------------------------------- |
| 💵 Tiền mặt     | Sum details where paymentMethod = "Tiền mặt"        |
| 💳 Thẻ thường   | Sum details where paymentMethod = "Quẹt thẻ thường" |
| 💎 Thẻ Visa     | Sum details where paymentMethod = "Quẹt thẻ Visa"   |
| 🏦 Chuyển khoản | Sum details where paymentMethod = "Chuyển khoản"    |

### Filters

- Display: "X phiếu thu hôm nay"
- Actions: Button "Xuất Excel" (export daily data), Button "Tạo phiếu thu"

### Table Columns

| Column     | Width | Sort/Filter | Description                                        |
| ---------- | ----- | ----------- | -------------------------------------------------- |
| Khách hàng | 160px | ✅ Filter   | Line 1: Tên (link)<br>Line 2: Mã (text-muted)      |
| Số phiếu   | 130px | ✅ Sort     | `paymentNumber` (MK-2511-0001)                     |
| Ngày thu   | 140px | ✅ Sort     | `paymentDate` (**DD/MM/YYYY HH:mm** - có giờ phút) |
| Tổng tiền  | 110px | ✅ Sort     | `totalAmount` (VND format)                         |
| Thu ngân   | 120px | ✅ Filter   | `cashier.fullName`                                 |
| Số DV      | 60px  | -           | Count details (Tag)                                |
| Actions    | 110px | -           | In / Sửa / Xóa (3 buttons)                         |

**Width Optimization**:

- **Customer Detail View**: 130+140+110+120+60+110 = **670px** (no scroll needed!)
- **Daily View**: 160+130+110+120+60+110 = **690px** (minimal scroll)

**Table Configuration**:

- `size="small"` - Compact display cho expandable details
- `scroll={{ x: 900 }}` - Tối ưu để hạn chế scroll
- `pagination={false}` - No pagination trong Customer Detail view
- Action buttons: Default style (không dùng `type="link"`) với `Space size="small"`

**Expandable Rows**: Click row để expand hiển thị details table

**Details Table** (trong expand):

| Column      | Description                                |
| ----------- | ------------------------------------------ |
| Dịch vụ     | `consultedService.consultedServiceName`    |
| Giá dịch vụ | `consultedService.finalPrice` (VND format) |
| Số tiền     | `amount` (VND format)                      |
| Phương thức | `paymentMethod` (text tag)                 |

### Payment Method Icons

```typescript
const PAYMENT_METHOD_ICONS = {
  "Tiền mặt": "💵",
  "Quẹt thẻ thường": "💳",
  "Quẹt thẻ Visa": "💎",
  "Chuyển khoản": "🏦",
};
```

---

## 5. 🖨️ In Phiếu Thu

### UI/UX

**Component**: `PrintableReceipt` (A4 format)

**Receipt Layout**:

```
PHÒNG KHÁM NHA KHOA [CLINIC_NAME]
Địa chỉ: [CLINIC_ADDRESS] | ĐT: [CLINIC_PHONE]
==========================================
           PHIẾU THU TIỀN
           Số: [PAYMENT_NUMBER]
==========================================
Khách hàng: [CUSTOMER_NAME]
Mã KH: [CUSTOMER_CODE]
Thu ngân: [CASHIER_NAME]
Ngày lập phiếu: [PAYMENT_DATE - DD/MM/YYYY HH:mm]
------------------------------------------
STT | Dịch vụ        | Tiền thu   | PT
------------------------------------------
1   | Nhổ răng khôn  | 300,000    | TM
2   | Cạo vôi răng   | 200,000    | CK
------------------------------------------
              TỔNG CỘNG: 500,000 VNĐ
==========================================
Ghi chú: [NOTES]

Thu ngân               Khách hàng
[CASHIER_SIGNATURE]    [CUSTOMER_SIGNATURE]
```

**Features**:

- Auto-print khi mở (window.print())
- CSS print media queries
- Responsive cho khổ A4
- No header/footer browser elements

---

## 6. 🔄 Debt Synchronization Logic

### Business Rules

**Debt sync chỉ với ConsultedService đã chốt** - quy tắc cốt lõi:

| Action     | ConsultedService Update       | Debt Logic                       |
| ---------- | ----------------------------- | -------------------------------- |
| **CREATE** | `amountPaid += detail.amount` | `debt = finalPrice - amountPaid` |
| **UPDATE** | Rollback cũ → Apply mới       | Recalculate debt                 |
| **DELETE** | `amountPaid -= detail.amount` | `debt = finalPrice - amountPaid` |

### Implementation Flow

```typescript
// 1. CREATE payment voucher
await prisma.$transaction(async (tx) => {
  // Generate unique payment number
  const paymentNumber = await generatePaymentNumber(clinicId, tx);

  // Create voucher
  const voucher = await tx.paymentVoucher.create({ ... });

  // Create details + update consulted services
  for (const detail of details) {
    await tx.paymentVoucherDetail.create({ ... });
    await tx.consultedService.update({
      where: { id: detail.consultedServiceId },
      data: {
        amountPaid: { increment: detail.amount },
        debt: { decrement: detail.amount }
      }
    });
  }
});

// 2. UPDATE payment voucher
await prisma.$transaction(async (tx) => {
  // Rollback old amounts
  const oldDetails = await tx.paymentVoucherDetail.findMany({ ... });
  for (const detail of oldDetails) {
    await tx.consultedService.update({
      where: { id: detail.consultedServiceId },
      data: {
        amountPaid: { decrement: detail.amount },
        debt: { increment: detail.amount }
      }
    });
  }

  // Delete old details
  await tx.paymentVoucherDetail.deleteMany({ ... });

  // Update voucher + create new details (same as CREATE)
});

// 3. DELETE payment voucher
await prisma.$transaction(async (tx) => {
  // Rollback all amounts
  const details = await tx.paymentVoucherDetail.findMany({ ... });
  for (const detail of details) {
    await tx.consultedService.update({
      where: { id: detail.consultedServiceId },
      data: {
        amountPaid: { decrement: detail.amount },
        debt: { increment: detail.amount }
      }
    });
  }

  // Delete details + voucher
  await tx.paymentVoucherDetail.deleteMany({ ... });
  await tx.paymentVoucher.delete({ ... });
});
```

---

## 7. 🏥 Customer Detail Integration

### Customer Detail Tab

**Location**: Customer Detail page → Tab "Phiếu thu"

**Features**:

- List payment vouchers của customer
- Button "Tạo phiếu thu" (nếu có outstanding services)
- Table columns: Số phiếu, Ngày thu, Tổng tiền, Actions
- Modal integration với customerId pre-filled

### Outstanding Services Display

**Location**: Customer Detail → Summary cards hoặc tab riêng

**Features**:

- Tổng công nợ: Sum debt của các services đã chốt
- Số services chưa thanh toán: Count services có debt > 0
- Link "Thu tiền" mở modal payment

---

## 8. 🎨 Payment Method Categorization

### Constants

```typescript
export const PAYMENT_METHODS = [
  { value: "Tiền mặt", label: "💵 Tiền mặt", color: "green" },
  { value: "Quẹt thẻ thường", label: "💳 Quẹt thẻ thường", color: "blue" },
  { value: "Quẹt thẻ Visa", label: "💎 Quẹt thẻ Visa", color: "purple" },
  { value: "Chuyển khoản", label: "🏦 Chuyển khoản", color: "orange" },
];
```

### Statistics Helper

```typescript
export function categorizePaymentMethods(details: PaymentVoucherDetail[]) {
  const result = PAYMENT_METHODS.reduce((acc, method) => {
    acc[method.value] = {
      amount: 0,
      count: 0,
      label: method.label,
      color: method.color,
    };
    return acc;
  }, {} as PaymentMethodStats);

  details.forEach((detail) => {
    if (result[detail.paymentMethod]) {
      result[detail.paymentMethod].amount += detail.amount;
      result[detail.paymentMethod].count += 1;
    }
  });

  return result;
}
```

---

## 9. 🔢 Payment Number Generation

### Format Rules

- **Pattern**: `{PREFIX}-{YYMM}-{XXXX}`
- **PREFIX Mapping**:
  ```typescript
  const CLINIC_PREFIX_MAP = {
    "450MK": "MK",
    "143TDT": "TDT",
    "153DN": "DN",
  };
  // Fallback: "XX"
  ```
- **YYMM**: Current year/month (2511 = Nov 2025)
- **XXXX**: Sequential number in month (0001-9999)

### Implementation

```typescript
async function generatePaymentNumber(
  clinicId: string,
  tx: PrismaTransaction
): Promise<string> {
  const prefix = CLINIC_PREFIX_MAP[clinicId] || "XX";
  const yymm = dayjs().format("YYMM");

  let retryCount = 0;
  while (retryCount < 10) {
    try {
      const count = await tx.paymentVoucher.count({
        where: {
          paymentNumber: {
            startsWith: `${prefix}-${yymm}-`,
          },
        },
      });

      const sequence = (count + 1).toString().padStart(4, "0");
      const paymentNumber = `${prefix}-${yymm}-${sequence}`;

      // Test uniqueness với dummy create
      await tx.paymentVoucher.create({
        data: { paymentNumber /* other required fields */ },
      });

      return paymentNumber;
    } catch (error) {
      if (error.code === "P2002") {
        // Unique constraint
        retryCount++;
        continue;
      }
      throw error;
    }
  }

  throw new Error("Could not generate unique payment number after 10 retries");
}
```

---

## 10. 📋 Implementation Checklist

### Backend

- [x] **Zod Schemas**: CreatePaymentVoucherRequestSchema, UpdatePaymentVoucherRequestSchema (có `cashierId`, `paymentDate` optional), PaymentVoucherResponseSchema
- [x] **Repository Layer**: generatePaymentNumber, createVoucher, updateVoucher (hỗ trợ `cashierId` và `paymentDate`), deleteVoucher, listVouchers
- [x] **Service Layer**: Business logic + permission checks + debt synchronization + **timezone handling** (ISO string → Date)
- [x] **Server Actions**: createPaymentVoucherAction, updatePaymentVoucherAction, deletePaymentVoucherAction
- [x] **API Routes**: GET /api/payment-vouchers, GET /api/payment-vouchers/[id], GET /api/customers/[id]/outstanding-services
- [x] **Transaction Logic**: Đảm bảo atomicity cho debt sync

### Frontend

- [x] **Types**: PaymentVoucherResponse, PaymentVoucherDetail, OutstandingService, PaymentMethodStats
- [x] **API Client**: fetchPaymentVouchers, fetchOutstandingServices (API Routes)
- [x] **Hooks**: usePaymentVouchers, useOutstandingServices, usePaymentVoucherMutations
- [x] **Components**: CreatePaymentVoucherModal, **UpdatePaymentVoucherModal** (có metadata + admin advanced edit), PaymentVoucherTable, PaymentStatistics, PrintableReceipt
- [x] **Pages**: PaymentDailyView
- [x] **Customer Integration**: PaymentsTab trong Customer Detail

### Testing

- [x] **Payment Number Generation**: Concurrent requests + uniqueness
- [x] **Debt Synchronization**: Create/Update/Delete scenarios
- [x] **Permission Logic**: Admin vs Employee, today vs past
- [x] **Outstanding Services**: Correct filtering + calculation
- [x] **Transaction Rollback**: Error scenarios
- [x] **Timezone Handling**: ISO string → Date conversion, Timestamptz storage
- [x] **Admin Advanced Edit**: cashierId và paymentDate update với permission check

---

## 11. 🚀 Performance Considerations

### Database Indexes

```prisma
model PaymentVoucher {
  // ... fields ...
  paymentDate DateTime @default(now()) @db.Timestamptz // Ngày và giờ thu tiền (có timezone)

  @@index([clinicId, paymentDate]) // Daily view
  @@index([paymentNumber])         // Search by number
  @@index([customerId])            // Customer detail
}

model PaymentVoucherDetail {
  // ... fields ...

  @@index([consultedServiceId])    // Debt sync lookup
}
```

### Caching Strategy

| Data Type            | Cache Duration | Reason                             |
| -------------------- | -------------- | ---------------------------------- |
| Payment Vouchers     | No cache       | Real-time financial data           |
| Outstanding Services | No cache       | Real-time debt calculation         |
| Customer Search      | 5 min          | Master data, less frequent changes |

### Query Optimization

- **Daily View**: Single query với include customer, cashier, details
- **Outstanding Services**: Optimized với computed debt field
- **Payment Statistics**: Calculate từ fetched data (client-side)
