import { FileTextIcon } from "lucide-react";

export default function PrescriptionPage(_props: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="flex items-center gap-3">
        <FileTextIcon className="size-6 text-primary" />
        <h1 className="font-heading text-2xl">Prescription Results</h1>
      </div>
      <p className="mt-2 text-muted-foreground text-sm">
        Review your parsed prescription and discover cost-saving alternatives.
      </p>
    </div>
  );
}
