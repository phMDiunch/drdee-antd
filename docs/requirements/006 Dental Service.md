# Requirements: Dental Service Management System

## Database Model

Prisma Model DentalService: prisma/schema.prisma

Ghi chú mô hình (đã thống nhất):
- Dùng `archivedAt DateTime?` để soft-delete (đồng bộ với Clinics); không dùng `isActive`.
- `price Int` là giá niêm yết toàn cục; thêm `minPrice Int?` là giá nhỏ nhất phục vụ rule nghiệp vụ khi thu tiền.
- `unit`, `serviceGroup`, `department` trước mắt dùng constants (free text/select theo constant), chưa tách bảng.

---

## Core Requirements

### 1. Tạo dịch vụ nha khoa (Create)

#### Permissions

- Chỉ **Admin** mới được tạo dịch vụ nha khoa.
- Kiểm tra quyền ở cả client và server (server là quyết định cuối).

#### UI/UX

- Modal form responsive (85% width mobile, 65% width desktop).
- Real-time validation với error feedback.

#### Form Layout (5 hàng)

```
Hàng 1: [name                 ] [price                 ] [unit                  ]
Hàng 2: [serviceGroup         ] [department            ] [tags                  ]
Hàng 3: [origin               ] [description                                   ]
Hàng 4: [officialWarranty     ] [clinicWarranty                               ]
Hàng 5: [avgTreatmentMinutes  ] [avgTreatmentSessions  ] [archivedAt (read-only)]
```

Ghi chú:
- `unit`, `serviceGroup`, `department`: chọn từ constants (select) hoặc nhập nhanh theo constant list.
- `archivedAt` không hiển thị trong Create; chỉ hiển thị read-only ở Edit khi đã bị lưu trữ.

#### Validation Rules

- `name`: Required, unique, độ dài 2–120 ký tự.
- `price`: Required, `Int >= 0` (VND, đơn vị đồng, không thập phân).
- `unit`: Required (chọn từ constants).
- `avgTreatmentMinutes`, `avgTreatmentSessions`: `Int >= 0` (optional nếu không nhập).
- `tags`: tối đa 10 tag, mỗi tag 1–24 ký tự (chữ/số/gạch), không bắt buộc.
- `minPrice` (server-side rule liên quan đến thanh toán): nếu có phát sinh thu tiền cho dịch vụ này thì số tiền phải > `minPrice` (strictly greater). Không bắt buộc nhập khi tạo; nếu nhập thì phải `Int >= 0` và `minPrice <= price` là hợp lệ về mặt dữ liệu niêm yết (không chặn nghiệp vụ định giá promo về sau).

---

### 2. Danh sách dịch vụ nha khoa (List)

#### Table Features

- Không phân trang (dataset nhỏ, tương tự Clinics).
- Không search backend. Sử dụng filter/sorter sẵn có của AntD Table ở frontend.
- Filter theo cột: Bộ phận (`department`), Nhóm dịch vụ (`serviceGroup`).
- Sorter theo cột: Tên dịch vụ (`name`), Đơn giá (`price`).
- Toggle “Hiển thị archived” — param `includeArchived=0|1` khi gọi API.
- Action buttons: Edit, Archive/Unarchive, Delete (kèm tooltips + Popconfirm).

#### Table Columns

| Column         | Width | Type    | Description                                   |
| -------------- | ----- | ------- | --------------------------------------------- |
| Tên dịch vụ    | Auto  | Text    | `name` (Sorter)                               |
| Nhóm dịch vụ   | 200px | Text    | `serviceGroup` (constant, Filter)             |
| Bộ phận        | 200px | Text    | `department` (constant, Filter)               |
| Đơn vị         | 120px | Text    | `unit` (constant)                             |
| Giá niêm yết   | 160px | Tag     | `price` format VND (Sorter)                   |
| Trạng thái     | 140px | Tag     | Active/Archived (từ `archivedAt`)             |
| Tags           | Auto  | Text    | `tags`                                        |
| Thao tác       | 180px | Actions | Edit/Archive/Unarchive/Delete                 |

#### Components

- `DentalServiceTable.tsx` — reusable table component.
- `DentalServicesPageView.tsx` — page wrapper (filters/sorters + toggle + table + create button).

---

### 3. Chỉnh sửa dịch vụ (Edit)

#### UI/UX

- Dùng chung modal như Create.
- Pre-populate dữ liệu theo item được chọn.
- Hiển thị admin metadata: `createdAt`, `updatedAt`, `archivedAt` (read-only).

#### Behavior

- Cho phép chỉnh sửa tất cả fields trừ `archivedAt` (chỉ thay đổi qua action Archive/Unarchive).
- Unique validation cho `name` (exclude current record).
- Success feedback + auto-close modal + invalidate list/detail queries.

---

### 4. Archive/Delete Operations

#### Archive System (đồng bộ Clinics)

- Soft delete bằng `archivedAt` timestamp.
- Archive: set `archivedAt = now()`.
- Unarchive: set `archivedAt = null`.

#### Delete Logic

```typescript
if (hasLinkedData) {
  throw new Error("Dịch vụ đang có dữ liệu liên kết, chỉ được phép Archive");
} else {
  // Hard delete allowed
}
```

Linked data bao gồm (ít nhất):
- `ConsultedService.dentalServiceId`
- `PaymentVoucherDetail.consultedServiceId` (gián tiếp qua ConsultedService)
- (Tương lai) treatment logs ràng buộc quy trình

#### UI Actions

- Archive button: `<InboxOutlined />` — Lưu trữ
- Unarchive button: `<RollbackOutlined />` — Khôi phục
- Delete button: `<DeleteOutlined />` + Popconfirm

---

### 5. Layout Integration

#### Sidebar Navigation

- Location: Dưới nhóm “Cài đặt (Settings)”.
- Menu item: “Dịch vụ nha khoa”.
- Route: `/dental-services`.
- Icon: liên quan dịch vụ nha khoa (đã có trong menu.config.tsx).

---

## Technical Implementation

### API Endpoints

```
GET    /api/v1/dental-services?includeArchived=0|1
POST   /api/v1/dental-services                 (Admin only)
GET    /api/v1/dental-services/:id
PUT    /api/v1/dental-services/:id             (Admin only)
DELETE /api/v1/dental-services/:id             (Admin only)
POST   /api/v1/dental-services/:id/archive     (Admin only)
POST   /api/v1/dental-services/:id/unarchive   (Admin only)
```

Ghi chú:
- Không hỗ trợ search backend. Lọc/sắp xếp thực hiện tại frontend dựa trên dữ liệu đã tải.
- `includeArchived` = 0 (mặc định) chỉ trả về Active; = 1 trả về cả Archived.
- Rule minPrice áp dụng ở service thanh toán: nếu tạo PaymentVoucherDetail cho dịch vụ này mà có `amount` thì `amount > minPrice` (server-side guard), đồng thời cho phép business giảm giá/promotions miễn phù hợp rule này.

### Architecture

```
UI Components + Custom Hooks + API Client + Routes + Services + Repository + Database
```

### State Management

- React Query cho server state.
- Query keys: `['dental-services', { includeArchived }]`, `['dental-service', id]`.

### Validation Stack

- Client: React Hook Form + Zod resolver.
- Server: Zod schemas tại `src/shared/validation/dental-service.schema.ts`.
- Database: Prisma constraints (unique name, archivedAt soft-delete).

Zod gợi ý:

- `CreateDentalServiceRequestSchema`:
  - name (string.min(2).max(120)), price (int >= 0), unit (enum từ constants hoặc string regex),
  - serviceGroup/department (optional, từ constants), tags (array string, max 10),
  - minPrice (optional int >= 0, refine: minPrice <= price),
  - officialWarranty/clinicWarranty/origin/description (optional),
  - avgTreatmentMinutes/avgTreatmentSessions (optional int >= 0).
- `UpdateDentalServiceRequestSchema`: giống create, tất cả optional trừ id context; không cho set `archivedAt` trực tiếp.
- `DentalServiceResponseSchema`, `DentalServiceListResponseSchema` theo model.

---

## Security & Permissions

- Admin: Create, Update, Delete, Archive, Unarchive (server-side guard `requireAdmin()`).
- Authenticated users: View list, View details.
- Measures: Session validation, server-side role checking, input sanitization, Prisma query safety.

---

## Performance & Optimization

- React Query cache: `staleTime` 60s cho list, 60s cho detail.
- Smart invalidation sau mutations.
- Index gợi ý (DB): `@@index([archivedAt])`, `@@index([serviceGroup])`, `@@index([department])`, tùy nhu cầu filter tương lai.

---

## Acceptance Criteria

### Testing Checklist

- [ ] Admin có thể tạo/sửa/xoá/archive/unarchive dịch vụ.
- [ ] User đăng nhập có thể xem list và chi tiết.
- [ ] Validation hoạt động đúng: name unique; price/unit required; avg* >= 0.
- [ ] List: filter (department, serviceGroup) và sorter (name, price) hoạt động ở frontend; toggle includeArchived hoạt động.
- [ ] Archive/Unarchive: cập nhật trạng thái và phản ánh trên UI.
- [ ] Delete: chặn khi có dữ liệu liên kết; cho phép khi không có.
- [ ] Modal responsive, loading/error/success states rõ ràng.

### Quality Standards

- TypeScript strict mode, Zod validation ở client/server.
- Error mapping thân thiện, dùng notify utils.
- Accessibility cơ bản, hiệu năng ổn định.

