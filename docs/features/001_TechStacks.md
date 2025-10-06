# 🛠️ Feature: Tech Stack Overview

## 1) Mục tiêu & Phạm vi

Tổng quan về stack công nghệ được sử dụng trong dự án DRDEE-ANTD - một hệ thống quản lý phòng khám nha khoa.

### 🎯 **Core Features**

- ✅ **Modern React Stack**: Next.js 15 + React 19 + TypeScript
- 📊 **Full-stack Solution**: Frontend + Backend + Database integrated
- 🔐 **Enterprise Security**: Supabase Auth + Role-based permissions

### 🎨 **Architecture Integration**

- 📁 **Clean Architecture**: Separation of concerns với layers rõ ràng
- 🏷️ **Type Safety**: End-to-end TypeScript từ database đến UI
- 📱 **Responsive First**: Mobile-first design với Ant Design

---

## 2) Frontend Stack

### ⚛️ **React & Next.js**

```json
{
  "next": "15.5.3",
  "react": "19.1.0",
  "react-dom": "19.1.0",
  "typescript": "^5"
}
```

- **Next.js 15**: App Router với RSC (React Server Components)
- **React 19**: Latest với Concurrent Features
- **TypeScript**: Strict mode cho type safety
- **Turbopack**: Build tool cho development & production

### 🎨 **UI Framework**

```json
{
  "antd": "^5.27.3",
  "@ant-design/icons": "^6.0.2",
  "@ant-design/nextjs-registry": "^1.1.0",
  "@ant-design/v5-patch-for-react-19": "^1.0.3"
}
```

- **Ant Design 5**: Enterprise-class UI components
- **Design System**: Consistent theming và branding
- **Icons**: Comprehensive icon library
- **React 19 Compatibility**: Patches cho compatibility

### 📝 **Forms & Validation**

```json
{
  "react-hook-form": "^7.63.0",
  "@hookform/resolvers": "^5.2.2",
  "zod": "^4.1.11"
}
```

- **React Hook Form**: Performant forms với minimal re-renders
- **Zod Integration**: Schema-first validation
- **Type Safety**: End-to-end typed forms

### 🔄 **State Management**

```json
{
  "@tanstack/react-query": "^5.89.0",
  "@tanstack/react-query-devtools": "^5.89.0",
  "zustand": "^5.0.8"
}
```

- **React Query**: Server state management + caching
- **Zustand**: UI state cho global state needs
- **DevTools**: Development debugging tools

---

## 3) Backend Stack

### 🚀 **API Layer**

- **Next.js API Routes**: Server-side endpoints trong `/api/v1/`
- **Route Handlers**: App Router native API handling
- **Middleware**: Authentication và route protection
- **SSR Integration**: Server-side rendering với data fetching

### 🔐 **Authentication**

```json
{
  "@supabase/supabase-js": "^2.57.4",
  "@supabase/ssr": "^0.7.0"
}
```

- **Supabase Auth**: Email/password authentication
- **HttpOnly Cookies**: Secure session management
- **SSR Support**: Server-side authentication checks
- **Role-based Access**: Admin/User permissions

### 📊 **Database & ORM**

```json
{
  "@prisma/client": "^6.16.2",
  "prisma": "^6.16.2"
}
```

- **Prisma ORM**: Type-safe database access
- **PostgreSQL**: Production database (Supabase)
- **Schema Management**: Migration-based schema evolution
- **Type Generation**: Auto-generated TypeScript types

---

## 4) Development Tools

### 🛠️ **Build & Development**

```json
{
  "eslint": "^9",
  "eslint-config-next": "15.5.3",
  "tsx": "^4.20.5"
}
```

- **ESLint**: Code linting với Next.js config
- **TypeScript Compiler**: Strict type checking
- **tsx**: TypeScript execution cho scripts
- **Turbopack**: Fast development build tool

### 📅 **Date Handling**

```json
{
  "dayjs": "^1.11.18"
}
```

- **Day.js**: Lightweight date manipulation
- **Timezone Support**: UTC storage, local display
- **Vietnamese Locale**: Local date formatting

---

## 5) Architecture Patterns

### 🏗️ **Clean Architecture:**

```
🎨 Presentation Layer (UI Components)
    ↓
🪝 Application Layer (Hooks & State)
    ↓
🔄 Domain Layer (API Client & Types)
    ↓
🚀 Infrastructure Layer (API Routes)
    ↓
⚙️ Service Layer (Business Logic)
    ↓
🗄️ Data Layer (Prisma Repository)
    ↓
📄 Database (PostgreSQL)
```

### 📁 **Feature-based Structure:**

```
features/[feature]/
├── api/          # HTTP client calls
├── components/   # UI components
├── hooks/        # React Query hooks
├── views/        # Page components
├── types.ts      # Feature-specific types
├── constants.ts  # Endpoints & constants
└── index.ts      # Barrel exports
```

### ✅ **Type Safety Stack:**

1. **Database**: Prisma schema → TypeScript types
2. **API**: Zod schemas cho request/response validation
3. **Frontend**: React Hook Form + Zod resolvers
4. **State**: React Query với typed hooks

---

## 6) Security & Validation

### 🔐 **Authentication Flow:**

- **Supabase Auth**: Secure authentication provider
- **HttpOnly Cookies**: Session storage không accessible từ JS
- **Middleware Protection**: Route-level authentication
- **Role Validation**: Server-side permission checks

### ✅ **Validation Strategy:**

- **Client-side**: Real-time validation với React Hook Form + Zod
- **Server-side**: Request validation với Zod schemas
- **Database**: Prisma constraints cho data integrity
- **Type Safety**: End-to-end TypeScript coverage

---

## 7) Performance & Optimization

### ⚡ **Frontend Optimization:**

- **React Query**: Smart caching với stale-while-revalidate
- **Code Splitting**: Dynamic imports cho feature modules
- **SSR/RSC**: Server-side rendering cho better performance
- **Ant Design**: Tree-shaking cho optimal bundle size

### 🗄️ **Backend Optimization:**

- **Prisma**: Efficient database queries với select optimization
- **Connection Pooling**: Supabase managed connections
- **Caching Strategy**: React Query client + server caching
- **Middleware**: Lightweight authentication checks

---

## 8) Development Workflow

### 📝 **Development Scripts:**

```bash
npm run dev        # Development với Turbopack
npm run build      # Production build
npm run lint       # Code linting
npm run db:seed    # Database seeding
```

### 🔄 **Database Workflow:**

```bash
npx prisma generate    # Generate TypeScript types
npx prisma db push     # Push schema changes
npx prisma studio      # Visual database browser
npm run db:seed        # Seed database với sample data
```

### 🧪 **Quality Assurance:**

- **TypeScript**: Strict mode compilation
- **ESLint**: Code quality enforcement
- **Prisma**: Schema validation
- **Zod**: Runtime validation

---

## 9) Deployment & Production

### 🚀 **Production Stack:**

- **Vercel**: Frontend deployment với Next.js optimization
- **Supabase**: Database + Authentication hosting
- **CDN**: Static assets delivery
- **Environment Variables**: Secure configuration management

### 📊 **Monitoring & Analytics:**

- **React Query DevTools**: Development debugging
- **Supabase Dashboard**: Database monitoring
- **Vercel Analytics**: Performance tracking
- **Error Boundaries**: Graceful error handling

---

## 10) Future Tech Considerations

### 🔮 **Planned Upgrades:**

- [ ] **React Query v6**: Latest caching strategies
- [ ] **Next.js 16**: When stable release available
- [ ] **Prisma v6**: Advanced query optimization
- [ ] **Ant Design v6**: Future design system updates

### 🛠️ **Potential Additions:**

- [ ] **Redis**: Advanced caching layer
- [ ] **WebSocket**: Real-time features
- [ ] **PWA**: Progressive Web App capabilities
- [ ] **Testing**: Jest + React Testing Library

### ⚠️ **Migration Considerations:**

- **React 19**: Handled với compatibility patches
- **Next.js 15**: App Router stable adoption
- **Supabase**: Future auth improvements
- **Prisma**: Schema evolution strategies

---

## 🎯 Best Practices

### 📝 **Code Standards:**

1. **TypeScript Strict**: No any types, complete type coverage
2. **ESLint Rules**: Consistent code formatting
3. **Feature Organization**: Clean module boundaries
4. **Error Handling**: Comprehensive error boundaries

### 🏗️ **Architecture Guidelines:**

1. **Separation of Concerns**: Clear layer responsibilities
2. **Type Safety**: End-to-end TypeScript usage
3. **Performance First**: Optimization-minded development
4. **Security by Default**: Secure coding practices
