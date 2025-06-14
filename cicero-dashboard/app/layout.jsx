import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import LayoutClient from "@/components/LayoutClient";

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
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  );
}
