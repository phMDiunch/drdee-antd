# Hướng dẫn thiết lập dự án DRDEE-ANTD

## 1) Khởi tạo dự án Next.js

```bash
npx create-next-app@latest drdee-antd
```

## 2) Cài đặt Ant Design và Icons

```bash
npm install antd @ant-design/icons
```

## 3) Khắc phục tương thích React 19 cho Ant Design

- Cài đặt gói tương thích:

```bash
npm install @ant-design/v5-patch-for-react-19
```

- Import trong file `app/layout.tsx`:

```ts
import "@ant-design/v5-patch-for-react-19";
```

## 4) Thiết lập Ant Design Registry cho Next.js

- Cài đặt:

```bash
npm install @ant-design/nextjs-registry
```

- Bọc `children` trong `app/layout.tsx`:

```tsx
<AntdRegistry>{children}</AntdRegistry>
```

## 5) Thiết lập xác thực Supabase

- Cài đặt package:

```bash
npm install @supabase/supabase-js @supabase/ssr
```

- Biến môi trường: tạo file `.env.local` và thêm thông tin Supabase.

- Tạo các file dịch vụ:
  - `src/service/supabase/client.ts`
  - `src/service/supabase/server.ts`
  - `src/service/supabase/middleware.ts`
  - `src/middleware.ts`

## 6) Thiết lập Prisma và chạy TypeScript (tsx)

```bash
npm install prisma tsx --save-dev
npm install @prisma/client
```

## 7) Cài đặt Day.js

```bash
npm install dayjs
```

## 8) Tạo các Prisma Models

- 8.1 Branch Model
- 8.2 Employee Model
- 8.3 DentalService Model
- 8.4 Customer Model
- 8.5 Appointment Model
- 8.6 ConsultedService Model
- 8.7 TreatmentLog Model
- 8.8 PaymentVoucher Model
- 8.9 PaymentVoucherDetail Model
- 8.10 TreatmentCare Model

## 9) Thiết lập State Management

```bash
npm install zustand
```

## 10) Thiết lập React Query

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```
