## Model

model Clinic {
id String @id @default(uuid())

// Thông tin cơ bản
clinicCode String @unique // Mã phòng khám
name String @unique // Tên phòng khám
address String // Địa chỉ phòng khám
phone String? // Số điện thoại liên hệ
email String? // Email liên hệ
colorCode String? // Mã màu để phân biệt phòng khám trên UI
archivedAt DateTime? @db.Timestamptz // Ngày phòng khám ngừng hoạt động

// Metadata
createdAt DateTime @default(now()) @db.Timestamptz // Ngày tạo
updatedAt DateTime @updatedAt @db.Timestamptz // Ngày cập nhật cuối

// Liên kết đến nhân viên
employees Employee[]
}

## Yêu cầu

1. Tạo phòng khám (Create)

- Chỉ có admin mới tạo được phòng khám
- Tạo bằng modal
- validate:
  --- clinicCode: require, unique
  --- name: require
  --- phone: đúng định dạng việt nam
  --- email: đúng định dạng
  --- colorCode: require

- form:
  --- Hàng 1: clinicCode, name, colorCode (chọn màu dạng color picker, hiển thị mã hex)
  --- Hàng 2: address, phone, email

2. List phòng khám

- Do số lượng phòng khám hiện tại ít (<10) , nên sẽ không cần phân trang, cũng ko cần các chức năng nâng cao: lọc, sắp xếp, tìm kiếm.
- Có tách thành table (ClinicTable.tsx) riêng?
- Table có button Edit, Delete. Hiển thị icon và Tooltip. Ấn vào nút Delete sẽ hiển thị Popconfirm.
- Table có các cột: clinicCode, name, phone, address, colorCode

3. Detail phòng khám (View/Edit)

- Hiển thị như chức năng Tạo phòng khám (modal).
- Hiển thị cả phần createdAt và updatedAt với role Admin
- Cho phép chỉnh sửa tất cả các trường.

4. Delete / Archive phòng khám

- Chỉ cho xoá khi không còn dữ liệu nào gắn với Clinic, nếu có dữ liệu chỉ cho Archive (lưu trữ)
- Nếu có dữ liệu trong archivedAt: thì phòng khám đó ngừng hoạt động, không hiển thị để select trong các tính năng khác. Có thêm toggle để hiện thị các clinic đã archive.

5. Layout

- Header
  --- Header sẽ có hiển thị clinicCode (tag) dựa theo clinicId của user (employee) ở cạnh logo.
  --- Màu của tag sẽ là colorCode.
  --- Không có chức năng chọn clinicCode ở đây.
- SideNav
  --- Hiển thị submenu clinic trong menu cài đặt (setting)

## Câu hỏi

- Các feature khác sẽ sử dụng id và clinicCode để chọn phòng khám. Vậy dữ liệu này sẽ được lưu ở đâu để optimization?
