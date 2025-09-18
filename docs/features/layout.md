# Feature: App Layout

## 1) Overview

AppShell dùng cho khu vực `(private)`: Header cố định (Logo | Search | Notifications | User), bên dưới chia Sider (menu) + Content. Mục tiêu: khung UI nhất quán, responsive, ít CSS ngoài, ưu tiên Ant Design.

## 2) Folder structure

- `src/layouts/AppLayout/AppLayout.tsx` — ráp khung tổng (Header + Sider + Content), quản lý menu state
- `src/layouts/AppLayout/AppHeader.tsx` — Header “dumb”: nhận `currentUser`, render 3 vùng, responsive
- `src/layouts/AppLayout/SidebarNav.tsx` — Sider + Menu inline, scroll riêng
- `src/layouts/AppLayout/menu.config.ts` — cấu hình menu (icon ở cấp 1, children không icon)
- `src/layouts/AppLayout/theme.ts` — kích thước layout (HEADER_HEIGHT, SIDER_WIDTH,...)

> Header nhận `currentUser` từ SSR (được inject tại `src/app/(private)/layout.tsx`).

## 3) Data flow

`(private)/layout.tsx (Server)` → `getSessionUser()` → `AppLayout (Client)` → `AppHeader (Client)`

- Menu: `menu.config.ts` → `AppLayout` tính `selectedKeys`, `openKeys` theo URL → `SidebarNav`.

## 4) Behavior & UX

- Header sticky, không trôi khi content scroll.
- Sider có scroll riêng, `breakpoint="lg"`, collapse được.
- Content có scroll riêng, padding theo token AntD.
- Responsive Header:
  - md↑: hiện đủ Search + Avatar + Tên + Role (Tag)
  - sm/xs: nút hamburger + icon search mở Modal; chỉ hiển thị Avatar (tên/role ẩn)

## 5) State management

- Server state: không có.
- UI state (cục bộ): `collapsed`, `openKeys`, `selectedKeys` — giữ trong `AppLayout`. (Có thể chuyển sang Zustand nếu cần dùng chéo nhiều nơi.)

## 6) Security

- Khu vực `(private)` đã có middleware chặn khi chưa đăng nhập.
- Header hiển thị thông tin từ SSR; không tin dữ liệu client.

## 7) Theming & Customization

- Màu sắc: `src/shared/providers/antd.tsx` → `ConfigProvider.theme.token`.
- Kích thước: `src/layouts/AppLayout/theme.ts`.

## 8) Testing checklist

- Collapse/expand Sider.
- Điều hướng menu + highlight `selectedKeys`, `openKeys`.
- Header responsive md/xs.
- Scroll độc lập giữa Sider và Content.

## 9) TODO

- Breadcrumb (để sau).
- Quick create button trên Header.
- Chi nhánh hiện tại + Switcher (sau khi có Employee/Clinic).
