import { HistoryIcon } from "lucide-react";

export default function HistoryPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="flex items-center gap-3">
        <HistoryIcon className="size-6 text-primary" />
        <h1 className="font-heading text-2xl">Prescription History</h1>
      </div>
      <p className="mt-2 text-muted-foreground text-sm">
        View your past prescriptions, savings, and audit trail.
      </p>
    </div>
  );
}
