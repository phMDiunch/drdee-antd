# DrDee Antd - Hệ thống đăng ký/đăng nhập với Firebase

Hệ thống authentication hiện đại sử dụng React, Vite, Ant Design và Firebase.

## ✨ Tính năng

- 🔐 **Đăng ký/Đăng nhập** với Firebase Authentication
- 👤 **Quản lý trạng thái tài khoản** (pending/approve/reject/disabled)
- 📧 **Quên mật khẩu** với Firebase Password Reset
- 🎨 **Giao diện đẹp** với Ant Design Theme System
- 📱 **Responsive** trên mọi thiết bị
- 🔔 **Thông báo** với React Toastify
- 🛡️ **Bảo mật** với Environment Variables

## 🚀 Cài đặt

### 1. Clone repository

```bash
git clone <repository-url>
cd drdee-antd
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Cấu hình Firebase

1. Tạo project Firebase tại [Firebase Console](https://console.firebase.google.com/)
2. Bật Authentication với Email/Password
3. Tạo Firestore Database
4. Copy cấu hình Firebase

### 4. Cấu hình Environment Variables

```bash
# Copy file .env.example thành .env
cp .env.example .env
```

Cập nhật file `.env` với thông tin Firebase của bạn:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 5. Chạy ứng dụng

```bash
npm run dev
```

## 📁 Cấu trúc thư mục

```
src/
├── components/          # Components tái sử dụng
│   ├── Header.jsx
│   └── Sidebar.jsx
├── contexts/           # React Contexts
│   └── AuthContext.jsx
├── pages/              # Các trang chính
│   ├── Home.jsx
│   └── auth/           # Module authentication
│       ├── SignIn.jsx      # Đăng nhập
│       ├── SignUp.jsx      # Đăng ký
│       ├── ForgotPassword.jsx  # Quên mật khẩu
│       ├── Pending.jsx     # Chờ phê duyệt
│       └── Reject.jsx      # Tài khoản bị từ chối
└── services/           # Services và utilities
    └── firebase.js     # Cấu hình Firebase
```

## 🔄 Luồng xử lý Authentication

1. **Đăng ký**: User điền form → Kiểm tra trùng lặp → Tạo Firebase Auth → Lưu Firestore với status "pending"
2. **Đăng nhập**: User nhập email/password → Xác thực Firebase → Kiểm tra trạng thái → Chuyển hướng
3. **Trạng thái tài khoản**:
   - `pending`: Chờ phê duyệt
   - `approve`: Được phê duyệt, vào được trang chủ
   - `reject`: Bị từ chối, hiển thị trang Reject
   - `disabled`: Bị vô hiệu hóa

## 🎨 UI/UX

- **Design System**: Sử dụng hoàn toàn Ant Design Theme Tokens
- **Responsive**: Mobile-first design
- **Loading States**: Hiệu ứng loading cho mọi action
- **Error Handling**: Thông báo lỗi chi tiết và user-friendly
- **Navigation**: Routes RESTful với alias (`/login` → `/signin`)

## 🛡️ Bảo mật

- ✅ Environment variables cho Firebase config
- ✅ Validation phía client và server
- ✅ Kiểm tra trùng lặp email/phone/CCCD
- ✅ Rate limiting cho password reset
- ✅ Sanitize user input

## 📦 Dependencies

### Core

- React 18
- Vite
- React Router DOM

### UI/UX

- Ant Design
- React Toastify

### Backend

- Firebase (Auth + Firestore)

## 🔧 Scripts

```bash
npm run dev          # Chạy development server
npm run build        # Build cho production
npm run preview      # Preview build
npm run lint         # Chạy ESLint
```

## 📝 Environment Variables

| Variable                            | Description                  | Example                   |
| ----------------------------------- | ---------------------------- | ------------------------- |
| `VITE_FIREBASE_API_KEY`             | Firebase API Key             | `AIza...`                 |
| `VITE_FIREBASE_AUTH_DOMAIN`         | Firebase Auth Domain         | `project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID`          | Firebase Project ID          | `my-project`              |
| `VITE_FIREBASE_STORAGE_BUCKET`      | Firebase Storage Bucket      | `project.appspot.com`     |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID | `123456789`               |
| `VITE_FIREBASE_APP_ID`              | Firebase App ID              | `1:123:web:abc`           |
| `VITE_SUPPORT_EMAIL`                | Support Email                | `support@domain.com`      |

## 🚀 Deploy

### Vercel

```bash
npm run build
# Deploy thư mục dist/
```

### Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

## 📄 License

MIT License

## 👥 Contributors

- DrDee Teamte

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
