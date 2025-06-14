"use client";
import { usePathname } from "next/navigation";
import SidebarWrapper from "./SidebarWrapper";

export default function LayoutClient({ children }) {
  const pathname = usePathname();

  if (pathname === "/") {
    return <main>{children}</main>;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarWrapper />
      <main className="flex-1 min-h-screen p-4 md:p-8">{children}</main>
    </div>
  );
}
