// src/app/(private)/customers/[id]/page.tsx
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
 */
export default async function CustomerDetailPage({
  params,
}: CustomerDetailPageProps) {
  const { id } = await params;

  return <CustomerDetailView customerId={id} />;
}
