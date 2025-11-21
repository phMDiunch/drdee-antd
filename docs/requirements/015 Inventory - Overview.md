# 📦 Requirements: Inventory Management System - Overview

> **📋 STATUS: PENDING** - Tài liệu tổng quan hệ thống quản lý kho  
> **📄 Feature Documentation**: `docs/features/015_Inventory.md` (when completed)  
> **🔗 Implementation**: `src/features/inventory/` (when exists)

## 🎯 Mục Tiêu Hệ Thống

Xây dựng hệ thống quản lý kho dược/vật tư y tế nha khoa toàn diện, đảm bảo:

- ✅ Quản lý tồn kho chính xác theo phương pháp FIFO (First In, First Out)
- ✅ Tính giá vốn đích danh (Specific Identification Costing)
- ✅ Truy xuất nguồn gốc đầy đủ (Số lô NSX, Hạn sử dụng)
- ✅ Theo dõi công nợ nhà cung cấp
- ✅ Phân tích chi phí theo bác sĩ, bệnh nhân, bộ môn

## 📋 Kế Hoạch Triển Khai Theo Giai Đoạn

### 🔵 GIAI ĐOẠN 1: NỀN TẢNG CỐT LÕI & VẬN HÀNH CƠ BẢN

**Mục tiêu**: Thiết lập danh mục và thực hiện vòng đời cơ bản: Nhập → Lưu kho → Xuất (FIFO)

**Tính năng**:

1. **[015.1] Cấu hình Từ điển Hệ thống** (System Dictionary)

   - Quản lý danh sách dropdown: Nhóm NCC, Đơn vị tính, Loại vật tư, Bộ môn, Nhóm/Phân nhóm vật tư

2. **[015.2] Quản lý Nhà Cung Cấp** (Supplier Management)

   - CRUD nhà cung cấp với phân nhóm
   - Tự động sinh mã NCC

3. **[015.3] Quản lý Vật Tư** (Material Management)

   - CRUD vật tư với phân loại chi tiết (4 cấp: Loại → Bộ môn → Nhóm → Phân nhóm)
   - Tự động sinh mã vật tư
   - Hỗ trợ tags tự do

4. **[015.4] Phiếu Nhập Kho** (Goods Receipt Note - GRN)

   - Tạo phiếu nhập với trạng thái (Nháp/Đã xác nhận)
   - Ghi nhận Số lô NSX, Hạn sử dụng cho từng dòng hàng
   - Tự động cập nhật tồn kho theo "lô nội bộ" (goodsReceiptDetailId)

5. **[015.5] Phiếu Xuất Kho** (Goods Issue Note - GIN)

   - Xuất cho Bác sĩ/Phòng khám hoặc Bệnh nhân
   - Tự động áp dụng FIFO (nhập trước xuất trước)
   - Tính giá vốn đích danh chính xác

6. **[015.6] Báo cáo Tồn Kho** (Stock Balance Report)
   - Báo cáo tổng hợp theo vật tư
   - Báo cáo chi tiết theo lô/dòng nhập

**Deliverable**: Hệ thống có thể nhập hàng, xuất hàng đúng FIFO và hiển thị tồn kho hiện tại.

---

### 🟢 GIAI ĐOẠN 2: KIỂM SOÁT TÀI CHÍNH & ĐỐI TƯỢNG SỬ DỤNG

**Mục tiêu**: Hoàn thiện quy trình liên quan đến tiền (công nợ) và theo dõi chi tiết đích đến của hàng hóa

**Tính năng**:

1. **[015.7] Quản lý Công Nợ NCC** (Accounts Payable)

   - Tự động ghi nhận công nợ khi xác nhận phiếu nhập
   - Ghi nhận thanh toán cho NCC
   - Báo cáo công nợ phải trả, cảnh báo quá hạn

2. **[015.8] Cảnh báo Hạn Sử Dụng** (Expiry Control)

   - Dashboard/Báo cáo lô hàng sắp hết hạn (< 6 tháng)
   - Cảnh báo lô hàng đã hết hạn
   - Danh sách đề xuất đổi trả NCC

3. **[015.9] Báo cáo Chi Phí Sử Dụng** (Usage Cost Report)
   - Tổng hợp chi phí vật tư theo Bác sĩ/Phòng khám
   - Lịch sử sử dụng vật tư của từng Bệnh nhân
   - Phân tích theo bộ môn/thủ thuật

**Deliverable**: Hệ thống quản lý được dòng tiền, biết chính xác hàng xuất cho ai, kiểm soát được hàng hết date.

---

### 🟡 GIAI ĐOẠN 3: TỐI ƯU HÓA & ĐẢM BẢO CHÍNH XÁC

**Mục tiêu**: Giúp quản lý kho làm việc hiệu quả, giảm sai sót, hỗ trợ ra quyết định mua hàng

**Tính năng**:

1. **[015.10] Kiểm Kê Kho** (Stock Taking)

   - Tạo đợt kiểm kê
   - So sánh thực tế vs hệ thống
   - Tự động tạo phiếu điều chỉnh

2. **[015.11] Cảnh Báo Tồn Kho & Đề Xuất Mua Hàng** (Reorder Suggestion)

   - Thiết lập định mức tồn kho tối thiểu/tối đa
   - Báo cáo mặt hàng dưới định mức
   - Tự động tạo đề nghị mua hàng

3. **[015.12] Quản Lý Nhiều Mức Giá NCC** (Multi-Price Management)
   - Một vật tư liên kết với nhiều NCC với giá khác nhau
   - Gợi ý NCC khi nhập hàng

**Deliverable**: Kho vận hành trơn tru, số liệu chính xác, chủ động trong việc mua hàng.

---

### 🟣 GIAI ĐOẠN 4: NÂNG CAO & MỞ RỘNG (Tùy nhu cầu tương lai)

**Mục tiêu**: Nâng cao trải nghiệm người dùng và tích hợp hệ thống

**Tính năng**:

1. Dashboard tổng quan (Biểu đồ trực quan)
2. Quản lý vị trí kho (Bin location)
3. Quy trình phê duyệt phiếu
4. Tích hợp API (HIS, Kế toán)
5. Xuất trả hàng cho NCC (Vendor Return)

---

## 🏗️ Mô Hình Dữ Liệu Cốt Lõi

### 📊 ERD Diagram (Simplified)

```
┌─────────────────┐
│ SystemDictionary│  (Từ điển: UOM, Groups, Types...)
└────────┬────────┘
         │
    ┌────┴─────────────────────┐
    │                          │
┌───▼────────┐        ┌────────▼─────┐
│  Supplier  │        │   Material   │
│  (NCC)     │        │   (Vật tư)   │
└───┬────────┘        └───┬──────────┘
    │                     │
    │    ┌────────────────┴────────────┐
    │    │                             │
┌───▼────▼─────────┐         ┌────────▼─────────┐
│ GoodsReceipt     │         │  GoodsIssue      │
│ (Phiếu nhập)     │         │  (Phiếu xuất)    │
└───┬──────────────┘         └────┬─────────────┘
    │                             │
┌───▼──────────────────┐    ┌────▼──────────────────┐
│GoodsReceiptDetail    │    │ GoodsIssueDetail      │
│(Chi tiết nhập)       │    │ (Chi tiết xuất)       │
│- batchNo (Lô NSX)    │    │- Link to receiptDetail│
│- expiryDate (HSD)    │◄───┤  (Truy xuất nguồn)   │
│- unitPrice (Giá)     │    └───────────────────────┘
└───┬──────────────────┘
    │ 1:1
┌───▼──────────────┐
│   StockQuant     │  (Tồn kho hiện tại theo "lô nội bộ")
│ - quantity       │
└──────────────────┘

┌─────────────────────┐
│    StockMove        │  (Lịch sử giao dịch - Ledger)
│ - quantityChange    │
│ - transactionDate   │
└─────────────────────┘
```

---

## 🎨 Nguyên Tắc Thiết Kế

### ✅ FIFO Engine

- **Quy tắc**: Nhập trước (goodsReceiptDetailId nhỏ hơn) → Xuất trước
- **Không xét**: Hạn sử dụng KHÔNG tham gia vào thuật toán xuất kho
- **Mục đích HSD**: Chỉ để cảnh báo và đề xuất đổi trả (< 6 tháng)

### ✅ Tính Giá Đích Danh (Specific Identification)

- Mỗi dòng nhập kho (`GoodsReceiptDetail`) = 1 "lô nội bộ"
- Giá vốn cố định theo từng lô
- Khi xuất: Tính giá chính xác từ lô nguồn

### ✅ Tính Toàn Vẹn Dữ Liệu

- **Phiếu đã xác nhận**: KHÔNG cho phép sửa trực tiếp
- **Sửa sai**: Phải thông qua nghiệp vụ Hủy/Điều chỉnh
- **Transaction**: Mọi thao tác nhập/xuất phải atomic (all or nothing)

---

## 📚 Chi Tiết Requirements

Xem các file requirement chi tiết cho từng tính năng:

### Giai đoạn 1

- **[015.1-System-Dictionary.md]** - Cấu hình Từ điển Hệ thống
- **[015.2-Supplier-Management.md]** - Quản lý Nhà Cung Cấp
- **[015.3-Material-Management.md]** - Quản lý Vật Tư
- **[015.4-Goods-Receipt.md]** - Phiếu Nhập Kho
- **[015.5-Goods-Issue.md]** - Phiếu Xuất Kho
- **[015.6-Stock-Report.md]** - Báo cáo Tồn Kho

### Giai đoạn 2

- **[015.7-Accounts-Payable.md]** - Quản lý Công Nợ NCC
- **[015.8-Expiry-Control.md]** - Cảnh báo Hạn Sử Dụng
- **[015.9-Usage-Cost-Report.md]** - Báo cáo Chi Phí Sử Dụng

### Giai đoạn 3

- **[015.10-Stock-Taking.md]** - Kiểm Kê Kho
- **[015.11-Reorder-Suggestion.md]** - Cảnh Báo & Đề Xuất Mua Hàng
- **[015.12-Multi-Price-Management.md]** - Quản Lý Nhiều Mức Giá

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14+ (App Router), React Query, Ant Design (antd)
- **Backend**: Next.js API Routes / Server Actions
- **Database**: PostgreSQL + Supabase
- **ORM**: Prisma
- **Validation**: Zod
- **State Management**: React Query + Zustand (if needed)

---

## 📝 Ghi Chú Quan Trọng

1. **Số Lô NSX vs Số Lô Nội Bộ**

   - **Số Lô NSX** (`batchNo`): Nhập tay từ vỏ hộp → Dùng để truy xuất nguồn gốc
   - **Số Lô Nội Bộ**: Chính là `goodsReceiptDetailId` → Dùng để tính FIFO và giá

2. **Validate Ngày Nhập Kho**

   - Không được chọn tương lai
   - Không được chọn quá khứ quá 7 ngày

3. **Cách Nhập Thành Tiền**

   - User nhập: Số lượng + Thành tiền tổng
   - Hệ thống tính: Đơn giá = Thành tiền / Số lượng
   - Giải quyết case "mua 10 tặng 5"

4. **Đối Tượng Xuất Kho**
   - Có 2 trường riêng: `employeeId` (Bác sĩ) và `customerId` (Bệnh nhân)
   - Có thể để trống hoặc chọn 1 trong 2

---

**Created**: 2025-01-21  
**Last Updated**: 2025-01-21  
**Version**: 1.0
