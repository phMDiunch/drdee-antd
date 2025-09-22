# Feature: Auth (Login & Logout)

## 1) Mục tiêu & Phạm vi

Xác thực người dùng bằng **Supabase (email/password)**, quản lý **session qua HttpOnly cookie** (SSR-friendly), bảo vệ khu vực `(private)` bằng **middleware**. Header lấy thông tin user theo hướng **SSR inject**.

## 2) Thư mục & File

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx                    # 📄 Page render LoginView
│   └── api/v1/auth/
│       ├── login/
│       │   └── route.ts                    # 🚀 POST login (SSR Supabase)
│       └── logout/
│           └── route.ts                    # 🚀 POST logout
│
├── features/auth/
│   ├── api/
│   │   ├── login.ts                        # 🔄 fetch -> parse Zod -> LoginResponse
│   │   └── logout.ts                       # 🔄 fetch -> parse Zod -> LogoutResponse
│   ├── components/
│   │   └── LoginForm.tsx                   # 🎨 AntD form, validator (Zod hoặc rule AntD)
│   ├── hooks/
│   │   ├── useLogin.ts                     # 🪝 React Query mutation
│   │   └── useLogout.ts                    # 🪝 React Query mutation
│   ├── views/
│   │   └── LoginView.tsx                   # 📱 Bố cục trang login
│   ├── constants.ts                        # 📋 Endpoint/messages chuẩn hoá
│   ├── types.ts                           # 🏷️ Type suy ra từ schema Zod
│   └── index.ts                           # 📦 Barrel exports
│
├── server/services/
│   └── auth.service.ts                     # ⚙️ getSessionUser() (SSR inject Header)
│
├── services/supabase/
│   ├── server.ts                          # 🗄️ createClient() (Next 15: cookies() async)
│   └── middleware.ts                      # 🛡️ updateSession() cho src/middleware.ts
│
└── shared/
    ├── validation/
    │   └── auth.schema.ts                 # ✅ Zod schema: LoginRequest/Response...
    ├── types/
    │   └── user.ts                        # 👤 UserCore dùng chung toàn app
    ├── utils/
    │   └── guards.ts                      # 🛡️ isApiError/isLoginResponse...
    └── constants/
        └── routes.ts                      # 🛣️ DEFAULT_AFTER_LOGIN, sanitizeNext()
```

## 3) Data Flow (Login)

1. **UI**: `LoginForm` → submit email/password.
2. **Hook**: `useLogin` (**useMutation**) gọi `loginApi`.
3. **Client API**: `loginApi` → `POST /api/v1/auth/login` → parse JSON bằng **Zod**.
4. **Server API**: `login/route.ts` → validate body (Zod) → `supabase.auth.signInWithPassword()` → Supabase set **session cookie** → trả `{ user }`.
5. **Hook onSuccess**: toast + `router.replace(next || "/dashboard")`.
6. **Middleware**: người chưa login bị redirect về `/login?next=...`.
7. **SSR inject**: `(private)/layout.tsx` gọi `getSessionUser()` → truyền `currentUser` cho `AppLayout`/`AppHeader`.

## 4) Data Flow (Logout)

`useLogout` → `logoutApi` → `POST /auth/logout` → `supabase.auth.signOut()` xoá cookie → toast + `router.replace("/login")`.

## 5) API Contracts

### `POST /api/v1/auth/login`

- **Body**: `{ email: string; password: string }` (Zod: required, email format)
- **200**: `{ user: { id: string; email: string | null } | null }`
- **400**: `{ error: string }` dữ liệu không hợp lệ
- **401**: `{ error: string }` sai thông tin
- **500**: `{ error: string }` lỗi hệ thống

### `POST /api/v1/auth/logout`

- **200**: `{ ok: true }`
- **4xx/5xx**: `{ error: string }`

## 6) Validation & Error Handling

- **Client**:
  - AntD Form rule hoặc Zod field-level; trước khi gọi API parse tổng thể (Zod).
  - React Query `onError` → `message.error(err.message)`.
- **Server**:
  - Zod parse request; map lỗi Supabase “Invalid login credentials” → “Email hoặc mật khẩu không đúng.”
  - Luôn trả body `{ error }` khi !ok.

## 7) State Management

- **React Query**: `useMutation` cho login/logout (loading/error/success).
- **Không lưu session ở JS** (cookie HttpOnly).
- **Header**: lấy user bằng **SSR (`getSessionUser`)**.

## 8) Security

- Middleware bảo vệ `(private)`.
- `sanitizeNext()` chỉ cho phép `?next=` nội bộ (`/...`) để tránh **open redirect**.
- Không tin dữ liệu role/id từ client.

## 9) Testing Checklist

- Login: thiếu field / sai password / đúng thông tin.
- Redirect theo `next` hoặc `/dashboard`.
- Logout: cookie bị xoá, redirect `/login`.
- Middleware chặn private khi chưa login.
- SSR Header hiển thị tên/role từ metadata hoặc (sau này) Employee.

## 10) TODO / Nâng cấp

- Ghép **Employee** vào `getSessionUser()` (theo `authUserId`).
- `/api/v1/auth/me` (nếu cần fetch client-side).
- Role-based guard cho API quan trọng.
