import { ScaleIcon } from "lucide-react";

export default function ComparePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="flex items-center gap-3">
        <ScaleIcon className="size-6 text-primary" />
        <h1 className="font-heading text-2xl">Price Comparison</h1>
      </div>
      <p className="mt-2 text-muted-foreground text-sm">
        Compare prices across pharmacies to find the best deals.
      </p>
    </div>
  );
}
