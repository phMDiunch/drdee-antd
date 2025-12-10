# 016 Labo Management - Overview

## 📋 Tổng Quan

**Module**: Quản lý Labo - Xưởng Răng Giả

**Mục đích**: Quản lý quy trình gửi và nhận mẫu răng giả từ xưởng labo, theo dõi chi phí, bảo hành, và báo cáo hiệu suất.

**Phạm vi**:

- Quản lý danh mục răng giả (master data)
- Quản lý bảng giá dịch vụ labo của từng xưởng
- Theo dõi đơn hàng labo (gửi mẫu → nhận mẫu → lắp cho khách)
- Báo cáo theo nhiều chiều: xưởng, bác sĩ, khách hàng, dịch vụ

---

## 🎯 Business Flow

```
1. Setup Master Data
   ├─ Tạo danh mục răng giả (LaboItem)
   ├─ Thêm xưởng labo vào Supplier
   └─ Setup bảng giá dịch vụ cho từng xưởng

2. Quy trình điều trị
   ├─ Khách hàng chốt dịch vụ răng sứ
   ├─ Bác sĩ mài răng, lấy dấu
   ├─ Nhân viên tạo đơn gửi mẫu
   └─ Gửi mẫu đến xưởng labo

3. Xử lý đơn hàng
   ├─ Xưởng sản xuất răng giả
   ├─ Trả mẫu về clinic
   ├─ Nhân viên nhận mẫu, cập nhật hệ thống
   └─ Bác sĩ lắp răng cho khách hàng

4. Báo cáo & thanh toán
   ├─ Xem báo cáo chi phí labo
   └─ Thanh toán xưởng (manual, qua phiếu chi)
```

---

## 📦 Module Structure

### 1. **Danh mục Labo** (`016.1`)

- CRUD danh mục răng giả
- Phân nhóm theo dịch vụ (răng sứ kim loại, răng toàn sứ...)
- Đơn vị tính từ master data

### 2. **Bảng giá Labo** (`016.2`)

- CRUD bảng giá theo từng xưởng
- Mỗi xưởng có giá và bảo hành riêng cho từng loại răng
- Cập nhật giá trực tiếp (không version history)

### 3. **Theo dõi hàng ngày** (`016.3`)

- Daily view: Mẫu gửi đi + Mẫu nhận về
- Statistics cards
- Quick actions (Tạo đơn, Cập nhật trạng thái)

### 4. **Báo cáo Labo** (`016.4`)

- Multi-dimension reports với drill-down
- Theo: xưởng, bác sĩ, ngày, clinic, dịch vụ
- Metrics: Số lượng, Chi phí
- Export Excel

---

## 🗂️ Database Schema Overview

### Core Tables

```prisma
// Master data - Danh mục răng giả
LaboItem {
  id: uuid
  name: String @unique         // "Răng sứ Katana"
  serviceGroup: String         // "rang-toan-su" (string value, not FK)
  unit: String                 // "rang" (string value, not FK)
  description: String?
  archivedAt: DateTime?
}

// Bảng giá dịch vụ labo
SupplierLaboPrice {
  id: uuid
  supplierId: String           // Xưởng labo
  laboItemId: String           // Loại răng giả
  price: Decimal               // Giá 1 đơn vị
  warranty: String             // "5-nam" (string value, not FK)
  @@unique([supplierId, laboItemId])
}

// Đơn hàng labo
LaboOrder {
  id: uuid

  // Thông tin khách hàng & điều trị
  customerId: String
  treatmentDate: DateTime      // Ngày bác sĩ điều trị
  doctorId: String

  // Thông tin đơn hàng
  supplierId: String           // Xưởng
  laboItemId: String           // Loại răng giả
  quantity: Int
  orderType: Enum              // lam-moi | bao-hanh
  detailRequirement: String?   // Màu sắc, yêu cầu chi tiết

  // Tracking
  sentDate: DateTime           // Ngày gửi mẫu
  sentById: String             // Người gửi
  returnDate: DateTime?        // Ngày trả mẫu
  receivedById: String?        // Người nhận
  expectedFitDate: DateTime    // Ngày hẹn lắp

  // Snapshot pricing (denormalized)
  unitPrice: Decimal           // Giá tại thời điểm tạo
  totalCost: Decimal           // unitPrice × quantity
  warranty: String             // "5-nam" (snapshot)
  warrantyLabel: String        // "5 năm" (for display)

  // Metadata
  clinicId: String
  createdById: String
  updatedById: String
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Master Data Requirements

Cần seed các MasterData groups sau:

#### 1. nhom-dich-vu-labo (Nhóm dịch vụ Labo)

```typescript
[
  {
    key: "rang-su-kim-loai",
    label: "Răng sứ kim loại",
    description: "Răng sứ phủ kim loại (IPL)",
  },
  {
    key: "rang-toan-su",
    label: "Răng toàn sứ",
    description: "Răng sứ nguyên khối (Zirconia, Katana...)",
  },
  {
    key: "chinh-nha",
    label: "Chỉnh nha",
    description: "Hàm duy trì, khí cụ chỉnh nha",
  },
  {
    key: "phuc-hinh-thao-lap",
    label: "Phục hình tháo lắp",
    description: "Hàm giả, khung hàm...",
  },
];
```

#### 2. don-vi-tinh-labo (Đơn vị tính Labo)

```typescript
[
  { key: "rang", label: "Răng" },
  { key: "cai", label: "Cái" },
  { key: "bo", label: "Bộ" },
  { key: "ham", label: "Hàm" },
];
```

#### 3. bao-hanh-labo (Bảo hành Labo)

```typescript
[
  { key: "6-thang", label: "6 tháng" },
  { key: "1-nam", label: "1 năm" },
  { key: "2-nam", label: "2 năm" },
  { key: "5-nam", label: "5 năm" },
  { key: "7-nam", label: "7 năm" },
  { key: "10-nam", label: "10 năm" },
];
```

#### 4. loai-ncc (Supplier Types) - Add new type

```typescript
[...existing, { key: "labo-xuong-rang-gia", label: "Xưởng răng giả" }];
```

**Note**: serviceGroup, unit, warranty trong LaboItem và SupplierLaboPrice lưu **key string** (vd: "rang-toan-su", "5-nam"), frontend sẽ lookup label từ MasterData cache.

---

## 🎨 UI/UX Structure

### Sidebar Menu

```
📦 Quản lý tồn kho
  └─ ...existing items

🦷 Labo - Xưởng răng giả          ← NEW SECTION
  └─ Danh mục                      /labo-items (Admin only)
  └─ Bảng giá                      /labo-services (Admin only)
  └─ Hàng ngày                     /labo-orders/daily ⭐ Default

📊 Báo Cáo
  └─ ...existing reports
  └─ Labo                          /reports/labo
```

### Route Structure

```typescript
/labo                             // Redirect to /labo-orders/daily
/labo-items                       // Danh mục răng giả (CRUD) - Admin only
/labo-services                    // Bảng giá labo (CRUD) - Admin only
/labo-orders/daily                // Daily tracking view
/reports/labo                     // Reports with drill-down (in Reports section)
```

---

## 🔐 Permissions

### Master Data (Admin Only)

- **Danh mục Labo (016.1)**: Chỉ admin xem và quản lý
- **Bảng giá Labo (016.2)**: Chỉ admin xem và quản lý
- Lý do: Dữ liệu nhạy cảm, ảnh hưởng giá thành

### Daily Operations (Admin + Employee)

- **Hàng ngày (016.3)**: admin, employee
- Tạo/sửa/xóa đơn hàng: admin, employee
- Nhận mẫu: admin, employee

### Reports (Admin + Manager)

- **Báo cáo Labo (016.4)**: admin, manager
- Export Excel: admin, manager

### Phase 2: Role-based (Future)

```
Admin:
  - Full access all clinics
  - Manage master data (LaboItem, SupplierLaboPrice)

Manager/Doctor:
  - View all orders in their clinic
  - Create/Edit/Delete orders in their clinic

Nurse/Receptionist:
  - Create orders (send samples)
  - Update receive status
  - View orders in their clinic
```

---

## 📊 Key Features

### 1. **Master Data Management**

- ✅ Danh mục răng giả với nhóm dịch vụ
- ✅ Bảng giá theo xưởng, cập nhật trực tiếp
- ✅ Tích hợp master data: nhóm DV, đơn vị, bảo hành

### 2. **Order Tracking**

- ✅ Daily view: Mẫu gửi + Mẫu nhận hôm nay
- ✅ Full lifecycle: Tạo → Gửi → Nhận → Lắp
- ✅ Phân loại: Làm mới (có phí) vs Bảo hành (miễn phí)
- ✅ Snapshot pricing tại thời điểm đặt hàng

### 3. **Integration**

- ✅ Link với Customer (tab Labo trong customer detail)
- ✅ Link với Employee (doctor, sentBy, receivedBy)
- ✅ Link với Clinic (multi-clinic support)
- ⏳ Future: Link với ConsultedService/TreatmentLog

### 4. **Reporting**

- ✅ Multi-dimension: Xưởng, Bác sĩ, Ngày, Clinic, Dịch vụ
- ✅ Drill-down detail panel (giống Sales Report)
- ✅ Export Excel với full details
- ✅ Cost analysis & metrics

---

## 🚀 Implementation Order

### Phase 1: Core Setup (Priority 1)

1. Master data: LaboItem CRUD
2. Supplier: Add labo type, bảng giá CRUD
3. LaboOrder: Schema + Basic CRUD

### Phase 2: Daily Operations (Priority 2)

4. Daily View: Theo dõi gửi/nhận hàng ngày
5. Customer Integration: Tab Labo

### Phase 3: Analytics (Priority 3)

6. Reports: Multi-dimension với drill-down
7. Export Excel
8. Dashboard widgets

### Phase 4: Advanced (Future)

9. Link với TreatmentLog
10. Notifications (ngày hẹn lắp sắp đến)
11. Quality tracking (sửa lại, khiếu nại)
12. Payment integration (phiếu chi)
13. Order Management view (Full CRUD với filters)

---

## 📝 Technical Notes

### Data Integrity

- LaboOrder lưu **snapshot** giá và bảo hành (denormalized)
- Các trường khác (customer, doctor, supplier names) query qua JOIN

### Performance

- Daily view: Index trên `sentDate`, `returnDate`
- Reports: Index trên `returnDate`, `supplierId`, `doctorId`, `clinicId`
- Denormalized warranty label để tránh JOIN với MasterData

### Caching Strategy

- Master data (LaboItem, SupplierLaboPrice): staleTime = Infinity
- Orders: staleTime = 1 minute (tháng hiện tại), 1 hour (tháng cũ)
- Reports: staleTime = 2 minutes (tháng hiện tại), 2 hours (tháng cũ)

---

## 🔗 Related Documents

- `016.1 Labo Item Master.md` - Danh mục răng giả (Admin only)
- `016.2 Labo Service Prices.md` - Bảng giá xưởng (Admin only)
- `016.3 Labo Orders - Daily View.md` - Theo dõi hàng ngày (Admin, Employee)
- `016.4 Labo Reports.md` - Báo cáo & analytics (in Reports section)

---

**Version**: 1.0  
**Last Updated**: 2025-12-03  
**Status**: Draft - Ready for Review
