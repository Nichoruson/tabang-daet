"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { loadSession, clearSession } from "@/lib/auth";

type AppShellProps = {
  children: React.ReactNode;
  role?: string;
  badge?: string;
  online?: boolean;
};

export function AppShell({ children, role, badge, online = true }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    setSession(loadSession());
  }, [pathname]);

  const navItems = [
    { href: "/", label: "Home" },
  ];

  if (!session) {
    navItems.push({ href: "/citizen", label: "Report" });
    navItems.push({ href: "/login/staff", label: "Staff Portal" });
  } else if (session.role === "citizen") {
    navItems.push({ href: "/citizen", label: "Report Dashboard" });
  } else if (session.role === "dispatcher") {
    navItems.push({ href: "/dispatcher", label: "Command Board" });
  } else if (session.role === "responder") {
    navItems.push({ href: "/responder", label: "Field Board" });
  }

  return (
    <div className="emergency-grid-bg flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-red-900/40 bg-[#0a0f1a]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-700 text-lg font-bold text-white shadow-lg shadow-red-900/50">
              TD
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-red-400">
                MDRRMO Daet
              </p>
              <p className="text-lg font-bold leading-tight text-white">
                Tabang Daet
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  pathname === item.href
                    ? "bg-red-700/30 text-red-100"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <span
              className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium sm:flex ${
                online
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-200"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${online ? "bg-emerald-400" : "bg-amber-400 pulse-alert"}`}
              />
              {online ? "Online" : "Offline queue"}
            </span>
            {role ? (
              <span className="rounded-full border border-red-500/30 bg-red-950/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-200">
                {role}
              </span>
            ) : null}
            {badge ? (
              <span className="rounded-full bg-[#1a2332] px-3 py-1 text-xs text-slate-300">
                {badge}
              </span>
            ) : null}
            {session ? (
              <button
                type="button"
                onClick={() => {
                  clearSession();
                  router.replace("/");
                }}
                className="rounded-full border border-red-500/30 bg-red-950/40 px-3 py-1 text-xs font-bold text-red-300 hover:bg-red-900/40 transition cursor-pointer"
              >
                Sign Out
              </button>
            ) : null}
          </div>
        </div>

        <nav className="flex border-t border-white/5 md:hidden">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 py-2.5 text-center text-xs font-semibold uppercase tracking-wide ${
                pathname === item.href
                  ? "bg-red-800/40 text-red-100"
                  : "text-slate-500"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6 md:py-8">
        {children}
      </main>

      <footer className="border-t border-white/5 bg-[#0a0f1a] px-4 py-4 text-center text-xs text-slate-500">
        Tabang Daet — Daet Emergency Response & Incident Command System (DERICS)
      </footer>
    </div>
  );
}
