import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Saltwise",
  description: "Terms of Service for Saltwise.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-28 pb-16 sm:px-6 md:pt-32 lg:px-8">
      <p className="font-heading text-primary text-xs uppercase tracking-widest">
        Legal
      </p>
      <h1 className="mt-3 font-title text-4xl text-foreground tracking-tight sm:text-5xl">
        Terms of <span className="text-primary italic">Service</span>
      </h1>
      <p className="mt-2 text-muted-foreground text-sm">
        Last updated: August 21, 2026
      </p>

      <div className="prose prose-sm dark:prose-invert mt-8 max-w-none prose-headings:font-heading prose-headings:text-foreground prose-p:text-muted-foreground prose-p:leading-relaxed">
        <p>
          This is a placeholder. Have counsel review and replace this copy
          before production. By using Saltwise you agree to use the service
          lawfully, not to abuse or scrape it, and that information provided is
          for general informational purposes only.
        </p>
        <h3>Not medical advice</h3>
        <p>
          Saltwise does not provide medical advice, diagnosis, or treatment.
          Always consult a qualified healthcare professional before starting,
          stopping, or switching any medicine.
        </p>
        <h3>Availability & changes</h3>
        <p>
          Features, prices, and availability are provided as-is and may change.
          We may update these terms; continued use after an update constitutes
          acceptance.
        </p>
      </div>
    </div>
  );
}
