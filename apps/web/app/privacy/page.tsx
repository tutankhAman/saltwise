import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Saltwise",
  description: "Privacy Policy for Saltwise.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-28 pb-16 sm:px-6 md:pt-32 lg:px-8">
      <p className="font-heading text-primary text-xs uppercase tracking-widest">
        Legal
      </p>
      <h1 className="mt-3 font-title text-4xl text-foreground tracking-tight sm:text-5xl">
        Privacy <span className="text-primary italic">Policy</span>
      </h1>
      <p className="mt-2 text-muted-foreground text-sm">
        Last updated: August 21, 2026
      </p>

      <div className="prose prose-sm dark:prose-invert mt-8 max-w-none prose-headings:font-heading prose-headings:text-foreground prose-p:text-muted-foreground prose-p:leading-relaxed">
        <p>
          Saltwise respects your privacy. This is a placeholder policy — replace
          it with counsel-reviewed language before production use. In short: we
          collect only what we need to provide search, price comparison, and
          prescription-upload features, and we do not sell your personal data.
        </p>
        <h3>What we collect</h3>
        <ul>
          <li>Account data if you sign in (e.g. via Google OAuth).</li>
          <li>Search queries and prescription images you choose to upload.</li>
          <li>Basic usage and error diagnostics to improve reliability.</li>
        </ul>
        <h3>How we use it</h3>
        <ul>
          <li>To return medicine and price results and AI insights.</li>
          <li>To operate and secure the service.</li>
          <li>To comply with law and prevent abuse.</li>
        </ul>
        <h3>Contact</h3>
        <p>
          For privacy requests, contact the team via the channels listed on the
          site footer. Update this page with your DPO/contact, retention, and
          jurisdiction-specific disclosures.
        </p>
      </div>
    </div>
  );
}
