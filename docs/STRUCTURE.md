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
│   │   ├── 🔌 api/                           # API routes (GET only - Hybrid pattern)
│   │   │   ├── v1/                            # Versioned API endpoints
│   │   │   │   ├── appointments/
│   │   │   │   │   ├── route.ts               # GET /appointments (list)
│   │   │   │   │   ├── [id]/route.ts          # GET /appointments/:id (detail)
│   │   │   │   │   ├── daily/route.ts         # GET /appointments/daily (by date)
│   │   │   │   │   └── check-availability/route.ts # GET availability check
│   │   │   │   ├── customers/
│   │   │   │   │   ├── route.ts               # GET /customers (list)
│   │   │   │   │   ├── [id]/route.ts          # GET /customers/:id (detail)
│   │   │   │   │   ├── search/route.ts        # GET /customers/search
│   │   │   │   │   └── daily/route.ts         # GET /customers/daily
│   │   │   │   ├── employees/
│   │   │   │   │   ├── route.ts               # GET /employees (list)
│   │   │   │   │   ├── [id]/route.ts          # GET /employees/:id (detail)
│   │   │   │   │   └── working/route.ts       # GET /employees/working
│   │   │   │   ├── clinics/
│   │   │   │   │   ├── route.ts               # GET /clinics (list)
│   │   │   │   │   └── [id]/route.ts          # GET /clinics/:id (detail)
│   │   │   │   └── dental-services/
│   │   │   │       ├── route.ts               # GET /dental-services (list)
│   │   │   │       └── [id]/route.ts          # GET /dental-services/:id (detail)
│   │   │   └── public/                        # Public API endpoints
│   │   │       └── employees/                 # Public employee endpoints
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
│   │   ├── ✅ validation/                     # Zod schemas (single source of truth)
│   │   │   ├── auth.schema.ts                 # Auth validation schemas & types (z.infer)
│   │   │   ├── employee.schema.ts             # Employee schemas & types
│   │   │   ├── clinic.schema.ts               # Clinic schemas & types
│   │   │   ├── dental-service.schema.ts       # Service schemas & types
│   │   │   └── common.schema.ts               # Shared validation schemas
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
│   ├── 🎯 features/                          # Domain-driven features (Clean Architecture)
│   │   ├── 👥 employees/
│   │   │   ├── 🔄 api/                        # API client functions (GET requests only)
│   │   │   │   ├── getEmployees.ts            # Fetch employees list
│   │   │   │   ├── getEmployeeById.ts         # Fetch employee detail
│   │   │   │   ├── getWorkingEmployees.ts     # Fetch working employees
│   │   │   │   └── index.ts                   # API exports (barrel)
│   │   │   ├── 🧩 components/                 # Domain-specific components
│   │   │   │   ├── EmployeeForm.tsx           # Employee form component
│   │   │   │   ├── EmployeeTable.tsx          # Employee table component
│   │   │   │   └── EmployeeCard.tsx           # Employee card component
│   │   │   ├── 🪝 hooks/                      # React Query hooks (mutations use Server Actions)
│   │   │   │   ├── useEmployees.ts            # Query hook: GET /employees
│   │   │   │   ├── useEmployeeById.ts         # Query hook: GET /employees/:id
│   │   │   │   ├── useCreateEmployee.ts       # Mutation: createEmployeeAction()
│   │   │   │   ├── useUpdateEmployee.ts       # Mutation: updateEmployeeAction()
│   │   │   │   ├── useDeleteEmployee.ts       # Mutation: deleteEmployeeAction()
│   │   │   │   ├── useSetEmployeeStatus.ts    # Mutation: setEmployeeStatusAction()
│   │   │   │   ├── useResendEmployeeInvite.ts # Mutation: resendEmployeeInviteAction()
│   │   │   │   └── index.ts                   # Hook exports (barrel)
│   │   │   ├── 📱 views/                      # Page-level components
│   │   │   │   ├── EmployeeListView.tsx       # Employee list page
│   │   │   │   ├── EmployeeDetailView.tsx     # Employee detail page
│   │   │   │   └── EmployeeCreateView.tsx     # Employee creation page
│   │   │   └── 📋 constants.ts                # Domain constants, query keys, messages
│   │   │
│   │   ├── 👤 customers/                      # Customer management
│   │   │   ├── api/                           # Customer APIs
│   │   │   ├── components/                    # Customer components
│   │   │   ├── hooks/                         # Customer hooks
│   │   │   ├── views/                         # Customer views
│   │   │   └── constants.ts                   # Customer constants
│   │   │
│   │   ├── 🦷 dental-services/                # Dental service catalog
│   │   │   ├── api/                           # Service APIs
│   │   │   ├── components/                    # Service components
│   │   │   ├── hooks/                         # Service hooks
│   │   │   ├── views/                         # Service views
│   │   │   └── constants.ts                   # Service constants
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
│   │   ├── ⚡ actions/                        # 🆕 Server Actions (Next.js 15 RPC layer)
│   │   │   ├── customer.actions.ts            # Customer mutations (create, update)
│   │   │   ├── appointment.actions.ts         # Appointment mutations (create, update, delete, check-in/out)
│   │   │   ├── clinic.actions.ts              # Clinic mutations (create, update, archive, unarchive)
│   │   │   ├── dental-service.actions.ts      # Dental service mutations (create, update, archive, unarchive)
│   │   │   ├── employee.actions.ts            # Employee mutations (create, update, delete, setStatus, resendInvite)
│   │   │   └── index.ts                       # Action exports
│   │   │
│   │   ├── 🗃️ repos/                         # Data access layer (Prisma queries)
│   │   │   ├── customer.repo.ts               # Customer data access
│   │   │   ├── appointment.repo.ts            # Appointment data access
│   │   │   ├── clinic.repo.ts                 # Clinic data access
│   │   │   ├── dental-service.repo.ts         # Dental service data access
│   │   │   ├── employee.repo.ts               # Employee data access
│   │   │   └── index.ts                       # Repository exports
│   │   │
│   │   └── ⚙️ services/                       # Business logic layer (orchestration)
│   │       ├── auth.service.ts                # Authentication & session management
│   │       ├── customer.service.ts            # Customer business logic
│   │       ├── appointment.service.ts         # Appointment business logic
│   │       ├── clinic.service.ts              # Clinic business logic
│   │       ├── dental-service.service.ts      # Dental service business logic
│   │       ├── employee.service.ts            # Employee business logic
│   │       ├── errors.ts                      # Custom error classes
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
