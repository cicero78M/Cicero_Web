"use client";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

export default function SidebarWrapper() {
  const pathname = usePathname();
  // Daftar path yang tidak menampilkan sidebar
  const excludedPaths = ["/", "/login"];

  if (excludedPaths.includes(pathname)) return null;
  return <Sidebar />;
}
