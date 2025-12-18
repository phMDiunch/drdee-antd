# 🎯 Requirements: Hệ Thống Sales Pipeline

> **📋 TRẠNG THÁI: 📝 CHỜ TRIỂN KHAI**  
> **🔗 Liên quan**: `009 Consulted-Service.md`, `006 Dental Service.md`, `121 Generic Kanban Component.md`  
> **🔧 Cập nhật lần cuối**: 2025-12-17  
> **📌 Version**: 2.0 - Added Stage Management, Kanban View, Analytics

## 📊 Tham khảo

- **Prisma Models**:
  - `ConsultedService` (đã có - bao gồm `source`, `sourceNote`, thêm field `stage`)
  - `DentalService` (field `requiresFollowUp`)
  - `SalesActivityLog` (model mới)
  - `StageHistory` (model mới - track stage transitions)
- **Requirements liên quan**:
  - `009 Consulted-Service.md` - Quản lý dịch vụ tư vấn cơ bản
  - `006 Dental Service.md` - Cấu hình dịch vụ

---

## 🎯 Mục Tiêu

**Mục tiêu Kinh doanh:**

- Quản lý sales pipeline với các stages rõ ràng (Offline: Đã đến → Đang tư vấn → Đã báo giá → Đã cọc → Đã làm)
- Phân công sale tự động cho các dịch vụ cần theo dõi
- Theo dõi lịch sử tiếp xúc giữa sale và khách hàng
- **Theo dõi chính xác stage transitions** với validation rules (không nhảy cóc, không lùi)
- **Visualize pipeline qua Kanban View** với drag & drop
- **Đo lường tỷ lệ chuyển đổi và hiệu suất bán hàng** theo từng stage với analytics dashboard
- **Phân tích lost customers** - biết khách hàng thất bại ở giai đoạn nào
- Hỗ trợ cả kênh Offline (walk-in) và Online (lead) trong tương lai

**User Stories:**

1. **Với vai trò Sale**, tôi muốn nhận các dịch vụ trong pipeline để quản lý khách hàng của mình
2. **Với vai trò Sale**, tôi muốn ghi lại các hoạt động tiếp xúc (gọi điện, nhắn tin, gặp mặt) để có lịch sử đầy đủ
3. **Với vai trò Sale**, tôi muốn xem tất cả dịch vụ đang quản lý theo stage trong **Kanban board**
4. **Với vai trò Sale**, tôi muốn **chuyển stage** của dịch vụ bằng cách drag & drop hoặc button
5. **Với vai trò Admin**, tôi muốn chuyển dịch vụ cho sale khác khi cần thiết
6. **Với vai trò Manager**, tôi muốn xem **conversion funnel** và biết khách thất bại ở stage nào
7. **Với vai trò Manager**, tôi muốn xem **hiệu suất từng sale** (số deal, win rate, avg time per stage)

---

## 🎲 Nhật Ký Quyết Định

### 1. **Mô hình Phân công Sale**

**Quyết định**: Dùng button thay vì field trong form

> **Lưu ý**: ConsultedService **đã có sẵn** field `consultingSaleId`, chỉ cần thay đổi UI pattern.

- ❌ Xóa field `consultingSaleId` khỏi modal Tạo/Sửa (nếu đang hiển thị)
- ✅ Trong bảng ConsultedService: Nếu `requiresFollowUp = true` và `consultingSaleId = null` → hiện button "Nhận quản lý"
- ✅ Nếu đã có `consultingSaleId` → hiển thị tên sale
- ✅ Pattern tương tự button cập nhật Trạng thái DV

**Lý do:**

- UX đơn giản hơn - không cần chọn từ dropdown
- Sale tự phân công dựa trên sẵn sàng
- Giảm công việc cho admin

### 2. **Mô hình Phân quyền**

**Quyết định**: Phân công mở (Giai đoạn 1)

- ✅ Bất kỳ Employee/Admin nào cũng có thể nhận
- ✅ Ai nhanh tay hơn
- ✅ Sau khi nhận, không thể hủy nhận (chỉ admin mới reassign được)

**Tương lai**: Lọc theo vai trò (Giai đoạn 2)

- Lọc theo `jobTitle/team = "Sale"`

### 3. **Hành vi khi Toggle requiresFollowUp**

**Kịch bản**: Admin đổi `DentalService.requiresFollowUp` từ `true` thành `false`

**Quyết định**: Giữ `consultingSaleId` (để audit trail)

- ✅ ConsultedService giữ nguyên giá trị `consultingSaleId`
- ✅ Bảng ẩn tên sale nếu `requiresFollowUp = false`
- ✅ Sales Pipeline dashboard lọc bỏ các dịch vụ này
- ✅ Các bản ghi SalesActivityLog vẫn giữ nguyên

**Kịch bản**: Admin đổi từ `false` thành `true`

- ✅ Button "Nhận quản lý" xuất hiện với dịch vụ chưa được nhận
- ✅ Sale có thể nhận bình thường

### 4. **Ghi Log Hoạt động**

**Quyết định**: Chỉ ghi contact activities (không ghi system events)

- ✅ Ghi tất cả hoạt động tiếp xúc thực sự với khách (call, message, meet)
- ✅ System events (claim, reassign) ghi vào Audit Trail chung
- ✅ Theo dõi timeline cho số liệu hiệu suất

**Triển khai**: Model `SalesActivityLog` với 3 loại contact

### 5. **Stage Management & Validation**

**Quyết định**: Sử dụng bảng `StageHistory` riêng để track transitions

- ✅ **Stage transitions phải tuần tự** - Không cho nhảy cóc (ARRIVED → CONSULTING → QUOTED → DEPOSIT → TREATING)
- ✅ **Không cho chuyển ngược** - Hành động thực tế (báo giá, cọc) không thể undo
- ✅ **Cho phép chuyển sang LOST** từ bất kỳ stage nào
- ✅ **Bảng StageHistory** capture tất cả transitions với timestamp và user
- ✅ **Không dùng snapshot trong SalesActivityLog** - Stage history độc lập với activities
- ✅ **Stage validation** ở cả frontend (UI disable) và backend (throw error)

**Lý do chọn StageHistory:**

- Capture 100% transitions (không phụ thuộc vào việc sale có contact hay không)
- Tính toán chính xác thời gian ở mỗi stage
- Biết chính xác khách lost từ stage nào (via `fromStage` field)
- Clean data - không bị nhiễu bởi "chuyển nhầm" (validation rules prevent)
- Support analytics và funnel reports chính xác

### 6. **serviceStatus vs stage**

**Quyết định**: Giữ `serviceStatus` đơn giản, dùng `stage` cho pipeline flow

- ✅ `serviceStatus`: Chỉ 2 giá trị ("Chưa chốt" | "Đã chốt") - commitment status
- ✅ `stage`: Track vị trí trong pipeline (ARRIVED → CONSULTING → ... → LOST)
- ❌ KHÔNG thêm "Thất bại" vào serviceStatus (trùng với stage = LOST)
- ✅ Khi khách thất bại: Set `stage = "LOST"` + ghi `reason` vào StageHistory

---

## 📐 Database Schema

### Pipeline Stages Constants

**Offline Pipeline (Hiện tại):**

```typescript
const OFFLINE_STAGES = [
  { key: "ARRIVED", title: "Đã đến", color: "purple" },
  { key: "CONSULTING", title: "Đang tư vấn", color: "orange" },
  { key: "QUOTED", title: "Đã báo giá", color: "gold" },
  { key: "DEPOSIT", title: "Đã cọc", color: "green" },
  { key: "TREATING", title: "Đã làm", color: "lime" },
  { key: "LOST", title: "Thất bại", color: "red" },
];
```

**Online Pipeline (Tương lai):**

```typescript
const ONLINE_STAGES = [
  { key: "NEW", title: "Mới", color: "blue" },
  { key: "CONTACTING", title: "Đang liên hệ", color: "cyan" },
  { key: "SCHEDULED", title: "Đã đặt lịch", color: "geekblue" },
  { key: "ARRIVED", title: "Đã đến ✅", color: "purple" },
  { key: "LOST", title: "Thất bại", color: "red" },
];
```

> **Lưu ý**: ConsultedService đã có sẵn fields `source` và `sourceNote` để phân biệt offline/online.

---

### Model Mới: SalesActivityLog

```prisma
model SalesActivityLog {
  id String @id @default(uuid())

  // Liên kết
  consultedServiceId String
  consultedService   ConsultedService @relation(fields: [consultedServiceId], references: [id], onDelete: Cascade)

  employeeId String
  employee   Employee @relation("SalesActivityLogs", fields: [employeeId], references: [id])

  // Thông tin Tiếp xúc
  contactType String // "call" | "message" | "meet"
  contactDate DateTime @default(now()) @db.Timestamptz

  // Nội dung & Chi tiết
  content String // Nội dung ghi chú, tóm tắt cuộc gọi, kết quả gặp mặt (bắt buộc)

  // Kế hoạch Tiếp xúc Tiếp theo
  nextContactDate DateTime? @db.Date // Ngày dự kiến liên hệ tiếp

  // Metadata
  createdAt DateTime @default(now()) @db.Timestamptz
  updatedAt DateTime @updatedAt @db.Timestamptz

  // Indexes để tối ưu query
  @@index([consultedServiceId, contactDate(sort: Desc)])
  @@index([employeeId, contactDate(sort: Desc)])
  @@index([contactType, contactDate])
}
```

**Các Loại Tiếp xúc:**

- `call`: Gọi điện cho khách hàng
- `message`: Nhắn tin (Zalo, SMS, Facebook Messenger, v.v.)
- `meet`: Gặp trực tiếp khách hàng (tại phòng khám, ngoài, sự kiện)

> **📌 LƯU Ý**: SalesActivityLog CHỈ ghi nhận **tiếp xúc thực sự với khách hàng**.  
> Các hành động hệ thống (nhận quản lý, chuyển sale) sẽ được ghi trong **Audit Trail chung** của app.
>
> **📌 QUAN TRỌNG**: `consultingSaleId` **ĐÃ TỒN TẠI** trong model ConsultedService. Feature này chỉ thay đổi UI pattern từ form field sang button.

**Thêm vào model Employee:**

```prisma
model Employee {
  // ... các fields hiện có
  salesActivityLogs SalesActivityLog[] @relation("SalesActivityLogs")
  stageChanges StageHistory[] @relation("StageChangedBy")
}
```

**Thêm vào model ConsultedService:**

```prisma
model ConsultedService {
  // ... các fields hiện có

  // Ghi chú: Các fields sau ĐÃ TỒN TẠI:
  // - source: String? (nguồn khách)
  // - sourceNote: String? (ghi chú nguồn)
  // - consultingSaleId: String? (sale tư vấn)
  // - consultingSale: Employee? @relation("ConsultingSaleServices")

  // MỚI THÊM:
  stage String // "ARRIVED" | "CONSULTING" | "QUOTED" | "DEPOSIT" | "TREATING" | "LOST" (no default)

  // Relations
  salesActivityLogs SalesActivityLog[]
  stageHistory StageHistory[]

  // Index for performance
  @@index([stage, consultationDate(sort: Desc)])
}
```

---

### Model Mới: StageHistory

```prisma
model StageHistory {
  id String @id @default(uuid())

  // Liên kết
  consultedServiceId String
  consultedService ConsultedService @relation(fields: [consultedServiceId], references: [id], onDelete: Cascade)

  // Stage Transition
  fromStage String? // null for first stage entry
  toStage String // New stage

  // Metadata
  changedAt DateTime @default(now()) @db.Timestamptz
  changedById String
  changedBy Employee @relation("StageChangedBy", fields: [changedById], references: [id])

  reason String? // CRITICAL when toStage = "LOST" (e.g., "Giá cao", "Không liên lạc được")

  // Indexes for analytics queries
  @@index([consultedServiceId, changedAt])
  @@index([toStage, changedAt])
  @@index([fromStage, toStage]) // For funnel analysis
}
```

**Stage Flow Rules:**

```typescript
const STAGE_FLOW = {
  ARRIVED: ["CONSULTING", "LOST"],
  CONSULTING: ["QUOTED", "LOST"],
  QUOTED: ["DEPOSIT", "LOST"],
  DEPOSIT: ["TREATING", "LOST"],
  TREATING: [], // Terminal state
  LOST: [], // Terminal state
} as const;
```

**Validation Logic:**

```typescript
function validateStageTransition(fromStage: string, toStage: string) {
  const allowedNextStages = STAGE_FLOW[fromStage];
  if (!allowedNextStages.includes(toStage)) {
    throw new Error(
      `Không thể chuyển từ "${fromStage}" sang "${toStage}". ` +
        `Chỉ có thể chuyển sang: ${allowedNextStages.join(", ")}`
    );
  }
}
```

**Analytics Queries:**

```sql
-- Biết khách lost ở stage nào
SELECT
  fromStage as lost_at_stage,
  reason,
  COUNT(*) as count
FROM StageHistory
WHERE toStage = 'LOST'
GROUP BY fromStage, reason
ORDER BY count DESC;

-- Tính thời gian trung bình ở mỗi stage
SELECT
  toStage,
  AVG(DATEDIFF(
    LEAD(changedAt) OVER (PARTITION BY consultedServiceId ORDER BY changedAt),
    changedAt
  )) as avg_days_in_stage
FROM StageHistory
GROUP BY toStage;

-- Conversion funnel
SELECT
  fromStage,
  toStage,
  COUNT(*) as transitions,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY fromStage) as conversion_rate
FROM StageHistory
GROUP BY fromStage, toStage;
```

---

## 9. 🔘 Nhận Quản Lý Pipeline (Mô hình Button)

### UI/UX

**Bảng ConsultedService - Cột "Sale tư vấn" (consultingSaleId)**

> **Quan trọng**: Cột này **ĐÃ TỒN TẠI** trong bảng, chỉ cần thay đổi logic render.

**Logic Render Cột (CẬP NHẬT):**

```typescript
render: (_, record) => {
  const service = record.dentalService;
  const requiresFollowUp = service.requiresFollowUp;
  const saleId = record.consultingSaleId;
  const sale = record.consultingSale;

  // Case 1: Service không cần follow-up
  if (!requiresFollowUp) {
    return <Text type="secondary">-</Text>;
  }

  // Case 2: Cần follow-up nhưng chưa claim
  if (!saleId) {
    return (
      <Button
        type="link"
        icon={<UserAddOutlined />}
        onClick={() => handleClaim(record.id)}
      >
        Nhận quản lý
      </Button>
    );
  }

  // Case 3: Đã claim - hiển thị tên sale
  return (
    <Space direction="vertical" size={0}>
      <Text strong>{sale?.fullName || "-"}</Text>
      {/* Optional: Show claim date from Audit Trail */}
      <Text type="secondary" style={{ fontSize: 11 }}>
        {getClaimDate(record.id)} {/* From Audit Trail: PIPELINE_CLAIMED */}
      </Text>
    </Space>
  );
};
```

**Trạng thái Button:**

- **Mặc định**: Link màu xanh với icon "Follow up"
- **Loading**: Hiển thị spin khi đang xử lý nhận
- **Thành công**: Thay thế bằng tên sale ngay lập tức

### Logic Backend

**Server Action**: `claimPipelineAction(consultedServiceId: string)`

**Luồng xử lý:**

```typescript
1. Validate:
   - User đã đăng nhập
   - ConsultedService tồn tại
   - consultingSaleId IS NULL (chưa được nhận)
   - dentalService.requiresFollowUp = true

2. Update ConsultedService:
   SET consultingSaleId = currentUser.employeeId
   SET updatedAt = now()

3. Trả về: Updated ConsultedServiceResponse

4. Frontend:
   - Invalidate queries: ["consulted-services"]
   - Hiển thị thông báo thành công: "Đã nhận quản lý dịch vụ"

5. Audit Trail (tương lai):
   - Hệ thống AuditTrail sẽ tự động ghi nhận thay đổi consultingSaleId
   - Action: "PIPELINE_CLAIMED"
   - Details: { consultedServiceId, saleId, timestamp }
```

**Xử lý Lỗi:**

- **Đã được nhận**: `{ code: "ALREADY_CLAIMED", message: "Dịch vụ đã được nhận bởi sale khác" }`
- **Không yêu cầu quản lý**: `{ code: "NOT_PIPELINE_SERVICE", message: "Dịch vụ này không cần quản lý trong pipeline" }`

### Phân quyền

**Ai có thể nhận:**

- ✅ Employee (bất kỳ)
- ✅ Admin

**Validation:**

- Dịch vụ phải có `consultingSaleId = NULL`
- Sau khi nhận, không thể hủy nhận (chỉ admin mới reassign được)

---

## 10. 🎛️ Admin: Chuyển Sale

### UI/UX

**Bảng ConsultedService - Cột Thao tác Admin**

**Thao tác Bổ sung cho Admin:**

```typescript
// In actions column
{
  admin && saleId && requiresFollowUp && (
    <Tooltip title="Chuyển sale">
      <Button
        icon={<SwapOutlined />}
        onClick={() => openReassignModal(record)}
      />
    </Tooltip>
  );
}
```

**Modal Chuyển Sale:**

```
┌─────────────────────────────────────────┐
│ Chuyển sale phụ trách                   │
├─────────────────────────────────────────┤
│ Dịch vụ: [Niềng răng Invisalign]       │
│ Khách hàng: [Nguyễn Văn A - 0901...]   │
│                                         │
│ Sale hiện tại: [Trần Thị B]            │
│                                         │
│ * Chuyển cho:                           │
│ [Select từ danh sách Employee]          │
│                                         │
│ Lý do:                                  │
│ [TextArea - tùy chọn]                   │
│                                         │
│         [Hủy]           [Chuyển]       │
└─────────────────────────────────────────┘
```

### Logic Backend

**Server Action**: `reassignSaleAction(consultedServiceId: string, newSaleId: string, reason?: string)`

**Phân quyền:**

- ✅ Chỉ Admin
- ❌ Employee không thể chuyển

**Luồng xử lý:**

```typescript
1. Validate:
   - User là Admin
   - ConsultedService tồn tại
   - Employee mới tồn tại và đang làm việc
   - consultingSaleId != newSaleId

2. Update ConsultedService:
   SET consultingSaleId = newSaleId
   SET updatedAt = now()

3. Trả về: Updated ConsultedServiceResponse

4. Frontend:
   - Invalidate queries
   - Hiển thị thành công: "Đã chuyển sale thành công"

5. Audit Trail (tương lai):
   - Hệ thống AuditTrail sẽ tự động ghi nhận
   - Action: "PIPELINE_REASSIGNED"
   - Details: {
       consultedServiceId,
       oldSaleId,
       newSaleId,
       adminId: currentUser.id,
       reason
     }
```

---

## 11. 📊 Dashboard Sales Pipeline

### Route & Navigation

**Route**: `/sales-pipeline`

**Menu Item:**

```typescript
{
  key: "sales-pipeline",
  icon: <FunnelPlotOutlined />,
  label: "Sales Pipeline",
  path: "/sales-pipeline",
  permissions: ["employee", "admin"]
}
```

### Cấu trúc UI

**Layout giống Daily View:**

```
┌────────────────────────────────────────────────────────┐
│ 📊 Sales Pipeline Dashboard                           │
├────────────────────────────────────────────────────────┤
│ HeaderWithMonthNav:                                    │
│   [<]  Tháng 12/2025  [>]  [Tháng này]               │
│                                                        │
│ ClinicTabs (Admin only):                              │
│   [All] [Chi nhánh 1] [Chi nhánh 2]                  │
├────────────────────────────────────────────────────────┤
│ Statistics Cards:                                      │
│ ┌──────────┬──────────┬───────────┬──────────┐       │
│ │ Tổng KH  │ Tổng DV  │ Chưa chốt │ Đã chốt  │       │
│ │ 25       │ 45       │ 30        │ 15       │       │
│ │          │          │ 67%       │ 33%      │       │
│ └──────────┴──────────┴───────────┴──────────┘       │
├────────────────────────────────────────────────────────┤
│ Table (No pagination)                                  │
└────────────────────────────────────────────────────────┘
```

### Thẻ Thống kê

**Chỉ số:**

1. **Tổng khách hàng**: `COUNT(DISTINCT customerId)` trong tháng
2. **Tổng dịch vụ**: `COUNT(*)` trong tháng
3. **Chưa chốt**: `COUNT(*) WHERE serviceStatus = "Chưa chốt"`
4. **Đã chốt**: `COUNT(*) WHERE serviceStatus = "Đã chốt"`

**Bảng màu:**

- Tổng KH: Xanh (#1890ff)
- Tổng DV: Xanh lơ (#13c2c2)
- Chưa chốt: Cam (#fa8c16)
- Đã chốt: Xanh lá (#52c41a)

### Bảng

**Các cột:**

1. **Khách hàng** (200px)

   - Hiển thị: `fullName` (link đến chi tiết khách hàng)
   - Dòng phụ: `phone`

2. **Dịch vụ** (250px)

   - Hiển thị: `consultedServiceName`

3. **Ngày chốt** (120px)

   - Hiển thị: `serviceConfirmDate` (DD/MM/YYYY)
   - Nếu null: "-"

4. **Trạng thái DV** (110px)

   - Tag: "Chưa chốt" (cam) | "Đã chốt" (xanh lá)

5. **Sale** (150px)

   - Hiển thị: `consultingSale.fullName`

6. **Lần tiếp xúc cuối** (130px)

   - Hiển thị: `SalesActivityLog` cuối cùng với `contactType IN ["call", "message", "meet"]`
   - Format: "X ngày trước" + icon (📞/💬/🤝)
   - Nếu không có log: "-"

7. **Ghi chú** (200px)

   - Hiển thị: `specificStatus` (rút gọn 50 ký tự)
   - Tooltip: Toàn bộ text khi hover

8. **Thao tác** (Fixed right, 120px)
   - **Với sale được phân công**:
     - `[📝 Hoạt động]` - Mở ActivityModal
   - **Với admin**:
     - `[📝 Hoạt động]` - Mở ActivityModal
     - `[🔄 Chuyển]` - Mở ReassignSaleModal

**Mở rộng dòng (Tùy chọn - Tương lai):**

- Hiển thị timeline hoạt động khi mở rộng
- Liệt kê tất cả các bản ghi FollowUpLog theo thứ tự thời gian

---

## 12. 📝 Modal Ghi Nhận Tiếp Xúc

### UI/UX

**Component**: `SalesActivityModal`

**Layout Modal:**

```
┌─────────────────────────────────────────────────┐
│ Ghi nhận tiếp xúc khách hàng                    │
├─────────────────────────────────────────────────┤
│ Khách hàng: Nguyễn Văn A - 0901234567          │
│ Dịch vụ: Niềng răng Invisalign                 │
│                                                 │
│ * Loại tiếp xúc:                                │
│ ○ Gọi điện  ○ Nhắn tin  ○ Gặp mặt              │
│                                                 │
│ * Nội dung:                                     │
│ [TextArea, 3 rows]                              │
│ Placeholder:                                    │
│  - Gọi điện: "Tư vấn về quy trình, giá cả..."  │
│  - Nhắn tin: "Gửi báo giá, hình ảnh..."        │
│  - Gặp mặt: "Khách đến phòng khám, tư vấn..."  │
│                                                 │
│ Ngày hẹn liên hệ tiếp: [DatePicker] (optional) │
│                                                 │
│         [Hủy]               [Lưu]              │
└─────────────────────────────────────────────────┘
```

**Phần Timeline Tiếp xúc (Chỉ đọc, bên dưới form):**

```
┌─────────────────────────────────────────────────┐
│ Lịch sử tiếp xúc khách hàng                     │
├─────────────────────────────────────────────────┤
│ 📞 15/12/2025 10:30 - Trần Thị B (Gọi điện)   │
│    Đã tư vấn về quy trình niềng răng...        │
│    Hẹn liên hệ tiếp: 20/12/2025                │
│                                                 │
│ 💬 10/12/2025 14:00 - Trần Thị B (Nhắn tin)   │
│    Gửi báo giá qua Zalo                        │
│                                                 │
│ 🤝 05/12/2025 09:15 - Trần Thị B (Gặp mặt)    │
│    Khách đến phòng khám, trao đổi chi tiết     │
│    Hẹn liên hệ tiếp: 10/12/2025                │
└─────────────────────────────────────────────────┘
```

> **Lưu ý**: Timeline chỉ hiển thị các lần tiếp xúc với khách. Để xem lịch sử hệ thống (nhận follow-up, chuyển sale), xem **Audit Trail** ở trang chi tiết dịch vụ.

### Validation Form

**Bắt buộc:**

- `contactType`: Radio group (call, message, meet)
- `content`: TextArea, tối thiểu 10 ký tự

**Tùy chọn:**

- `nextContactDate`: Date picker (chỉ ngày tương lai)

### Logic Backend

**Server Action**: `createSalesActivityAction(data: CreateSalesActivityRequest)`

**Phân quyền:**

- ✅ Employee: Chỉ nếu `consultingSaleId = currentUser.employeeId`
- ✅ Admin: Luôn được phép

**Luồng xử lý:**

```typescript
1. Validate:
   - User đã đăng nhập
   - Nếu Employee: consultingSaleId = currentUser.employeeId
   - ConsultedService tồn tại
   - contactType in ["call", "message", "meet"]
   - content.length >= 10

2. Tạo SalesActivityLog:
   INSERT INTO SalesActivityLog {
     consultedServiceId,
     employeeId: currentUser.employeeId,
     contactType: data.contactType,
     content: data.content,
     nextContactDate: data.nextContactDate,
     contactDate: now()
   }

3. Trả về: Created SalesActivityLog

4. Frontend:
   - Invalidate queries: ["sales-activities", consultedServiceId]
   - Hiển thị thành công: "Đã ghi nhận hoạt động"
   - Reset form
```

---

## 13. 📡 Các API Endpoints

### 5.1. GET /api/v1/sales-pipeline

**Mô tả**: Lấy danh sách dịch vụ trong sales pipeline cho dashboard

**Query Params:**

- `month`: string (YYYY-MM, ví dụ: "2025-12") - Bắt buộc
- `clinicId?: string` - Lọc theo chi nhánh (chỉ admin)

**Response:**

```typescript
{
  items: ConsultedServiceResponse[], // With nested customer, dentalService, consultingSale
  stats: {
    totalCustomers: number,
    totalServices: number,
    unconfirmedServices: number,
    confirmedServices: number
  }
}
```

**Logic Backend:**

```typescript
1. Tính khoảng thời gian tháng: firstDay, lastDay

2. Xây dựng query filters:
   - serviceConfirmDate IN [firstDay, lastDay]
   - dentalService.requiresFollowUp = true
   - consultingSaleId IS NOT NULL (chỉ dịch vụ đã được nhận)
   - Nếu Employee role: consultingSaleId = currentUser.employeeId
   - Nếu có clinicId param: lọc theo clinicId

3. Include relations:
   - customer (id, fullName, phone)
   - dentalService (id, name, requiresFollowUp)
   - consultingSale (id, fullName)

4. Tính toán stats từ cùng dataset

5. Trả về: { items, stats }
```

**Cache**: Không cache (dữ liệu động)

---

### 5.2. GET /api/v1/sales-activities/{consultedServiceId}

**Mô tả**: Lấy timeline hoạt động tiếp xúc cho một dịch vứ

**Response:**

```typescript
SalesActivityLogResponse[] // Sắp xếp theo contactDate DESC
```

**Schema:**

```typescript
{
  id: string,
  contactType: string, // "call" | "message" | "meet"
  contactDate: string (ISO),
  content: string,
  nextContactDate: string (ISO Date) | null,
  employee: {
    id: string,
    fullName: string
  }
}
```

**Logic Backend:**

```typescript
1. Validate consultedServiceId tồn tại

2. Query SalesActivityLog:
   WHERE consultedServiceId = ?
   ORDER BY contactDate DESC
   INCLUDE employee (id, fullName)

3. Trả về: Mảng các activities
```

**Cache**: Không cache (dữ liệu thời gian thực)

---

## 14. 🧩 Cấu trúc Components

```
src/features/sales-pipeline/
├── api.ts                          # Hàm API client
├── constants.ts                    # Query keys, messages, pipeline stages
├── index.ts                        # Barrel export
├── components/
│   ├── SalesActivityModal.tsx      # Modal ghi nhận tiếp xúc
│   ├── PipelineStatistics.tsx      # Thẻ thống kê
│   ├── PipelineTable.tsx           # Bảng chính
│   ├── ReassignSaleModal.tsx       # Modal admin chuyển sale
│   └── ActivityTimeline.tsx        # Danh sách tiếp xúc (chỉ đọc)
├── hooks/
│   ├── usePipelineServices.ts      # Query hook cho dashboard
│   ├── useSalesActivities.ts       # Query hook cho timeline
│   ├── useClaimPipeline.ts         # Mutation hook cho nhận
│   ├── useReassignSale.ts          # Mutation hook cho admin chuyển
│   └── useCreateActivity.ts        # Mutation hook cho ghi nhận tiếp xúc
└── views/
    └── SalesPipelineView.tsx       # Trang chính

src/shared/components/
└── HeaderWithMonthNav.tsx          # Header chọn tháng có thể tái sử dụng
```

---

## 15. 🚀 Các Giai đoạn Triển khai

### Giai đoạn 1: Tính năng Cốt lõi (MVP)

**Database:**

- [ ] Thêm model `SalesActivityLog` vào Prisma schema
- [ ] Thêm model `StageHistory` vào Prisma schema
- [ ] Thêm field `stage` vào ConsultedService (no default)
- [ ] Chạy migration: `prisma migrate dev --name add-stage-management`
- [ ] Thêm relation fields vào Employee (stageChanges)
- [ ] Xác nhận ConsultedService đã có `source` và `sourceNote`

**Backend:**

- [ ] Tạo `sales-pipeline.repo.ts` - Lớp truy cập dữ liệu
- [ ] Tạo `sales-pipeline.service.ts` - Business logic
- [ ] Tạo `sales-pipeline.actions.ts` - Server actions
  - [ ] `claimPipelineAction`
  - [ ] `reassignSaleAction`
  - [ ] `createSalesActivityAction`
  - [ ] `updateStageAction` (với validation)
- [ ] Tạo API route: `/api/v1/sales-pipeline` (GET) - update query để hỗ trợ unclaimed services
- [ ] Tạo API route: `/api/v1/sales-activities/[id]` (GET)
- [ ] Thêm validation schemas vào `sales-activity.schema.ts`
- [ ] Thêm mappers: `sales-pipeline/_mappers.ts`
- [ ] Thêm constants: OFFLINE_STAGES, ONLINE_STAGES, STAGE_FLOW
- [ ] Implement `validateStageTransition` function

**Frontend:**

- [ ] Tạo `HeaderWithMonthNav` shared component
- [ ] Tạo `useDateNavigation` hook với chế độ tháng
  - [ ] `usePipelineServices`
  - [ ] `useClaimPipeline`
  - [ ] `useReassignSale`
  - [ ] `useCreateSalesActivity`
  - [ ] `useUpdateStage` (NEW)
- [ ] Implement SalesPipelineView với tabs (List | Kanban)
- [ ] Implement PipelineTable với button "Nhận quản lý"
- [ ] Implement PipelineKanban (NEW)
  - [ ] Drag & Drop với react-beautiful-dnd
  - [ ] Stage validation trước khi drop
  - [ ] Lost reason modal
- [ ] Implement SalesPipelineView
- [ ] Implement PipelineTable với button "Nhận quản lý"
- [ ] Implement SalesActivityModal
- [ ] Implement ReassignSaleModal (admin)
- [ ] Thêm route `/sales-pipeline` vào app router
- [ ] Thêm menu item "Sales Pipeline" với icon FunnelPlotOutlined

**Cập nhật UI:**

- [ ] Kiểm tra và xóa field `consultingSaleId` khỏi CreateConsultedServiceModal (nếu đang hiển thị)
- [ ] Kiểm tra và xóa field `consultingSaleId` khỏi UpdateConsultedServiceModal (nếu đang hiển thị)
- [ ] Cập nhật logic render cột "Sale tư vấn" trong bảng ConsultedService:
  - Nếu `requiresFollowUp =
- [ ] **Test Stage Transitions:**
  - [ ] Không cho nhảy cóc (ARRIVED → QUOTED blocked)
  - [ ] Không cho chuyển ngược (QUOTED → CONSULTING blocked)
  - [ ] Cho phép Analytics & Reports

**Analytics Dashboard:**

- [ ] Conversion Funnel Chart (Ant Design Funnel)
- [ ] Sale Performance Table
- [ ] Lost Analysis (by stage + reasons)
- [ ] Service Win Rate Analysis
- [ ] Time in Stage Chart
- [ ] Create route: `/sales-pipeline/analytics`

**Advanced Queries:**

- [ ] Implement funnel query (StageHistory)
- [ ] Implement sale performance metrics
- [ ] Implement lost analysis with reasons
- [ ] Add date range picker for reports
- [ ] Export to Excel functionality

### Giai đoạn 3: Tính năng Nâng cao (Tương lai)

**Phân tích:**

- [ ] Real-time dashboard updates (WebSocket)
- [ ] Heatmap hoạt động
- [ ] Predictive analytics (AI/ML)age, toStage
  - [ ] changedBy tracking đúng user false` → hiện "-"
  - Nếu `requiresFollowUp = true` và `consultingSaleId = null` → hiện button "Nhận quản lý"
  - Nếu `requiresFollowUp = true` và có `consultingSaleId` → hiện tên sale

**Testing:**

- [ ] Test luồng nhận (happy path)
- [ ] Test xung đột nhận (đã được nhận)
- [ ] Test phân quyền (employee không thể chuyển)
- [ ] Test ghi log hoạt động
- [ ] Test bộ lọc dashboard
- [ ] Test điều hướng tháng

---

### Giai đoạn 2: Tính năng Nâng cao (Tương lai)

**Phân tích:**

- [ ] Dashboard tỷ lệ chuyển đổi
- [ ] Bảng xếp hạng hiệu suất bán hàng
- [ ] Thời gian trung bình để chốt deal
- [ ] Heatmap hoạt động

**Tự động hóa:**

- [ ] Thông báo nhắc nhở tự động
- [ ] Thuật toán phân công task follow-up
- [ ] Tích hợp Email/SMS để ghi log

**Cải tiến UX:**

- [ ] Nút gọi nhanh (link tel: + tự động log)
- [ ] Tích hợp WhatsApp/Zalo
- [ ] Ghi âm ghi chú bằng giọng nói
- [ ] Theo dõi tâm trạng khách hàng

---

## 16. 📊 Chỉ số Thành công

**KPIs cần Theo dõi:**

1. **Độ phủ Pipeline**: % dịch vụ requiresFollowUp được phân công sale
2. **Thời gian Phản hồi**: Thời gian từ khi tạo dịch vụ đến khi được nhận quản lý
3. **Tỷ lệ Chuyển đổi theo Stage**: % dịch vụ chuyển từ stage này sang stage khác
4. **Tần suất Tiếp xúc**: Số lần tiếp xúc trung bình mỗi dịch vụ
5. **Khối lượng Sale**: Số dịch vụ trong pipeline trên mỗi sale

**Mục tiêu (Giai đoạn 1):**

- ✅ 100% dịch vụ requiresFollowUp có sale được phân công
- ✅ Thời gian phản hồi trung bình < 24 giờ
- ✅ Thiết lập baseline tỷ lệ chuyển đổi

---

## 17. 🔄 SalesActivityLog vs Audit Trail

### Phân biệt 2 hệ thống

| Tiêu chí       | SalesActivityLog                      | Audit Trail (Tương lai)                     |
| -------------- | ------------------------------------- | ------------------------------------------- |
| **Mục đích**   | Ghi nhận tiếp xúc với khách           | Ghi log hành động hệ thống                  |
| **Dữ liệu**    | contactType, content, nextContactDate | action, entityType, changes, metadata       |
| **Ví dụ**      | "Gọi điện tư vấn", "Gặp khách tại PK" | "FOLLOW_UP_CLAIMED", "FOLLOW_UP_REASSIGNED" |
| **Người dùng** | Sale ghi thủ công                     | Hệ thống tự động ghi                        |
| **UI**         | Modal nhập liệu + Timeline            | Timeline read-only                          |
| **Query**      | Theo consultedServiceId, employeeId   | Theo entity + entityId                      |

### Các hành động ghi vào Audit Trail (không vào SalesActivityLog)

1. **PIPELINE_CLAIMED**: Sale nhận quản lý pipeline

   ```typescript
   {
     action: "PIPELINE_CLAIMED",
     entityType: "ConsultedService",
     entityId: consultedServiceId,
     userId: employeeId,
     changes: { consultingSaleId: { from: null, to: employeeId } }
   }
   ```

2. **PIPELINE_REASSIGNED**: Admin chuyển sale

   ```typescript
   {
     action: "PIPELINE_REASSIGNED",
     entityType: "ConsultedService",
     entityId: consultedServiceId,
     userId: adminId,
     changes: {
       consultingSaleId: { from: oldSaleId, to: newSaleId }
     },
     metadata: { reason: "Sale nghỉ phép" }
   }
   ```

3. **CONSULTED_SERVICE_UPDATED**: Mọi thay đổi khác
   - serviceStatus, serviceConfirmDate, specificStatus, v.v.

### Lợi ích của thiết kế mới

✅ **Tách biệt rõ ràng**: Sales activities ≠ System logs  
✅ **Không trùng lặp**: Mỗi loại data có 1 nguồn chân lý  
✅ **Dễ mở rộng**: Thêm audit trail cho toàn app không ảnh hưởng SalesActivityLog  
✅ **Query hiệu quả**: Index riêng, không cần filter loại bỏ system events  
✅ **UX tốt hơn**: Timeline chỉ hiện tiếp xúc thực sự, không lộn system noise  
✅ **Hỗ trợ nhiều kênh**: Có thể mở rộng cho Offline và Online pipeline

---

## 5. 🎯 Stage Management Implementation

### Backend Service: updateStage

**Server Action**: `updateStageAction(consultedServiceId: string, newStage: string, reason?: string)`

```typescript
async function updateStage(
  consultedServiceId: string,
  newStage: string,
  userId: string,
  reason?: string
) {
  // 1. Get current service
  const service = await prisma.consultedService.findUnique({
    where: { id: consultedServiceId },
  });

  if (!service) throw new Error("Dịch vụ không tồn tại");

  // 2. Validate stage transition
  const validation = validateStageTransition(service.stage, newStage);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // 3. Require reason when moving to LOST
  if (newStage === "LOST" && !reason) {
    throw new Error("Vui lòng nhập lý do thất bại");
  }

  // 4. Execute transaction
  return await prisma.$transaction([
    // Update ConsultedService.stage
    prisma.consultedService.update({
      where: { id: consultedServiceId },
      data: { stage: newStage },
    }),

    // Create StageHistory record
    prisma.stageHistory.create({
      data: {
        consultedServiceId,
        fromStage: service.stage,
        toStage: newStage,
        changedById: userId,
        reason,
      },
    }),
  ]);
}
```

### Frontend: Stage Update UI

**Trong Kanban View:**

- Drag & Drop với validation
- Chặn drop vào cột không hợp lệ (UI visual feedback)
- Modal confirm khi drop vào LOST (yêu cầu reason)

**Trong Table View:**

- Dropdown select với options filtered theo STAGE_FLOW
- Disabled options cho stages không hợp lệ
- Modal reason khi chọn LOST

**Error Handling:**

```typescript
try {
  await updateStageMutation.mutateAsync({
    consultedServiceId,
    newStage,
    reason,
  });
} catch (error) {
  if (error.message.includes("Không thể chuyển")) {
    // Show user-friendly error
    message.error(error.message);
  }
}
```

### Permissions

**Who can update stage:**

- ✅ Admin: Luôn có quyền
- ✅ Employee: Chỉ nếu `consultingSaleId = currentUser.employeeId`
- ❌ Employee khác: Không thể update

---

## 6. 📋 Kanban View

### Route & Layout

**Route**: `/sales-pipeline?view=kanban` (hoặc tab trong dashboard)

**Layout Structure:**

```
┌────────────────────────────────────────────────────────────────┐
│ 📊 Sales Pipeline - Kanban View                               │
├────────────────────────────────────────────────────────────────┤
│ [<]  Tháng 12/2025  [>]  [Tháng này]                         │
│ [All Clinics ▼]  [All Sales ▼]                               │
├────────────────────────────────────────────────────────────────┤
│ ARRIVED │ CONSULTING │ QUOTED │ DEPOSIT │ TREATING │ LOST   │
│   (15)  │    (20)    │  (12)  │   (8)   │    (5)   │  (10)  │
├─────────┼────────────┼────────┼─────────┼──────────┼────────┤
│ Card 1  │  Card 1    │ Card 1 │ Card 1  │  Card 1  │ Card 1 │
│ Card 2  │  Card 2    │ Card 2 │         │          │ Card 2 │
│ Card 3  │  Card 3    │        │         │          │ Card 3 │
│ ...     │  ...       │ ...    │ ...     │  ...     │ ...    │
└─────────┴────────────┴────────┴─────────┴──────────┴────────┘
```

### Card Design

```
┌─────────────────────────────────┐
│ 👤 Nguyễn Văn A - 0901234567   │
│ 🦷 Niềng răng Invisalign       │
│                                 │
│ 💰 45,000,000đ                 │
│ 📅 Tư vấn: 10/12/2025          │
│                                 │
│ 👨‍💼 Sale: Trần Thị B            │
│ 📞 2 ngày trước                 │
└─────────────────────────────────┘
```

**Card Details:**

- Customer name + phone (link to customer detail)
- Service name
- Price (finalPrice)
- Consultation date
- Assigned sale
- Last contact (icon + time ago)

### Drag & Drop Logic

```typescript
const handleDragEnd = (result: DropResult) => {
  const { draggableId, source, destination } = result;

  if (!destination) return;

  const consultedServiceId = draggableId;
  const fromStage = source.droppableId;
  const toStage = destination.droppableId;

  // Skip if same column
  if (fromStage === toStage) return;

  // Validate transition
  const validation = validateStageTransition(fromStage, toStage);
  if (!validation.valid) {
    message.error(validation.error);
    return;
  }

  // If moving to LOST, show reason modal
  if (toStage === "LOST") {
    setLostReasonModal({
      open: true,
      consultedServiceId,
      onSubmit: (reason) =>
        updateStageMutation.mutate({
          consultedServiceId,
          newStage: toStage,
          reason,
        }),
    });
    return;
  }

  // Update stage
  updateStageMutation.mutate({
    consultedServiceId,
    newStage: toStage,
  });
};
```

### Filters

**Available Filters:**

- Month (via HeaderWithMonthNav)
- Clinic (admin only)
- Sale (admin: all, employee: auto-filtered to self)

**Query Logic:**

```typescript
const { data } = usePipelineServices({
  month: selectedMonth,
  clinicId: selectedClinicId,
  // saleId auto-added based on user role
});

// Group by stage for Kanban columns
const groupedByStage = groupBy(data.items, "stage");
```

### Performance Optimization

**Pagination per Column:**

- Show first 20 cards per column
- "Load more" button at bottom
- Virtual scrolling for large datasets

**Real-time Updates:**

- WebSocket or polling (5s interval)
- Optimistic UI updates on drag

---

## 7. 📈 Sales Analytics & Reports

### Route & Layout

**Route**: `/sales-pipeline/analytics` (hoặc tab trong dashboard)

**Layout Structure:**

```
┌──────────────────────────────────────────────────┐
│ 📈 Sales Analytics                               │
├──────────────────────────────────────────────────┤
│ [Month Range Picker: 01/2025 - 12/2025]        │
│ [All Clinics ▼]  [All Sales ▼]                 │
├──────────────────────────────────────────────────┤
│                                                  │
│ 1. CONVERSION FUNNEL                            │
│ 2. SALE PERFORMANCE TABLE                       │
│ 3. LOST ANALYSIS                                │
│ 4. SERVICE WIN RATE                             │
│ 5. TIME IN STAGE                                │
│                                                  │
└──────────────────────────────────────────────────┘
```

### 1. Conversion Funnel Chart

**Visual:** Ant Design Funnel Chart

```
ARRIVED (100 services, 100%)
   ↓ 85%
CONSULTING (85 services, 85%)
   ↓ 70%
QUOTED (60 services, 60%)
   ↓ 50%
DEPOSIT (30 services, 30%)
   ↓ 83%
TREATING (25 services, 25%)

LOST: 40 services (40% tổng từ ARRIVED)
```

**Query:**

```sql
SELECT
  toStage,
  COUNT(*) as count,
  COUNT(*) * 100.0 / (
    SELECT COUNT(DISTINCT consultedServiceId)
    FROM StageHistory
    WHERE toStage = 'ARRIVED'
  ) as percentage
FROM StageHistory
WHERE changedAt BETWEEN ? AND ?
GROUP BY toStage
ORDER BY
  CASE toStage
    WHEN 'ARRIVED' THEN 1
    WHEN 'CONSULTING' THEN 2
    WHEN 'QUOTED' THEN 3
    WHEN 'DEPOSIT' THEN 4
    WHEN 'TREATING' THEN 5
  END;
```

### 2. Sale Performance Table

**Columns:**

- Sale Name
- Total Services
- Win Rate (% reached TREATING)
- Lost Count
- Avg Days to Close
- Avg Activities per Service

**Query:**

```sql
SELECT
  e.fullName as sale_name,
  COUNT(DISTINCT cs.id) as total_services,
  COUNT(CASE WHEN cs.stage = 'TREATING' THEN 1 END) * 100.0 / COUNT(*) as win_rate,
  COUNT(CASE WHEN cs.stage = 'LOST' THEN 1 END) as lost_count,
  AVG(DATEDIFF(sh_final.changedAt, sh_first.changedAt)) as avg_days_to_close,
  AVG(activity_counts.count) as avg_activities
FROM ConsultedService cs
JOIN Employee e ON cs.consultingSaleId = e.id
LEFT JOIN StageHistory sh_first ON sh_first.consultedServiceId = cs.id AND sh_first.fromStage IS NULL
LEFT JOIN StageHistory sh_final ON sh_final.consultedServiceId = cs.id AND sh_final.toStage IN ('TREATING', 'LOST')
LEFT JOIN (
  SELECT consultedServiceId, COUNT(*) as count
  FROM SalesActivityLog
  GROUP BY consultedServiceId
) activity_counts ON activity_counts.consultedServiceId = cs.id
WHERE cs.consultationDate BETWEEN ? AND ?
GROUP BY e.id;
```

### 3. Lost Analysis

**Chart:** Bar chart - Lost by Stage

```
Lost Distribution by Stage:
CONSULTING: ████████ 35 (35%)
QUOTED:     ████████████ 45 (45%)
DEPOSIT:    ██ 10 (10%)
ARRIVED:    ████ 10 (10%)
```

**Top Lost Reasons Table:**

| Stage      | Reason                 | Count | % of Stage |
| ---------- | ---------------------- | ----- | ---------- |
| QUOTED     | Giá cao                | 25    | 55%        |
| QUOTED     | Không đồng ý phương án | 15    | 33%        |
| CONSULTING | Không liên lạc được    | 20    | 57%        |

**Query:**

```sql
SELECT
  fromStage,
  reason,
  COUNT(*) as count,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY fromStage) as percentage_of_stage
FROM StageHistory
WHERE toStage = 'LOST' AND changedAt BETWEEN ? AND ?
GROUP BY fromStage, reason
ORDER BY fromStage, count DESC;
```

### 4. Service Win Rate

**Table:** Dịch vụ nào dễ/khó chốt?

| Service Name          | Total | Won | Win Rate | Avg Days | Avg Price |
| --------------------- | ----- | --- | -------- | -------- | --------- |
| Niềng răng Invisalign | 50    | 35  | 70%      | 15 days  | 45M       |
| Implant               | 30    | 24  | 80%      | 20 days  | 25M       |
| Bọc răng sứ           | 40    | 20  | 50%      | 10 days  | 5M        |

**Insights:**

- ✅ Implant: Win rate cao, khách quyết định nhanh
- ⚠️ Bọc răng sứ: Win rate thấp, cần cải thiện tư vấn

### 5. Time in Stage

**Chart:** Column chart - Avg days in each stage

```
Avg Days in Stage:
ARRIVED:     █ 1.5 days
CONSULTING:  ███ 3.2 days
QUOTED:      ██████ 7.8 days  ← Bottleneck!
DEPOSIT:     ████ 4.5 days
```

**Query:**

```sql
SELECT
  sh.toStage as stage,
  AVG(DATEDIFF(
    LEAD(sh.changedAt) OVER (PARTITION BY sh.consultedServiceId ORDER BY sh.changedAt),
    sh.changedAt
  )) as avg_days
FROM StageHistory sh
WHERE sh.changedAt BETWEEN ? AND ?
  AND sh.toStage != 'LOST'
GROUP BY sh.toStage;
```

---

## 8. �📝 Ghi chú & Cân nhắc

### Các Trường hợp Đặc biệt

**1. Dịch vụ cần follow-up nhưng khách hàng hủy:**

- Giữ consultingSaleId (dữ liệu lịch sử)
- Dashboard sẽ ẩn nếu serviceStatus chuyển sang archived

**2. Nhiều sale nhận cùng lúc (race condition):**

- Không cần database unique constraint (consultingSaleId không unique)
- Backend validation: Kiểm tra `consultingSaleId IS NULL` trước khi update
- Nếu xung đột: Trả về lỗi "ALREADY_CLAIMED"

**3. Admin đổi requiresFollowUp từ true → false:**

- Giữ nguyên giá trị consultingSaleId (audit trail)
- Bảng hiển thị "-" thay vì tên sale
- Dashboard lọc bỏ các dịch vụ này

**4. Sale nghỉ việc:**

- Admin phải chuyển thủ công các dịch vụ của họ
- Tương lai: Công cụ chuyển hàng loạt

### Cải tiến Tương lai

**Tích hợp với Treatment Care:**

- Tự động tạo follow-up cho chăm sóc sau điều trị
- Liên kết FollowUpLog với bản ghi TreatmentCare

**Mobile App:**

- Ghi log hoạt động nhanh từ điện thoại
- Push notification cho nhắc nhở

**Gợi ý AI:**

- Gợi ý thời điểm follow-up tối ưu dựa trên hành vi khách hàng
- Tự động phân loại cảm xúc cuộc trò chuyện

---

## 18. 🔗 Tài liệu Liên quan

- [009 Consulted-Service.md](./009%20Consulted-Service.md) - Quản lý dịch vụ tư vấn cơ bản
- [006 Dental Service.md](./006%20Dental%20Service.md) - Cấu hình dịch vụ
- [013 Treatment Care.md](./013%20Treatment%20Care.md) - Follow-up sau điều trị
- [GUIDELINES.md](../GUIDELINES.md) - Mô hình kiến trúc

---

**📅 Ngày tạo**: 2025-12-17  
**👤 Tác giả**: AI Assistant  
**✅ Trạng thái**: Sẵn sàng Triển khai
