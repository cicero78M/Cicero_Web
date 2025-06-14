"use client";
import { usePathname } from "next/navigation";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SidebarWrapper from "@/components/SidebarWrapper";

export const metadata = {
  title: "CICERO Dashboard",
  description:
    "Next-Gen Dashboard for Social Media Monitoring & Team Management",
  viewport: "width=device-width, initial-scale=1",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }) {
  const pathname = usePathname();

  // Jika halaman landing page ("/"), render langsung children saja (tanpa sidebar, tanpa wrapper)
  if (pathname === "/") {
    return (
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <main>{children}</main>
        </body>
      </html>
    );
  }

  // Untuk halaman lain, tetap render sidebar + wrapper
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="flex min-h-screen bg-gray-100">
          <SidebarWrapper />
          <main className="flex-1 min-h-screen p-4 md:p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
