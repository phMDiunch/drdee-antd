1. List employees

```
model Employee {
  id String @id @default(uuid())

  // Thông tin tài khoản
  uid   String? @unique // User ID từ Supabase Auth để liên kết
  email String  @unique // Email đăng nhập
  role  String // Vai trò trong hệ thống: "admin", "employee"

  // Thông tin cơ bản
  fullName      String //
  dob           DateTime? @db.Date // Ngày sinh
  gender        String? // Giới tính
  avatarUrl     String? //
  favoriteColor String? // Màu yêu thích để cá nhân hóa giao diện

  // Thông tin liên hệ
  phone          String  @unique
  currentAddress String? // Địa chỉ hiện tại
  hometown       String? // Quê quán

  // Thông tin pháp lý & BH
  nationalId           String?   @unique // Số CCCD
  nationalIdIssueDate  DateTime? @db.Date // Ngày cấp
  nationalIdIssuePlace String? // Nơi cấp
  taxId                String?   @unique // Mã số thuế
  insuranceNumber      String?   @unique // Số sổ BHXH

  // Thông tin ngân hàng
  bankAccountNumber String? // Số tài khoản ngân hàng
  bankName          String? // Tên ngân hàng

  // Thông tin công việc
  employeeCode     String? @unique // Mã nhân viên
  employmentStatus String? // "Đang làm việc", "Nghỉ việc"
  clinicId         String? // ID của phòng khám làm việc
  department       String? // Phòng ban
  team             String? // Bộ phận
  jobTitle         String? // Chức danh
  positionTitle    String? // Chức vụ

  // Metadata
  createdById String? // ID của người tạo
  updatedById String? // ID của người cập nhật cuối

  createdAt DateTime @default(now()) @db.Timestamptz
  updatedAt DateTime @updatedAt @db.Timestamptz

  // Liên kết đến nhân viên
  createdBy        Employee?  @relation("CreatedEmployees", fields: [createdById], references: [id])
  updatedBy        Employee?  @relation("UpdatedEmployees", fields: [updatedById], references: [id])
  createdEmployees Employee[] @relation("CreatedEmployees")
  updatedEmployees Employee[] @relation("UpdatedEmployees")

  // Liên kết đến phòng khám
  clinic Clinic? @relation(fields: [clinicId], references: [id])

  // Liên kết đến khách hàng
  createdCustomers Customer[] @relation("CreatedCustomers")
  updatedCustomers Customer[] @relation("UpdatedCustomers")

  // Liên kết đến dịch vụ nha khoa
  createdDentalServices DentalService[] @relation("CreatedDentalServices")
  updatedDentalServices DentalService[] @relation("UpdatedDentalServices")

  // Liên kết đến lịch hẹn
  primaryDentistAppointments   Appointment[] @relation("PrimaryDentistAppointments")
  secondaryDentistAppointments Appointment[] @relation("SecondaryDentistAppointments")
  createdAppointments          Appointment[] @relation("CreatedAppointments")
  updatedAppointments          Appointment[] @relation("UpdatedAppointments")

  // Liên kết đến dịch vụ tư vấn
  consultingDoctorServices ConsultedService[] @relation("ConsultingDoctorServices")
  consultingSaleServices   ConsultedService[] @relation("ConsultingSaleServices")
  treatingDoctorServices   ConsultedService[] @relation("TreatingDoctorServices")
  createdConsultedServices ConsultedService[] @relation("CreatedConsultedServices")
  updatedConsultedServices ConsultedService[] @relation("UpdatedConsultedServices")

  // Liên kết đến nhật ký điều trị
  dentistLogs    TreatmentLog[] @relation("DentistLogs")
  assistant1Logs TreatmentLog[] @relation("Assistant1Logs")
  assistant2Logs TreatmentLog[] @relation("Assistant2Logs")
  createdLogs    TreatmentLog[] @relation("CreatedLogs")
  updatedLogs    TreatmentLog[] @relation("UpdatedLogs")

  // Liên kết đến phiếu thu
  cashierVouchers PaymentVoucher[] @relation("CashierVouchers")
  createdVouchers PaymentVoucher[] @relation("CreatedVouchers")
  updatedVouchers PaymentVoucher[] @relation("UpdatedVouchers")

  // Liên kết đến chi tiết phiếu thu
  createdVoucherDetails PaymentVoucherDetail[] @relation("CreatedVoucherDetails")

  // Liên kết đến chăm sóc sau điều trị (aftercare)
  careStaffTreatmentCares TreatmentCare[]
  createdTreatmentCares   TreatmentCare[] @relation("CreatedTreatmentCares")
  updatedTreatmentCares   TreatmentCare[] @relation("UpdatedTreatmentCares")

  // Liên kết đến nhà cung cấp
  createdSuppliers Supplier[] @relation("CreatedSuppliers")
  updatedSuppliers Supplier[] @relation("UpdatedSuppliers")
}
```

Xem file sơ đồ tổ chức công ty: organizationalStructure.ts

1. List employeees

- Chỉ có admin và employee thuộc phòng back office mới có thể truy cập tính năng này
- Nhân viên có 2 trạng thái (employeeStatus): đang làm việc (WORKING), nghỉ việc (RESIGNED). Mặc định sẽ tải các nhân viên có trạng thái: đang làm việc. Có toggle bật tắt để tải các nhân viên nghỉ việc.

  Phân trang phía server (server-side pagination)
  Lọc, sắp xếp, tìm kiếm thực hiện ở server.
  Khi người dùng nhập và ấn enter thì mới thực hiện tìm kiếm

  Trong các module/feature khác sẽ cần đến danh sách nhân viên đang làm việc để chọn trong các ô form input (VD: lịch hẹn cho bác sĩ nào, nhân viên nào tư vấn, nhân viên nào điều trị cho khách hàng ....). Danh sách này (WorkingEmployee) sẽ được tạo route riêng. Sử dụng reactquery để cache WorkingEmployee với thời gian tầm 30 phút, trả về các trường giống như lúc tạo nhân viên (xem bên dưới)

- Thiết kế phần giao diện của trang gồm
  --- Phần thông tin trang: tiêu đè
  --- Phần statistics: các chỉ số tổng quan
  ------ Tổng số nhân viên đang làm việc
  ------ Nhân viên mới trong tháng: Số lượng nhân viên có createAt trong tháng
  ------ Phân bổ theo phòng ban: Biểu đồ tròn thể hiện tỷ lệ nhân viên theo department
  Phân bổ theo chi nhánh: Biểu đồ cột thể hiện số lượng nhân viên ở mỗi clinicId
  --- Phần filter + button toggle + button add
  ------ Select để lọc theo Chi nhánh (clinicId).
  ------ Select để lọc theo Phòng ban (department).
  --- Phần table gồm các cột: employeeCode, fullName, phone (hiển thị nút gọi), clinicId (tag, màu tag là colorCode của clinic) , department, jobTitle, role
  --- Table có cột action là các button edit, delete. Hiển thị icon và Tooltip, ấn vào nút delete sẽ hiển thị Popconfirm. Chỉ xoá được khi không có dữ liệu nào gắn với employee đó.

2. Tạo employee

- Bussiness logic:

* Admin / employee phòng BO tạo nhân viên mới. Nhập các trường bắt buộc sau:
  --- email: đúng định dạng, không trùng
  --- role: admin hoặc user,
  --- fullname
  --- phone: đúng định dạng: 10 chữ số, với số 0 ở đầu; không trùng
  --- employeeStatus: để mặc định là đang làm việc
  --- clinicId: dựa vào table clinic
  --- department, jobTitle, positionTitle: dựa vào file sơ đồ tổ chức: organizationalStructure.ts

- Gửi email về mail user, user bấm vào link truy cập vào trang điền thông tin, cập nhật các thông tin bắt buộc sau: fullname, dob, gender, favoriteColor, currentAdress, hometown, nationalId, nationalIdIssueDate, nationalIdIssuePlace, các thông tin còn lại tuỳ chọn.

  Trang điền thông tin là trang "Hoàn tất hồ sơ" (/complete-profile) riêng biệt.
  Trang này chỉ có thể truy cập khi người dùng đã xác thực qua email nhưng chưa hoàn thành thông tin bắt buộc. Sau khi hoàn tất, họ sẽ được chuyển đến trang dashboard.

- Sau khi cập nhật thông tin thì sẽ truy cập được vào webapp. Thông tin và vai trò của user sẽ được hiển thị trên header, avatar nếu không có thì sẽ lấy avatar mặc định cho nam riêng và nữ riêng (antd icons)

- Email sẽ hết hạn trong 12h, admin / phòng BO có thể gửi lại email mời
- Trường hợp không nhập mail thì sẽ không tạo tài khoản (supabase auth). Sau này nhập lại email thì sẽ có nút mời nếu chưa có tài khoản (supabase auth)

* Giao diện

- Tạo bằng trang riêng

3. Edit / view employee

- admin có thể xem sửa được tất cả các thông tin, cả thông tin metadata của tất cả các user
- user thuộc phòng backoffice có thể xem sửa được các thông tin của các user, ngoại trừ các thông tin: role, email của tất cả các users. Không xem sửa được thông tin metadata
- user không thuộc phòng backoffice thì chỉ có thể sửa các thông tin của chính mình ngoại trừ các thông tin: role, email, employmentStatus, clinicid, department, team, jobtitle, positonTitle. Không xem sửa được thông tin metadata

Không cho bất cứ ai có thể thay đổi email?

4. Delete nhân viên

- Chỉ cho xoá nhân viên khi không còn dữ liệu nào gắn với nhân viên đó.
- Nếu nhân viên không còn làm việc nữa thì có thể chuyển trạng thái nhân viên sang nghỉ việc. Lúc đó nhân viên cũng ko truy cập được vào webapp và không xuất hiện trong các option để chọn lựa cho các form input.

5. Tính năng nâng cao khác

- Audit log (ai sửa gì, khi nào) cho Employee
- Role/Permission chi tiết (CASL) theo action + field (field-level access server/FE)
- Hồ sơ nhân sự: đính kèm hợp đồng, chứng chỉ: cho phép tải lên và quản lý các hợp đồng lao động, phụ lục hợp đồng, theo dõi ngày bắt đầu, ngày kết thúc.
- Chấm công / Ca làm / Lịch trực tích hợp Appointment/Room
- Quản lý nghỉ phép: Nhân viên có thể tạo yêu cầu nghỉ phép, quản lý có thể duyệt/từ chối. Hệ thống tự động tính toán số ngày phép còn lại.
- KPI/OKR theo phòng ban (Marketing/Sales/Treatment): đánh giá hiệu suất (Performance Review): Xây dựng quy trình đánh giá nhân viên định kỳ (hàng quý, hàng năm) với các tiêu chí và feedback.
- Thông báo (email/Telegram) khi: nhân sự mới, thay đổi clinic, đổi ca…
