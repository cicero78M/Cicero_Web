"use client";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

export default function SidebarWrapper() {
  const pathname = usePathname();
  // Sembunyikan sidebar di halaman /login
  if (pathname === "/login") return null;
  return <Sidebar />;
}
