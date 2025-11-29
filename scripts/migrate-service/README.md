# Chuyển đổi Dental Service A sang B

Script này giúp bạn chuyển đổi tất cả các liên kết từ dịch vụ A sang dịch vụ B, và có thể xoá dịch vụ A sau đó.

## 📋 Model bị ảnh hưởng

### 1. **ConsultedService** (Dịch vụ tư vấn)

- **Foreign Key**: `dentalServiceId` → `DentalService.id`
- **Dữ liệu denormalized**:
  - `consultedServiceName`: Tên dịch vụ tại thời điểm tư vấn
  - `consultedServiceUnit`: Đơn vị tính
  - `price`: Giá niêm yết tại thời điểm tư vấn

**Lưu ý**: Đây là dữ liệu **lịch sử** - thường nên giữ nguyên để theo dõi giá tại thời điểm tư vấn.

## 🚀 Cách sử dụng

### Cú pháp cơ bản

```bash
npx tsx scripts/migrate-service/migrate-dental-service.ts <serviceA_id> <serviceB_id>
```

### Options

- `--update-denormalized`: Cập nhật cả tên, đơn vị, giá trong ConsultedService theo dịch vụ B
- `--delete-old`: Xoá dịch vụ A sau khi chuyển đổi hoàn tất

### Ví dụ

#### 1. Chỉ chuyển đổi dentalServiceId (giữ nguyên lịch sử giá)

```bash
npx tsx scripts/migrate-service/migrate-dental-service.ts abc-123-uuid def-456-uuid
```

- ✅ Update `dentalServiceId` từ A → B
- ✅ Giữ nguyên `consultedServiceName`, `consultedServiceUnit`, `price` (lịch sử)
- ❌ Không xoá dịch vụ A

#### 2. Chuyển đổi + cập nhật dữ liệu denormalized

```bash
npx tsx scripts/migrate-service/migrate-dental-service.ts abc-123-uuid def-456-uuid --update-denormalized
```

- ✅ Update `dentalServiceId` từ A → B
- ✅ Update `consultedServiceName`, `consultedServiceUnit`, `price` theo dịch vụ B
- ⚠️ **Cảnh báo**: Dữ liệu lịch sử sẽ bị ghi đè!

#### 3. Chuyển đổi + xoá dịch vụ cũ

```bash
npx tsx scripts/migrate-service/migrate-dental-service.ts abc-123-uuid def-456-uuid --delete-old
```

- ✅ Update `dentalServiceId` từ A → B
- ✅ Xoá dịch vụ A sau khi hoàn tất
- ✅ Giữ nguyên lịch sử giá

#### 4. Full migration (cập nhật tất cả + xoá dịch vụ cũ)

```bash
npx tsx scripts/migrate-service/migrate-dental-service.ts abc-123-uuid def-456-uuid --update-denormalized --delete-old
```

- ✅ Update `dentalServiceId` từ A → B
- ✅ Update tên, đơn vị, giá theo dịch vụ B
- ✅ Xoá dịch vụ A
- ⚠️ **Cảnh báo**: Mất hoàn toàn lịch sử!

## 📊 Quy trình thực hiện

1. **Kiểm tra dịch vụ A**: Xác nhận tồn tại và hiển thị thông tin
2. **Kiểm tra dịch vụ B**: Xác nhận tồn tại và hiển thị thông tin
3. **Đếm số lượng**: Đếm ConsultedService đang sử dụng dịch vụ A
4. **Xác nhận**: Hiển thị tóm tắt và chờ 3 giây để xác nhận
5. **Cập nhật**: Chuyển đổi tất cả ConsultedService
6. **Xoá (nếu có)**: Xoá dịch vụ A nếu dùng `--delete-old`
7. **Báo cáo**: Hiển thị tổng kết

## 🎯 Kịch bản sử dụng phổ biến

### Kịch bản 1: Gộp dịch vụ trùng lặp (giữ lịch sử giá)

```bash
# Ví dụ: "Cạo vôi răng" và "Cạo vôi" là 2 dịch vụ giống nhau
npx tsx scripts/migrate-service/migrate-dental-service.ts old-service-id new-service-id --delete-old
```

✅ Phù hợp khi muốn giữ nguyên giá đã tư vấn cho khách hàng

### Kịch bản 2: Điều chỉnh giá toàn bộ

```bash
# Ví dụ: Nâng cấp dịch vụ và muốn cập nhật giá mới
npx tsx scripts/migrate-service/migrate-dental-service.ts old-id new-id --update-denormalized --delete-old
```

⚠️ Cẩn thận: Sẽ ghi đè giá đã tư vấn trước đó!

### Kịch bản 3: Test trước khi xoá

```bash
# Bước 1: Chuyển đổi trước
npx tsx scripts/migrate-service/migrate-dental-service.ts old-id new-id

# Bước 2: Kiểm tra trong Supabase/Prisma Studio
# Bước 3: Xoá thủ công nếu OK
```

✅ An toàn nhất - kiểm tra trước khi xoá

## ⚠️ Lưu ý quan trọng

### 1. Về dữ liệu denormalized

- `consultedServiceName`, `consultedServiceUnit`, `price` là **snapshot tại thời điểm tư vấn**
- Giữ nguyên để tracking lịch sử giá
- Chỉ dùng `--update-denormalized` nếu thực sự cần thiết

### 2. Về việc xoá dịch vụ

- Script sẽ kiểm tra lại trước khi xoá
- Nếu vẫn còn liên kết, sẽ không xoá được
- Có thể chạy lại với `--delete-old` sau nếu quên

### 3. Về backup

- **Nên backup database trước khi chạy script**
- Dùng Supabase Dashboard → Database → Backups
- Hoặc export bảng `ConsultedService` và `DentalService` ra CSV

### 4. Về transaction

- Script dùng Prisma transactions nên an toàn
- Nếu có lỗi, thay đổi sẽ bị rollback

## 🔍 Kiểm tra kết quả

### Trong Supabase SQL Editor:

```sql
-- Kiểm tra ConsultedService đã chuyển sang dịch vụ B chưa
SELECT
  id,
  "dentalServiceId",
  "consultedServiceName",
  price
FROM "ConsultedService"
WHERE "dentalServiceId" = 'def-456-uuid'; -- ID của dịch vụ B

-- Kiểm tra xem còn ConsultedService nào dùng dịch vụ A không
SELECT COUNT(*)
FROM "ConsultedService"
WHERE "dentalServiceId" = 'abc-123-uuid'; -- ID của dịch vụ A
-- Kết quả phải là 0
```

### Trong Prisma Studio:

```bash
npx prisma studio
```

- Mở bảng `ConsultedService`
- Filter theo `dentalServiceId`
- Kiểm tra các record đã chuyển đổi

## 🆘 Troubleshooting

### Lỗi "Không tìm thấy dịch vụ A/B"

```
❌ Không tìm thấy dịch vụ A với id: abc-123
```

➡️ Kiểm tra lại ID, có thể copy nhầm

### Lỗi "Vẫn còn ConsultedService liên kết"

```
❌ Vẫn còn 5 ConsultedService liên kết với dịch vụ A!
```

➡️ Script đã update nhưng vẫn còn record. Kiểm tra database.

### Muốn rollback

Nếu đã chạy nhưng muốn hoàn tác:

1. Restore từ backup
2. Hoặc chạy script ngược lại (đổi B về A)

```bash
npx tsx scripts/migrate-service/migrate-dental-service.ts def-456-uuid abc-123-uuid
```

## 📞 Cần giúp đỡ?

Nếu không chắc chắn, chạy script **KHÔNG có** `--delete-old` trước:

```bash
npx tsx scripts/migrate-service/migrate-dental-service.ts old-id new-id
```

Sau đó kiểm tra kết quả, nếu OK thì xoá thủ công hoặc chạy lại với `--delete-old`.
