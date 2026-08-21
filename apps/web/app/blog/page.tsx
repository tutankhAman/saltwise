import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog — Saltwise",
  description:
    "Guides and explainers on generic medicines, savings, and how to shop smarter for prescriptions.",
};

export default function BlogPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-28 pb-16 sm:px-6 md:pt-32 lg:px-8">
      <div className="fade-in slide-in-from-bottom-4 animate-in fill-mode-forwards duration-700 ease-out">
        <p className="font-heading text-primary text-xs uppercase tracking-widest">
          Blog
        </p>
        <h1 className="mt-3 font-title text-4xl text-foreground tracking-tight sm:text-5xl">
          Guides & <span className="text-primary italic">explainers</span>
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground leading-relaxed">
          We&apos;re building a library of practical guides on generics, price
          comparison, and getting the best value from your prescriptions.
        </p>
      </div>

      <div className="mt-10 rounded-2xl border border-border/40 bg-white/60 p-8 backdrop-blur-xl dark:bg-white/[0.04]">
        <p className="font-heading font-semibold text-foreground">
          Coming soon
        </p>
        <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
          Articles are on the way. In the meantime, try searching for a medicine
          or learn how Saltwise works.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            className="inline-flex items-center rounded-full bg-primary px-5 py-2.5 font-medium text-primary-foreground text-sm shadow-sm hover:bg-primary/90"
            href="/search"
          >
            Search medicines
          </Link>
          <Link
            className="inline-flex items-center rounded-full border border-border bg-white/60 px-5 py-2.5 font-medium text-foreground text-sm backdrop-blur-sm hover:bg-white dark:bg-white/[0.06]"
            href="/how-it-works"
          >
            How it works
          </Link>
        </div>
      </div>
    </div>
  );
}
