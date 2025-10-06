# 🧩 Feature: [Feature Name]

## 1) Mục tiêu & Phạm vi

Mô tả ngắn gọn nghiệp vụ và mục tiêu chính của feature.

### 🎯 **Core Features**

- ✅ **CRUD Operations**: Create / Read / Update / Delete
- 📊 **List Management**: Hiển thị danh sách + filters
- 🔐 **Permission Control**: Admin/User role-based access

### 🎨 **UI Integration** (nếu có)

- 📁 **Sidebar Menu**: Vị trí trong navigation
- 🏷️ **Header Integration**: Tags/indicators (nếu có)
- 📱 **Responsive Design**: Mobile/desktop layout

---

## 2) Folder Structure

```
src/
├── app/
│   ├── api/v1/[feature]/
│   │   ├── route.ts                    # 📝 GET list, POST create
│   │   └── [id]/route.ts               # 🔍 GET, PUT, DELETE by ID
│   └── (private)/
│       └── [feature]/page.tsx          # 📄 Mount FeaturePageView
│
├── features/[feature]/
│   ├── api/
│   │   ├── get[Feature]s.ts            # 📋 Fetch list
│   │   ├── get[Feature]ById.ts         # 🔍 Fetch by ID
│   │   ├── create[Feature].ts          # ➕ Create new
│   │   ├── update[Feature].ts          # ✏️ Update existing
│   │   └── delete[Feature].ts          # ❌ Delete
│   ├── components/
│   │   ├── [Feature]FormModal.tsx      # 📝 Create/Edit form
│   │   └── [Feature]Table.tsx          # 📊 List table
│   ├── hooks/
│   │   ├── use[Feature]s.ts            # 📋 Query list
│   │   ├── use[Feature]ById.ts         # 🔍 Query by ID
│   │   ├── useCreate[Feature].ts       # ➕ Create mutation
│   │   ├── useUpdate[Feature].ts       # ✏️ Update mutation
│   │   └── useDelete[Feature].ts       # ❌ Delete mutation
│   ├── views/
│   │   └── [Feature]PageView.tsx       # 📱 Main page wrapper
│   ├── constants.ts                    # 🔗 Endpoints & constants
│   ├── types.ts                        # 🏷️ TypeScript types
│   └── index.ts                        # 📦 Barrel exports
│
├── server/
│   ├── repos/
│   │   └── [feature].repo.ts           # 🗄️ Database operations
│   └── services/
│       └── [feature].service.ts        # ⚙️ Business logic
│
└── shared/validation/
    └── [feature].schema.ts             # ✅ Zod schemas
```

---

## 3) Data Flow

### 🏗️ **Architecture:**

```
🎨 UI → 🪝 Hooks → 🔄 API Client → 🚀 Routes → ⚙️ Services → 🗄️ Repos → 📄 Database
```

### 📝 **Create/Update Flow:**

1. **UI**: Form với React Hook Form + Zod validation
2. **Hook**: `useCreate[Feature]()` mutation
3. **API**: `POST /api/v1/[feature]` → validate body
4. **Service**: Business logic + validation
5. **Repo**: Database operations
6. **Response**: Success → invalidate cache + UI feedback

### 📊 **List/Detail Flow:**

1. **UI**: Component mount → trigger query
2. **Hook**: `use[Feature]s()` với React Query
3. **API**: `GET /api/v1/[feature]` → parse response
4. **Cache**: Store result với staleTime
5. **UI**: Render data với loading/error states

---

## 4) API Contracts

### 📡 **Endpoints:**

```
GET    /api/v1/[feature]           # List với optional filters
POST   /api/v1/[feature]           # Create new (Admin)
GET    /api/v1/[feature]/:id       # Get by ID
PUT    /api/v1/[feature]/:id       # Update (Admin)
DELETE /api/v1/[feature]/:id       # Delete (Admin)
```

### 📥 **Request/Response:**

**Create/Update Request:**

```typescript
{
  name: string;           // Required
  description?: string;   // Optional
  status: 'active' | 'inactive';
}
```

**Response Format:**

```typescript
// Success
{
  id: string;
  name: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

// Error
{
  error: string;
}
```

---

## 5) Validation & Error Handling

### 🎨 **Client-Side:**

- **React Hook Form** + `zodResolver`
- **Real-time validation** với error feedback
- **AntD UI** chỉ render, không validate

### ⚙️ **Server-Side:**

- **Zod parsing** cho request/response
- **ServiceError** với HTTP status codes
- **Error mapping** sang tiếng Việt thân thiện

```typescript
// Error examples
'Not found' → 'Không tìm thấy dữ liệu.'
'Duplicate' → 'Dữ liệu đã tồn tại.'
'Validation error' → 'Thông tin không hợp lệ.'
```

---

## 6) State Management

### 🔄 **React Query:**

```typescript
// Queries
use[Feature]s(filters?) → ['[feature]s', filters]
use[Feature]ById(id) → ['[feature]', id]

// Mutations + Smart Invalidation
useCreate[Feature]() → invalidates ['[feature]s']
useUpdate[Feature]() → invalidates ['[feature]s'], ['[feature]', id]
useDelete[Feature]() → invalidates ['[feature]s']
```

### 🎛️ **UI State:**

- **Modal state**: Component local state
- **Form state**: React Hook Form
- **No Zustand**: Cho server state

---

## 7) Security & Permissions

### 🔐 **Role-based Access:**

- **Admin**: Full CRUD operations
- **User**: Read operations only
- **Server validation**: `requireAdmin()` không trust client

### 🛡️ **Security Measures:**

- Input sanitization với Zod
- Session-based authentication
- SQL injection protection (Prisma)

---

## 8) UI/UX

### 📝 **Form Interface:**

- **Modal form** responsive (85% mobile, 65% desktop)
- **Required fields** với `*` indicator
- **Real-time validation** feedback
- **Loading states** với disabled form

### 📊 **Table Interface:**

- **Action buttons** với tooltips
- **Pagination** (nếu > 20 items)
- **Filters** basic search + status
- **Responsive columns** hide secondary data on mobile

### 📱 **Loading States:**

- ⏳ **Skeleton placeholders** for initial loading
- 🔄 **Loading spinners** for actions
- 📊 **Progress indicators** for long operations

### 🚨 **Error States:**

- ❌ **Validation errors** with inline feedback
- 🚫 **Network errors** with retry options
- 💥 **Server errors** with user-friendly messages

### 🎉 **Success States:**

- ✅ **Success messages** via toast notifications
- 🎯 **Confirmation feedback** for actions
- 🔄 **Auto-refresh data** after mutations

---

## 9) Testing Checklist

### ✅ **Functional:**

- [ ] CRUD operations work correctly
- [ ] Form validation prevents invalid data
- [ ] Error handling shows user-friendly messages
- [ ] Loading states provide feedback
- [ ] Success operations give confirmation

### 🔐 **Security:**

- [ ] Unauthorized access blocked
- [ ] Role permissions enforced
- [ ] Input validation on client + server

### 📱 **UI/UX:**

- [ ] Responsive design on all devices
- [ ] Accessibility keyboard navigation
- [ ] Consistent with app design system

---

## 10) TODO & Implementation

### 🛠️ **Tech Stack:**

- 🎨 **UI**: Ant Design components
- 📝 **Forms**: React Hook Form + Zod validation
- 🔄 **State**: React Query for server state
- 🗄️ **Database**: Prisma ORM
- 🔐 **Auth**: Supabase authentication

### 📋 **Implementation Notes:**

- Consider pagination for large datasets
- Plan for real-time updates if needed
- Design for mobile-first responsive
- Follow project coding conventions

### 🔮 **Future Enhancements:**

- [ ] Advanced search/filtering
- [ ] Bulk operations
- [ ] Export functionality
- [ ] Audit trail logging
- [ ] Real-time notifications

### ⚠️ **Potential Issues:**

- Performance với large datasets
- Complex validation requirements
- Mobile UX considerations
- Integration với existing systems

---

## 🎯 Best Practices

### 📝 **Documentation Rules:**

1. **Consistent numbering**: `001_Feature.md`, `002_Feature.md`
2. **Emoji usage**: Sử dụng emoji cho dễ đọc và phân biệt
3. **Code blocks**: Syntax highlighting cho tất cả code examples
4. **Template sections**: Tuân thủ 10 sections chuẩn

### 🏗️ **Structure Guidelines:**

1. **Feature folder**: Theo convention `api/`, `components/`, `hooks/`, `views/`
2. **Barrel exports**: Luôn có `index.ts` cho clean imports
3. **Type safety**: Zod schemas cho tất cả API contracts
4. **Error handling**: Consistent error format across features
