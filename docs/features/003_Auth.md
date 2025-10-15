# Feature: Auth (Login, Logout, Forgot Password & Reset Password)

## 1) Mục tiêu & Phạm vi

Xác thực người dùng bằng **Supabase (email/password)**, quản lý **session qua HttpOnly cookie** (SSR-friendly), bảo vệ khu vực `(private)` bằng **middleware**. Header lấy thông tin user theo hướng **SSR inject**. Hỗ trợ **forgot password & reset password** flow để giải quyết vấn đề user complete profile trước khi có password fields.

## 2) Thư mục & File

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx                    # 📄 Page render LoginView
│   │   ├── forgot-password/
│   │   │   └── page.tsx                    # 📄 Page render ForgotPasswordView
│   │   └── reset-password/
│   │       └── page.tsx                    # 📄 Page render ResetPasswordView
│   └── api/v1/auth/
│       ├── login/
│       │   └── route.ts                    # 🚀 POST login (SSR Supabase)
│       ├── logout/
│       │   └── route.ts                    # 🚀 POST logout
│       ├── forgot-password/
│       │   └── route.ts                    # 🚀 POST forgot password (Supabase)
│       └── reset-password/
│           └── route.ts                    # 🚀 POST reset password (Supabase)
│
├── features/auth/
│   ├── api/
│   │   ├── login.ts                        # 🔄 fetch -> parse Zod -> LoginResponse
│   │   ├── logout.ts                       # 🔄 fetch -> parse Zod -> LogoutResponse
│   │   ├── forgotPassword.ts               # 🔄 fetch -> parse Zod -> ForgotPasswordResponse
│   │   └── resetPassword.ts                # 🔄 fetch -> parse Zod -> ResetPasswordResponse
│   ├── components/
│   │   ├── LoginForm.tsx                   # 🎨 AntD form, validator (Zod hoặc rule AntD)
│   │   ├── ForgotPasswordForm.tsx          # 🎨 AntD form cho forgot password
│   │   └── ResetPasswordForm.tsx           # 🎨 AntD form cho reset password
│   ├── hooks/
│   │   ├── useLogin.ts                     # 🪝 React Query mutation
│   │   ├── useLogout.ts                    # 🪝 React Query mutation
│   │   ├── useForgotPassword.ts            # 🪝 React Query mutation
│   │   └── useResetPassword.ts             # 🪝 React Query mutation
│   ├── views/
│   │   ├── LoginView.tsx                   # 📱 Bố cục trang login
│   │   ├── ForgotPasswordView.tsx          # 📱 Bố cục trang forgot password
│   │   └── ResetPasswordView.tsx           # 📱 Bố cục trang reset password
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
    │   └── auth.schema.ts                 # ✅ Zod schema: LoginRequest/Response, ForgotPasswordRequest/Response, ResetPasswordRequest/Response
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

## 5) Data Flow (Forgot Password)

1. **UI**: `ForgotPasswordForm` → submit email.
2. **Hook**: `useForgotPassword` (**useMutation**) gọi `forgotPasswordApi`.
3. **Client API**: `forgotPasswordApi` → `POST /api/v1/auth/forgot-password` → parse JSON bằng **Zod**.
4. **Server API**: `forgot-password/route.ts` → validate body (Zod) → `supabase.auth.resetPasswordForEmail()` → Supabase gửi email với reset link → trả `{ ok: true }`.
5. **Hook onSuccess**: toast thông báo "Email đã được gửi".
6. **Email Link**: User click link → redirect về `/reset-password?token=...`.

## 6) Data Flow (Reset Password)

1. **UI**: `ResetPasswordForm` → submit password + confirmPassword.
2. **Hook**: `useResetPassword` (**useMutation**) gọi `resetPasswordApi`.
3. **Client API**: `resetPasswordApi` → `POST /api/v1/auth/reset-password` → parse JSON bằng **Zod**.
4. **Server API**: `reset-password/route.ts` → validate body (Zod) → `supabase.auth.updateUser({ password })` → update password → trả `{ ok: true }`.
5. **Hook onSuccess**: toast + `router.replace("/login")`.

## 7) API Contracts

### `POST /api/v1/auth/login`

- **Body**: `{ email: string; password: string }` (Zod: required, email format)
- **200**: `{ user: { id: string; email: string | null } | null }`
- **400**: `{ error: string }` dữ liệu không hợp lệ
- **401**: `{ error: string }` sai thông tin
- **500**: `{ error: string }` lỗi hệ thống

### `POST /api/v1/auth/logout`

- **200**: `{ ok: true }`
- **4xx/5xx**: `{ error: string }`

### `POST /api/v1/auth/forgot-password`

- **Body**: `{ email: string }` (Zod: required, email format)
- **200**: `{ ok: true }`
- **400**: `{ error: string }` dữ liệu không hợp lệ
- **500**: `{ error: string }` lỗi hệ thống

### `POST /api/v1/auth/reset-password`

- **Body**: `{ password: string; confirmPassword: string }` (Zod: required, min 6 chars, must match)
- **200**: `{ ok: true }`
- **400**: `{ error: string }` dữ liệu không hợp lệ
- **401**: `{ error: string }` token không hợp lệ
- **500**: `{ error: string }` lỗi hệ thống

## 8) Validation & Error Handling

- **Client**:
  - AntD Form rule hoặc Zod field-level; trước khi gọi API parse tổng thể (Zod).
  - React Query `onError` → `message.error(err.message)`.
- **Server**:
  - Zod parse request; map lỗi Supabase “Invalid login credentials” → “Email hoặc mật khẩu không đúng.”
  - Luôn trả body `{ error }` khi !ok.

## 9) State Management

- **React Query**: `useMutation` cho login/logout/forgot-password/reset-password (loading/error/success).
- **Không lưu session ở JS** (cookie HttpOnly).
- **Header**: lấy user bằng **SSR (`getSessionUser`)**.

## 10) Security

- Middleware bảo vệ `(private)`.
- `sanitizeNext()` chỉ cho phép `?next=` nội bộ (`/...`) để tránh **open redirect**.
- Không tin dữ liệu role/id từ client.
- Password reset token được Supabase quản lý tự động.

## 11) Testing Checklist

- Login: thiếu field / sai password / đúng thông tin.
- Redirect theo `next` hoặc `/dashboard`.
- Logout: cookie bị xoá, redirect `/login`.
- Forgot Password: email valid/invalid, check email được gửi.
- Reset Password: password validation, token invalid/expired.
- Middleware chặn private khi chưa login.
- SSR Header hiển thị tên/role từ metadata hoặc (sau này) Employee.

## 12) TODO / Nâng cấp

- Ghép **Employee** vào `getSessionUser()` (theo `authUserId`).
- `/api/v1/auth/me` (nếu cần fetch client-side).
- Role-based guard cho API quan trọng.
- Rate limiting cho forgot password để tránh spam email.
