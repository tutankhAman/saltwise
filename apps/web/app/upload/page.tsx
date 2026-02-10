import { UploadIcon } from "lucide-react";

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="flex items-center gap-3">
        <UploadIcon className="size-6 text-primary" />
        <h1 className="font-heading text-2xl">Upload Prescription</h1>
      </div>
      <p className="mt-2 text-muted-foreground text-sm">
        Upload a photo or scan of your prescription to find affordable
        alternatives.
      </p>
    </div>
  );
}
