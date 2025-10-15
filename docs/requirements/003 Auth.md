# 🔐 Requirements: Authentication System

> **✅ STATUS: COMPLETED** - Implementation finished on October 15, 2025  
> **📄 Feature Documentation**: `docs/features/003_Auth.md`  
> **🔗 Implementation**: `src/features/auth/`

## 🎯 Core Requirements

### 📐 **Authentication Flow**

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Public    │───▶│    Login    │───▶│   Private   │
│   Routes    │    │    Page     │    │   Routes    │
└─────────────┘    └─────────────┘    └─────────────┘
                           │                  │
                           ▼                  ▼
                   ┌─────────────┐    ┌─────────────┐
                   │  Supabase   │    │ Middleware  │
                   │    Auth     │    │ Protection  │
                   └─────────────┘    └─────────────┘
```

---

## 🛠️ Technical Implementation

### 🔗 **Authentication Provider:**

- **Supabase Auth** với email/password
- **HttpOnly Cookies** cho session management
- **SSR-friendly** implementation

### 📡 **API Endpoints:**

```
POST   /api/v1/auth/login     # Authenticate user
POST   /api/v1/auth/logout    # Clear session
```

---

## 🎨 Component Specifications

### 1. 🚪 **Login Page**

#### 🎯 **Layout & Design:**

- **Centered layout** với background
- **Card container** width 420px max
- **Clean form design** với Ant Design

#### 📝 **Form Structure:**

```
┌─────────────────────────────────┐
│      Đăng nhập hệ thống         │
├─────────────────────────────────┤
│ Email    [________________]     │
│ Mật khẩu [________________]     │
│          [   Đăng nhập   ]      │
└─────────────────────────────────┘
```

#### ✅ **Validation Rules:**

- `email`: Required, valid email format
- `password`: Required, minimum 1 character
- **Real-time validation** với React Hook Form + Zod

#### 🔄 **Form Behavior:**

- **Auto-focus** on email field
- **Submit on Enter** key
- **Loading state** during authentication
- **Error feedback** for invalid credentials

---

### 2. 🔒 **Route Protection**

#### 🛡️ **Middleware Logic:**

```typescript
// src/middleware.ts
if (!isAuthenticated && isPrivateRoute) {
  redirect("/login?next=" + currentPath);
}

if (isAuthenticated && isAuthRoute) {
  redirect(nextParam || "/dashboard");
}
```

#### 🗂️ **Route Categories:**

- **Public**: `/`, `/login`, `/forgot-password`
- **Private**: `/dashboard`, `/clinics`, `/customers`, etc.
- **Auth**: `/login`, `/register`, `/forgot-password`

#### 🔄 **Redirect Behavior:**

- **After login**: Redirect to `?next` param or `/dashboard`
- **Protected access**: Redirect to `/login?next=currentPath`
- **Open redirect protection**: Only allow internal paths

---

### 3. 👤 **User Session Management**

#### 📊 **Session Data:**

```typescript
type UserCore = {
  id: string;
  email: string | null;
  fullName: string | null;
  role: string | null;
  avatarUrl: string | null;
  employeeId: string | null;
  clinicId: string | null;
};
```

#### 🔄 **SSR Integration:**

- **Server-side session**: `getSessionUser()` function
- **Layout injection**: Pass user to private layout
- **Header display**: User info trong AppHeader
- **No client-side token**: Security through HttpOnly cookies

---

## 🔐 Security & Error Handling

### 🛡️ **Security Measures:**

- **HttpOnly cookies**: No JS access to tokens
- **CSRF protection**: Built-in với Supabase
- **Session validation**: Every protected request
- **Input sanitization**: Zod schema validation

### 🚨 **Error Handling:**

```typescript
// Error message mapping
'Invalid login credentials' → 'Email hoặc mật khẩu không đúng.'
'Network error' → 'Không thể đăng nhập. Vui lòng thử lại.'
'Server error' → 'Lỗi máy chủ. Vui lòng thử lại.'
```

### 🔒 **Open Redirect Protection:**

```typescript
function sanitizeNext(next?: string): string {
  if (!next || !next.startsWith("/")) {
    return "/dashboard";
  }
  return next;
}
```

---

## 📱 User Experience

### 🎯 **Login Flow:**

1. User visits protected route
2. Middleware redirects to `/login?next=/protected-route`
3. User fills form với validation
4. Submit triggers `useLogin` mutation
5. Success → redirect to `next` or `/dashboard`
6. Error → show user-friendly message

### 🚪 **Logout Flow:**

1. User clicks logout trong header dropdown
2. `useLogout` mutation calls API
3. Supabase clears session cookie
4. Redirect to `/login`
5. Show success message

### 📱 **Responsive Design:**

- **Mobile**: Full-screen login layout
- **Desktop**: Centered card layout
- **Loading states**: Spinner với disabled form
- **Error states**: Inline error messages

---

## 🔄 State Management

### 📊 **React Query Integration:**

```typescript
// Login mutation
useLogin() {
  mutationFn: loginApi,
  onSuccess: (data) => {
    message.success('Đăng nhập thành công');
    router.replace(sanitizeNext(next) || '/dashboard');
  },
  onError: (error) => {
    message.error(error.message);
  }
}

// Logout mutation
useLogout() {
  mutationFn: logoutApi,
  onSuccess: () => {
    message.success('Đăng xuất thành công');
    router.replace('/login');
  }
}
```

### 🎛️ **No Global Auth State:**

- **SSR injection**: User data từ server
- **HttpOnly cookies**: Session management
- **React Query**: API call state only

---

## 📡 API Specifications

### 🔐 **POST /api/v1/auth/login**

#### 📥 **Request:**

```typescript
{
  email: string; // Required, email format
  password: string; // Required
}
```

#### 📤 **Response:**

```typescript
// Success (200)
{
  user: {
    id: string;
    email: string | null;
  } | null;
}

// Error (400/401/500)
{
  error: string;
}
```

### 🚪 **POST /api/v1/auth/logout**

#### 📤 **Response:**

```typescript
// Success (200)
{
  ok: true;
}

// Error (4xx/5xx)
{
  error: string;
}
```

---

## ⚡ Performance & Optimization

### 🔄 **Caching Strategy:**

- **No client-side caching** for auth data
- **SSR injection** for user info
- **React Query mutations** for API calls only

### 🎯 **Loading Optimization:**

- **Minimal JavaScript** on login page
- **Code splitting** cho auth routes
- **Prefetch** dashboard route after login

---

## ✅ Acceptance Criteria

### 🧪 **Authentication Flow:**

- [ ] Login với email/password works
- [ ] Invalid credentials show error
- [ ] Successful login redirects correctly
- [ ] Logout clears session
- [ ] Protected routes require auth
- [ ] Middleware redirects work
- [ ] Next parameter functions
- [ ] Open redirect protection works

### 🎨 **User Interface:**

- [ ] Form validation real-time
- [ ] Loading states during auth
- [ ] Error messages user-friendly
- [ ] Responsive design works
- [ ] Accessibility compliance
- [ ] Auto-focus on email field

### 🔐 **Security Requirements:**

- [ ] HttpOnly cookies secure
- [ ] Session validation works
- [ ] Input sanitization active
- [ ] CSRF protection enabled
- [ ] No token exposure client-side
- [ ] Role checking server-side

### 📱 **User Experience:**

- [ ] Smooth navigation flow
- [ ] Clear success feedback
- [ ] Intuitive error messages
- [ ] Fast login/logout
- [ ] Remember last visited page

---

## 📋 Future Enhancements

### 🔮 **Planned Features:**

- [ ] **Multi-factor auth**: SMS/Email OTP
- [ ] **Social login**: Google, Facebook
- [ ] **Remember me**: Extended session
- [ ] **Password reset**: Email recovery
- [ ] **Account lockout**: Brute force protection
- [ ] **Session management**: Multiple devices

### 🛠️ **Technical Improvements:**

- [ ] **Refresh tokens**: Auto token renewal
- [ ] **Role-based routing**: Dynamic permissions
- [ ] **Audit logging**: Login activity tracking
- [ ] **Device fingerprinting**: Security enhancement
- [ ] **Progressive enhancement**: Offline support
