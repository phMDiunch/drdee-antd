// src/app/(private)/customers/[id]/page.tsx
import { Suspense } from "react";
import { Spin } from "antd";
import CustomerDetailView from "@/features/customers/views/CustomerDetailView";

interface CustomerDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Customer Detail Page (SSR)
 * Dynamic route: /customers/[id]
 * Renders CustomerDetailView with customer ID from URL
 * Wrapped in Suspense for useSearchParams
 */
export default async function CustomerDetailPage({
  params,
}: CustomerDetailPageProps) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div style={{ textAlign: "center", padding: "100px 0" }}>
          <Spin size="large" />
        </div>
      }
    >
      <CustomerDetailView customerId={id} />
    </Suspense>
  );
}
