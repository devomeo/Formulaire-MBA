import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Formulaire MBA",
  description: "Form builder et runner"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen">
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-6">
          <header className="flex items-center justify-between py-4">
            <a href="/dashboard" className="text-lg font-semibold">
              Formulaire MBA
            </a>
            <nav className="flex gap-4 text-sm">
              <a href="/dashboard" className="text-slate-600 hover:text-slate-900">
                Dashboard
              </a>
              <a href="/admin/forms" className="text-slate-600 hover:text-slate-900">
                Admin
              </a>
              <a href="/api/auth/logout" className="text-slate-600 hover:text-slate-900">
                Logout
              </a>
            </nav>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
