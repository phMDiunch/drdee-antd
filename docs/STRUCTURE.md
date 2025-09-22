# 🏗️ Project Structure

```
📁 drdee-next/
├── 🗄️ prisma/
│   └── schema.prisma                           # Database schema definition
├── 🌐 public/
│   └── images/                                 # Static assets
├── 📦 src/
│   ├── 🚦 app/                                # Next.js App Router
│   │   ├── 🔐 (auth)/                         # Auth route group
│   │   │   ├── login/page.tsx                 # Login page
│   │   │   ├── register/page.tsx              # Registration page
│   │   │   └── forgot-password/page.tsx       # Password recovery
│   │   ├── 🔒 (private)/                      # Protected routes
│   │   │   ├── layout.tsx                     # Private layout wrapper
│   │   │   ├── dashboard/page.tsx             # Main dashboard
│   │   │   ├── customers/
│   │   │   │   ├── page.tsx                   # Customer list
│   │   │   │   └── [id]/page.tsx              # Customer detail
│   │   │   ├── employees/                     # Employee management
│   │   │   ├── appointments/                  # Appointment management
│   │   │   └── ...                           # Other protected routes
│   │   ├── 🔌 api/                           # API routes
│   │   │   ├── appointments/
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── check-in/route.ts      # Check-in endpoint
│   │   │   │   │   ├── confirm/route.ts       # Confirmation endpoint
│   │   │   │   │   └── checkout/route.ts      # Check-out endpoint
│   │   │   │   ├── checked-in/route.ts        # Checked-in list
│   │   │   │   └── check-conflict/route.ts    # Conflict detection
│   │   │   ├── customers/                     # Customer APIs
│   │   │   ├── employees/                     # Employee APIs
│   │   │   └── ...                           # Other API routes
│   │   ├── 🎨 globals.css                     # Global styles
│   │   ├── 📄 layout.tsx                      # Root layout
│   │   └── 🏠 page.tsx                        # Home page
│   │
│   ├── 🔗 shared/                            # 🆕 Domain-agnostic reusable code
│   │   ├── 🧩 components/                     # UI primitives & cross-domain components
│   │   │   ├── 🏥 ClinicLogo.tsx              # Cross-domain business components
│   │   │   ├── 🔍 GlobalCustomerSearch.tsx    # Global search component
│   │   │   └── 📦 index.ts                    # Barrel export
│   │   │
│   │   ├── 🪝 hooks/                         # Cross-domain custom hooks
│   │   │   ├── useAuth.ts                     # Authentication hook
│   │   │   ├── useLocalStorage.ts             # Local storage management
│   │   │   ├── useDebounce.ts                 # Input debouncing hook
│   │   │   ├── usePagination.ts               # Pagination logic hook
│   │   │   ├── useToggle.ts                   # Toggle state hook
│   │   │   └── index.ts                       # Hook exports
│   │   │
│   │   ├── 🏷️ types/                          # Shared TypeScript types
│   │   │   ├── user.ts                        # User-related types
│   │   │   ├── global.ts                      # Global app types
│   │   │   ├── api.ts                         # API response/request types
│   │   │   ├── database.ts                    # Database model types
│   │   │   ├── ui.ts                          # UI component types
│   │   │   └── index.ts                       # Type exports
│   │   │
│   │   ├── 🛠️ utils/                          # Pure utility functions
│   │   │   ├── guards.ts                      # Type guards & validation
│   │   │   ├── date.ts                        # Date utilities
│   │   │   ├── excelExport.ts                 # Excel export utilities
│   │   │   ├── validation.ts                  # Validation utilities
│   │   │   ├── formatters.ts                  # Data formatters
│   │   │   ├── helpers.ts                     # General helpers
│   │   │   └── index.ts                       # Utility exports
│   │   │
│   │   ├── 📋 constants/                      # Global constants
│   │   │   ├── route.ts                       # App routes & navigation
│   │   │   ├── api.ts                         # API endpoints
│   │   │   ├── ui.ts                          # UI constants (colors, sizes...)
│   │   │   ├── validation.ts                  # Validation rules
│   │   │   └── index.ts                       # Constant exports
│   │   │
│   │   ├── ✅ validation/                     # Common Zod schemas
│   │   │   ├── common.schema.ts               # Shared validation schemas
│   │   │   ├── api.schema.ts                  # API request/response schemas
│   │   │   └── index.ts                       # Validation exports
│   │   │
│   │   ├── 🔧 providers/                      # React context providers
│   │   │   ├── antd.tsx                       # Ant Design theme provider
│   │   │   ├── react-query.tsx                # React Query client provider
│   │   │   └── index.ts                       # Provider exports
│   │   │
│   │   └── 📦 index.ts                        # Main barrel export
│   │
│   ├── 🏗️ layouts/                           # Layout components
│   │   ├── AppLayout/
│   │   │   ├── AppLayout.tsx                  # Main app layout
│   │   │   ├── AppHeader.tsx                  # Application header
│   │   │   ├── SidebarNav.tsx                 # Sidebar navigation
│   │   │   ├── menu.config.tsx                # Menu configuration & structure
│   │   │   └── theme.ts                       # Layout theme settings
│   │   ├── AuthLayout/                        # Authentication layout
│   │   └── index.ts                           # Layout exports
│   │
│   ├── 🎯 features/                          # Domain-driven features
│   │   ├── 👥 employees/
│   │   │   ├── 🔄 api/                        # Domain API (React Query hooks)
│   │   │   │   ├── queries.ts                 # useEmployeesQuery, useEmployeeQuery
│   │   │   │   ├── mutations.ts               # useCreateEmployee, useUpdateEmployee
│   │   │   │   └── index.ts                   # API exports
│   │   │   ├── 🧩 components/                 # Domain-specific components
│   │   │   │   ├── EmployeeForm.tsx           # Employee form component
│   │   │   │   ├── EmployeeTable.tsx          # Employee table component
│   │   │   │   ├── EmployeeCard.tsx           # Employee card component
│   │   │   │   └── index.ts                   # Component exports
│   │   │   ├── 🪝 hooks/                      # Domain-specific hooks
│   │   │   │   ├── useEmployeeValidation.ts   # Employee validation
│   │   │   │   ├── useEmployeeFilters.ts      # Employee filters
│   │   │   │   └── index.ts                   # Hook exports
│   │   │   ├── 📱 views/                      # Page-level components
│   │   │   │   ├── EmployeeListView.tsx       # Employee list page
│   │   │   │   ├── EmployeeDetailView.tsx     # Employee detail page
│   │   │   │   ├── EmployeeCreateView.tsx     # Employee creation page
│   │   │   │   └── index.ts                   # View exports
│   │   │   ├── 🏷️ types.ts                    # Domain types
│   │   │   ├── 📋 constants.ts                # Domain constants
│   │   │   └── 📦 index.ts                    # Feature barrel export
│   │   │
│   │   ├── 👤 customers/                      # Customer management
│   │   │   ├── api/                           # Customer APIs
│   │   │   ├── components/                    # Customer components
│   │   │   ├── hooks/                         # Customer hooks
│   │   │   ├── views/                         # Customer views
│   │   │   ├── types.ts                       # Customer types
│   │   │   ├── constants.ts                   # Customer constants
│   │   │   └── index.ts                       # Customer exports
│   │   │
│   │   ├── 🦷 consulted-services/             # Dental consultation services
│   │   │   ├── api/                           # Service APIs
│   │   │   ├── components/
│   │   │   │   └── ToothSelectionModal.tsx    # Tooth selection modal
│   │   │   ├── hooks/                         # Service hooks
│   │   │   ├── views/
│   │   │   │   └── DailyView.tsx              # Daily consultation view
│   │   │   ├── types.ts                       # Service types
│   │   │   ├── constants.ts                   # Service constants
│   │   │   └── index.ts                       # Service exports
│   │   │
│   │   ├── 📅 appointments/                   # Appointment management
│   │   ├── 🦷 dental-services/                # Dental service catalog
│   │   ├── 💰 payments/                       # Payment processing
│   │   ├── 📊 reports/                        # Reporting & analytics
│   │   ├── 🏪 suppliers/                      # Supplier management
│   │   ├── 🩺 treatment-care/                 # Treatment & care tracking
│   │   └── 📈 dashboard/                      # Dashboard features
│   │
│   ├── 🖥️ server/                            # Server-side logic (Clean Architecture)
│   │   ├── 🗃️ repos/                         # Data access layer (Prisma queries)
│   │   │   ├── employee.repo.ts               # Employee data access
│   │   │   └── index.ts                       # Repository exports
│   │   │
│   │   └── ⚙️ services/                       # Business logic layer
│   │       ├── auth.service.ts                # Authentication business logic
│   │       ├── employee.service.ts            # Employee business logic
│   │       └── index.ts                       # Service exports
│   │
│   ├── 📚 lib/                               # Third-party configurations
│   │   ├── QueryProvider.tsx                  # React Query setup
│   │   ├── AntdRegistry.tsx                   # Ant Design setup
│   │   ├── authHeaders.ts                     # Auth configuration
│   │   └── index.ts                           # Library exports
│   │
│   ├── 🔌 services/                          # External service clients
│   │   ├── 🔐 supabase/                       # Supabase authentication & database
│   │   │   ├── client.ts                      # Client-side Supabase instance
│   │   │   ├── server.ts                      # Server-side Supabase instance
│   │   │   └── middleware.ts                  # Supabase middleware configuration
│   │   │
│   │   └── �️ prisma/                        # Prisma ORM configuration
│   │       └── prisma.ts                      # Prisma client instance
│   │
│   ├── 🏪 stores/                            # Global state management (Zustand)
│   │   ├── useAppStore.ts                     # Main app store
│   │   ├── useAuthStore.ts                    # Auth state (if needed)
│   │   └── index.ts                           # Store exports
│   │
│   └── 📊 data/                              # Static data files
│       └── vietnamAdministrativeUnits.json    # Vietnam geographic data
│
├── 📄 package.json                            # Project dependencies
├── ⚙️ next.config.ts                          # Next.js configuration
├── 🏷️ tsconfig.json                           # TypeScript configuration
├── 🔍 eslint.config.mjs                       # ESLint configuration
└── 📖 README.md                               # Project documentation
```
