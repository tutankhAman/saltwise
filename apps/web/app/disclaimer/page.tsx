import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Medical Disclaimer — Saltwise",
  description: "Medical Disclaimer for Saltwise.",
};

export default function DisclaimerPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-28 pb-16 sm:px-6 md:pt-32 lg:px-8">
      <p className="font-heading text-primary text-xs uppercase tracking-widest">
        Legal
      </p>
      <h1 className="mt-3 font-title text-4xl text-foreground tracking-tight sm:text-5xl">
        Medical <span className="text-primary italic">Disclaimer</span>
      </h1>
      <p className="mt-2 text-muted-foreground text-sm">
        Last updated: August 21, 2026
      </p>

      <div className="prose prose-sm dark:prose-invert mt-8 max-w-none prose-headings:font-heading prose-headings:text-foreground prose-p:text-muted-foreground prose-p:leading-relaxed">
        <p>
          Saltwise provides general information about medicines and prices for
          educational and comparison purposes only. It is not medical advice and
          does not establish a doctor–patient relationship.
        </p>
        <ul>
          <li>
            Always consult a qualified doctor or pharmacist before starting,
            stopping, or switching any medicine.
          </li>
          <li>
            Verify prices, availability, and product details with the pharmacy
            before purchasing. Live data can change.
          </li>
          <li>
            In an emergency, seek immediate medical help — do not rely on this
            site.
          </li>
        </ul>
        <p>
          AI-generated insights and prescription parsing may be inaccurate —
          review carefully and confirm with a professional.
        </p>
      </div>
    </div>
  );
}
