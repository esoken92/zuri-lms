import Link from "next/link";

const FEATURES = [
  {
    title: "Tyre inspections",
    body: "Walk-around condition logging with photo capture, tread measurements and per-position findings — built for the yard, not the office.",
    accent: "bg-hot-curry-600",
  },
  {
    title: "Scrap & write-off tracking",
    body: "Log scrapped tyres with reason codes and photographic evidence. Know what left the fleet and why.",
    accent: "bg-shadow-play-600",
  },
  {
    title: "Reports & analytics",
    body: "Inspection history, scrap trends and condition analytics across your vehicles and depots.",
    accent: "bg-burnt-coffee-600",
  },
  {
    title: "Bluetooth sensor reads",
    body: "Pair BLE tyre sensors and pull live readings straight into the inspection form — no retyping.",
    accent: "bg-puma-600",
  },
  {
    title: "Roles & approvals",
    body: "Admin, manager, inspector and user roles with sign-up approval workflow — nobody gets in unvetted.",
    accent: "bg-burrito-600",
  },
  {
    title: "Self-hosted, MIT",
    body: "Your data on your Supabase project. No telemetry, no licence server, no per-seat pricing. Free for a small fleet.",
    accent: "bg-hot-curry-800",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-hot-curry-50 text-hot-curry-950">
      <header className="flex items-center justify-between border-b border-hot-curry-200 bg-white/80 px-6 py-4 backdrop-blur">
        <span className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span className="inline-block h-3 w-3 rounded-sm bg-hot-curry-600" />
          Zuri LMS
        </span>
        <nav className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-hot-curry-800 hover:bg-hot-curry-100"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-md bg-hot-curry-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-hot-curry-800"
          >
            Get started
          </Link>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6">
        <section className="py-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-shadow-play-700">
            Logistics management · community edition
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Tyre &amp; fleet operations for the small yard.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-hot-curry-800/80">
            A self-hosted slice of Zuri — inspections, scrap tracking and
            reports, free to run for a small fleet. Same bones as the full
            platform, MIT licensed, deployable in an afternoon.
          </p>
          <div className="mt-8 flex gap-3">
            <Link
              href="/register"
              className="rounded-md bg-hot-curry-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-hot-curry-800"
            >
              Set up your fleet
            </Link>
            <a
              href="https://github.com/esoken92/zuri-lms"
              className="rounded-md border border-hot-curry-300 px-5 py-2.5 text-sm font-semibold text-hot-curry-800 hover:bg-hot-curry-100"
            >
              View on GitHub
            </a>
          </div>
        </section>

        <section className="grid gap-4 pb-16 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-hot-curry-200 bg-white p-5 shadow-sm"
            >
              <span className={`inline-block h-1.5 w-8 rounded-full ${f.accent}`} />
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-hot-curry-900/70">
                {f.body}
              </p>
            </div>
          ))}
        </section>

        <section className="mb-16 rounded-2xl bg-hot-curry-900 px-6 py-10 text-hot-curry-50 sm:px-10">
          <h2 className="text-2xl font-bold">The honest pitch</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-hot-curry-100/90">
            This is the free community tier — enough to run inspections and
            scrap tracking for a depot or two. The full Zuri platform adds
            multi-company tenancy, gate passes, waybills, access control and
            billing. If the mini gets you 80% there, you never needed the
            rest.
          </p>
          <p className="mt-4 text-sm font-semibold text-burrito-200">
            MIT license · no telemetry · your database, your rules
          </p>
        </section>
      </main>

      <footer className="border-t border-hot-curry-200 px-6 py-6 text-center text-xs text-hot-curry-800/60">
        Zuri LMS — community edition · Part of the ESO Industries ecosystem ·
        MIT licensed
      </footer>
    </div>
  );
}
