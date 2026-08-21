import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How It Works — Saltwise",
  description:
    "How Saltwise works — search, compare, and save on generic medicine alternatives in three simple steps.",
};

const steps = [
  {
    n: "01",
    title: "Search by name or salt",
    desc: "Enter a brand name (e.g. Dolo 650) or salt composition (e.g. Paracetamol). We resolve it to the active ingredient and surface the exact medicine.",
  },
  {
    n: "02",
    title: "Compare generics & prices",
    desc: "See government-approved generic alternatives at the salt level with live prices, pharmacy, stock, and per-unit cost — side by side.",
  },
  {
    n: "03",
    title: "Save & decide with your doctor",
    desc: "Review AI-powered insights and discuss the best option with your doctor or pharmacist. Saltwise never replaces medical advice.",
  },
] as const;

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-28 pb-16 sm:px-6 md:pt-32 lg:px-8">
      <div className="fade-in slide-in-from-bottom-4 animate-in fill-mode-forwards duration-700 ease-out">
        <p className="font-heading text-primary text-xs uppercase tracking-widest">
          How It Works
        </p>
        <h1 className="mt-3 font-title text-4xl text-foreground tracking-tight sm:text-5xl">
          Three steps to <span className="text-primary italic">save</span>
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground leading-relaxed">
          From search to savings — Saltwise keeps the flow simple and
          transparent.
        </p>
      </div>

      <ol className="mt-10 space-y-5">
        {steps.map((s) => (
          <li
            className="flex gap-5 rounded-2xl border border-border/40 bg-white/60 p-6 backdrop-blur-xl dark:bg-white/[0.04]"
            key={s.n}
          >
            <span className="font-bold font-heading text-3xl text-primary/30 tabular-nums">
              {s.n}
            </span>
            <div>
              <h3 className="font-heading font-semibold text-foreground">
                {s.title}
              </h3>
              <p className="mt-1.5 text-muted-foreground text-sm leading-relaxed">
                {s.desc}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          className="inline-flex items-center rounded-full bg-primary px-5 py-2.5 font-medium text-primary-foreground text-sm shadow-sm transition-colors hover:bg-primary/90"
          href="/search"
        >
          Try a search
        </Link>
        <Link
          className="inline-flex items-center rounded-full border border-border bg-white/60 px-5 py-2.5 font-medium text-foreground text-sm backdrop-blur-sm transition-colors hover:bg-white dark:bg-white/[0.06]"
          href="/about"
        >
          About Saltwise
        </Link>
      </div>

      <p className="mt-8 text-muted-foreground/60 text-xs leading-relaxed">
        Tip: you can also upload a prescription photo from the{" "}
        <Link
          className="text-primary underline-offset-2 hover:underline"
          href="/upload"
        >
          Upload
        </Link>{" "}
        page — we&apos;ll identify medicines with AI and let you search each one
        in a tap.
      </p>
    </div>
  );
}
