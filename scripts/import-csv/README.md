# Import Dental Services từ CSV

Script này giúp bạn update dữ liệu Dental Services từ file CSV vào Supabase.

## Cách sử dụng

### Bước 1: Export dữ liệu từ Supabase

Có 2 cách:

**Cách 1: Dùng Supabase Dashboard**

1. Vào Supabase Dashboard → Table Editor
2. Chọn bảng `DentalService`
3. Click "Export to CSV"

**Cách 2: Dùng script SQL trong Supabase SQL Editor**

```sql
COPY (
  SELECT
    id,
    name,
    description,
    "serviceGroup",
    department,
    tags,
    unit,
    price,
    "minPrice",
    "officialWarranty",
    "clinicWarranty",
    origin,
    "avgTreatmentMinutes",
    "avgTreatmentSessions",
    "updatedById"
  FROM "DentalService"
  ORDER BY name
) TO STDOUT WITH CSV HEADER;
```

### Bước 2: Chỉnh sửa file CSV

- Mở file CSV bằng Excel, Google Sheets, hoặc text editor
- **QUAN TRỌNG**: Giữ nguyên cột `id` - đây là cột dùng để xác định record cần update
- Chỉnh sửa các cột khác tùy ý: `name`, `price`, `description`, v.v.
- Lưu file

**Lưu ý về cột `tags`:**

- Có thể để dạng: `"tag1,tag2,tag3"` (ngăn cách bằng dấu phẩy)
- Hoặc dạng JSON: `["tag1","tag2","tag3"]`
- Script sẽ tự động parse cả 2 định dạng

**Lưu ý về cột `updatedById`:**

- Phải là ID của một Employee hợp lệ trong hệ thống
- Dùng cùng một ID cho tất cả các dòng nếu muốn

### Bước 3: Đặt file CSV vào thư mục scripts/import-csv

```bash
# Copy file CSV vào thư mục scripts/import-csv với tên dental-services.csv
cp /path/to/your/file.csv scripts/import-csv/dental-services.csv
```

### Bước 4: Chạy script import

```bash
# Cài đặt dependencies (nếu chưa có)
npm install csv-parse

# Chạy script
npx tsx scripts/import-csv/import-dental-services-from-csv.ts
```

## Định dạng CSV

File CSV phải có các cột sau (header row):

### Cột bắt buộc:

- `id`: UUID của dental service (KHÔNG ĐƯỢC SỬA)
- `name`: Tên dịch vụ
- `unit`: Đơn vị tính (Răng, Hàm, Lần)
- `price`: Giá niêm yết (số nguyên, VNĐ)
- `updatedById`: ID của employee thực hiện update

### Cột tùy chọn (có thể để trống):

- `description`: Mô tả chi tiết
- `serviceGroup`: Nhóm dịch vụ
- `department`: Bộ môn
- `tags`: Các tag (format: `"tag1,tag2"` hoặc `["tag1","tag2"]`)
- `minPrice`: Giá tối thiểu
- `officialWarranty`: Bảo hành chính hãng
- `clinicWarranty`: Bảo hành phòng khám
- `origin`: Xuất xứ
- `avgTreatmentMinutes`: Thời gian điều trị trung bình (phút)
- `avgTreatmentSessions`: Số buổi điều trị trung bình

## Ví dụ

Xem file `dental-services-example.csv` để biết cấu trúc chi tiết.

## Xử lý lỗi

Script sẽ:

- ✅ Bỏ qua các dòng thiếu `id`, `name`, hoặc `updatedById`
- ✅ Bỏ qua các dòng có `id` không tồn tại trong database
- ✅ Hiển thị chi tiết lỗi cho từng dòng bị lỗi
- ✅ Tiếp tục xử lý các dòng còn lại
- ✅ Báo cáo tổng kết: số dòng thành công/lỗi

## Lưu ý

1. **Backup trước khi import**: Nên export một bản backup trước khi chạy script
2. **Kiểm tra Employee ID**: Đảm bảo `updatedById` là ID hợp lệ
3. **Giá trị số**: `price`, `minPrice`, `avgTreatmentMinutes`, `avgTreatmentSessions` phải là số nguyên
4. **Encoding**: File CSV nên dùng UTF-8 để hỗ trợ tiếng Việt
5. **Testing**: Có thể test với 1-2 dòng trước khi import toàn bộ

## Troubleshooting

### Lỗi "Không tìm thấy file"

```
❌ Không tìm thấy file: scripts/dental-services.csv
```

➡️ Đảm bảo file CSV nằm trong thư mục `scripts/` với tên chính xác `dental-services.csv`

### Lỗi "Không tìm thấy dịch vụ với id=..."

```
❌ Row 5: Không tìm thấy dịch vụ với id=abc-123 - Bỏ qua
```

➡️ ID trong CSV không tồn tại trong database. Kiểm tra lại ID.

### Lỗi "Thiếu id, name hoặc updatedById"

```
⚠️  Row 3: Thiếu id, name hoặc updatedById - Bỏ qua
```

➡️ Dòng CSV thiếu giá trị bắt buộc. Kiểm tra và bổ sung.
