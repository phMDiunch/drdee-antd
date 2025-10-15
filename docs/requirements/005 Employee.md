# 🏥 Requirements: Employee Management System

## 📊 Tham khảo

Prisma Model Employee: src/prisma/schema.prisma
Sơ đồ tổ chức công ty: src/data/organizationalStructure.ts

## 🎯 Core Requirements

### 1. ➕ **Tạo nhân viên (Create)**

#### 🔐 **Permissions:**

- Chỉ có **Admin** và **Back office** mới được tạo nhân viên
- Kiểm tra quyền ở cả client và server

#### 🎨 **UI/UX:**

- **Modal form** responsive (85% width mobile, 65% width desktop)
- **Color picker** cho favoriteColor (hiển thị mã hex)
- **Real-time validation** với error feedback

#### 📝 **Form Layout:**

```
Hàng 1: [fullName            ] [email                    ]
Hàng 2: [phone        ] [role       ] [employeeStatus    ]
Hàng 3: [employeeCode        ] [clinicId                 ]
Hàng 4: [department          ] [team                     ]
Hàng 5: [jobTitle            ] [positionTitle            ]
```

#### ✅ **Validation Rules:**

- `employeeCode`: Optional, unique
- `fullName`: Required,
- `email`: Optional, unique, email format,
- `phone`: Optional, unique, VN format `/^(0)\d{9}$/`
- `role`: Required
- `clinicId`: Required, dựa vào model clinic
- `department`: Required, dựa vào organizationalStructure.ts
- `jobTitle`: Required, dựa vào organizationalStructure.ts
- `team`: Optional, dựa vào organizationalStructure.ts
- `positionTitle`: Optional, dựa vào organizationalStructure.ts
- `employeeStatus`: Required, mặc định là `WORKING`

---

**Sau khi tạo**: Nếu có email thì supabase sẽ gửi link đến nhân viên, nhân viên truy cập `/complete-profile` để hoàn thiện hồ sơ.

### 2. ➕ **Hoàn thiện hồ sơ (Profile)**

#### 🔐 **Permissions:**

Truy cập công khai qua public API endpoints (không cần authentication trước). Sau khi hoàn tất → chuyển đến dashboard với authentication.

#### 🎨 **UI/UX:**

Trang riêng biệt `/complete-profile`

#### 📝 **Form Layout:**

```
Hàng 1: [fullName            ] [dob                             ]
Hàng 2: [gender              ] [favoriteColor                   ]
Hàng 3: [password            ] [confirmPassword                 ]
Hàng 4: [currentAdress       ] [hometown                        ]
Hàng 5: [nationalId] [nationalIdIssueDate] [nationalIdIssuePlace]
Hàng 6: [taxId               ] [insuranceNumber                 ]
Hàng 7: [bankAccountNumber   ] [bankName                        ]
```

#### ✅ **Validation Rules:**

- `fullName`: Required
- `dob`: Required
- `gender`: Required
- `favoriteColor`: Required
- `password`: Required, min 6 characters
- `confirmPassword`: Required, must match password
- `currentAdress`: Required
- `hometown`: Required
- `nationalId`: Required, unique
- `nationalIdIssueDate`: Required
- `nationalIdIssuePlace`: Required
- `taxId`: Optional
- `insuranceNumber`: Optional
- `bankAccountNumber`: Optional
- `bankName`: Optional

**Business Rules:**

- Sử dụng public API endpoints để truy cập và cập nhật thông tin
- Password được set thông qua Supabase admin client
- Sau khi hoàn tất profile, chuyển hướng đến login để authentication
- Email hết hạn trong 12h
- Admin/BackOffice có thể gửi lại email mời
- Không nhập email = không tạo Supabase auth
- Sau này có thể thêm email và gửi lời mời

---

### 3. 📋 **Danh sách nhân viên (List)**

#### 🔧 **Structure:**

- `EmployeesListView.tsx` - Main page wrapper
  -- Tilte: có font tương tự các feature khác
  -- `EmployeeStats.tsx` - Reusable statistics component
  -- Search Input (Left) + Add button (right)
  -- `EmployeeTable.tsx` - Reusable table component

#### **Statistics Component**

- Tổng số nhân viên đang làm việc
- Phân chia theo từng cơ sở

#### **Search & Controls:**

- Search theo tên nhân viên (fullName)
- Search tất cả nhân viên (gồm cả nghỉ việc và đang làm việc)
- Trigger search khi Enter hoặc click button

#### **Table Component**

##### 📊 **_Table Features:_**

- **No Pagination**: mặc định sẽ tải tất cả employee có employeeStatus = "WORKING", nên không cần phân trang. Nếu người dùng tìm kiếm ở ô search input thì sẽ hiển thị dữ liệu từ việc tìm kiếm.
- **Frontend Filters** phía frontend bằng tính năng sẵn có của antd
- **Action buttons**: Edit, Đang làm việc/Nghỉ việc, Delete với tooltips. Với user đã nghỉ việc thì sẽ hiển thị button Đang Làm việc, ngược lại với user đang làm việc thì sẽ hiển thị button Nghỉ việc
- **Employee Status Display**: Hiển thị bằng Tag với màu sắc: WORKING (green), RESIGNED (red)
- Cần tải thêm dữ liệu từ route clinic: id, clinicCode và colorCode để hiển thị trên table

##### 🗂️ **_Table Columns:_**

```
| Column         | Width | Type    || Filter/Sort  | Description                    |
| -------------- | ----- | ------- || ------------ | ------------------------------ |
| Tên nhân viên  | 140px | Text    || Filter + Sort| fullName (cố định)             |
| Mã nhân viên   | Auto  | Text    || Sort         | employeeCode                   |
| Điện thoại     | Auto  | Text    ||              | phone                          |
| Vai trò        | Auto  | Tag     || Sort         | role                           |
| Chi nhánh      | Auto  | Tag     || Sort         | colorCode với background color |
| Trạng thái     | Auto  | Tag     || Sort         | WORKING (green), RESIGNED (red)|
| Phòng ban      | Auto  | Text    || Sort         | department                     |
| Chức danh      | Auto  | Text    || Sort         | jobTitle                       |
| Thao tác       | Auto  | Actions || Actions      | Edit/Working/Delete buttons    |
```

### 4. 👥 **Working Employees API**

**Mục đích**: API cho các feature khác sử dụng (appointments, treatments, consultations...)

#### 📡 **Endpoint:** `GET /api/v1/employees/working`

#### 📊 **Response Format:**

```typescript
{
  id: string;
  fullName: string;
  employeeCode: string | null;
  jobTitle: string | null;
  role: "admin" | "employee";
  department: string;
  clinicId: string;
}
[];
```

#### ⚡ **Caching Strategy:**

- **React Query cache**: 30 phút
- **Query key**: `["employees", "working"]`
- **Invalidation**: Khi có mutation create/update/toggle status employee

### 5. ✏️ **Chỉnh sửa employee (Edit)**

#### 🎨 **UI/UX:**

- **Separate edit page**: `/employees/[id]/edit`
- **Pre-populated data** từ selected employee

#### 🔐 **Field-level Permissions:**

- **Admin**: Xem/sửa tất cả thông tin + metadata của tất cả users
- **BackOffice**: Xem/sửa thông tin users, ngoại trừ role/email. Không xem metadata
- **Employee**: Chỉ sửa thông tin của chính mình, ngoại trừ role/email/employeeStatus/clinicId/department/team/jobTitle/positionTitle

**Không ai có thể thay đổi email**

---

### 6. 🗄️ **Nghỉ việc/Đang làm việc/Delete Operations**

#### 📦 **Business Logic:**

- **Nghỉ việc**: set `employeeStatus = "RESIGNED"` → không truy cập webapp + không xuất hiện trong dropdowns
- **Đang làm việc**: set `employeeStatus = "WORKING"`
- **Delete**: Hard delete khi không có linked data, báo lỗi nếu có

#### 🎯 **UI Actions:**

- **Toggle button**: Hiển thị "Đang làm việc" nếu RESIGNED, "Nghỉ việc" nếu WORKING
- **Delete button**: `<DeleteOutlined />` + Popconfirm

### 7. 🎨 **Layout Integration**

#### 🏷️ **Header Configuration:**

- **Breadcrumb**: `Dashboard > Nhân viên > [Danh sách | Chỉnh sửa]`
- **Page Title**: "Quản lý nhân viên" với icon `<TeamOutlined />`
- **User Avatar**:
  - Nam: `<UserOutlined />` với background blue
  - Nữ: `<UserOutlined />` với background pink
  - Fallback: `<UserOutlined />` với background gray

#### 📁 **Sidebar Navigation:**

```typescript
{
  key: '/employees',
  icon: <TeamOutlined />,
  label: 'Nhân viên',
  // Không có submenu - single page
}
```

**Navigation Rules:**

- Hiển thị cho tất cả user roles
- Admin/BackOffice: Full access (CRUD)
- Employee: View only + Edit self profile

---

## 🛠️ Technical Implementation

### 📡 **API Endpoints:**

```typescript
export const EMPLOYEE_ENDPOINTS = {
  ROOT: "/api/v1/employees",
  BY_ID: (id: string) => `/api/v1/employees/${id}`,
  WORKING: "/api/v1/employees/working",
  SET_STATUS: (id: string) => `/api/v1/employees/${id}/status`,
  INVITE: (id: string) => `/api/v1/employees/${id}/invite`,
  COMPLETE_PROFILE: "/api/v1/employees/complete-profile",
  // Public endpoints for complete profile flow
  PUBLIC_BY_ID: (id: string) => `/api/public/employees/${id}`,
  PUBLIC_COMPLETE_PROFILE: (id: string) =>
    `/api/public/employees/${id}/complete-profile`,
} as const;
```

**API Routes:**

```
GET    /api/v1/employees?search=&status=         # List employees
POST   /api/v1/employees (Admin/BackOffice only) # Create employee
GET    /api/v1/employees/working                 # Working employees for dropdowns
GET    /api/v1/employees/:id                     # Get employee details
PUT    /api/v1/employees/:id                     # Update employee
DELETE /api/v1/employees/:id                     # Delete employee
PUT    /api/v1/employees/:id/status              # Toggle working/resigned
POST   /api/v1/employees/:id/invite              # Resend invitation
POST   /api/v1/employees/complete-profile        # Complete profile after invitation

# Public endpoints for complete profile flow
GET    /api/public/employees/:id                 # Get employee for profile completion (public)
POST   /api/public/employees/:id/complete-profile # Complete profile with password (public)
```

### 🏗️ **Architecture:**

```
UI Components → Custom Hooks → API Client → Routes → Services → Repository → Database
```

**Feature Structure:**

```
src/features/employees/
├── api/           # API client functions
├── components/    # EmployeeTable, EmployeeFormModal, EmployeeStats
├── hooks/         # useEmployees, useCreateEmployee, useUpdateEmployee
├── views/         # EmployeesPageView, CompleteProfileView
├── types.ts       # TypeScript interfaces
├── constants.ts   # Endpoints, query keys, messages
└── index.ts       # Barrel exports
```

### 🔄 **State Management:**

- **React Query** cho server state
- **Component local state** cho UI state
- **Query keys**:
  ```typescript
  export const EMPLOYEE_QUERY_KEYS = {
    list: (search?: string, status?: string) =>
      ["employees", { search, status }] as const,
    working: () => ["employees", "working"] as const,
    byId: (id: string) => ["employee", id] as const,
  } as const;
  ```

### ✅ **Validation Requirements:**

**Field Validation Rules:**

- `fullName`: Required, min 1 character
- `email`: Optional, valid email format, unique (không thể thay đổi sau khi tạo)
- `phone`: Optional, Vietnamese format `/^(0)\d{9}$/`, unique
- `employeeCode`: Optional, unique
- `role`: Required (`admin` | `employee`)
- `clinicId`: Required, must exist
- `department`: Required, dựa vào organizationalStructure.ts
- `jobTitle`: Required, dựa vào organizationalStructure.ts
- `team`, `jobTitle`: Optional, dựa vào organizationalStructure.ts
- `employeeStatus`: Required, default `WORKING`

**Complete Profile Validation:**

- `fullName`: Required, min 1 character
- `dob`: Required, valid date
- `gender`: Required (`MALE` | `FEMALE` | `OTHER`)
- `favoriteColor`: Required, hex color format
- `password`: Required, min 6 characters
- `confirmPassword`: Required, must match password
- `currentAddress`: Required, min 1 character
- `hometown`: Required, min 1 character
- `nationalId`: Required, Vietnamese CMND/CCCD format, unique
- `nationalIdIssueDate`: Required, valid date
- `nationalIdIssuePlace`: Required, min 1 character
- `taxId`, `insuranceNumber`, `bankAccountNumber`, `bankName`: Optional

**Technical Stack:**

- Client: React Hook Form + Zod resolver
- Server: Zod schemas validation
- Database: Prisma constraints

---

## 🔐 Security & Permissions

### 👨‍� **Permission Matrix:**

| **Action**      | **Admin** | **BackOffice** | **Employee (Self)** | **Employee (Others)** |
| --------------- | --------- | -------------- | ------------------- | --------------------- |
| Create          | ✅        | ✅             | ❌                  | ❌                    |
| View List       | ✅        | ✅             | ✅                  | ✅                    |
| View Details    | ✅        | ✅             | ✅ (self)           | ❌                    |
| Edit Basic Info | ✅        | ✅             | ✅ (self)           | ❌                    |
| Edit Role/Email | ✅        | ❌             | ❌                  | ❌                    |
| Toggle Status   | ✅        | ✅             | ❌                  | ❌                    |
| Delete          | ✅        | ✅             | ❌                  | ❌                    |
| View Metadata   | ✅        | ❌             | ❌                  | ❌                    |

### 🛡️ **Security Measures:**

- **Complete Profile Authentication**: Public API endpoints cho profile completion flow
- **Password Security**: Supabase admin client để set password an toàn
- **Role-based access**: Server-side validation với `requireRole()`
- **Field-level permissions**: Conditional form fields based on user role
- **Session validation**: Middleware protection cho routes
- **Input sanitization**: Zod validation + Prisma type safety
- **Auto logout on RESIGNED**: Middleware check `employeeStatus` → redirect login nếu RESIGNED
- **Resend invitation**: Chỉ Admin + BackOffice có quyền gửi lại email mời
- **Public Endpoint Security**: Validate employee ID và email match trước khi complete profile

---

## 📈 **Performance & Technical**

### ⚡ **Caching Strategy:**

- `useEmployees()`: 60s cache, refetch on window focus
- `useWorkingEmployees()`: 30min cache cho dropdown selections
- `useEmployeeById()`: 5min cache
- **Invalidation**: Create/update/delete employee → invalidate all employee caches

### 🔄 **Data Optimization:**

- **Default sorting**: createdAt DESC (mới nhất trước)
- **Search**: Debounced input, chỉ search theo fullName
- **Include relations**: Clinic data cho table display
- **Conditional metadata**: Chỉ admin xem được metadata

### 🗑️ **Delete Logic:**

- **Hard delete**: Chỉ khi không có linked data (appointments, treatments, consultations)
- **Soft delete**: Set status = RESIGNED nếu có linked data
- **Error handling**: Thông báo rõ ràng khi không thể delete

### 🔄 **Authentication & Onboarding:**

**Business Flow:**

1. Admin/BackOffice tạo employee → Gửi magic link (nếu có email)
2. Employee click link → Redirect `/complete-profile` (public access)
3. Hoàn thành profile với password → Supabase admin set password
4. Complete profile xong → Redirect `/login` để authenticate
5. Employee login với email/password → Access dashboard

**System States:**

- **No Auth**: Chưa tạo auth account (không có email)
- **Pending**: Magic link sent, chờ complete profile
- **Active**: Profile completed với password, có thể login
- **Expired**: Link hết hạn, cần resend

**Alternative Flow:**

- Nếu nhân viên quên password sau khi complete profile → Sử dụng forgot password flow

---

## ✅ **Acceptance Criteria**

### 🧪 **Testing Checklist:**

**Core Functions:**

- [ ] Admin/BackOffice có thể tạo nhân viên
- [ ] Employee không thể tạo nhân viên khác
- [ ] Magic link authentication hoạt động đúng
- [ ] Complete profile flow với password hoạt động
- [ ] Public API endpoints cho complete profile accessible
- [ ] Password được set thông qua Supabase admin client
- [ ] Redirect về login page sau complete profile
- [ ] Resend invitation hoạt động

**Employee Management:**

- [ ] Toggle working/resigned status hoạt động
- [ ] Delete logic check linked data đúng
- [ ] Search employees theo tên hoạt động
- [ ] Working employees API cache đúng thời gian

**Permissions:**

- [ ] Field-level permissions theo role
- [ ] Employee chỉ sửa được profile của mình
- [ ] Admin xem được metadata, others không
- [ ] Email không thể sửa bởi ai

**UI/UX:**

- [ ] Responsive design works
- [ ] Color picker cho favoriteColor
- [ ] Clinic tags hiển thị đúng màu
- [ ] Loading states smooth
- [ ] Error handling graceful

### 🎯 **Quality Standards:**

- TypeScript strict mode
- Zod validation everywhere
- Error boundaries
- Accessibility compliance
- Performance optimization
- Clean code architecture
