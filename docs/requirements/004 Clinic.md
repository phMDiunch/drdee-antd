# 🏥 Requirements: Clinic Management System

> **✅ STATUS: COMPLETED** - Implementation finished on October 15, 2025  
> **📄 Feature Documentation**: `docs/features/004_Clinic.md`  
> **🔗 Implementation**: `src/features/clinics/`

## 📊 Database Model

Prisma Model Clinic: src/prisma/schema.prisma

---

## 🎯 Core Requirements

### 1. ➕ **Tạo phòng khám (Create)**

#### 🔐 **Permissions:**

- Chỉ có **Admin** mới được tạo phòng khám
- Kiểm tra quyền ở cả client và server

#### 🎨 **UI/UX:**

- **Modal form** responsive (85% width mobile, 65% width desktop)
- **Color picker** cho colorCode (hiển thị mã hex)
- **Real-time validation** với error feedback

#### 📝 **Form Layout:**

```
Hàng 1: [clinicCode ] [name                    ]
Hàng 2: [colorCode  ] [address                 ]
Hàng 3: [phone      ] [email                   ]
```

#### ✅ **Validation Rules:**

- `clinicCode`: Required, unique, regex `/^[A-Za-z0-9_.-]{2,20}$/`
- `name`: Required, unique
- `shortName`: Required, unique, max 20 chars
- `address`: Required
- `phone`: Optional, VN format `/^(0)\d{9}$/`
- `email`: Optional, email format
- `colorCode`: Required, hex format `/^#([0-9A-Fa-f]{6})$/`

---

### 2. 📋 **Danh sách phòng khám (List)**

#### 📊 **Table Features:**

- **No pagination** (< 10 items)
- **No advanced filters** (search, sort)
- **Archive toggle**: "Hiện cả archived" checkbox
- **Action buttons**: Edit, Archive/Unarchive, Delete với tooltips

#### 🗂️ **Table Columns:**

| Column         | Width | Type    | Description                    |
| -------------- | ----- | ------- | ------------------------------ |
| Mã             | 140px | Text    | clinicCode                     |
| Tên phòng khám | Auto  | Text    | name                           |
| Tên viết tắt   | 150px | Text    | shortName                      |
| Điện thoại     | 160px | Text    | phone                          |
| Địa chỉ        | Auto  | Text    | address                        |
| Màu            | 120px | Tag     | colorCode với background color |
| Thao tác       | 150px | Actions | Edit/Archive/Delete buttons    |

#### 🔧 **Components:**

- `ClinicTable.tsx` - Reusable table component
- `ClinicsPageView.tsx` - Main page wrapper

---

### 3. ✏️ **Chỉnh sửa phòng khám (Edit)**

#### 🎨 **UI/UX:**

- **Same modal** như tạo mới
- **Pre-populated data** từ selected clinic
- **Admin metadata**: Hiển thị createdAt, updatedAt (read-only)

#### 🔄 **Behavior:**

- Cho phép chỉnh sửa **tất cả fields**
- **Unique validation** (exclude current record)
- **Success feedback** + auto-close modal

---

### 4. 🗄️ **Archive/Delete Operations**

#### 📦 **Archive System:**

- **Soft delete** approach với `archivedAt` timestamp
- **Archive**: Set `archivedAt = now()`
- **Unarchive**: Set `archivedAt = null`

#### ❌ **Delete Logic:**

```typescript
if (hasLinkedData) {
  throw new Error("Phòng khám còn dữ liệu liên kết, chỉ có thể Archive");
} else {
  // Hard delete allowed
}
```

#### 🔗 **Linked Data Check:**

- `Employee.clinicId` references
- Future: Appointments, Billing, etc.
- `countLinked()` function in repository

#### 🎯 **UI Actions:**

- **Archive button**: `<InboxOutlined />` - Lưu trữ
- **Unarchive button**: `<RollbackOutlined />` - Khôi phục
- **Delete button**: `<DeleteOutlined />` + Popconfirm

---

### 5. 🎨 **Layout Integration**

#### 🏷️ **Employee Table Integration:**

- **Position**: Trong bảng danh sách nhân viên
- **Content**: `clinicCode` từ `employee.clinicId`
- **Style**: Tag với `colorCode` background
- **Behavior**: Read-only display

#### 📁 **Sidebar Navigation:**

- **Location**: Dưới nhóm "Cài đặt (Settings)"
- **Menu item**: "Phòng khám"
- **Route**: `/clinics`
- **Icon**: Hospital/clinic related

---

## 🛠️ Technical Implementation

### 📡 **API Endpoints:**

```
GET    /api/v1/clinics?includeArchived=0|1
POST   /api/v1/clinics (Admin only)
GET    /api/v1/clinics/:id
PUT    /api/v1/clinics/:id (Admin only)
DELETE /api/v1/clinics/:id (Admin only)
POST   /api/v1/clinics/:id/archive (Admin only)
POST   /api/v1/clinics/:id/unarchive (Admin only)
```

### 🏗️ **Architecture:**

```
UI Components → Custom Hooks → API Client → Routes → Services → Repository → Database
```

### 🔄 **State Management:**

- **React Query** cho server state
- **Component local state** cho UI state
- **Query keys**: `['clinics', { includeArchived }]`

### ✅ **Validation Stack:**

- **Client**: React Hook Form + Zod resolver
- **Server**: Zod schemas validation
- **Database**: Prisma constraints

---

## 🔐 Security & Permissions

### 👨‍💼 **Admin Operations:**

- Create, Update, Delete, Archive, Unarchive
- Server-side validation với `requireAdmin()`

### 👤 **Authenticated Users:**

- View list, View details
- Based hiện tại: ai login cũng xem được

### 🛡️ **Security Measures:**

- Session validation
- Role checking không trust client
- Input sanitization
- SQL injection protection (Prisma)

---

## 📈 Performance & Optimization

### ⚡ **Caching Strategy:**

```typescript
// React Query cache
useClinics(includeArchived)     // staleTime: 60s
useClinicById(id)              // staleTime: 60s

// Smart invalidation
mutations → invalidate relevant queries
```

### 🎯 **Data Optimization:**

- **SSR injection** cho header clinic info
- **Small dataset** (< 10 items) → no pagination needed
- **Efficient queries** với Prisma select

---

## ❓ **Future Considerations**

### 🔮 **Câu hỏi đã giải quyết:**

**Q: Dữ liệu clinic sẽ được lưu ở đâu để optimization?**

**A: Multi-layer approach:**

1. **SSR Level**: `getSessionUser()` → inject currentUser (contains clinicId)
2. **React Query**: Cache clinic list với staleTime 60s
3. **Future**: Consider Redis cache cho heavy usage

### 📋 **TODO Items:**

- [ ] **Enhanced linking**: Add Appointments, Billing to `countLinked()`
- [ ] **Audit trail**: Log admin operations
- [ ] **Bulk operations**: Multi-select actions
- [ ] **Export features**: CSV/Excel export
- [ ] **Advanced permissions**: Per-clinic access control

---

## ✅ **Acceptance Criteria**

### 🧪 **Testing Checklist:**

- [x] Admin có thể CRUD clinics
- [x] Non-admin không thể tạo/sửa/xóa
- [x] Validation hoạt động đúng
- [x] Archive/Unarchive toggle correctly
- [x] Employee table hiển thị clinic tag đúng
- [x] Menu sidebar có link clinics
- [x] Responsive design works
- [x] Error handling graceful
- [x] Loading states smooth
- [ ] Success feedback clear

### 🎯 **Quality Standards:**

- TypeScript strict mode
- Zod validation everywhere
- Error boundaries
- Accessibility compliance
- Performance optimization
- Clean code architecture
