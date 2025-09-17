drdee-next/
├── prisma/
│ └── schema.prisma
├── public/
│ └── images/
├── src/
│ ├── app/ # Next.js App Router
│ │ ├── (auth)/ # Auth route group
│ │ │ ├── login/page.tsx
│ │ │ ├── register/page.tsx
│ │ │ └── forgot-password/page.tsx
│ │ ├── (private)/ # Protected routes
│ │ │ ├── layout.tsx
│ │ │ ├── dashboard/page.tsx
│ │ │ ├── customers/
│ │ │ │ ├── page.tsx
│ │ │ │ └── [id]/page.tsx
│ │ │ ├── employees/
│ │ │ ├── appointments/
│ │ │ └── ...
│ │ ├── api/ # API routes
│ │ │ ├── appointments/
│ │ │ │ ├── [id]/
│ │ │ │ │ ├── check-in/route.ts
│ │ │ │ │ ├── confirm/route.ts
│ │ │ │ │ └── checkout/route.ts
│ │ │ │ ├── checked-in/route.ts
│ │ │ │ └── check-conflict/route.ts
│ │ │ ├── customers/
│ │ │ ├── employees/
│ │ │ └── ...
│ │ ├── globals.css
│ │ ├── layout.tsx
│ │ └── page.tsx
│ │
│ ├── shared/ # 🆕 Domain-agnostic reusable code
│ │ ├── components/ # UI primitives & cross-domain components
│ │ │ ├── ui/ # Basic reusable UI primitives
│ │ │ │ ├── Button/
│ │ │ │ │ ├── Button.tsx
│ │ │ │ │ ├── Button.types.ts
│ │ │ │ │ └── index.ts
│ │ │ │ ├── Input/
│ │ │ │ ├── Modal/
│ │ │ │ ├── Table/
│ │ │ │ ├── Form/
│ │ │ │ └── index.ts
│ │ │ ├── ClinicLogo.tsx # Cross-domain business components
│ │ │ ├── GlobalCustomerSearch.tsx
│ │ │ └── index.ts # Barrel export
│ │ │
│ │ ├── hooks/ # Cross-domain custom hooks
│ │ │ ├── useAuth.ts
│ │ │ ├── useLocalStorage.ts
│ │ │ ├── useDebounce.ts
│ │ │ ├── usePagination.ts
│ │ │ ├── useToggle.ts
│ │ │ └── index.ts
│ │ │
│ │ ├── types/ # Shared TypeScript types
│ │ │ ├── global.ts # Global app types
│ │ │ ├── api.ts # API response/request types
│ │ │ ├── database.ts # Database model types
│ │ │ ├── ui.ts # UI component types
│ │ │ └── index.ts
│ │ │
│ │ ├── utils/ # Pure utility functions
│ │ │ ├── date.ts
│ │ │ ├── excelExport.ts
│ │ │ ├── validation.ts
│ │ │ ├── formatters.ts
│ │ │ ├── helpers.ts
│ │ │ └── index.ts
│ │ │
│ │ ├── constants/ # Global constants
│ │ │ ├── api.ts # API endpoints
│ │ │ ├── routes.ts # App routes
│ │ │ ├── ui.ts # UI constants (colors, sizes...)
│ │ │ ├── validation.ts # Validation rules
│ │ │ └── index.ts
│ │ │
│ │ └── index.ts # Main barrel export
│ │
│ ├── layouts/ # Layout components
│ │ ├── AppLayout/
│ │ │ ├── AppLayout.tsx
│ │ │ ├── AppHeader.tsx
│ │ │ └── SidebarNav.tsx
│ │ ├── AuthLayout/
│ │ └── index.ts
│ │
│ ├── features/ # Domain-driven features
│ │ ├── employees/
│ │ │ ├── api/ # Domain API (React Query hooks)
│ │ │ │ ├── queries.ts # useEmployeesQuery, useEmployeeQuery
│ │ │ │ ├── mutations.ts # useCreateEmployee, useUpdateEmployee
│ │ │ │ └── index.ts
│ │ │ ├── components/ # Domain-specific components
│ │ │ │ ├── EmployeeForm.tsx
│ │ │ │ ├── EmployeeTable.tsx
│ │ │ │ ├── EmployeeCard.tsx
│ │ │ │ └── index.ts
│ │ │ ├── hooks/ # Domain-specific hooks
│ │ │ │ ├── useEmployeeValidation.ts
│ │ │ │ ├── useEmployeeFilters.ts
│ │ │ │ └── index.ts
│ │ │ ├── views/ # Page-level components
│ │ │ │ ├── EmployeeListView.tsx
│ │ │ │ ├── EmployeeDetailView.tsx
│ │ │ │ ├── EmployeeCreateView.tsx
│ │ │ │ └── index.ts
│ │ │ ├── types.ts # Domain types
│ │ │ ├── constants.ts # Domain constants
│ │ │ └── index.ts # Feature barrel export
│ │ │
│ │ ├── customers/
│ │ │ ├── api/
│ │ │ ├── components/
│ │ │ ├── hooks/
│ │ │ ├── views/
│ │ │ ├── types.ts
│ │ │ ├── constants.ts
│ │ │ └── index.ts
│ │ │
│ │ ├── consulted-services/ # Consistent plural naming
│ │ │ ├── api/
│ │ │ ├── components/
│ │ │ │ └── ToothSelectionModal.tsx
│ │ │ ├── hooks/
│ │ │ ├── views/
│ │ │ │ └── DailyView.tsx
│ │ │ ├── types.ts
│ │ │ ├── constants.ts
│ │ │ └── index.ts
│ │ │
│ │ ├── appointments/
│ │ ├── dental-services/
│ │ ├── payments/
│ │ ├── reports/
│ │ ├── suppliers/
│ │ ├── treatment-care/
│ │ └── dashboard/
│ │
│ ├── server/ # Server-side logic (Clean Architecture)
│ │ ├── repositories/ # Data access layer (Prisma queries)
│ │ │ ├── employees.repo.ts
│ │ │ ├── customers.repo.ts
│ │ │ ├── appointments.repo.ts
│ │ │ ├── base.repo.ts # Base repository class
│ │ │ └── index.ts
│ │ ├── services/ # Business logic layer
│ │ │ ├── appointments.service.ts
│ │ │ ├── customers.service.ts
│ │ │ ├── employees.service.ts
│ │ │ └── index.ts
│ │ └── validators/ # API input/output validation (Zod)
│ │ ├── employees.schema.ts
│ │ ├── customers.schema.ts
│ │ ├── appointments.schema.ts
│ │ ├── common.schema.ts # Common validation schemas
│ │ └── index.ts
│ │
│ ├── lib/ # Third-party configurations
│ │ ├── QueryProvider.tsx # React Query setup
│ │ ├── AntdRegistry.tsx # Ant Design setup
│ │ ├── authHeaders.ts # Auth configuration
│ │ └── index.ts
│ │
│ ├── services/ # External service clients
│ │ ├── prismaClient.ts # Prisma client instance
│ │ ├── supabaseClient.ts # Supabase client instance
│ │ └── index.ts
│ │
│ ├── stores/ # Global state management (Zustand)
│ │ ├── useAppStore.ts # Main app store
│ │ ├── useAuthStore.ts # Auth state (if needed)
│ │ └── index.ts
│ │
│ └── data/ # Static data files
│ └── vietnamAdministrativeUnits.json
│
├── package.json
├── next.config.ts
├── tsconfig.json
├── eslint.config.mjs
└── README.md
