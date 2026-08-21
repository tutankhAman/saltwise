import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy — Saltwise",
  description: "Cookie Policy for Saltwise.",
};

export default function CookiesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-28 pb-16 sm:px-6 md:pt-32 lg:px-8">
      <p className="font-heading text-primary text-xs uppercase tracking-widest">
        Legal
      </p>
      <h1 className="mt-3 font-title text-4xl text-foreground tracking-tight sm:text-5xl">
        Cookie <span className="text-primary italic">Policy</span>
      </h1>
      <p className="mt-2 text-muted-foreground text-sm">
        Last updated: August 21, 2026
      </p>

      <div className="prose prose-sm dark:prose-invert mt-8 max-w-none prose-headings:font-heading prose-headings:text-foreground prose-p:text-muted-foreground prose-p:leading-relaxed">
        <p>
          Saltwise uses cookies and similar technologies to keep you signed in,
          remember preferences, and measure usage. This placeholder should be
          expanded with your actual cookie inventory and consent controls.
        </p>
        <h3>Types of cookies</h3>
        <ul>
          <li>
            <strong>Essential</strong> — required for sign-in and security.
          </li>
          <li>
            <strong>Preferences</strong> — remember settings like language.
          </li>
          <li>
            <strong>Analytics</strong> — help us understand and improve the
            product (only with your consent where required).
          </li>
        </ul>
        <h3>Your choices</h3>
        <p>
          You can control cookies via your browser settings and, where offered,
          our consent banner. Blocking essential cookies may break sign-in and
          other core features.
        </p>
      </div>
    </div>
  );
}
