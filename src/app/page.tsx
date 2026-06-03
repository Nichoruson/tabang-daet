import { AppShell } from "@/components/AppShell";
import Link from "next/link";

const roles = [
  {
    href: "/citizen",
    title: "Report Emergency",
    desc: "GPS location, live photo, and real-time status updates for residents and visitors.",
    cta: "Open reporter app",
    accent: "border-red-600/50 bg-gradient-to-br from-red-950/80 to-[#111827] hover:border-red-500",
    icon: "🆘",
  },
  {
    href: "/dispatcher",
    title: "Command Dashboard",
    desc: "Validate reports, triage by severity, assign units, and monitor the live incident map.",
    cta: "Open command center",
    accent: "border-blue-800/50 bg-gradient-to-br from-blue-950/80 to-[#111827] hover:border-blue-600",
    icon: "📡",
  },
  {
    href: "/responder",
    title: "Field Response",
    desc: "Accept assignments, navigate to GPS pins, update status, and notify citizens.",
    cta: "Open field unit",
    accent: "border-amber-700/50 bg-gradient-to-br from-amber-950/60 to-[#111827] hover:border-amber-500",
    icon: "🚑",
  },
];

export default function Home() {
  return (
    <AppShell>
      <section className="relative overflow-hidden rounded-2xl border border-red-900/30 bg-[#111827] px-6 py-10 md:px-10 md:py-14">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(220,38,38,0.15),transparent_55%)]" />
        <div className="relative max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-400">
            Daet, Camarines Norte
          </p>
          <h1 className="mt-3 text-4xl font-extrabold leading-tight text-white md:text-5xl">
            Tabang Daet
          </h1>
          <p className="mt-2 text-lg font-medium text-red-200/90">
            Real-Time Community Emergency Reporting
          </p>
          <p className="mt-4 max-w-2xl text-slate-300 leading-relaxed">
            DERICS connects citizens with MDRRMO and C-HEMS through precise GPS
            reporting, live photo validation, dispatcher triage, and two-way
            status notifications — replacing vague phone calls during crises.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full border border-red-500/30 bg-red-950/50 px-3 py-1 text-red-200">
              Live map
            </span>
            <span className="rounded-full border border-amber-500/30 bg-amber-950/40 px-3 py-1 text-amber-200">
              Smart triage
            </span>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 text-emerald-200">
              Offline queue
            </span>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {roles.map((role) => (
          <Link
            key={role.href}
            href={role.href}
            className={`group rounded-2xl border p-6 transition ${role.accent}`}
          >
            <span className="text-3xl">{role.icon}</span>
            <h2 className="mt-4 text-xl font-bold text-white">{role.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              {role.desc}
            </p>
            <span className="mt-5 inline-block text-sm font-bold text-red-300 group-hover:text-red-200">
              {role.cta} →
            </span>
          </Link>
        ))}
      </section>

      <section className="mt-8 rounded-2xl border border-[#3d4f6f] bg-[#111827] p-6">
        <h2 className="text-lg font-bold text-white">How the system works</h2>
        <ol className="mt-4 grid gap-3 md:grid-cols-4">
          {[
            "Citizen submits GPS + live photo",
            "Dispatcher validates & dispatches unit",
            "Responder navigates & updates status",
            "Citizen receives push-style updates",
          ].map((step, i) => (
            <li
              key={step}
              className="rounded-xl border border-white/5 bg-[#0a0f1a] p-4"
            >
              <span className="text-xs font-bold text-red-400">Step {i + 1}</span>
              <p className="mt-2 text-sm text-slate-300">{step}</p>
            </li>
          ))}
        </ol>
      </section>
    </AppShell>
  );
}
