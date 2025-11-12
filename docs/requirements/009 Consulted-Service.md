# 🧩 Requirements: Consulted Service Management System

> **📋 STATUS: 🔄 IN PROGRESS** - Backend + Frontend implementation needed  
> **🔗 Implementation**: `src/features/consulted-services/`  
> **🔧 Last Updated**: 2025-11-05 - Streamlined version

## 📊 Tham khảo

- Prisma Model: `prisma/schema.prisma` → ConsultedService
- Old Spec: `docs/Dự án cũ/09. consulted-service/consulted-service-old-codex.md`
- Related: `008 Appointment.md`, `007 Customer.md`, `006 Dental Service.md`

## 🎯 Mục Tiêu

- Ghi nhận dịch vụ tư vấn cho khách (gắn lịch hẹn đã check-in)
- Quản lý giá, số lượng, công nợ, vị trí răng, nhân sự (bác sĩ tư vấn/điều trị/sale)
- Workflow chốt dịch vụ để cố định giá trị cho tài chính/điều trị
- Daily View + Customer Detail integration

---

## 🎲 Decision Log

### Database & Business Rules

- ✅ **Appointment Dependency**: Tạo service yêu cầu khách đã check-in hôm nay (appointmentId required)
- ✅ **Denormalized Data**: Sao chép `consultedServiceName`, `consultedServiceUnit`, `price` từ DentalService tại thời điểm tạo
- ✅ **Pricing Logic**:
  - `price`: Giá gốc (copy từ DentalService)
  - `preferentialPrice`: Giá ưu đãi/đơn vị
    - Default = `price`
    - Validation: **0 (miễn phí)** HOẶC **[minPrice, price]**
      - Hợp lệ: `preferentialPrice === 0` HOẶC `minPrice <= preferentialPrice <= price`
      - Không hợp lệ: `0 < preferentialPrice < minPrice` (VD: nhập 1, 10, 499 khi minPrice=500)
  - `finalPrice = preferentialPrice * quantity` (realtime)
  - **`debt` Logic (QUAN TRỌNG)**:
    - **Chưa chốt**: `debt = 0` (chưa phát sinh nghiệp vụ tài chính)
    - **Đã chốt**: `debt = finalPrice - amountPaid` (phát sinh công nợ thực tế)
- ✅ **Status Fields**:
  - `serviceStatus`: "Chưa chốt" | "Đã chốt" (workflow driven)
  - `treatmentStatus`: "Chưa điều trị" | "Đang điều trị" | "Hoàn thành" (từ TreatmentLog)

### Repository Pattern

```typescript
// Complex + Server Fields
type ConsultedServiceCreateInput = CreateConsultedServiceRequest & {
  createdById: string;
  updatedById: string;
  appointmentId: string; // từ check-in lookup
};
```

### Permission Rules

**Quyền dựa trên: Service Status + Timeline (33d) + Role + Clinic**

#### CREATE

- Employee/Admin: Tạo cho clinic của mình
- **Ràng buộc**: Khách phải check-in hôm nay (frontend disable + backend 400)

#### UPDATE

| Service Status | Employee                                                | Admin         |
| -------------- | ------------------------------------------------------- | ------------- |
| Chưa chốt      | ✅ Sửa tất cả                                           | ✅ Sửa tất cả |
| Đã chốt <33d   | ⚠️ Chỉ sửa nhân sự (3 fields: consulting/treating/sale) | ✅ Sửa tất cả |
| Đã chốt >33d   | ❌ Không sửa                                            | ✅ Sửa tất cả |

#### DELETE

| Service Status | Employee | Admin              |
| -------------- | -------- | ------------------ |
| Chưa chốt      | ✅       | ✅                 |
| Đã chốt        | ❌       | ✅ (có warning UI) |

#### CONFIRM

- Employee/Admin: Chốt service "Chưa chốt" → Set `serviceStatus = "Đã chốt"`, `serviceConfirmDate = now()`
- Validate: Không chốt lại service đã chốt → 400

### Architecture

- ✅ **Hybrid**: GET qua API Routes + Mutations qua Server Actions
- ✅ **Modal Pattern**: 2 modal riêng biệt
  - `CreateConsultedServiceModal`: Form đơn giản, validation strict (no past date)
  - `UpdateConsultedServiceModal`: Form phức tạp, có admin section + metadata
  - Clear separation (giống Appointment pattern)
- ✅ **Tooth Selector**: Separate modal (`ToothSelectorModal` - reuse từ old project)
- ❌ **No Cross-Clinic**: Service thuộc 1 clinic cố định

---

## 1. ➕ Tạo Dịch Vụ Tư Vấn

### Permissions

- Employee: Clinic của mình + khách đã check-in
- Admin: Clinic đang chọn + khách đã check-in
- Frontend: Disable button nếu chưa check-in + Alert warning
- Backend: Validate appointment check-in → 400 với `{ needsCheckin: true }`

### UI/UX

**Component**: `CreateConsultedServiceModal` (85% mobile, 65% desktop)

**Form Layout**:

```
Hàng 1: [* Dịch vụ (Select)                    ] [Đơn vị (readonly)               ]
Hàng 2: [Vị trí răng: Button "Chọn vị trí răng (0)" - counter động               ]
Hàng 3: [Đơn giá (VND) (readonly)              ] [Giá ưu đãi (VND)                ]
        [Số lượng (auto nếu Răng)              ] [Thành tiền (VND) (readonly)     ]
Hàng 4: [Bác sĩ tư vấn (Select)                ] [Sale tư vấn (Select)            ]
        [Bác sĩ điều trị (Select)                                                  ]
Hàng 5: [Ghi chú tình trạng (Textarea)                                            ]
```

**Notes**:

- "\* Dịch vụ": required với red asterisk, Select từ cached master data
- "Đơn vị": readonly, auto-fill từ DentalService.unit
- "Vị trí răng": Button với counter động "(0)" → "(2)" khi chọn 2 răng
- "Đơn giá", "Thành tiền": readonly, auto-fill/calculate, format VND
- "Số lượng": disabled và auto = toothPositions.length nếu unit là "Răng"

### Validation

**Required**:

- `customerId`: UUID (auto-filled từ context, hidden)
- `dentalServiceId`: UUID (Select từ cached master data)
  - Hook: `useDentalServices()` (staleTime: Infinity - cached toàn bộ)
  - **No search/debounce** - filter client-side (AntD Select filterOption)
  - Placeholder: "Chọn dịch vụ"
  - Display: `"{name}"`
  - Auto-fill khi chọn:
    - `consultedServiceName` → hidden
    - `consultedServiceUnit` → field "Đơn vị" (readonly)
    - `price` → field "Đơn giá" (readonly, format VND)
    - `preferentialPrice` → field "Giá ưu đãi" (editable, default = price)
- `clinicId`: UUID (auto-filled, hidden)
- `quantity`: Int >= 1
  - **Logic động**:
    - Nếu `unit === "Răng"` → disabled, auto = `toothPositions.length`
    - Nếu `unit !== "Răng"` → editable, default: 1, min: 1
- `preferentialPrice`: Int (editable)
  - Default: `price` (từ DentalService)
  - **Validation**: `preferentialPrice === 0` HOẶC `minPrice <= preferentialPrice <= price`
    - ✅ **0**: Miễn phí (luôn hợp lệ)
    - ✅ **minPrice → price**: Trong khoảng cho phép
    - ❌ **1 → (minPrice-1)**: Không hợp lệ (giữa 0 và minPrice)
  - Example: minPrice=500, price=1000
    - ✅ 0 (miễn phí), 500-1000 (hợp lệ)
    - ❌ 1, 10, 499 (không hợp lệ)

**Conditional Required**:

- `toothPositions`: String[] (Button "Chọn vị trí răng (0)")
  - **Bắt buộc nếu** `unit === "Răng"` → validation error nếu empty
  - **Optional** nếu `unit !== "Răng"`
  - Click button → mở `ToothSelectorModal`
  - Hiển thị counter: "(2)" khi có 2 răng được chọn
  - Khi chọn răng → auto update `quantity = toothPositions.length` (nếu unit là Răng)
  - Không hiển thị tags trong form (khác dự án mới)

**Optional**:

- `consultingDoctorId`, `consultingSaleId`, `treatingDoctorId`: UUID
  - Placeholder: "Chọn bác sĩ tư vấn", "Chọn sale tư vấn", "Chọn bác sĩ điều trị"
  - Hook: `useWorkingEmployees({ clinicId })`
  - Display: `"{fullName}"`
- `specificStatus`: String (textarea, placeholder: "Ghi chú của bác sĩ về tình trạng răng...")

**Display-Only (Readonly)**:

- `consultedServiceUnit`: String (field "Đơn vị", auto-fill từ DentalService)
- `price`: Int (field "Đơn giá (VND)", auto-fill từ DentalService, format VND, dùng làm max cho preferentialPrice)
- `finalPrice`: Int (field "Thành tiền (VND)", realtime = `preferentialPrice * quantity`, format VND)

**Hidden (Backend lookup)**:

- `minPrice`: Int (từ DentalService.minPrice, dùng để validate preferentialPrice, nếu null → min = 0)

**Auto/Hidden**:

- `appointmentId`: Backend lookup (today check-in)
- `consultedServiceName`: Auto-copy từ DentalService.name
- `debt`: `finalPrice`
- `amountPaid`: 0
- `consultationDate`: now()
- `serviceStatus`: "Chưa chốt"
- `treatmentStatus`: "Chưa điều trị"

### Check-in Requirement Logic

**Frontend**:

- Query appointment hôm nay của khách: `useQuery(['appointment', 'today-checkin', customerId])`
- Disable button "Thêm dịch vụ" nếu `checkInTime === null`
- Hiển thị Alert warning: "Khách chưa check-in hôm nay"

**Backend**:

- Lookup appointment hôm nay có `checkInTime !== null`
- Nếu không có → throw `BadRequestError` với `{ needsCheckin: true }`
- Nếu có → gắn `appointmentId` vào consulted service

---

## 2. ✏️ Cập Nhật Dịch Vụ

### UI/UX

**Component**: `UpdateConsultedServiceModal` (65% viewport width, scrollable)

**Base Form Layout** (giống Create, có enable/disable logic):

```
Hàng 1: [dentalServiceId (disabled nếu đã chốt)] [Đơn vị (readonly)               ]
Hàng 2: [Vị trí răng: Button "Chọn vị trí răng (X)" (disabled nếu đã chốt)        ]
Hàng 3: [Đơn giá (readonly)                     ] [Giá ưu đãi (disabled nếu chốt) ]
        [Số lượng (disabled nếu đã chốt)       ] [Thành tiền (readonly)           ]
Hàng 4: [consultingDoctorId                    ] [consultingSaleId                ]
        [treatingDoctorId                                                          ]
Hàng 5: [specificStatus (Textarea, disabled nếu đã chốt)                          ]
```

**Admin Section** (sau Divider "Chỉnh sửa nâng cao (Admin)"):

```
Hàng 6: [serviceStatus              ] [treatmentStatus                            ]
Hàng 7: [serviceConfirmDate         ] [consultationDate                           ]
Hàng 8: [Metadata Descriptions: createdBy, createdAt, updatedBy, updatedAt (2 cols)]
```

**Field Enable/Disable**: Theo permission matrix (mục Decision Log)

**Scrollable**: Body max-height 60vh with overflow-y auto

**Warning Alerts** (trên form):

- Đã chốt (Employee): Alert warning "Dịch vụ đã chốt - chỉ sửa nhân sự trong 33 ngày"
- Đã chốt >33d (Employee): Alert error "Không thể chỉnh sửa" (all fields disabled)
- Admin: Không warning (full access)

### Validation

**Áp dụng validation rules từ Section 1 (Create)**, với điểm khác biệt:

- **Field enable/disable** theo permission matrix
- **Admin fields** (serviceStatus, treatmentStatus, dates) chỉ Admin mới edit được
- **Backend validation**: Nếu admin set `serviceStatus = "Đã chốt"` → `serviceConfirmDate` required

---

## 3. 🗑️ Xoá Dịch Vụ

### UI/UX

- Button: Delete icon (actions column)
- Popconfirm:
  - Employee (chưa chốt): "Xác nhận xoá?"
  - Admin (đã chốt): "⚠️ Dịch vụ đã chốt! Xóa có thể ảnh hưởng dữ liệu. Chắc chắn?"

### Rules

- Hard delete (no archive)
- Employee: Chặn xóa đã chốt → 403
- Admin: Xóa được tất cả

---

## 4. ✅ Chốt Dịch Vụ

### UI/UX

- Button: "Chốt dịch vụ" (primary, hiển thị khi `serviceStatus !== "Đã chốt"`)
- Popconfirm: "Xác nhận chốt? Sau khi chốt, giá trị sẽ được cố định"

### Business Logic

- Set `serviceStatus = "Đã chốt"`
- Set `serviceConfirmDate = now()`
- **Calculate debt**: `debt = finalPrice - amountPaid` (chỉ khi chốt mới phát sinh công nợ)
- Validate: Đã chốt rồi → 400

### Implementation

**Server Action**: `confirmConsultedServiceAction(id: string)`

- Input: `id` (consulted service UUID)
- Process: Update status + set confirm date
- Return: Updated ConsultedService object
- Error: 400 nếu đã chốt, 404 nếu không tìm thấy, 403 nếi không có quyền

---

## 4.1. 💰 Debt (Công nợ) Logic

### Business Rules

**Debt chỉ được tính khi dịch vụ đã chốt** - đây là quy tắc cốt lõi:

| Trạng thái dịch vụ | Debt Logic                       | Lý do                                                   |
| ------------------ | -------------------------------- | ------------------------------------------------------- |
| **Chưa chốt**      | `debt = 0`                       | Giá có thể thay đổi, chưa phát sinh nghiệp vụ tài chính |
| **Đã chốt**        | `debt = finalPrice - amountPaid` | Giá đã cố định, phát sinh công nợ thực tế               |

### Implementation Flow

```typescript
// 1. CREATE service (chưa chốt)
const createInput = {
  finalPrice: preferentialPrice * quantity,
  debt: 0, // Always 0 for unconfirmed services
  amountPaid: 0,
  serviceStatus: "Chưa chốt",
};

// 2. UPDATE service (chưa chốt)
if (existing.serviceStatus === "Chưa chốt") {
  updateInput.debt = 0; // Keep debt = 0
}

// 3. CONFIRM service (chưa chốt → đã chốt)
if (newStatus === "Đã chốt") {
  updateInput.debt = finalPrice - amountPaid; // Calculate debt
  updateInput.serviceConfirmDate = now();
}

// 4. UPDATE confirmed service (admin only)
if (existing.serviceStatus === "Đã chốt" && priceChanged) {
  updateInput.debt = newFinalPrice - existing.amountPaid; // Recalculate
}
```

### UI Display Rules

- **Daily View**: Không hiển thị cột Debt (focus tổng quan)
- **Customer Detail**: Hiển thị cột "Công nợ"
  - Màu đỏ khi: `serviceStatus === "Đã chốt" && debt > 0`
  - Màu thường khi: `serviceStatus === "Chưa chốt"` hoặc `debt === 0`

### Integration với Payment

```typescript
// Payment system sẽ:
// 1. Query services với debt > 0 và đã chốt
const outstandingServices = await findMany({
  where: {
    serviceStatus: "Đã chốt",
    debt: { gt: 0 },
  },
});

// 2. Update debt sau thanh toán
await update(serviceId, {
  amountPaid: existing.amountPaid + paymentAmount,
  debt: existing.debt - paymentAmount,
});
```

---

## 5. 📊 Daily View

### Structure

```
<PageHeaderWithDateNav />           // Shared component
<ClinicTabs />                      // Admin chọn clinic
<ConsultedServiceStatistics />      // 4 KPI cards
<ConsultedServiceFilters />         // Search + Refresh
<ConsultedServiceTable />           // Data table
```

### Statistics (4 Cards)

| Metric       | Logic                                        |
| ------------ | -------------------------------------------- |
| Tổng dịch vụ | Count all                                    |
| Đã chốt      | Count `serviceStatus = "Đá chốt"`            |
| Chưa chốt    | Count `serviceStatus = "Chưa chốt"`          |
| Tổng giá trị | **Đã chốt / Tổng** (VND format, single line) |

### Filters

- Display: "X dịch vụ tư vấn hôm nay"
- Actions: Button "Xuất Excel" (export daily data)
- **No Search, No Create button** (tạo từ Customer Detail sau check-in)

### Table Columns

| Column          | Width | Sort/Filter | Description                                          |
| --------------- | ----- | ----------- | ---------------------------------------------------- |
| Khách hàng      | 180px | -           | Line 1: Tên (link)<br>Line 2: Mã + Tuổi (text-muted) |
| Dịch vụ         | 200px | ✅ Filter   | `consultedServiceName`                               |
| SL              | 60px  | -           | `quantity`                                           |
| Đơn giá         | 120px | -           | `price` (VND format)                                 |
| Giá ưu đãi      | 120px | -           | `preferentialPrice` (VND format)                     |
| Thành tiền      | 140px | ✅ Sort     | `finalPrice` (VND format)                            |
| Bác sĩ tư vấn   | 140px | ✅ Filter   | `consultingDoctor.fullName`                          |
| Bác sĩ điều trị | 140px | ✅ Filter   | `treatingDoctor.fullName`                            |
| Sale            | 120px | ✅ Filter   | `consultingSale.fullName`                            |
| Trạng thái      | 120px | ✅ Filter   | Tag: Chưa chốt (blue) / Đã chốt (green)              |
| Ngày chốt       | 140px | ✅ Sort     | Date hoặc Button "Chốt" (inline action)              |
| Thao tác        | 120px | -           | Edit \| Delete (fixed="right")                       |

**Notes**:

- **Khách hàng**:
  - Tên: Link → navigate to `/customers/{customerId}` (Customer Detail page)
  - Tuổi: Calculate từ `customer.dateOfBirth` → `{currentYear - birthYear} tuổi`
- **Ngày chốt**:
  - **Đã chốt**: Hiển thị `serviceConfirmDate` (DD/MM/YYYY HH:mm)
  - **Chưa chốt**: Hiển thị Button "Chốt" (dashed, small) - inline action giống check-in của appointment

**Sort/Filter**: Client-side (dữ liệu daily ít)

---

## 6. 👤 Customer Detail Integration

### Tab: "Dịch vụ tư vấn"

**Add Button Logic**:

- Query appointment hôm nay của khách có `checkInTime !== null`
- Button "Thêm dịch vụ tư vấn":
  - **Enabled**: Nếu khách đã check-in hôm nay
  - **Disabled**: Nếu chưa check-in + hiển thị Tooltip "Khách chưa check-in hôm nay"

### Table Columns (khác Daily View)

- **Ẩn cột**: Khách hàng (vì đã trong Customer Detail)
- **Thêm cột**: Ngày tư vấn, Công nợ, Trạng thái điều trị
- **Sort**: `consultationDate desc` (mới nhất trước)

| Column              | Width | Sort/Filter | Description                                                    |
| ------------------- | ----- | ----------- | -------------------------------------------------------------- |
| Ngày tư vấn         | 140px | ✅ Sort     | `consultationDate` (DD/MM/YYYY)                                |
| Dịch vụ             | 200px | ✅ Filter   | `consultedServiceName`                                         |
| SL                  | 60px  | -           | `quantity`                                                     |
| Giá ưu đãi          | 120px | -           | `preferentialPrice` (VND format)                               |
| Thành tiền          | 140px | ✅ Sort     | `finalPrice` (VND format)                                      |
| Công nợ             | 120px | ✅ Sort     | `debt` (VND format, **chỉ red khi đã chốt và > 0**)            |
| Bác sĩ tư vấn       | 140px | ✅ Filter   | `consultingDoctor.fullName`                                    |
| Sale tư vấn         | 120px | ✅ Filter   | `consultingSale.fullName`                                      |
| Bác sĩ điều trị     | 140px | ✅ Filter   | `treatingDoctor.fullName`                                      |
| Trạng thái dịch vụ  | 120px | ✅ Filter   | Tag: Chưa chốt (orange) / Đã chốt (green)                      |
| Trạng thái điều trị | 120px | ✅ Filter   | Tag: Chưa (default) / Đang (processing) / Hoàn thành (success) |
| Ngày chốt           | 140px | ✅ Sort     | Date hoặc Button "Chốt" (inline action)                        |
| Thao tác            | 120px | -           | Edit \| Delete (fixed="right")                                 |

---

## 7. 🦷 Tooth Selector Modal

**Component**: `ToothSelectorModal` (reuse từ old project - attachment)

**Features**:

- 52 răng: 32 vĩnh viễn (R11-R48) + 20 sữa (R51-R85)
- Layout: 2 sections (Vĩnh viễn / Sữa), mỗi section 4 quadrants
- Click răng → toggle select/deselect
- Quadrant buttons: "Hàm trên phải/trái", "Hàm dưới phải/trái"
- Controls: "Chọn tất cả", "Bỏ chọn tất cả"
- Modal props: `{ open, onCancel, value: string[], onChange: (teeth: string[]) => void }`

**Hiển thị trong form**:

- Button "Chọn răng" → mở modal
- Tags với selected teeth → click X để remove individual

---

## 8. 🛠️ Technical Implementation

### API Endpoints & Server Actions

**API Routes (GET only)**:

- `GET /api/v1/consulted-services/daily?date&clinicId` - Daily view data
- `GET /api/v1/consulted-services?customerId` - Customer tab data
- `GET /api/v1/consulted-services/:id` - Detail view

**Server Actions (Mutations)**:

- `createConsultedServiceAction(data)` - Tạo mới
- `updateConsultedServiceAction(id, data)` - Cập nhật
- `deleteConsultedServiceAction(id)` - Xóa (hard delete)
- `confirmConsultedServiceAction(id)` - Chốt service

### Zod Schemas

**Location**: `src/shared/validation/consulted-service.schema.ts`

**3-Layer Pattern**:

1. `ConsultedServiceCommonFieldsSchema` - Base fields (dentalServiceId, quantity, preferentialPrice, toothPositions, nhân sự, specificStatus)
2. `CreateConsultedServiceFormSchema` / `CreateConsultedServiceRequestSchema` - Thêm customerId, clinicId
3. `ConsultedServiceResponseSchema` - Full response với relations (customer, dentalService, doctors, sale)

**Key Validations**:

- `preferentialPrice`: min(0), validate với minPrice/price ở service layer
- `quantity`: min(1), default(1)
- `toothPositions`: array string[], default([])
- **`debt`**: Business rule validation
  - CREATE: Always 0 (chưa chốt)
  - UPDATE: 0 nếu chưa chốt, calculated nếu đã chốt
  - CONFIRM: Calculate từ finalPrice - amountPaid
- Relations: customer, dentalService, consultingDoctor, treatingDoctor, consultingSale (optional)

### Constants

**Location**: `src/features/consulted-services/constants.ts`

- `SERVICE_STATUSES`: Chưa chốt (blue), Đã chốt (green)
- `TREATMENT_STATUSES`: Chưa điều trị (default), Đang điều trị (processing), Hoàn thành (success)
- `EDIT_PERMISSION_DAYS`: 33 ngày
- `CONSULTED_SERVICE_MESSAGES`: Success/error messages cho tất cả operations

### Permissions Helper

**Location**: `src/shared/permissions/consulted-service.permissions.ts`

**Methods**:

- `canEdit(user, service)` → Check role + status + timeline → return { allowed, editableFields }
- `canDelete(user, service)` → Check role + status
- `validateUpdateFields(user, service, fields)` → Throw error nếu edit restricted fields

**Logic**: Admin = full access; Employee = restricted theo status + 33-day timeline

### React Query Caching

**Master Data** (`useDentalServices`):

- staleTime: Infinity
- gcTime: 24h

**Transaction Data** (`useConsultedServices`):

- staleTime: 60s
- gcTime: 5min
- refetchOnWindowFocus: true

**Mutations**: Optimistic updates với rollback on error, invalidate queries on success

---

## 9. 🔗 Integration Points

### With Appointments

- **Dependency**: Check-in required (appointmentId gắn với lịch có checkInTime)
- **Display**: Hiển thị appointment info trong service detail view

### With Customers

- **Tab**: "Dịch vụ tư vấn" trong Customer Detail
- **Add button**: Disable nếu chưa check-in hôm nay
- **Navigation**: Click tên khách → Customer Detail

### With Dental Services

- **Master data**: Sao chép name, unit, price tại thời điểm tạo
- **Search**: Debounce 500ms, min 2 chars
- **Display**: `"{name} - {price} VND/{unit}"`

### With Employees

- **Working employees**: Filter WORKING status, cache 30min
- **3 roles**: consultingDoctor, treatingDoctor, consultingSale
- **Hook**: `useWorkingEmployees({ clinicId })`

### With Treatment Logs (Future)

- **Relationship**: TreatmentLog.consultedServiceId
- **Status update**: Logs cập nhật treatmentStatus

### With Payments (Future)

- **Relationship**: PaymentVoucherDetail.consultedServiceId
- **Update**: Payments cập nhật amountPaid, recalculate debt

---

**End of Requirements** 📋
