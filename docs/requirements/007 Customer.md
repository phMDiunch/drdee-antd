# 🧩 Requirements: Customer Management System

> **✅ STATUS: COMPLETED** - Implementation finished on October 27, 2025  
> **📄 Feature Documentation**: `docs/features/007_Customer.md` (placeholder)  
> **🔗 Implementation**: `src/features/customers/`, `src/app/(private)/customers/`, `src/app/api/v1/customers/`

## 📊 Tham khảo

- Prisma Model Customer: `prisma/schema.prisma`
- Validation Schema: `src/shared/validation/customer.schema.ts`
- Constants: `src/features/customers/constants.ts`

## 🎯 Mục Tiêu & Phạm Vi

- ✅ Chuẩn hóa quy trình tạo khách hàng (Create): trường, validation, sinh mã `customerCode` trong transaction
- ✅ Xác lập phụ thuộc SĐT ↔ Người liên hệ chính: realtime lookup (10 số), search theo tên/SĐT
- ✅ Chuẩn hóa Nguồn khách (source/sourceNotes):
  - `employee_referral`: chọn từ nhân viên đang làm việc (WORKING), client-side filtering; `sourceNotes` lưu `employeeId`
  - `customer_referral`: chọn từ khách hàng (không bắt buộc có SĐT, global search); `sourceNotes` lưu `customerId`
- ✅ Cung cấp Daily View (hôm nay) với KPI statistics theo dịch vụ quan tâm
- ✅ Cung cấp List View (toàn bộ) có phân trang, filters, sorting server-side
- ✅ Định nghĩa hợp đồng API (Zod) thống nhất FE/BE, gồm endpoints: list, daily, search
- ✅ Quyền truy cập & đa‑clinic: filter theo clinic user; admin chọn clinic qua tabs

---

## 🎲 Decision Log (Chuẩn Hoá)

### Database & Validation

- ✅ **Unique toàn hệ thống**: `phone`, `email` (nếu có)
- ✅ **Logic Phone ↔ Primary Contact**:
  - Nếu KH không có `phone` thì bắt buộc `primaryContactId` + `primaryContactRole`
  - Primary contact phải là Customer có `phone` hợp lệ
- ✅ **clinicId**: bắt buộc ở Zod/API; enforce ở tầng service
- ✅ **serviceOfInterest**: constant (single select từ `SERVICES_OF_INTEREST`), không nhập tự do
- ✅ **occupation**: hỗ trợ nhập tự do hoặc chọn từ 205 nghề nghiệp gợi ý (`OCCUPATIONS`)
- ✅ **customerCode**: `${prefix}-${YY}${MM}-${NNN}`; sinh trong transaction theo `clinicId`/prefix
  - Prefix mapping: `{ MK, TDT, DN }` theo clinic
  - Sequential counter reset theo tháng

### Source & SourceNotes Implementation

- ✅ **Nguồn khách hàng**: 13 loại được định nghĩa trong `CUSTOMER_SOURCES`
  - Mỗi source có `noteType` quyết định UI/validation của `sourceNotes`
  - NoteType: `none`, `text_input_optional`, `text_input_required`, `employee_search`, `customer_search`
- ✅ **employee_referral** (Nhân viên giới thiệu):
  - `sourceNotes` lưu `employeeId`
  - Sử dụng `useWorkingEmployees()` hook: tải tất cả nhân viên WORKING, cache 30min, filter client-side instant
  - Không cần API endpoint riêng cho search employee
  - Lọc theo `clinicId` (nhân viên: clinic của mình; admin: clinic đang chọn)
- ✅ **customer_referral** (Khách cũ giới thiệu):
  - `sourceNotes` lưu `customerId`
  - Search API với debounce 500ms; gọi khi `q.length >= 2`
  - Hiển thị tất cả khách (không bắt buộc có SĐT), không giới hạn theo clinic (global search)

---

## 1. ➕ Tạo Khách Hàng (Create)

### 🔐 Permissions

- **Admin** và **Back office**: có thể tạo khách hàng cho bất kỳ clinic nào
- **Employee**: chỉ tạo được khách hàng cho clinic của mình
- Kiểm tra quyền ở cả client và server

### 🎨 UI/UX

- Modal responsive (≈ 85% mobile, 65% desktop)
- Component: `CreateCustomerModal.tsx`
- Real-time validation với React Hook Form + Zod resolver
- Submit button disabled khi đang gửi; dedupe lỗi ~2.5s
- Success notification + auto close modal + invalidate queries

### 📝 Form Layout (5 hàng)

```
Hàng 1: [fullName            ] [dob                      ] [gender              ]
Hàng 2: [phone               ] [primaryContactId         ] [primaryContactRole  ]
Hàng 3: [address             ] [city                     ] [district            ]
Hàng 4: [email               ] [occupation               ] [clinicId            ]
Hàng 5: [serviceOfInterest   ] [source                   ] [sourceNotes         ]
```

### ✅ Validation Rules

#### Required Fields

- `fullName`: 2–200 ký tự
- `dob`: Date (DatePicker, format YYYY-MM-DD)
- `gender`: "male" | "female" (Radio)
- `address`: min 1 ký tự
- `city`: required (Select từ provinces data)
- `district`: required khi có city (Select động theo city)
- `clinicId`: required (admin chọn từ tabs/select; employee lấy từ session)
- `serviceOfInterest`: required (Select từ `SERVICES_OF_INTEREST` - 10 options)
- `source`: required (Select từ `CUSTOMER_SOURCES` - 13 options)

#### Conditional Fields

- **Phone Logic**:
  - Nếu có `phone`: phải là 10 số VN format, unique toàn hệ thống
  - Nếu không có `phone`: bắt buộc `primaryContactId` + `primaryContactRole`
- **Primary Contact Fields**:
  - `primaryContactId`: UUID, chỉ chọn Customer có phone hợp lệ
  - `primaryContactRole`: required khi có primaryContactId (Select từ `PRIMARY_CONTACT_ROLES` - 11 options)

#### Optional Fields

- `email`: unique nếu có, email format validation
- `occupation`: text input hoặc chọn từ `OCCUPATIONS` (205 options)
- `sourceNotes`:
  - Required/Optional/Hidden tùy theo `noteType` của source đã chọn
  - Với `employee_referral`: lưu `employeeId` (Select từ working employees)
  - Với `customer_referral`: lưu `customerId` (Search Select global)

### 🔄 Phone ↔ Primary Contact Logic (Realtime)

#### Debounce & Trigger Rules

- **Phone lookup**:
  - Trigger khi `phone.length === 10`
  - Debounce 500ms
  - Auto-cancel khi clear phone
  - Hook: `useLookupCustomerPhone(phone)`
- **Primary Contact search**:
  - Trigger khi `q.length >= 2`
  - Debounce 500ms
  - Filter theo clinic (admin: clinic đang chọn; employee: clinic của mình)
  - Hook: `useCustomersSearch({ q, requirePhone: true })`

#### Phone Duplicate Warning

Khi nhập phone trùng với khách hàng đã có:

- Hiển thị cảnh báo dưới ô SĐT: `"SĐT đã tồn tại: <customerCode> - <fullName>"`
- Nút action: `"Chọn người này làm người liên hệ chính"` (button kiểu link nhỏ)
- **Behavior khi click**:
  - Clear giá trị ô phone (tránh trùng)
  - Set `primaryContactId = <id tìm thấy>`
  - KHÔNG auto-fill `primaryContactRole` (user phải chọn thủ công)
  - Store phoneDup để giữ option trong dropdown sau khi clear phone

#### Primary Contact Search

- Input tên/SĐT để search
- Chỉ hiển thị khách hàng có SĐT (server filter)
- Hiển thị format: `{fullName} — {phone}`
- Khi chọn: KHÔNG tự động xoá ô phone (user quyết định)
- Options merge phoneDup vào list nếu có

### 🎯 Acceptance Criteria (Create)

✅ Given form hợp lệ, When submit  
→ Then trả Customer có `customerCode` đúng format, `clinicId` bắt buộc

✅ Given thiếu `phone` và thiếu `primaryContactId`/`primaryContactRole`  
→ Then hiển thị lỗi validation rõ ràng ở cả 2 field

✅ Given nhập đủ 10 số SĐT trùng DB  
→ Then hiển thị cảnh báo với nút "Chọn người này làm NLH chính"

✅ Given click nút cảnh báo SĐT  
→ Then ô phone bị clear và `primaryContactId` được set; `primaryContactRole` KHÔNG tự động điền

✅ Given search Primary Contact với q >= 2 ký tự  
→ Then gọi API (debounce) và chỉ hiện khách có SĐT

✅ Given đã chọn Primary Contact  
→ Then không tự động clear ô phone; validation vẫn apply theo rule

---

## 2. 📋 Nguồn Khách & Ghi Chú (Source & SourceNotes)

### NoteType Definitions

Defined in `CUSTOMER_SOURCES` constant (13 sources):

| NoteType              | Behavior                                   | Examples                        |
| --------------------- | ------------------------------------------ | ------------------------------- |
| `none`                | Ẩn ô sourceNotes                           | Google Search, Walk-in, Website |
| `text_input_optional` | Cho phép nhập text, không bắt buộc         | Facebook, Zalo, Voucher, Event  |
| `text_input_required` | Bắt buộc nhập text                         | Nguồn khác (Other)              |
| `employee_search`     | Search và chọn Employee → lưu `employeeId` | Nhân viên giới thiệu            |
| `customer_search`     | Search và chọn Customer → lưu `customerId` | Khách cũ giới thiệu             |

### Implementation: Employee Referral

**Source**: `employee_referral` (Nhân viên giới thiệu)

#### Technical Details

- Hook: `useWorkingEmployees()` (cache 30 phút)
- Filter: Client-side instant filtering (không cần API call)
- Scope: Lọc theo `clinicId` (admin: clinic đang chọn; employee: clinic hiện tại)
- Status filter: Chỉ hiển thị nhân viên `WORKING`
- Storage: `sourceNotes = employeeId` (UUID)

#### UI Component

- Component: AntD `Select`
- Options: `{ label: fullName, value: id }`
- filterOption: Client-side (AntD built-in)
- No loading state (data đã được cache)
- Display: `{fullName}` (phone có thể hiển thị nếu cần)

### Implementation: Customer Referral

**Source**: `customer_referral` (Khách cũ giới thiệu)

#### Technical Details

- Hook: `useCustomersSearch({ q, requirePhone: false })`
- API: `GET /api/v1/customers/search?q={query}&limit=10&requirePhone=false`
- Debounce: 500ms
- Trigger: `q.length >= 2`
- Scope: Global (không giới hạn theo clinic)
- Storage: `sourceNotes = customerId` (UUID)

#### UI Component

- Component: AntD `Select` with `onSearch`
- Options: `{ label: "{fullName} — {phone || '-'}", value: id }`
- filterOption: `false` (server-side search)
- notFoundContent: `<Spin />` khi fetching
- Hiển thị cả khách hàng không có SĐT

### 🎯 Acceptance Criteria (Source)

✅ Given chọn source có `text_input_required`, When submit thiếu `sourceNotes`  
→ Then báo lỗi validation required

✅ Given chọn `employee_referral`  
→ Then hiển thị Select với working employees của clinic, filter instant client-side

✅ Given chọn `employee_referral`, When chọn một nhân viên  
→ Then lưu `employeeId` vào `sourceNotes`, không yêu cầu nhập text

✅ Given chọn `customer_referral`, When search với q >= 2  
→ Then gọi API search với debounce 500ms

✅ Given chọn `customer_referral`, When search trả kết quả  
→ Then hiển thị tất cả khách (cả không có SĐT), format "{name} — {phone}"

✅ Given chọn customer từ search  
→ Then lưu `customerId` vào `sourceNotes`

---

## 3. 📊 Daily View (Danh Sách Khách Hàng Trong Ngày)

### 🔧 Structure

- **Component**: `CustomerDailyView.tsx` (client component)
- **Page**: `/customers/daily`
- **Route**: `src/app/(private)/customers/daily/page.tsx` (SSR with session)

### Components Hierarchy

```
CustomerDailyView
├── PageHeaderWithDateNav (shared component)
├── ClinicTabs (admin chọn clinic)
├── CustomerStatistics (KPI cards)
├── CustomerFilters (search + create button)
└── CustomerTable (data table)
```

### Features

#### Date Navigation

- Component: `PageHeaderWithDateNav`
- Hook: `useDateNavigation()`
- Default: Today
- Controls: Previous Day | Today | Next Day + DatePicker
- Format: YYYY-MM-DD (ISO) gửi lên API

#### Clinic Selection (Admin Only)

- Component: `ClinicTabs`
- Display: Tabs với `clinicCode` và `colorCode`
- Employee: Auto-locked to session clinic
- Admin: Chọn clinic để xem data

#### Statistics (KPI)

Component: `CustomerStatistics` - 4 cards hiển thị:

| Metric          | Logic                                      | Display |
| --------------- | ------------------------------------------ | ------- |
| Tổng khách hàng | Count tất cả items                         | Number  |
| KH niềng răng   | Count `serviceOfInterest === "nieng_rang"` | Number  |
| KH implant      | Count `serviceOfInterest === "implant"`    | Number  |
| KH tổng quát    | Count `serviceOfInterest === "tong_quat"`  | Number  |

#### Filters & Actions

- Component: `CustomerFilters`
- Search: Input để filter local (placeholder cho tương lai)
- Create button: Mở `CreateCustomerModal`
- Display: Daily count

#### Table Display

- Component: `CustomerTable`
- Data source: API `GET /api/v1/customers/daily?date={date}&clinicId={id}`
- Sort: Fixed `createdAt desc` (mới nhất trước) - không UI sorter
- No pagination: Dữ liệu ít, hiển thị tất cả trong 1 trang
- Loading state: Skeleton/Spin

### 📊 Table Columns

| Column              | Width | Type | Description                                  |
| ------------------- | ----- | ---- | -------------------------------------------- |
| Mã KH               | 140px | Text | `customerCode`                               |
| Họ tên              | Auto  | Text | `fullName`                                   |
| SĐT                 | 140px | Text | `phone` (hiển thị "—" nếu null)              |
| Người liên hệ chính | Auto  | Text | `{primaryContact.fullName} — {phone}` nếu có |
| Dịch vụ quan tâm    | 160px | Tag  | Label từ `SERVICES_OF_INTEREST`              |
| Nguồn khách         | 160px | Tag  | Label từ `CUSTOMER_SOURCES`                  |
| Thời gian tạo       | 160px | Text | `createdAt` format "DD/MM/YYYY HH:mm"        |

### 🎯 Acceptance Criteria (Daily)

✅ Given không truyền `date`  
→ Then default Today, trả danh sách KH tạo hôm nay theo clinic

✅ Given admin truyền `clinicId` hợp lệ  
→ Then trả đúng dữ liệu clinic đó

✅ Given employee access  
→ Then tự động filter theo clinic của employee từ session

✅ Given data loaded  
→ Then hiển thị 4 KPI cards với số liệu đúng

✅ Given change date  
→ Then refetch data và update statistics

---

## 4. 📋 List View (Danh Sách Toàn Bộ Khách Hàng)

### 🔧 Structure

- **Component**: `CustomerListView.tsx` (client component)
- **Page**: `/customers` (default route)
- **Route**: `src/app/(private)/customers/page.tsx` (SSR with session)

### Features

#### Pagination

- Server-side pagination
- Default: `page=1`, `pageSize=20`
- Query string sync: page, pageSize, sortBy, sortOrder persist in URL
- AntD Table pagination component

#### Search & Filters

- **Search Input**:
  - Debounce 500ms
  - Trigger: Enter hoặc auto sau debounce
  - Scope: `fullName` (ILIKE), `customerCode` (prefix), `phone` (exact), `email` (ILIKE)
- **Source Filter**: Select từ `CUSTOMER_SOURCES`
- **Service Filter**: Select từ `SERVICES_OF_INTEREST`
- **Clinic Filter**: Admin only (tabs), employee auto-locked

#### Sorting

- Default: `createdAt:desc` (mới nhất trước)
- Supported: `customerCode`, `fullName`, `source`, `createdAt`
- UI: AntD Table sorter columns
- Format: `{field}:asc` hoặc `{field}:desc`

### 📊 Table Columns

| Column              | Width | Sorter | Filter | Description                         |
| ------------------- | ----- | ------ | ------ | ----------------------------------- |
| Mã KH               | 140px | ✅     | -      | `customerCode`                      |
| Họ tên              | Auto  | ✅     | -      | `fullName`                          |
| SĐT                 | 140px | -      | -      | `phone` hoặc "—"                    |
| Người liên hệ chính | Auto  | -      | -      | `{name} — {phone}` format           |
| Dịch vụ quan tâm    | 160px | -      | ✅     | Tag từ `SERVICES_OF_INTEREST`       |
| Nguồn khách         | 160px | ✅     | ✅     | Tag từ `CUSTOMER_SOURCES`           |
| Thời gian tạo       | 160px | ✅     | -      | Format "DD/MM/YYYY HH:mm"           |
| Thao tác            | 150px | -      | -      | "Xem chi tiết" button (placeholder) |

### Components Hierarchy

```
CustomerListView
├── Title ("Danh sách khách hàng")
├── ClinicTabs (admin only)
├── Card (Filters)
│   ├── Search Input
│   ├── Source Select
│   ├── Service Select
│   └── Create Button
└── Table
    ├── Columns with sorters
    ├── Pagination
    └── Loading/Empty states
```

### URL Query Params

State được persist trong URL để share-able:

```
/customers?page=1&pageSize=20&sortBy=createdAt&sortOrder=desc&search=nguyen&source=facebook&serviceOfInterest=implant&clinicId=xxx
```

### State Management

- Hook: `useCustomers({ page, pageSize, sort, search, source, serviceOfInterest, clinicId })`
- Query key: `['customers', { params }]`
- Auto refetch on: param changes, create success, window focus (stale)
- Loading states: `isLoading` for table skeleton

### 🎯 Acceptance Criteria (List View)

✅ Given không truyền `pageSize`  
→ Then mặc định 20 items per page

✅ Given thay đổi `page` hoặc `pageSize`  
→ Then fetch đúng subset data và update URL

✅ Given nhập `search` và wait debounce  
→ Then filter theo tên/mã/SĐT/email, reset về page 1

✅ Given chọn source hoặc serviceOfInterest filter  
→ Then filter data và reset về page 1

✅ Given click sorter column  
→ Then sort data theo field và order (asc/desc), update URL

✅ Given admin chọn clinic khác  
→ Then filter data theo clinic và reset page 1

✅ Given employee access  
→ Then auto filter theo clinic từ session, không hiển thị clinic tabs

✅ Given empty result  
→ Then hiển thị Empty state với message thân thiện

✅ Given create customer thành công  
→ Then refetch list và hiển thị notification

---

---

## 5. 🔌 API Contracts (Zod Schemas)

### Validation Schemas Location

- Path: `src/shared/validation/customer.schema.ts`
- Shared validation: `validateCustomerConditionalFields`

### API Endpoints Summary

#### **GET /api/v1/customers** (List)

Query: `search`, `page`, `pageSize`, `clinicId`, `source`, `serviceOfInterest`, `sort`  
Response: `{ items: CustomerResponse[], count, page, pageSize }`

#### **GET /api/v1/customers/daily** (Daily)

Query: `date` (ISO, default Today), `clinicId`  
Response: `{ items: CustomerResponse[], count }`

#### **POST /api/v1/customers** (Create)

Body: `CreateCustomerRequestSchema`  
Response: `CustomerResponse` (with generated `customerCode`)

#### **GET /api/v1/customers/search** (Search)

Query: `q`, `limit`, `requirePhone`  
Response: `{ items: Array<{ id, fullName, phone, customerCode? }> }`

**Note**: Employee search không cần API riêng - dùng `useWorkingEmployees()` với client-side filter (cache 30min).

---

## 6. ⚙️ State Management

### React Query Keys

- `['customers', { params }]` - List
- `['customers', 'daily', { date, id }]` - Daily
- `['customers', 'search', q, options]` - Search

### Hooks

- `useCustomers()`, `useCustomersDaily()`, `useCustomerSearch()`, `useLookupCustomerPhone()`, `useCustomersSearch()`, `useCreateCustomer()`

---

## 7. 🔒 Security & Permissions

| Action | Admin           | Back Office     | Employee        |
| ------ | --------------- | --------------- | --------------- |
| Create | ✅ (any clinic) | ✅ (any clinic) | ✅ (own clinic) |
| List   | ✅ (all)        | ✅ (all)        | ✅ (own clinic) |

Enforcement: Server-side in service layer. SSR injects session user.

---

## 8. 📁 File Structure

```
src/features/customers/
├── constants.ts
├── api/ (4 files)
├── components/ (5 components)
├── hooks/ (5 hooks)
└── views/ (2 views)

src/app/(private)/customers/
├── page.tsx
└── daily/page.tsx

src/app/api/v1/customers/
├── route.ts
├── daily/route.ts
└── search/route.ts
```

---

## 9. 📌 Future Enhancements

### Detail View (Planned)

Tabs: Overview, Appointments, Consulted Services, Treatment Logs, Payments, Aftercare

### Appointment Integration (Deferred)

Check-in feature waiting for Appointment module

---

## 10. ✅ Implementation Status

**COMPLETED** - October 27, 2025

Core features implemented:

- ✅ Create Customer Modal (700+ lines) with full validation
- ✅ Phone duplicate detection & primary contact logic
- ✅ Source & SourceNotes with employee/customer referral
- ✅ Daily View with date navigation & KPI statistics
- ✅ List View with pagination, search, filters, sorting
- ✅ 4 API endpoints with Zod validation
- ✅ React Query state management
- ✅ Role-based permissions & clinic scope

**Next Phase**: Customer detail view, Edit, Archive/Delete operations
