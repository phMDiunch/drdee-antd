// src/app/(private)/profile/page.tsx
import ProfileView from "@/features/profile/views/ProfileView";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hồ sơ cá nhân - DrDee",
  description: "Quản lý thông tin hồ sơ cá nhân",
};

export default function ProfilePage() {
  return <ProfileView />;
}
