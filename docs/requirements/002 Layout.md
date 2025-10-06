# 🏗️ Requirements: Private Layout System

## 🎯 Core Requirements

### 📐 **Layout Structure**

```
┌─────────────────────────────────────────────────┐
│ Header (sticky, height: 64px)                  │
├─────────────┬───────────────────────────────────┤
│ Sidebar     │ Main Content Area                 │
│ (240px)     │ ┌─────────────────────────────────┤
│             │ │ Breadcrumb (48px)               │
│ Menu        │ ├─────────────────────────────────┤
│ Items       │ │ Page Content (scrollable)       │
│             │ │                                 │
│ (scroll     │ │                                 │
│  independent)│ │                                 │
└─────────────┴─────────────────────────────────────┘
```

---

## 🎨 Component Specifications

### 1. 📱 **Header Component**

#### 🎯 **Layout & Positioning:**

- **Height**: 64px (Ant Design standard)
- **Position**: `sticky` top, z-index high
- **Background**: White with border-bottom

#### 🧩 **Content Structure:**

```
[Logo] ────────── [Global Search] ────────── [Notifications] [Avatar Menu]
```

#### 🔧 **Features:**

- **Logo**: Company logo với link về dashboard
- **Global Search**: `Input.Search` placeholder "Tìm kiếm..."
- **Notifications**: `Badge` + `BellOutlined` icon
- **Avatar Menu**: Dropdown với Profile & Sign out

#### 📱 **Responsive Behavior:**

- Mobile: Hide search, show hamburger menu
- Desktop: Full layout với search bar

---

### 2. 📁 **Sidebar Navigation**

#### 🎯 **Structure & Behavior:**

- **Width**: 240px desktop, collapsible
- **Menu Type**: `Menu` component với `mode="inline"`
- **Scroll**: Independent scrolling với `overflow-y: auto`

#### 🗂️ **Menu Hierarchy:**

```typescript
Level 1 (with icons):
├─ 📊 Dashboard
├─ 👥 Khách hàng
│   ├─ Danh sách        // No icon
│   └─ Thêm mới         // No icon
├─ 👨‍💼 Nhân sự
│   ├─ Danh sách
│   └─ Thêm mới
├─ 📅 Lịch hẹn
├─ 💰 Thanh toán
├─ 📊 Báo cáo
└─ ⚙️ Cài đặt
    └─ 🏥 Phòng khám
```

#### 🔄 **State Management:**

- **Selected menu**: Sync với current route
- **Open submenus**: Reflect URL structure
- **Persistent state**: Remember collapsed/expanded

---

### 3. 🧭 **Breadcrumb Component**

#### 🎯 **Functionality:**

- **Auto-generation**: Based on current route
- **Clickable items**: Navigate to parent routes
- **Current page**: Last item (non-clickable)

#### 📋 **Examples:**

```
Dashboard
Khách hàng / Danh sách
Cài đặt / Phòng khám
Khách hàng / Thêm mới
```

---

### 4. 📄 **Content Area**

#### 🎯 **Properties:**

- **Scrolling**: Content-based scrolling
- **Padding**: Standard spacing around content
- **Background**: Light gray background

---

## 🛠️ Technical Implementation

### 🏗️ **Component Architecture:**

```
AppLayout.tsx
├─ AppHeader.tsx
│  ├─ Logo component
│  ├─ GlobalSearch.tsx
│  ├─ NotificationIcon.tsx
│  └─ UserDropdown.tsx
├─ SidebarNav.tsx
│  └─ menu.config.tsx
├─ BreadcrumbNav.tsx
└─ Content wrapper
```

### 📡 **Layout Props & Context:**

```typescript
type LayoutProps = {
  currentUser: UserCore | null;
  currentClinic?: ClinicInfo | null; // For header tag
  children: React.ReactNode;
};
```

### 🎨 **Ant Design Components:**

- `Layout`: Main layout container
- `Layout.Header`: Header component
- `Layout.Sider`: Sidebar component
- `Layout.Content`: Content area
- `Menu`: Navigation menu
- `Breadcrumb`: Breadcrumb navigation
- `Input.Search`: Global search
- `Dropdown`: User menu
- `Avatar`: User avatar
- `Badge`: Notification badge

---

## 🔄 Responsive Design

### 📱 **Mobile (< 768px):**

- **Sidebar**: Collapsible drawer
- **Header**: Hamburger menu + logo + avatar
- **Search**: Hidden or modal-based
- **Content**: Full width

### 💻 **Desktop (≥ 768px):**

- **Sidebar**: Always visible, 240px width
- **Header**: Full layout với search
- **Content**: Calculated width

### 🎛️ **Collapsible States:**

```typescript
// Sidebar collapse states
type SiderState = {
  collapsed: boolean;
  collapsedWidth: 80; // Show icons only
  breakpoint: "lg"; // Auto-collapse point
};
```

---

## 🔐 Security & User Context

### 👤 **User Information Display:**

- **Avatar**: User profile picture or initials
- **Dropdown Menu**: Profile settings + Sign out
- **Clinic Tag**: Show current clinic (if applicable)

### 🏷️ **Clinic Integration:**

- **Header Tag**: Clinic code với background color
- **Position**: Next to logo
- **Data Source**: From `employee.clinicId`

---

## 🎨 Styling & Theme

### 🎨 **Color Scheme:**

```scss
$header-bg: #ffffff;
$sidebar-bg: #fafafa;
$content-bg: #f5f5f5;
$border-color: #d9d9d9;
$primary-color: #1890ff;
```

### 📏 **Dimensions:**

```scss
$header-height: 64px;
$sidebar-width: 240px;
$sidebar-collapsed-width: 80px;
$content-padding: 24px;
$breadcrumb-height: 48px;
```

---

## ⚡ Performance Considerations

### 🔄 **State Management:**

- **Menu state**: Local component state
- **User data**: SSR injection + React Query cache
- **Route sync**: React Router integration

### 🎯 **Optimization:**

- **Menu icons**: Tree-shaking unused icons
- **Layout shifts**: Fixed dimensions prevent CLS
- **Scroll performance**: Virtual scrolling for large menus

---

## ✅ Acceptance Criteria

### 🧪 **Layout Functionality:**

- [ ] Header stays fixed on scroll
- [ ] Sidebar scrolls independently
- [ ] Menu reflects current route
- [ ] Breadcrumb shows correct path
- [ ] Submenu expand/collapse works
- [ ] Mobile responsive design
- [ ] User dropdown functions
- [ ] Global search placeholder

### 🎨 **Visual Requirements:**

- [ ] Level 1 menus have icons
- [ ] Level 2 menus no icons
- [ ] Consistent spacing
- [ ] Proper hover states
- [ ] Loading states smooth
- [ ] Clinic tag displays correctly

### 🔧 **Technical Standards:**

- [ ] TypeScript strict mode
- [ ] Accessibility compliance
- [ ] Performance optimization
- [ ] Clean component architecture
- [ ] Proper error boundaries

---

## 📋 Future Enhancements

### 🔮 **Planned Features:**

- [ ] **Theme switching**: Dark/light mode
- [ ] **Layout customization**: Sidebar width adjustment
- [ ] **Advanced search**: Global search with filters
- [ ] **Notification system**: Real-time notifications
- [ ] **Multi-language**: i18n support
- [ ] **Layout persistence**: Remember user preferences

### 🛠️ **Technical Improvements:**

- [ ] **Performance**: Virtual scrolling for large menus
- [ ] **Accessibility**: Keyboard navigation
- [ ] **Analytics**: User interaction tracking
- [ ] **Caching**: Menu configuration caching
