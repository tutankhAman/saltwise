import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us — Saltwise",
  description:
    "Learn about Saltwise — helping you find safe, government-approved generic alternatives and save on every prescription.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-28 pb-16 sm:px-6 md:pt-32 lg:px-8">
      <div className="fade-in slide-in-from-bottom-4 animate-in fill-mode-forwards duration-700 ease-out">
        <p className="font-heading text-primary text-xs uppercase tracking-widest">
          About Us
        </p>
        <h1 className="mt-3 font-title text-4xl text-foreground tracking-tight sm:text-5xl">
          Making medicines{" "}
          <span className="text-primary italic">affordable</span>
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground leading-relaxed">
          Saltwise helps you find safe, government-approved generic alternatives
          for branded medicines — at the salt level. Compare prices across
          pharmacies and save on every prescription without compromising on
          quality.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        {[
          {
            title: "Salt-level matching",
            desc: "We match on the active pharmaceutical ingredient, not just brand names — so you see true substitutes.",
          },
          {
            title: "Price transparency",
            desc: "Live price comparison across trusted pharmacies with stock and confidence indicators.",
          },
          {
            title: "AI-assisted discovery",
            desc: "Upload a prescription photo and let AI identify medicines instantly, then explore alternatives.",
          },
        ].map((item) => (
          <div
            className="rounded-2xl border border-border/40 bg-white/60 p-6 backdrop-blur-xl dark:bg-white/[0.04]"
            key={item.title}
          >
            <h3 className="font-heading font-semibold text-foreground text-sm">
              {item.title}
            </h3>
            <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
              {item.desc}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-primary/10 bg-primary/[0.04] p-6">
        <p className="text-muted-foreground/70 text-xs leading-relaxed">
          Saltwise is an informational platform and is not a substitute for
          professional medical advice, diagnosis, or treatment. Always consult a
          qualified healthcare professional before switching medicines.
        </p>
      </div>
    </div>
  );
}
