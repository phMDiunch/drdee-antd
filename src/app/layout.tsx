import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@ant-design/v5-patch-for-react-19";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DR DEE ERP",
  description: "Phần mềm quản lý nha khoa",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {/* AntdRegistry là Server Component để SSR CSS-in-JS của AntD */}
        <AntdRegistry>
          {/* Providers là Client Component (React Query + AntD Config) */}
          <Providers>{children}</Providers>
        </AntdRegistry>
      </body>
    </html>
  );
}
