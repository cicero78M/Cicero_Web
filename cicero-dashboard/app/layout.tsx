import "./globals.css";
import LayoutClient from "@/components/LayoutClient";
import { AuthProvider } from "@/context/AuthContext";
import Toast from "@/components/Toast";

export const metadata = {
  title: "CICERO Dashboard",
  description:
    "Next-Gen Dashboard for Social Media Monitoring & Team Management",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <AuthProvider>
          <Toast />
          <LayoutClient>{children}</LayoutClient>
        </AuthProvider>
      </body>
    </html>
  );
}
