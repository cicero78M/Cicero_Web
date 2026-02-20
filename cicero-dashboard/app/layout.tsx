import "./globals.css";
import LayoutClient from "@/components/LayoutClient";
import { AuthProvider } from "@/context/AuthContext";
import { ReposterAuthProvider } from "@/context/ReposterAuthContext";
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

const documentSelectorShim = `(function(){
  if (typeof document === "undefined") return;
  var bindSelector = function(target){
    if (!target || typeof target.querySelector !== "function") return;
    if (typeof target.selector !== "function") {
      target.selector = target.querySelector.bind(target);
    }
  };

  bindSelector(document);

  if (typeof Document !== "undefined" && Document.prototype) {
    if (typeof Document.prototype.selector !== "function") {
      Document.prototype.selector = Document.prototype.querySelector;
    }
  }
})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: documentSelectorShim }} />
      </head>
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
