"use client";
import { usePathname } from "next/navigation";
import SidebarWrapper from "./SidebarWrapper";
import Header from "./Header";

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Landing and login pages render without sidebar or header
  if (pathname === "/" || pathname === "/login") {
    return (
      <main id="main-content" className="min-h-screen">
        {children}
      </main>
    );
  }

  return (
    <>
      <Header />
      <div className="flex min-h-screen bg-gray-100 dark:bg-gray-950">
        <aside aria-label="Sidebar navigation" className="md:min-h-screen">
          <SidebarWrapper />
        </aside>
        <main id="main-content" className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </>
  );
}
