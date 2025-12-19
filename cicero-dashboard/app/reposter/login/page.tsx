import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function ReposterLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 text-slate-700 dark:bg-slate-950 dark:text-slate-100">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-[0_24px_48px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900/80">
            <p className="text-sm text-slate-500 dark:text-slate-300">
              Memuat form login...
            </p>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
