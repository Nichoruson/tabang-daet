import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import { AlertOctagon, Radio, Shield, HelpCircle, ArrowRight, CheckCircle2 } from "lucide-react";

const roles = [
  {
    href: "/citizen",
    title: "Report Emergency",
    desc: "GPS location, live photo, and real-time status updates for residents and visitors.",
    cta: "Open reporter app",
    accent: "border-red-500/20 bg-gradient-to-br from-red-950/10 to-[#0d1423]/90 hover:border-red-500/50 hover:shadow-red-950/20 hover:shadow-2xl",
    iconName: "citizen",
  },
  {
    href: "/dispatcher",
    title: "Command Dashboard",
    desc: "Validate reports, triage by severity, assign units, and monitor the live incident map.",
    cta: "Open command center",
    accent: "border-blue-500/20 bg-gradient-to-br from-blue-950/10 to-[#0d1423]/90 hover:border-blue-500/50 hover:shadow-blue-950/20 hover:shadow-2xl",
    iconName: "dispatcher",
  },
  {
    href: "/responder",
    title: "Field Response",
    desc: "Accept assignments, navigate to GPS pins, update status, and notify citizens.",
    cta: "Open field unit",
    accent: "border-amber-500/20 bg-gradient-to-br from-amber-950/10 to-[#0d1423]/90 hover:border-amber-500/50 hover:shadow-amber-950/20 hover:shadow-2xl",
    iconName: "responder",
  },
];

function getRoleIcon(name: string) {
  switch (name) {
    case "citizen":
      return (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertOctagon size={24} />
        </div>
      );
    case "dispatcher":
      return (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
          <Radio size={24} />
        </div>
      );
    case "responder":
      return (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
          <Shield size={24} />
        </div>
      );
    default:
      return (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-500/10 border border-slate-500/20 text-slate-400">
          <HelpCircle size={24} />
        </div>
      );
  }
}

export default function Home() {
  return (
    <AppShell>
      <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-[#0c1322] to-[#070a13] px-6 py-12 md:px-10 md:py-16 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(239,68,68,0.08),transparent_55%)]" />
        <div className="relative max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-red-400 font-heading">
            Daet, Camarines Norte
          </p>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight text-white md:text-6xl tracking-tight font-heading">
            Tabang Daet
          </h1>
          <p className="mt-3 text-lg font-semibold text-slate-300">
            Real-Time Community Emergency Reporting & Coordination
          </p>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-slate-400">
            DERICS connects citizens with MDRRMO and C-HEMS through precise GPS
            reporting, live photo validation, dispatcher triage, and two-way
            status notifications — replacing vague phone calls during emergency crises.
          </p>
          <div className="mt-8 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wider">
            <span className="flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/5 px-4 py-1.5 text-red-400">
              <CheckCircle2 size={12} /> Live GPS Map
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 px-4 py-1.5 text-amber-400">
              <CheckCircle2 size={12} /> Smart Triage
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-emerald-400">
              <CheckCircle2 size={12} /> Offline Queue
            </span>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-3">
        {roles.map((role) => (
          <Link
            key={role.href}
            href={role.href}
            className={`group rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 ${role.accent}`}
          >
            {getRoleIcon(role.iconName)}
            <h2 className="mt-5 text-xl font-bold text-white tracking-tight font-heading">{role.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400 min-h-[48px]">
              {role.desc}
            </p>
            <span className="mt-6 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300 group-hover:text-white transition duration-200">
              <span>{role.cta}</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition duration-200" />
            </span>
          </Link>
        ))}
      </section>

      <section className="mt-8 rounded-2xl border border-white/5 bg-[#0c1322] p-6 shadow-xl">
        <h2 className="text-lg font-bold text-white font-heading tracking-tight">How the system works</h2>
        <ol className="mt-4 grid gap-4 md:grid-cols-4">
          {[
            "Citizen submits GPS + live photo",
            "Dispatcher validates & dispatches unit",
            "Responder navigates & updates status",
            "Citizen receives push-style updates",
          ].map((step, i) => (
            <li
              key={step}
              className="rounded-xl border border-white/5 bg-[#070a13] p-5 hover:border-slate-800 transition duration-200"
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-red-400 font-heading">
                Step {i + 1}
              </span>
              <p className="mt-2 text-sm font-semibold text-slate-200 leading-snug">{step}</p>
            </li>
          ))}
        </ol>
      </section>
    </AppShell>
  );
}
