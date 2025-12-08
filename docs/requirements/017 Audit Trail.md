# 🧩 Requirements: Audit Trail System

> **📋 STATUS: PENDING**
> **📄 Feature Documentation**: `docs/features/AuditTrail.md` (future)
> **🔗 Implementation**: `src/server/services/audit.service.ts` & `src/services/prisma/audit-extension.ts`

## 🎯 Core Requirements

### 📐 **Function Description**

Hệ thống ghi nhận lịch sử thay đổi dữ liệu (Audit Trail) cho các thực thể quan trọng trong hệ thống.
Tự động ghi lại ai, làm gì, khi nào và giá trị trước/sau khi thay đổi.
Bao gồm cơ chế tự động dọn dẹp log quá hạn (Retention Policy 6 tháng).

```
[User Action] ──▶ [Server Action] ──▶ [Prisma Client] ──▶ [Audit Extension] ──▶ [DB: AuditLog]
                                                                  │
                                                                  ▼
                                                              [DB: Models]
```

### 🏗️ **Key Architecture/Model**

```typescript
type AuditLog = {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: string; // Tên bảng (Customer, Appointment...)
  entityId: string;
  oldData: Json | null;
  newData: Json | null;
  performedById: string | null;
  performedAt: Date;
};
```

---

## 🛠️ Technical Implementation

### 📡 **API Endpoints:**

```
GET    /api/v1/audit-logs              # Xem lịch sử (Admin only, có filter)
GET    /api/cron/cleanup-audit-logs    # Cron job dọn dẹp log cũ
```

### 🏗️ **Architecture:**

```
Server Actions → Prisma Client (+ Extension) → Database
Cron Job → API Route → Audit Service → Database
```

### 🗄️ **Repository Pattern (Complex with Audit):**

**Audit Logic (thông qua Prisma Extension):**
Không cần sửa từng repo method `create`/`update`. Extension sẽ tự động intercept.
Tuy nhiên, cần sửa repo để truyền `userId` vào context (thường qua field `updatedById` hoặc `createdById` của data input) để Extension bắt được người thực hiện.

Đối với `DELETE`, cần đảm bảo truyền `userId` (hoặc `deletedById` nếu soft delete) để Extension ghi nhận.

### 📊 **Zod Schemas:**

```typescript
// src/shared/validation/audit-log.schema.ts

export const AuditLogResponseSchema = z.object({
  id: z.string(),
  action: z.string(),
  entity: z.string(),
  entityId: z.string(),
  oldData: z.record(z.unknown()).nullable(),
  newData: z.record(z.unknown()).nullable(),
  performedBy: z.object({
    id: z.string(),
    fullName: z.string(),
  }).nullable(),
  performedAt: z.string().datetime(),
});

export const AuditLogListResponseSchema = z.object({
  items: z.array(AuditLogResponseSchema),
  count: z.number(),
});
```

---

## 🎨 Component Specifications

### 1. 📝 **[Audit Log Table] (Admin Dashboard)**

#### 🎯 **Feature:**
- Xem danh sách log toàn hệ thống hoặc theo từng thực thể (ví dụ: tab "Lịch sử" trong Customer Detail).

#### 🗂️ **Table Columns:**

| Column | Width | Type | Description |
| :--- | :--- | :--- | :--- |
| Thời gian | 160px | DateTime | performAt |
| Người thực hiện | 150px | Text | performedBy.fullName |
| Hành động | 100px | Tag | CREATE (Xanh), UPDATE (Vàng), DELETE (Đỏ) |
| Đối tượng | 120px | Text | Entity + ID |
| Chi tiết | Auto | JSON View | Show Diff (Cũ -> Mới) |

---

## 🔐 Security & Permissions

### 👨‍💼 **Role-based Access:**
- **Admin**: Xem toàn bộ Audit Log.
- **Employee**: Không được xem (hoặc chỉ xem log liên quan đến bản thân - TBD).
- **Cron Job**: Gọi API cleanup với `CRON_SECRET`.

### 🛡️ **Security Measures:**
- `CRON_SECRET` bảo vệ API cleanup.
- Không log các trường nhạy cảm (password, token) - cấu hình trong Extension để exclude.

---

## 🔄 State Management

### 📊 **React Query Integration:**

```typescript
// Queries
useAuditLogs(filters) → useQuery(['audit-logs', filters], getAuditLogsApi)

// Cleanup không cần hook FE vì chạy ngầm
```

---

## ⚡ Performance & Optimization

- **Database Indexing**: Index `[entity, entityId]` để query lịch sử một bản ghi nhanh. Index `[performedAt]` để sort và cleanup nhanh.
- **Retention**: Xóa log > 6 tháng để tránh phình database.

---

## ✅ Acceptance Criteria

### 🧪 **Functional Requirements:**
- [ ] Ghi lại đúng `oldData`/`newData` khi Create/Update Customer.
- [ ] Ghi lại người thực hiện (`performedById`).
- [ ] API Cleanup xóa đúng các log > 6 tháng.
- [ ] API Cleanup trả về 401 nếu sai Secret.

### 🎨 **UI/UX Requirements:**
- [ ] Admin xem được danh sách log.
- [ ] Hiển thị JSON diff dễ nhìn (nếu có UI).
