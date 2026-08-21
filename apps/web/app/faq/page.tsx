import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ — Saltwise",
  description:
    "Frequently asked questions about Saltwise, generic medicines, and price comparison.",
};

const faqs = [
  {
    q: "Are generic medicines safe?",
    a: "Yes — generics approved by regulators (e.g. CDSCO in India) contain the same active ingredient, strength, and dosage form as the branded version and must meet the same quality standards.",
  },
  {
    q: "How does Saltwise match alternatives?",
    a: "We match at the salt (active ingredient) level, not just by brand, so you see true therapeutic substitutes. Each result shows salt, strength, form, and manufacturer.",
  },
  {
    q: "Where do prices come from?",
    a: "Prices are fetched live from pharmacy sources with stock and confidence indicators. They can change — always verify at checkout before purchasing.",
  },
  {
    q: "Does Saltwise sell medicines?",
    a: "No. Saltwise is an informational and comparison platform. Purchases happen on the pharmacy site via the link we surface — we don't handle payments or fulfillment.",
  },
  {
    q: "Can I upload a prescription?",
    a: "Yes. Upload a clear photo (JPEG/PNG/WebP) on the Upload page or from Search. AI identifies medicines from the image; you can then search each one for alternatives.",
  },
  {
    q: "Should I switch without consulting my doctor?",
    a: "No. Always consult your doctor or pharmacist before switching. Saltwise is not a substitute for professional medical advice, diagnosis, or treatment.",
  },
] as const;

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-28 pb-16 sm:px-6 md:pt-32 lg:px-8">
      <div className="fade-in slide-in-from-bottom-4 animate-in fill-mode-forwards duration-700 ease-out">
        <p className="font-heading text-primary text-xs uppercase tracking-widest">
          FAQ
        </p>
        <h1 className="mt-3 font-title text-4xl text-foreground tracking-tight sm:text-5xl">
          Common <span className="text-primary italic">questions</span>
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground leading-relaxed">
          Quick answers about generics, pricing, and how Saltwise works.
        </p>
      </div>

      <div className="mt-10 space-y-4">
        {faqs.map((item) => (
          <details
            className="group rounded-2xl border border-border/40 bg-white/60 backdrop-blur-xl open:bg-white/80 dark:bg-white/[0.04] dark:open:bg-white/[0.06]"
            key={item.q}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 font-heading font-medium text-foreground text-sm [&::-webkit-details-marker]:hidden">
              {item.q}
              <span className="shrink-0 text-muted-foreground/50 transition-transform duration-200 group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="px-6 pb-5 text-muted-foreground text-sm leading-relaxed">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </div>
  );
}
