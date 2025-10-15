# 🧩 Feature: Dental Service Management

## 1) Mục tiêu & Phạm vi

Quản lý danh mục dịch vụ nha khoa toàn cục trong hệ thống. Feature cung cấp đầy đủ CRUD operations cho Admin và khả năng xem danh sách cho các user đã đăng nhập.

### 🎯 **Core Features**

- ✅ **CRUD Operations**: Create / Read / Update / Delete
- ✅ **Archive System**: Soft delete với `archivedAt` timestamp
- ✅ **List Management**: Hiển thị danh sách + filters + sorters (frontend-only)
- ✅ **Permission Control**: Admin-only cho mutations, authenticated users cho queries
- ✅ **Form Validation**: React Hook Form + Zod với real-time validation

### 🎨 **UI Integration**

- 📁 **Sidebar Menu**: Trong nhóm "Cài đặt (Settings)" → "Dịch vụ nha khoa"
- 🔗 **Route**: `/dental-services`
- 📱 **Responsive Design**: Modal 85% width mobile, 65% desktop

---

## 2) Folder Structure

```
src/
├── app/
│   ├── api/v1/dental-services/
│   │   ├── route.ts                    # ✅ GET list, POST create
│   │   └── [id]/
│   │       ├── route.ts                # ✅ GET, PUT, DELETE by ID
│   │       ├── archive/route.ts        # ✅ POST archive
│   │       └── unarchive/route.ts      # ✅ POST unarchive
│   └── (private)/
│       └── dental-services/page.tsx    # ✅ Mount DentalServicesPageView
│
├── features/dental-services/
│   ├── api/
│   │   ├── getDentalServices.ts        # ✅ Fetch list với includeArchived
│   │   ├── getDentalServiceById.ts     # ✅ Fetch by ID
│   │   ├── createDentalService.ts      # ✅ Create new
│   │   ├── updateDentalService.ts      # ✅ Update existing
│   │   ├── deleteDentalService.ts      # ✅ Delete
│   │   ├── archiveDentalService.ts     # ✅ Archive (soft delete)
│   │   ├── unarchiveDentalService.ts   # ✅ Unarchive (restore)
│   │   └── index.ts                    # ✅ API barrel exports
│   ├── components/
│   │   ├── DentalServiceFormModal.tsx  # ✅ Create/Edit form modal
│   │   └── DentalServiceTable.tsx      # ✅ List table với actions
│   ├── hooks/
│   │   ├── useDentalServices.ts        # ✅ Query list
│   │   ├── useDentalServiceById.ts     # ✅ Query by ID
│   │   ├── useCreateDentalService.ts   # ✅ Create mutation
│   │   ├── useUpdateDentalService.ts   # ✅ Update mutation
│   │   ├── useDeleteDentalService.ts   # ✅ Delete mutation
│   │   ├── useArchiveDentalService.ts  # ✅ Archive mutation
│   │   ├── useUnarchiveDentalService.ts # ✅ Unarchive mutation
│   │   └── index.ts                    # ✅ Hook barrel exports
│   ├── views/
│   │   └── DentalServicesPageView.tsx  # ✅ Main page component
│   └── constants.ts                    # ✅ Domain constants
│
├── shared/validation/
│   └── dental-service.schema.ts        # ✅ Zod schemas cho client/server
│
└── server/
    ├── repos/
    │   └── dental-service.repo.ts       # ✅ Prisma data access
    └── services/
        └── dental-service.service.ts    # ✅ Business logic
```

---

## 3) API Design

### 📡 **Endpoints**

```typescript
// List với filter archived
GET /api/v1/dental-services?includeArchived=0|1

// CRUD cơ bản
POST   /api/v1/dental-services          # Create (Admin only)
GET    /api/v1/dental-services/:id      # Get by ID
PUT    /api/v1/dental-services/:id      # Update (Admin only)
DELETE /api/v1/dental-services/:id      # Delete (Admin only)

// Archive operations
POST /api/v1/dental-services/:id/archive    # Archive (Admin only)
POST /api/v1/dental-services/:id/unarchive  # Unarchive (Admin only)
```

### 🔒 **Permissions**

- **Admin**: Full CRUD + Archive operations
- **Authenticated Users**: View list + view details
- **Server Guards**: `requireAdmin()` cho mutations
- **Client Guards**: UI conditionally rendered based on user role

---

## 4) Data Model

### 🏗️ **Database Schema**

```typescript
model DentalService {
  id           String   @id @default(cuid())
  name         String   @unique
  price        Int      // VND, không thập phân
  minPrice     Int?     // Giá tối thiểu cho thanh toán
  unit         String
  serviceGroup String?
  department   String?
  tags         String[] // Array tags

  // Metadata
  origin               String?
  description          String?
  officialWarranty     String?
  clinicWarranty       String?
  avgTreatmentMinutes  Int?
  avgTreatmentSessions Int?

  // Soft delete
  archivedAt DateTime?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  consultedServices ConsultedService[]

  @@index([archivedAt])
  @@index([serviceGroup])
  @@index([department])
}
```

### 📊 **Zod Schemas**

```typescript
// Request schemas
CreateDentalServiceRequestSchema
UpdateDentalServiceRequestSchema
GetDentalServicesQuerySchema  // includeArchived param

// Response schemas
DentalServiceResponseSchema
DentalServicesResponseSchema

// Validation rules
- name: 2-200 chars, unique
- price: Int >= 0 (required)
- minPrice: Int >= 0 (optional)
- tags: max 10 items, each 1-29 chars [A-Za-z0-9_-]
- avgTreatmentMinutes/Sessions: Int >= 0 (optional)
```

---

## 5) UI Components

### 📝 **DentalServiceFormModal**

```typescript
interface Props {
  open: boolean;
  mode: 'create' | 'edit';
  initialData?: DentalService;
  onCancel: () => void;
}

// Features:
- React Hook Form + Zod validation
- 5-row responsive layout
- Real-time validation feedback
- Pre-populate cho edit mode
- Success/error handling với useNotify
```

### 📊 **DentalServiceTable**

```typescript
interface Props {
  includeArchived: boolean;
}

// Features:
- AntD Table với client-side filtering/sorting
- Columns: name, serviceGroup, department, unit, price, status, tags, actions
- Filter: department, serviceGroup
- Sorter: name, price
- Actions: Edit, Archive/Unarchive, Delete (với tooltips + Popconfirm)
- Responsive design
```

### 📄 **DentalServicesPageView**

```typescript
// Main page component:
- Header với "Tạo dịch vụ" button (Admin only)
- Toggle "Hiển thị archived" checkbox
- DentalServiceTable integration
- DentalServiceFormModal integration
- Loading/error states
```

---

## 6) Business Logic

### 🔄 **Archive System**

```typescript
// Soft delete pattern (consistent với Clinics)
Archive: archivedAt = new Date()
Unarchive: archivedAt = null

// List filtering
Active only: WHERE archivedAt IS NULL
Include archived: no filter
```

### 🚫 **Delete Protection**

````typescript
// Server-side check trước khi hard delete
if (linked.total > 0) {
  throw ServiceError("HAS_LINKED_DATA",
    "Dịch vụ đang có dữ liệu liên kết, chỉ có thể lưu trữ (Archive).");
}

// Linked data includes:
- ConsultedService.dentalServiceId
```### 💰 **Pricing Rules**

```typescript
// minPrice là optional field, dành cho future payment validation
// Hiện tại không có business rule cụ thể enforce minPrice <= price
// Field này dành cho tương lai khi implement payment system
````

---

## 7) State Management

### 🔄 **React Query**

```typescript
// Query keys
['dental-services', { includeArchived: boolean }]
['dental-service', id]

// Cache config
staleTime: 60s cho list và detail
invalidation: sau mutations smart invalidate related queries

// Mutations
- Create → invalidate list
- Update → invalidate list + detail
- Delete → invalidate list + remove detail
- Archive/Unarchive → invalidate list + update detail
```

### 📋 **Local State**

```typescript
// Page level state
const [includeArchived, setIncludeArchived] = useState(false);
const [modalState, setModalState] = useState({
  open: false,
  mode: "create" | "edit",
  editingItem: null,
});
```

---

## 8) Testing & Quality

### ✅ **Acceptance Criteria**

- [x] Admin có thể tạo/sửa/xoá/archive/unarchive dịch vụ
- [x] User đăng nhập có thể xem list và chi tiết
- [x] Validation: name unique, price/unit required, avg\* >= 0
- [x] List: filter + sorter hoạt động ở frontend, toggle includeArchived
- [x] Archive/Unarchive: cập nhật trạng thái và UI
- [x] Delete: chặn khi có linked data, cho phép khi không có
- [x] Modal responsive, loading/error/success states

### 🛡️ **Security**

- Server-side role checking với `requireAdmin()`
- Input sanitization qua Zod validation
- Prisma query safety (parameterized queries)
- Session validation ở middleware

### ⚡ **Performance**

- React Query caching với smart invalidation
- Frontend-only filtering/sorting (no backend search)
- Database indexes: archivedAt, serviceGroup, department
- Responsive modal sizing

---

## 9) Error Handling

### 🚨 **Error Types**

```typescript
// Service errors
NOT_FOUND (Dịch vụ nha khoa không tồn tại)
CONFLICT (Tên dịch vụ đã tồn tại)
HAS_LINKED_DATA (Dịch vụ đang có dữ liệu liên kết)
VALIDATION_INVALID

// Client error handling
try {
  await createDentalService.mutateAsync(data);
  notify.success(MESSAGES.DENTAL_SERVICE_CREATED);
} catch (error) {
  notify.error(error, {
    fallback: COMMON_MESSAGES.UNKNOWN_ERROR,
  });
}
```

### 📝 **User Feedback**

- Success: "Tạo dịch vụ thành công", "Cập nhật thành công"
- Validation: Real-time field errors + summary
- Network: Loading states + error boundaries
- Business: Vietnamese user-friendly messages

---

## 10) Integration Points

### 🔗 **Related Features**

```typescript
// Future integrations
- Customer consultation → select DentalService
- Treatment planning → reference services
- Payment vouchers → service pricing
- Reports → service utilization analytics
```

### 📊 **Menu Integration**

```typescript
// src/layouts/AppLayout/menu.config.tsx
{
  key: '/settings',
  icon: <SettingOutlined />,
  label: 'Cài đặt',
  children: [
    { key: '/dental-services', label: 'Dịch vụ nha khoa' }
  ]
}
```

---

## 11) Future Enhancements

### 🚀 **Potential Improvements**

- [ ] Service categories làm thành relational tables
- [ ] Service packages/combos
- [ ] Price versioning/history
- [ ] Service templates với standard procedures
- [ ] Integration với calendar để estimate appointment duration
- [ ] Analytics dashboard cho service utilization
- [ ] Bulk operations (import/export)
- [ ] Service images/attachments

### 📈 **Scalability Considerations**

- Backend search khi dataset lớn
- Pagination khi có hàng ngàn services
- Service hierarchy/categorization
- Multi-clinic pricing models
- Advanced filtering/search capabilities

---

## ✅ Status: **COMPLETED**

**Implementation Date**: October 2025  
**Last Updated**: October 15, 2025  
**Status**: Production Ready ✅

All core requirements implemented and tested. Ready for production use.
