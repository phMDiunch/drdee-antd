# Yêu cầu Layout Private (Ant Design)

Sử dụng Ant Design và @ant-design/icons để dựng layout cho khu vực private của ứng dụng.

## Cấu trúc tổng thể

- Layout gồm 2 phần chính:
  1. Header (cố định trên cùng, luôn hiển thị)
  2. Khu vực nội dung gồm:
     - Sidebar (menu 2 cấp, cuộn độc lập)
     - Khu vực chính: Breadcrumb và Content

Sơ đồ:

- Header (sticky, không cuộn)
- Body
  - Sidebar (cuộn riêng)
  - Main
    - Breadcrumb
    - Content (cuộn theo nội dung)

## Header

- Trái: Logo.
- Giữa: Ô tìm kiếm (Search input).
- Phải: Notification và Avatar người dùng.
  - Click Avatar hiển thị menu gồm: Profile và Sign out.
- Luôn ở trên cùng, không bị cuộn khi nội dung dài (sticky).

## Sidebar

- Menu 2 cấp:
  - Mục cấp 1 (menu) có icon.
  - Mục cấp 2 (submenu) không có icon.
- Bấm mục cấp 1 sẽ sổ/thu các submenu.
- Trạng thái mở/đóng và chọn mục phản ánh URL hiện tại (đồng bộ theo route/param).
- Sidebar không cuộn theo Content; có thanh cuộn riêng khi danh sách dài.

## Breadcrumb và Content

- Breadcrumb đặt phía trên Content trong khu vực chính.
- Content hiển thị nội dung trang, cuộn theo nội dung.
- Breadcrumb phản ánh đường dẫn hiện tại.

## Thành phần Ant Design khuyến nghị

- Layout: Header, Sider, Content.
- Menu (mode="inline") cho Sidebar; sử dụng icon ở cấp 1.
- Breadcrumb cho đường dẫn.
- Input.Search cho ô tìm kiếm.
- Dropdown + Avatar cho menu người dùng.
- Badge/Notification icon cho thông báo.

## Tiêu chí chấp nhận

- Header luôn cố định trên cùng, không cuộn.
- Sidebar có thể cuộn độc lập với Content.
- Submenu không hiển thị icon; menu cấp 1 có icon.
- Chọn/ mở menu phản ánh đúng URL; chuyển trang khi click.
- Breadcrumb hiển thị đúng cấu trúc đường dẫn.
- Giao diện sử dụng Ant Design và @ant-design/icons theo yêu cầu.

## Ghi chú

- Tập trung yêu cầu layout; nội dung trang chi tiết nằm ngoài phạm vi tài liệu này.
