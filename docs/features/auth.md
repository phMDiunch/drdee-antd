# Feature: Auth (Login & Logout)

## 1) Overview

Đăng nhập bằng Supabase (email/password), quản lý session bằng cookie HttpOnly (SSR). Đăng xuất xóa cookie phiên. Header và các route private dùng session SSR để phân quyền.

## 2) Folder structure

- `src/features/auth/types.ts` — kiểu dữ liệu LoginRequest, LoginResponse, ...
- `src/features/auth/constants.ts` — endpoint, messages
- `src/features/auth/api/login.ts`, `logout.ts` — API client (fetch)
- `src/features/auth/hooks/useLogin.ts`, `useLogout.ts` — React Query mutations
- `src/features/auth/components/LoginForm.tsx` — Form AntD (validate rule + parse tổng)
- `src/features/auth/views/LoginView.tsx` — bố cục trang login
- `src/app/(auth)/login/page.tsx` — page render view
- `src/app/api/v1/auth/login/route.ts` — route đăng nhập (Supabase SSR)
- `src/app/api/v1/auth/logout/route.ts` — route đăng xuất
- `src/services/supabase/server.ts` — tạo Supabase SSR client (Next 15 async `cookies()`)
- `src/services/supabase/middleware.ts` + `src/middleware.ts` — chặn truy cập khi chưa đăng nhập
- (shared) `src/shared/types/user.ts` — UserCore dùng chung
- (server) `src/server/services/auth.service.ts` — `getSessionUser()` phục vụ SSR inject vào Header

## 3) Data flow

Form → `useLogin (mutation)` → `loginApi` → `POST /api/v1/auth/login` → Supabase `auth.signInWithPassword` → set cookie → response `{ user }` → `onSuccess`: toast + redirect → Middleware cho vào `(private)` → SSR `getSessionUser()` inject header.

Đăng xuất: `useLogout` → `logoutApi` → `POST /logout` → Supabase `auth.signOut` → xóa cookie → toast + `/login`.

## 4) Validation & Errors

- Client: AntD Form rule + parse tổng (không Zod theo default repo); toast lỗi từ server.
- Server: kiểm tra required, map lỗi Supabase (“Invalid login credentials” → “Email hoặc mật khẩu không đúng.”), status chuẩn 400/401/500.

## 5) State management

- Dùng React Query `useMutation` cho đăng nhập/đăng xuất (loading/error/onSuccess).
- Không lưu session trong JS (cookie HttpOnly). Header lấy user bằng SSR (`getSessionUser`).

## 6) Security

- Middleware bảo vệ `(private)`.
- Chặn open redirect: khi có `?next=` chỉ cho phép path nội bộ (bắt đầu bằng `/`).
- Không tin bất kỳ header client tuỳ ý (role/id); quyền sẽ làm ở server sau khi có Employee.

## 7) Testing checklist

- Login đúng, sai, thiếu field.
- Khi login thành công → redirect đúng `next`/`/dashboard`.
- Logout → redirect `/login`.
- Middleware: vào private khi chưa login → bị chặn.

## 8) TODO

- `/api/v1/auth/me` (optional) nếu cần fetch client-side user.
- Role-based guard cho API quan trọng.
- Join `Employee` vào `getSessionUser()` sau khi có module Employee.
