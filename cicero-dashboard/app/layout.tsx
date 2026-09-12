import "./globals.css";
import LayoutClient from "@/components/LayoutClient";
import { AuthProvider } from "@/context/AuthContext";
import { ReposterAuthProvider } from "@/context/ReposterAuthContext";
import Toast from "@/components/Toast";

export const metadata = {
  title: "CICERO Dashboard",
  description:
    "Next-Gen Dashboard for Social Media Monitoring & Team Management",
  icons: {
    icon: "/cicero-mark.png",
    shortcut: "/cicero-mark.png",
    apple: "/cicero-mark.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="antialiased">
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <AuthProvider>
          <ReposterAuthProvider>
            <Toast />
            <LayoutClient>{children}</LayoutClient>
          </ReposterAuthProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
