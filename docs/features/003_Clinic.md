# 🏥 Feature: Clinic Management

## 📋 1. Mục tiêu & Phạm vi

Quản lý **Phòng khám** theo các nghiệp vụ chính:

### 🎯 **Core Features**

- ✅ **CRUD Operations**: Create / View / Edit / Delete
- 🗄️ **Archive Management**: Archive / Unarchive (Admin-only)
- 📊 **List Management**: Hiển thị danh sách (< 10 items, không phân trang)
- 🔄 **Toggle Archived**: Hiện/ẩn các phòng khám đã archive

### 🎨 **UI Integration**

- 🏷️ **Header Tag**: Hiển thị Clinic Tag (clinicCode + colorCode) theo `employee.clinicId` của user
- 📁 **Sidebar Menu**: Thêm mục "Phòng khám" dưới nhóm **Cài đặt (Settings)**

---

## 📁 2. Thư mục & File Structure

```
📦 src/
├── 🚦 app/
│   ├── 🔌 api/v1/clinics/
│   │   ├── route.ts                        # 📝 GET list, POST create
│   │   └── [id]/
│   │       ├── route.ts                    # 📋 GET one, PUT update, DELETE delete
│   │       ├── archive/route.ts            # 🗄️ POST archive
│   │       └── unarchive/route.ts          # 📤 POST unarchive
│   │
│   └── 🔒 (private)/
│       ├── layout.tsx                      # 🔐 SSR inject currentUser + currentClinic
│       └── clinics/page.tsx                # 🏥 Mount ClinicsPageView
│
├── 🎯 features/clinic/
│   ├── 🔄 api/
│   │   ├── getClinics.ts                   # 📋 Fetch clinics list
│   │   ├── getClinicById.ts                # 🔍 Fetch single clinic
│   │   ├── createClinic.ts                 # ➕ Create new clinic
│   │   ├── updateClinic.ts                 # ✏️ Update existing clinic
│   │   ├── deleteClinic.ts                 # ❌ Delete clinic
│   │   ├── archiveClinic.ts                # 🗄️ Archive clinic
│   │   └── unarchiveClinic.ts              # 📤 Unarchive clinic
│   │
│   ├── 🧩 components/
│   │   ├── ClinicFormModal.tsx             # 📝 AntD UI + RHF + zodResolver
│   │   └── ClinicTable.tsx                 # 📊 AntD Table (UI-only)
│   │
│   ├── 🪝 hooks/
│   │   ├── useClinics.ts                   # 📋 Query clinics list
│   │   ├── useClinicById.ts                # 🔍 Query single clinic
│   │   ├── useCreateClinic.ts              # ➕ Create mutation
│   │   ├── useUpdateClinic.ts              # ✏️ Update mutation
│   │   ├── useDeleteClinic.ts              # ❌ Delete mutation
│   │   ├── useArchiveClinic.ts             # 🗄️ Archive mutation
│   │   └── useUnarchiveClinic.ts           # 📤 Unarchive mutation
│   │
│   ├── 📱 views/
│   │   └── ClinicsPageView.tsx             # 🏥 Main clinic management page
│   │
│   ├── 📋 constants.ts                     # 🔗 API endpoints & constants
│   ├── 🏷️ types.ts                         # 📝 TypeScript type definitions
│   └── 📦 index.ts                         # 🔄 Barrel exports
│
├── 🏗️ layouts/AppLayout/
│   ├── AppHeader.tsx                       # 🏷️ Render Clinic Tag beside logo
│   ├── SidebarNav.tsx                      # 📁 Navigation sidebar
│   ├── menu.config.ts                      # ⚙️ Add "Phòng khám" under Settings
│   └── AppLayout.tsx                       # 🎨 Pass currentClinic to Header
│
├── 🖥️ server/
│   ├── 🗃️ repos/
│   │   └── clinic.repo.ts                  # 🗄️ Prisma CRUD + countLinked()
│   │
│   └── ⚙️ services/
│       ├── clinic.service.ts               # 🏢 Business logic, normalize, unique checks
│       ├── auth.service.ts                 # 🔐 getSessionUser(), requireAdmin(), getCurrentClinicForUser()
│       └── errors.ts                       # 🚨 ServiceError with httpStatus
│
└── 🔗 shared/validation/
    └── clinic.schema.ts                    # ✅ Zod schemas: Request/Response/Query
```

---

## 🔄 3. Data Flow

### 🏗️ **Kiến trúc tổng quan**

```
🎨 UI Components → 🪝 Custom Hooks → 🔄 API Client → 🚀 API Routes → ⚙️ Services → 🗃️ Repositories → 🗄️ Database
```

---

### 📝 **Tạo mới / Chỉnh sửa Clinic**

**1. UI Layer:**

- `ClinicFormModal` sử dụng React Hook Form + Zod validation

**2. Hook Layer:**

- `useCreateClinic()` - Tạo mới
- `useUpdateClinic()` - Cập nhật

**3. API Client:**

- `createClinicApi()` - POST request
- `updateClinicApi()` - PUT request

**4. Server Route:**

- `POST /api/v1/clinics` - Tạo mới
- `PUT /api/v1/clinics/:id` - Cập nhật

**5. Service & Database:**

- `clinicService.create()` / `clinicService.update()`
- `clinicRepo.create()` / `clinicRepo.update()`

**6. Response & Cache:**

- Trả về `ClinicResponseSchema`
- Invalidate React Query cache `['clinics']`

---

### 📊 **Hiển thị danh sách / Chi tiết**

**1. UI Layer:**

- `ClinicsPageView` hiển thị danh sách

**2. Hook Layer:**

- `useClinics()` - Lấy danh sách
- `useClinicById()` - Lấy chi tiết theo ID

**3. API Route:**

- `GET /api/v1/clinics` - Danh sách
- `GET /api/v1/clinics/:id` - Chi tiết

**4. Service & Database:**

- `clinicService.list()` / `clinicService.getById()`
- `clinicRepo.list()` / `clinicRepo.getById()`

**5. Response:**

- `ClinicsResponseSchema` (array)
- `ClinicResponseSchema` (object)

---

### 🗄️ **Archive / Xóa Clinic**

**1. UI Layer:**

- `ClinicTable` với các action buttons

**2. Hook Layer:**

- `useArchiveClinic()` - Archive
- `useUnarchiveClinic()` - Bỏ archive
- `useDeleteClinic()` - Xóa vĩnh viễn

**3. API Route:**

- `POST /api/v1/clinics/:id/archive`
- `POST /api/v1/clinics/:id/unarchive`
- `DELETE /api/v1/clinics/:id`

**4. Service Logic:**

- **Delete**: Kiểm tra linked data trước khi xóa
- **Archive**: Set `archivedAt = current timestamp`
- **Unarchive**: Set `archivedAt = null`

**5. Cache Update:**

- Invalidate `['clinics']` và `['clinic', id]`

---

### 🏷️ **Hiển thị Clinic Tag ở Header**

**1. SSR Injection:**

- `(private)/layout.tsx` chạy Server-Side Rendering

**2. Auth Service:**

- `getSessionUser()` - Lấy thông tin user hiện tại
- `getCurrentClinicForUser()` - Lấy clinic theo `employee.clinicId`

**3. Component Props:**

- Pass `currentClinic` cho `<AppLayout>`

**4. Header Render:**

- `AppHeader` hiển thị Tag với `clinicCode` và `colorCode`

## 🔌 4. API Contracts

### 🌐 **Base Path**: `/api/v1/clinics`

#### 📋 **GET** `/api/v1/clinics`

**Query Parameters:**

- `includeArchived`: `"0"` | `"1"` (default: `"0"`)

**Responses:**

- ✅ **200**: `ClinicsResponse[]`
- ❌ **400**: Query validation error
- ❌ **500**: Server error

#### ➕ **POST** `/api/v1/clinics` _(Admin Only)_

**Request Body** (Zod: `CreateClinicRequestSchema`):

```typescript
{
  clinicCode: string;     // Required, regex: [A-Za-z0-9_.-]{2,20}
  name: string;           // Required
  address: string;        // Required
  colorCode: string;      // Required, format: #RRGGBB
  phone?: string;         // Optional, VN phone regex
  email?: string;         // Optional, email format
}
```

**Responses:**

- ✅ **201**: `ClinicResponse`
- ❌ **401/403**: Unauthorized/Forbidden
- ❌ **409**: Duplicate clinicCode/name
- ❌ **400**: Validation error
- ❌ **500**: Server error

#### 🔍 **GET** `/api/v1/clinics/:id`

**Responses:**

- ✅ **200**: `ClinicResponse`
- ❌ **404**: Clinic not found
- ❌ **500**: Server error

#### ✏️ **PUT** `/api/v1/clinics/:id` _(Admin Only)_

**Request Body** (Zod: `UpdateClinicRequestSchema`):

```typescript
{
  id: string;             // Required UUID
  clinicCode: string;     // Required
  name: string;           // Required
  address: string;        // Required
  colorCode: string;      // Required
  phone?: string;         // Optional
  email?: string;         // Optional
}
```

**Responses:**

- ✅ **200**: `ClinicResponse`
- ❌ **401/403**: Unauthorized/Forbidden
- ❌ **404**: Clinic not found
- ❌ **409**: Duplicate unique fields
- ❌ **400**: Validation error
- ❌ **500**: Server error

#### ❌ **DELETE** `/api/v1/clinics/:id` _(Admin Only)_

**Responses:**

- ✅ **200**: `ClinicResponse` (deleted clinic)
- ❌ **401/403**: Unauthorized/Forbidden
- ❌ **404**: Clinic not found
- ❌ **409**: `HAS_LINKED_DATA` (has dependencies)
- ❌ **500**: Server error

#### 🗄️ **POST** `/api/v1/clinics/:id/archive` _(Admin Only)_

**Responses:**

- ✅ **200**: `ClinicResponse` (with archivedAt set)
- ❌ **401/403**: Unauthorized/Forbidden
- ❌ **404**: Clinic not found
- ❌ **500**: Server error

#### 📤 **POST** `/api/v1/clinics/:id/unarchive` _(Admin Only)_

**Responses:**

- ✅ **200**: `ClinicResponse` (archivedAt = null)
- ❌ **401/403**: Unauthorized/Forbidden
- ❌ **404**: Clinic not found
- ❌ **500**: Server error

### 🚨 **Standard Error Format**

```typescript
{
  error: string;
  code?: string;
}
```

---

## ✅ 5. Validation & Error Handling

### 🎨 **Client-Side (Form)**

- 📝 **React Hook Form** + `zodResolver(CreateClinicRequestSchema|UpdateClinicRequestSchema)`
- 🚫 **No AntD rules** - Pure Zod validation
- 🎯 **AntD Purpose**: UI only (labels, `*` markers, `validateStatus`, `help`)
- 🔄 **Null Handling**: Optional fields map `null/undefined` → `""` for AntD Input binding

### ⚙️ **Server-Side**

- 📥 **Route Parsing**: Body/query validation with Zod schemas
- 🏢 **Service Layer**: Data normalization and uniqueness checks
- 🚨 **Error Handling**: Throw `ServiceError(code, message, httpStatus)`
- 📤 **Response Mapping**: Route maps status codes and error format

---

## 🗂️ 6. State Management

### 🔄 **React Query** (Server State)

```typescript
// Query Keys
useClinics(includeArchived?: boolean)     // Key: ['clinics', { includeArchived }]
useClinicById(id: string)                 // Key: ['clinic', id]

// Mutations with Smart Invalidation
useCreateClinic()     → invalidates ['clinics']
useUpdateClinic()     → invalidates ['clinics'], ['clinic', id]
useDeleteClinic()     → invalidates ['clinics']
useArchiveClinic()    → invalidates ['clinics'], ['clinic', id]
useUnarchiveClinic()  → invalidates ['clinics'], ['clinic', id]
```

### 🎛️ **UI State** (Component Local)

- 📱 **Modal State**: Open/close, edit mode
- 🎯 **Selected Row**: Table selection state
- 🚫 **No Zustand**: For server-state management

---

## 🔐 7. Security & Permissions

### 👨‍💼 **Admin-Only Operations**

- ➕ Create, ✏️ Update, ❌ Delete
- 🗄️ Archive, 📤 Unarchive
- 🛡️ **Server Validation**: `requireAdmin()` in service layer

### 🔓 **Authenticated Operations**

- 📋 List, 🔍 Detail (according to current policy)

### 🔒 **SSR Security**

- 🔐 **Session Injection**: via `(private)/layout.tsx`
- 🚫 **No Client Trust**: Server validates roles, doesn't trust client claims

---

## 🎨 8. UX States & Interface

### 📝 **Form Interface**

- ⭐ **Required Fields**: `clinicCode`, `name`, `address`, `colorCode` (marked with `*`)
- 🚨 **Error Display**: Real-time validation via RHF (`fieldState.error?.message`)
- 📱 **Responsive Modal**:
  - Large screens: ~900px width
  - Mobile: 85% width
  - Max height: 70vh with scrollable body

### 📊 **Table Interface**

- 💡 **Tooltip Icons**: Hover information for actions
- ⚠️ **Popconfirm**: Confirmation dialog for delete operations
- 🏷️ **Color Tags**: Visual representation of `colorCode`
- 🔄 **Archive Toggle**: "Hiện cả archived" checkbox

---

## 🧪 9. Testing Checklist

### ➕ **Create Testing**

- [ ] 🚫 Missing required fields (`clinicCode`, `name`, `address`, `colorCode`)
- [ ] 🎨 Invalid `colorCode` format (not #RRGGBB)
- [ ] 📞 Invalid phone number format
- [ ] 📧 Invalid email format

### ✏️ **Update Testing**

- [ ] 🔄 Change `clinicCode`/`name` to existing value → 409 conflict
- [ ] ✅ Valid updates succeed with proper response

### ❌ **Delete Testing**

- [ ] 🔗 Has linked data → 409 `HAS_LINKED_DATA` error
- [ ] ✅ No dependencies → successful deletion

### 🗄️ **Archive/Unarchive Testing**

- [ ] 📊 Status correctly reflected in UI
- [ ] 🔄 Toggle archived displays proper items
- [ ] ✅ Operations succeed with status updates

### 🎨 **UI Integration Testing**

- [ ] 🏷️ Header displays correct Clinic Tag (`clinicCode` + `colorCode`)
- [ ] 📁 Sidebar contains "Phòng khám" menu under Settings
- [ ] 🔗 Navigation to `/clinics` works correctly

---

## 📦 10. Dependencies & Implementation

### 🛠️ **Tech Stack**

- 🎨 **UI**: Ant Design (AntD)
- 📝 **Forms**: React Hook Form + @hookform/resolvers
- ✅ **Validation**: Zod schemas
- 🔄 **State**: React Query for server state
- 🗄️ **Database**: Prisma ORM
- 🔐 **Auth**: Supabase sessions

### 📋 **TODO Items**

- [ ] 🔗 **Enhanced Linking**: Add more modules to `countLinked()` (Appointments, Billing, etc.)
- [ ] 🌐 **Client API**: Consider `/me` endpoint for client-side fetching vs SSR
- [ ] 📝 **Audit Trail**: Implement audit logging for admin operations
- [ ] 🎯 **Performance**: Add caching strategies for frequently accessed data
- [ ] 🧪 **Testing**: Comprehensive unit and integration test coverage

---

## 🎯 **Quick Navigation**

- 📁 [Project Structure](#-2-thư-mục--file-structure)
- 🔌 [API Documentation](#-4-api-contracts)
- ✅ [Validation Guide](#-5-validation--error-handling)
- 🧪 [Testing Checklist](#-9-testing-checklist)
