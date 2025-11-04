// src/app/(private)/layout.tsx

import AppLayout from "@/layouts/AppLayout/AppLayout";
import { getSessionUser } from "@/server/utils/sessionCache";
import Providers from "@/app/providers";

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getSessionUser(); // SSR lấy user
  return (
    <Providers user={currentUser}>
      <AppLayout currentUser={currentUser ?? undefined}>{children}</AppLayout>
    </Providers>
  );
}
