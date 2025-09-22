// src/app/(private)/layout.tsx

import AppLayout from "@/layouts/AppLayout/AppLayout";
import { getSessionUser } from "@/server/services/auth.service";

export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  const currentUser = await getSessionUser(); // SSR lấy user
  return <AppLayout currentUser={currentUser ?? undefined}>{children}</AppLayout>;
}
