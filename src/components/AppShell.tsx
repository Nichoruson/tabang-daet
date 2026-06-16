"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { loadSession, clearSession } from "@/lib/auth";
import { ShieldAlert, Wifi, WifiOff, LogOut, Shield, User } from "lucide-react";

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
    <div className="emergency-grid-bg flex min-h-screen flex-col font-sans text-slate-100 bg-[#070a13]">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#070a13]/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 md:px-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-700 text-white shadow-lg shadow-red-900/40 group-hover:scale-105 transition duration-200">
              <ShieldAlert size={22} className="animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-400">
                MDRRMO Daet
              </p>
              <p className="text-base font-bold leading-tight tracking-tight text-white font-heading">
                Tabang Daet
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1.5 md:flex">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold tracking-wide transition-all duration-200 ${
                    isActive
                      ? "bg-red-500/10 text-red-400 border border-red-500/20"
                      : "text-slate-400 border border-transparent hover:bg-white/5 hover:text-slate-200"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <span
              className={`hidden items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold sm:flex transition duration-300 ${
                online
                  ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
                  : "border-amber-500/20 bg-amber-500/5 text-amber-400"
              }`}
            >
              {online ? (
                <Wifi size={14} className="text-emerald-400" />
              ) : (
                <WifiOff size={14} className="text-amber-400 animate-bounce" />
              )}
              {online ? "System Connected" : "Offline Mode"}
            </span>

            {role ? (
              <span className="hidden items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-400 sm:flex">
                <Shield size={12} />
                {role}
              </span>
            ) : null}

            {badge ? (
              <span className="flex items-center gap-1.5 rounded-full bg-slate-900 border border-white/5 px-3 py-1 text-xs font-medium text-slate-300">
                <User size={12} className="text-slate-400" />
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
                className="flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-950/20 px-3.5 py-1 text-xs font-bold text-red-400 hover:bg-red-500 hover:text-white transition duration-200 cursor-pointer"
              >
                <LogOut size={12} />
                <span>Sign Out</span>
              </button>
            ) : null}
          </div>
        </div>

        <nav className="flex border-t border-white/5 md:hidden">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 py-3 text-center text-xs font-bold uppercase tracking-wider transition ${
                  isActive
                    ? "bg-red-950/20 text-red-400 border-b-2 border-red-500"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6 md:py-10">
        {children}
      </main>

      <footer className="border-t border-white/5 bg-[#05070d] py-6 text-center text-xs font-semibold tracking-wide text-slate-500">
        Tabang Daet &copy; {new Date().getFullYear()} — Daet Emergency Response & Incident Command System (DERICS)
      </footer>
    </div>
  );
}
