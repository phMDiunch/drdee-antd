import AppLayout from "@/layouts/AppLayout/AppLayout";

export default function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
