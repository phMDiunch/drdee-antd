# 🏗️ Feature: App Layout

## 1) Mục tiêu & Phạm vi

Private layout system với AppHeader (sticky) + SidebarNav + Content. Responsive design với breakpoint `lg`, search modal trên mobile, và menu collapse functionality.

## 2) Folder Structure

```
src/layouts/AppLayout/
├── AppLayout.tsx          # Main layout component với menu state management
├── AppHeader.tsx          # Header với logo, search, notifications, user menu
├── SidebarNav.tsx         # Collapsible sidebar với menu navigation
├── menu.config.tsx        # Menu items configuration (icons cấp 1 only)
└── theme.ts              # Layout constants (heights, widths)
```

> Header nhận `currentUser` từ SSR injection tại `src/app/(private)/layout.tsx`

## 3) Architecture & Data Flow

```typescript
// SSR injection flow
(private)/layout.tsx (Server)
  → getSessionUser()
  → AppLayout (Client)
  → AppHeader (Client)

// Menu state management
menu.config.tsx
  → AppLayout (calculates selectedKeys, openKeys from URL)
  → SidebarNav (renders menu)
```

## 4) Layout Components

### 📱 **AppHeader**

- **Logo**: Responsive text ("Nha khoa DR DEE" on lg+, "DR DEE" on mobile)
- **Search**: Input.Search on lg+, search icon → Modal on mobile
- **Notifications**: Badge với count (static)
- **User Menu**: Avatar + name/role on lg+, avatar only on mobile
- **Hamburger**: Menu toggle button với tooltip

### 📋 **SidebarNav**

- **Collapsible**: `breakpoint="lg"` auto-collapse
- **Menu**: AntD Menu với icons cấp 1, children không có icons
- **Scroll**: Independent scrolling từ content

### 📄 **AppLayout**

- **State Management**: `collapsed`, `selectedKeys`, `openKeys`
- **URL Sync**: Menu state sync với current pathname
- **SSR Props**: Receives `currentUser` từ private layout

## 5) Responsive Behavior

### 🖥️ **Breakpoint: lg (≥992px)**

- Show full search input in header
- Display user name + role tag beside avatar
- Logo shows full text "Nha khoa DR DEE"
- Sidebar auto-expanded

### 📱 **Mobile: <lg**

- Search icon opens modal với full-width input
- Hide user name/role, show avatar only
- Logo shows shortened "DR DEE"
- Sidebar auto-collapsed

## 6) Layout Constants

```typescript
// src/layouts/AppLayout/theme.ts
export const APP_LAYOUT = {
  HEADER_HEIGHT: 56, // Header height
  SIDER_WIDTH: 240, // Expanded sidebar width
  SIDER_COLLAPSED_WIDTH: 56, // Collapsed sidebar width
};
```

## 7) Theming & Integration

### 🎨 **Ant Design Theming**

```typescript
// src/shared/providers/antd.tsx
<ConfigProvider
  locale={viVN}
  theme={{
    token: {
      colorPrimary: "#0da70fff",
      // Layout styling via AntD tokens
    },
  }}
>
```

### 🔐 **Security**

- Private routes protected by middleware
- User data từ SSR (`getSessionUser()`)
- No client-side user data dependency

## 8) Implementation Status

### ✅ **Completed Features**

- ✅ Responsive header với breakpoint lg
- ✅ Search functionality với modal fallback
- ✅ Menu state management (selectedKeys, openKeys)
- ✅ Sidebar collapse/expand với breakpoint
- ✅ SSR user injection
- ✅ Notifications placeholder (Badge)
- ✅ User menu với role display

### 📋 **Testing Checklist**

- [x] Sidebar collapse/expand functionality
- [x] Menu navigation với URL sync
- [x] Responsive breakpoint behavior (lg)
- [x] Search modal on mobile devices
- [x] Independent scroll: sidebar vs content
- [x] SSR user data display

---

## ✅ Status: **COMPLETED**

**Implementation Date**: October 2025  
**Last Updated**: October 15, 2025  
**Status**: Production Ready ✅

Core layout system implemented and tested. Ready for production use.

### 📋 **Implementation Summary**

**Completed Components:**

- ✅ AppLayout: Main layout wrapper với menu state
- ✅ AppHeader: Responsive header với search, notifications, user menu
- ✅ SidebarNav: Collapsible navigation với menu items
- ✅ Menu Config: Hierarchical menu structure
- ✅ Theme System: Layout constants và AntD integration

**Architecture Delivered:**

```
✅ SSR User Injection → ✅ Layout Components → ✅ Responsive Design → ✅ Menu Management
```

**Feature Ready For:** Production use, consistent UI layout, responsive navigation.
