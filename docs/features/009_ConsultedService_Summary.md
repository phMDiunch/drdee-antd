# Consulted Service Feature - Implementation Summary

## ✅ Hoàn thành (Completed)

### 🔧 Backend (100%)

- ✅ **Schemas**: 3-layer Zod validation (Base → Frontend → Backend)
- ✅ **Repository**: Complex Prisma pattern with server fields
- ✅ **Service Layer**: Business logic với check-in requirement, pricing validation
- ✅ **Permissions**: 33-day rule, role-based, field-level restrictions (shared FE/BE)
- ✅ **Actions**: Auth-gated server actions for mutations
- ✅ **API Routes**: 3 GET endpoints với cache headers
- ✅ **HTTP Test File**: `consulted-service.http` cho REST Client

### 🎨 Frontend (90%)

- ✅ **7 React Query Hooks**: Query + Mutation hooks
- ✅ **Statistics Component**: 4 KPI cards với VND formatting
- ✅ **Filters Component**: Count display + Export button
- ✅ **Table Component**: Full-featured với permissions, inline confirm, VND formatting
- ✅ **Daily View**: Complete page với date navigation, clinic tabs
- ✅ **Page Route**: `/consulted-services/daily`
- ✅ **Sidebar Menu**: "Dịch vụ tư vấn" → "Theo ngày"

## 🧪 Test Backend với REST Client

1. Mở file: `src/app/api/v1/consulted-services/consulted-service.http`
2. Chạy các test queries:
   - `GET {{baseUrl}}/consulted-services` - List all
   - `GET {{baseUrl}}/consulted-services/daily?date=2024-01-15` - Daily view
   - `GET {{baseUrl}}/consulted-services/:id` - Get detail

## 🚀 Test Frontend

### Chạy dev server:

```bash
npm run dev
```

### Navigate to:

```
http://localhost:3000/consulted-services/daily
```

### Features có thể test:

1. ✅ **Date Navigation**: Previous/Today/Next buttons
2. ✅ **Clinic Tabs**: Admin có thể switch giữa các phòng khám
3. ✅ **Statistics**: 4 KPI cards tự động tính
4. ✅ **Table**:
   - View services với đầy đủ info
   - Click customer name → navigate to customer detail
   - Filter by service name, doctors, sale, status
   - Sort by final price, confirm date
5. ✅ **Inline Confirm**: Button "Chốt" khi status = "Chưa chốt"
6. ✅ **Actions Column**:
   - Edit button (disabled theo permissions)
   - Delete button với confirm popup
7. ✅ **Permissions**:
   - Employee không thể edit/delete sau 33 ngày
   - Admin có full access

## ⏳ Chưa implement (Deferred)

### 1. Create/Edit Modal (Cần redesign)

**Lý do**: Component quá phức tạp với nhiều lỗi type, cần simplify

**Kế hoạch**:

- Tạo modal đơn giản hơn với props pre-selected customer
- Chỉ cho daily view (không cần customer search)
- Sử dụng TodayCheckedInCustomer từ API response

### 2. Export Excel

**Kế hoạch**:

- Sử dụng library như `xlsx` hoặc `exceljs`
- Export data from current table filters/view
- Format VND currency trong Excel

### 3. Customer Detail Tab

**User yêu cầu**: "phần tích hợp vào tab customer detail sẽ làm sau"

**Kế hoạch**:

- Tạo tab mới trong CustomerDetailTabs
- Reuse ConsultedServiceTable component
- Filter by customerId

## 📊 Database Schema Reference

```prisma
model ConsultedService {
  id                    String   @id @default(cuid())
  customerId            String
  appointmentId         String
  dentalServiceId       String
  clinicId              String

  // Denormalized for historical accuracy
  consultedServiceName  String
  consultedServiceUnit  String
  price                 Decimal

  quantity              Int      @default(1)
  preferentialPrice     Decimal  // 0 or [minPrice, price]

  // Calculated fields
  finalPrice            Decimal  // preferentialPrice * quantity
  amountPaid            Decimal  @default(0)
  debt                  Decimal  // finalPrice - amountPaid

  // Personnel
  consultingDoctorId    String?
  treatingDoctorId      String?
  consultingSaleId      String?

  // Treatment info
  toothPositions        String[]
  treatmentStatus       TreatmentStatus @default(NOT_STARTED)
  specificStatus        String?  // Notes

  // Service lifecycle
  serviceStatus         ServiceStatus @default(UNCONFIRMED)
  serviceConfirmDate    DateTime?
  consultationDate      DateTime @default(now())

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}

enum ServiceStatus {
  UNCONFIRMED  // "Chưa chốt"
  CONFIRMED    // "Đã chốt"
}

enum TreatmentStatus {
  NOT_STARTED  // "Chưa điều trị"
  IN_PROGRESS  // "Đang điều trị"
  COMPLETED    // "Hoàn thành"
}
```

## 🔐 Permission Rules

### Edit Permission:

- **Admin**: Always allowed (both confirmed & unconfirmed)
- **Employee**:
  - Unconfirmed: All fields editable
  - Confirmed: Only personnel fields (doctors/sale) within 33 days

### Delete Permission:

- **Admin**: Always allowed
- **Employee**: Only unconfirmed services

### Confirm Permission:

- **Admin**: Always allowed
- **Employee**: Not allowed

### Field-Level Permissions (Confirmed services):

- **Admin can edit**: All fields
- **Employee can edit**: Only `consultingDoctorId`, `treatingDoctorId`, `consultingSaleId` (within 33 days)

## 📁 File Structure

```
src/
├── features/
│   └── consulted-services/
│       ├── api.ts                    # API client functions
│       ├── constants.ts              # Status tags, messages, endpoints
│       ├── index.ts                  # Feature exports
│       ├── components/
│       │   ├── index.ts
│       │   ├── ConsultedServiceStatistics.tsx
│       │   ├── ConsultedServiceFilters.tsx
│       │   └── ConsultedServiceTable.tsx
│       ├── hooks/
│       │   ├── index.ts
│       │   ├── useConsultedServicesDaily.ts
│       │   ├── useConsultedServices.ts
│       │   ├── useConsultedService.ts
│       │   ├── useCreateConsultedService.ts
│       │   ├── useUpdateConsultedService.ts
│       │   ├── useDeleteConsultedService.ts
│       │   └── useConfirmConsultedService.ts
│       └── views/
│           └── ConsultedServiceDailyView.tsx
├── app/
│   ├── (private)/
│   │   └── consulted-services/
│   │       └── daily/
│   │           └── page.tsx          # Route wrapper
│   └── api/
│       └── v1/
│           └── consulted-services/
│               ├── route.ts          # GET /api/v1/consulted-services
│               ├── daily/
│               │   └── route.ts      # GET /api/v1/consulted-services/daily
│               ├── [id]/
│               │   └── route.ts      # GET /api/v1/consulted-services/:id
│               └── consulted-service.http  # REST Client tests
├── server/
│   ├── actions/
│   │   └── consulted-service.actions.ts
│   ├── repos/
│   │   └── consulted-service.repo.ts
│   └── services/
│       └── consulted-service/
│           ├── consulted-service.service.ts
│           └── _mappers.ts
└── shared/
    ├── validation/
    │   └── consulted-service.schema.ts
    └── permissions/
        └── consulted-service.permissions.ts
```

## 🎯 Next Steps

1. **Immediate**: Test daily view functionality
2. **Short-term**: Implement simple Create/Edit modal
3. **Medium-term**: Add Export Excel feature
4. **Long-term**: Integrate into Customer Detail tabs
