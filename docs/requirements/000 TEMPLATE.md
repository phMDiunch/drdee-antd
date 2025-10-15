# 🧩 Requirements: [Feature Name] System

## 🎯 Core Requirements

### 📐 **[Core Function Description]**

```
[Visual diagram or flow diagram if needed]
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   State A   │───▶│  Process B  │───▶│   State C   │
└─────────────┘    └─────────────┘    └─────────────┘
```

### 🏗️ **[Key Architecture/Model]**

```typescript
// Core data model or interface
type [FeatureName] = {
  id: string;
  // Core properties
  name: string;
  status: 'active' | 'inactive';

  // Metadata
  createdAt: Date;
  updatedAt: Date;
};
```

---

## 🛠️ Technical Implementation

### 📡 **API Endpoints:**

```
GET    /api/v1/[feature]               # List items
POST   /api/v1/[feature]               # Create new
GET    /api/v1/[feature]/:id           # Get by ID
PUT    /api/v1/[feature]/:id           # Update
DELETE /api/v1/[feature]/:id           # Delete
```

### 🏗️ **Architecture:**

```
UI Components → Custom Hooks → API Client → Routes → Services → Repository → Database
```

### 📊 **Zod Schemas (Single Source of Truth):**

```typescript
// Định nghĩa trong src/shared/validation/[feature].schema.ts
export const Create[Feature]RequestSchema = z.object({
  name: z.string().min(1).max(100),
  // Other required fields
});

export const [Feature]ResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  // Full object structure
});

export const [Feature]ListResponseSchema = z.array([Feature]ResponseSchema);

// Types sử dụng trực tiếp (không cần file types.ts riêng)
import type { z } from "zod";
type CreateRequest = z.infer<typeof Create[Feature]RequestSchema>;
type [Feature] = z.infer<typeof [Feature]ResponseSchema>;
```

---

## 🎨 Component Specifications

### 1. 📝 **[Main Form Component]**

#### 🎯 **Layout & Design:**

- **Modal/Page**: Responsive width (85% mobile, 65% desktop)
- **Form layout**: Grid or flexible layout
- **Real-time validation**: With error feedback

#### 📝 **Form Structure:**

```
┌─────────────────────────────────────┐
│              [Title]                │
├─────────────────────────────────────┤
│ Field 1   [_________________]       │
│ Field 2   [_________________]       │
│           [   Submit   ] [Cancel]   │
└─────────────────────────────────────┘
```

#### ✅ **Validation Rules:**

- `field1`: Required, specific format/constraints
- `field2`: Optional, specific validation
- **Client validation**: React Hook Form + Zod
- **Server validation**: Zod schema matching

---

### 2. 📋 **[List/Table Component]**

#### 📊 **Table Features:**

- **Pagination**: If > 20 items, else simple list
- **Filters**: Basic search and status filters
- **Actions**: Edit, Delete, [Custom actions]

#### 🗂️ **Table Columns:**

| Column    | Width | Type    | Description         |
| --------- | ----- | ------- | ------------------- |
| [Field 1] | 140px | Text    | Primary identifier  |
| [Field 2] | Auto  | Text    | Main content        |
| [Field 3] | 120px | Tag     | Status/Category     |
| Actions   | 150px | Actions | Edit/Delete buttons |

---

## 🔐 Security & Permissions

### 👨‍💼 **Role-based Access:**

- **Admin**: Full CRUD operations
- **User**: Read and limited operations
- **Guest**: Read-only access (if applicable)

### 🛡️ **Security Measures:**

- Input sanitization with Zod
- Server-side role validation
- SQL injection protection (Prisma)
- CSRF protection (Supabase)

---

## 📱 User Experience

### 🎯 **Main User Flow:**

1. User navigates to [feature] page
2. View list of existing items
3. Click "Add New" → Open form modal
4. Fill form with validation feedback
5. Submit → Success message → List refresh
6. Edit/Delete actions with confirmation

### 🚨 **Error Handling:**

```typescript
// Error message mapping
'Validation error' → 'Thông tin không hợp lệ. Vui lòng kiểm tra lại.'
'Not found' → 'Không tìm thấy dữ liệu.'
'Conflict' → 'Dữ liệu đã tồn tại.'
'Server error' → 'Lỗi máy chủ. Vui lòng thử lại.'
```

### 📱 **Responsive Design:**

- **Mobile**: Stack form fields, full-width modals
- **Desktop**: Grid layout, optimal modal sizing
- **Loading states**: Skeleton screens and spinners
- **Empty states**: Helpful placeholder content

---

## 🔄 State Management

### 📊 **React Query Integration:**

```typescript
// Constants (trong features/[feature]/constants.ts)
export const [FEATURE]_ENDPOINTS = {
  ROOT: "/api/v1/[feature]",
  BY_ID: (id: string) => `/api/v1/[feature]/${id}`,
} as const;

export const [FEATURE]_QUERY_KEYS = {
  list: (filters?: any) => ['[feature]s', filters] as const,
  byId: (id: string) => ['[feature]', id] as const,
} as const;

// Query hooks (export từ hooks/index.ts)
use[Feature]s() → useQuery([FEATURE]_QUERY_KEYS.list(), get[Feature]sApi)
use[Feature]ById(id) → useQuery([FEATURE]_QUERY_KEYS.byId(id), get[Feature]ByIdApi)

// Mutation hooks với useNotify()
useCreate[Feature]() → useMutation(create[Feature]Api, {
  onSuccess: () => {
    notify.success([FEATURE]_MESSAGES.CREATE_SUCCESS);
    queryClient.invalidateQueries([FEATURE]_QUERY_KEYS.list());
  },
  onError: (e) => notify.error(e, { fallback: [FEATURE]_MESSAGES.UNKNOWN_ERROR })
})

useUpdate[Feature]() → useMutation(update[Feature]Api, ...)
useDelete[Feature]() → useMutation(delete[Feature]Api, ...)
```

### 🎛️ **Cache Strategy:**

- **List queries**: staleTime 60s, refetch on window focus
- **Detail queries**: staleTime 5 minutes
- **Smart invalidation**: Invalidate related queries on mutations

---

## 📡 API Specifications

### 📥 **Create/Update Request:**

```typescript
// Định nghĩa trong src/shared/validation/[feature].schema.ts
export const Create[Feature]RequestSchema = z.object({
  name: z.string().min(1, "Vui lòng nhập tên"),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
});

export const Update[Feature]RequestSchema = Create[Feature]RequestSchema.extend({
  id: z.string().uuid("ID không hợp lệ"),
});

// Sử dụng trong components/hooks
import type { z } from "zod";
type CreateRequest = z.infer<typeof Create[Feature]RequestSchema>;
```

### 📤 **Response Format:**

```typescript
// Trong schema file
export const [Feature]ResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(['active', 'inactive']),
  createdAt: z.string(), // ISO date
  updatedAt: z.string(), // ISO date
});

export const [Feature]ListResponseSchema = z.array([Feature]ResponseSchema);

// Error response (standardized)
// { error: string } - handled by API client + useNotify
```

---

## ⚡ Performance & Optimization

### 🔄 **Caching Strategy:**

- React Query for server state
- Local storage for user preferences
- Optimistic updates for better UX

### 🎯 **Performance Targets:**

- **Page load**: < 2s
- **Form submission**: < 1s
- **List rendering**: < 500ms
- **Search results**: < 300ms

---

## ✅ Acceptance Criteria

### 🧪 **Functional Requirements:**

- [ ] CRUD operations work correctly
- [ ] Form validation prevents invalid data
- [ ] Error messages are user-friendly
- [ ] Loading states provide feedback
- [ ] Success actions give confirmation
- [ ] Permissions enforce correctly
- [ ] Responsive design works on all devices

### 🎨 **UI/UX Requirements:**

- [ ] Consistent design with app theme
- [ ] Accessible for keyboard navigation
- [ ] Proper focus management
- [ ] Clear visual hierarchy
- [ ] Intuitive user interactions
- [ ] Fast and smooth animations

### 🔐 **Security Requirements:**

- [ ] Input validation on client and server
- [ ] Role-based access control working
- [ ] No sensitive data exposure
- [ ] CSRF protection active
- [ ] SQL injection prevention

### 📱 **Technical Requirements:**

- [ ] TypeScript strict mode compliance
- [ ] Clean component architecture
- [ ] Proper error boundaries
- [ ] Performance optimization
- [ ] Code follows project conventions

---

## 📋 Future Enhancements

### 🔮 **Planned Features:**

- [ ] **Advanced search**: Multiple filter criteria
- [ ] **Bulk operations**: Multi-select actions
- [ ] **Export functionality**: CSV/Excel export
- [ ] **Audit trail**: Change history tracking
- [ ] **Real-time updates**: WebSocket integration
- [ ] **Offline support**: PWA capabilities

### 🛠️ **Technical Improvements:**

- [ ] **Performance**: Virtual scrolling for large lists
- [ ] **Accessibility**: Enhanced keyboard navigation
- [ ] **Analytics**: User interaction tracking
- [ ] **Caching**: Advanced caching strategies
- [ ] **Testing**: Comprehensive test coverage

---

## 📝 Notes & Considerations

### 💡 **Implementation Notes:**

- Consider database performance for large datasets
- Plan for internationalization if needed
- Design for extensibility and maintainability
- Follow established project patterns

### ⚠️ **Potential Challenges:**

- Complex validation rules may need custom logic
- Large datasets might require advanced filtering
- Mobile UX may need special consideration
- Integration with existing systems

### 🎯 **Success Metrics:**

- User completion rate > 95%
- Error rate < 1%
- Performance within targets
- User satisfaction score > 4.5/5
