"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import SidebarWrapper from "./SidebarWrapper";
import Header from "./Header";

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStandalone =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/claim") ||
    pathname.startsWith("/reposter");

  useEffect(() => {
    if (!pathname) return;

    const isPublicPath =
      pathname === "/" ||
      pathname.startsWith("/login") ||
      pathname.startsWith("/claim") ||
      pathname.startsWith("/reposter");

    if (!isPublicPath) {
      localStorage.setItem("last_pathname", pathname);
    }
  }, [pathname]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    type SelectorDocument = Document & {
      selector?: (selectors: string) => Element | null;
    };

    const doc = document as SelectorDocument;
    if (typeof doc.selector !== "function") {
      doc.selector = doc.querySelector.bind(doc);
    }

    if (typeof Document !== "undefined" && Document.prototype) {
      type SelectorDocumentPrototype = Document & {
        selector?: (selectors: string) => Element | null;
      };
      const docPrototype = Document.prototype as SelectorDocumentPrototype;
      if (typeof docPrototype.selector !== "function") {
        docPrototype.selector = Document.prototype.querySelector;
      }
    }
  }, []);

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
        <main id="main-content" className="flex-1 p-2 md:p-4">
          {children}
        </main>
      </div>
    </>
  );
}
