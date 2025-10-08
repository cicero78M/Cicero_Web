"use client";
import { usePathname } from "next/navigation";
import SidebarWrapper from "./SidebarWrapper";
import Header from "./Header";

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStandalone =
    pathname === "/" || pathname.startsWith("/login") || pathname.startsWith("/claim");

  // Landing, login, and claim-related pages render without sidebar or header
  if (isStandalone) {
    return (
      <main id="main-content" className="min-h-screen">
        {children}
      </main>
    );
  }

  return (
    <>
      <Header />
      <div className="flex min-h-screen bg-gradient-to-b from-sky-50 via-blue-50 to-indigo-100">
        <aside aria-label="Sidebar navigation" className="md:sticky md:top-16">
          <SidebarWrapper />
        </aside>
        <main id="main-content" className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </>
  );
}
