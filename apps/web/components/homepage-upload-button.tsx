"use client";

import { Button } from "@saltwise/ui/components/button";
import { UploadIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { compressImage } from "@/lib/image-compress";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const PENDING_RX_KEY = "pendingPrescription";

export function HomepageUploadButton() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        return;
      }

      setProcessing(true);

      try {
        const result = await compressImage(file);

        sessionStorage.setItem(
          PENDING_RX_KEY,
          JSON.stringify({ image: result.dataUri, fileName: file.name })
        );

        router.push("/search?prescription=pending");
      } catch {
        setProcessing(false);
      }
    },
    [router]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  return (
    <>
      <Button
        className="gap-2 rounded-full border-border/40 bg-white/50 backdrop-blur-sm transition-all duration-200 hover:bg-white/70 hover:shadow-md dark:bg-white/5 dark:hover:bg-white/10"
        disabled={processing}
        onClick={() => fileInputRef.current?.click()}
        variant="outline"
      >
        <UploadIcon className="size-3.5" />
        {processing ? "Compressing..." : "Upload Prescription"}
      </Button>
      <input
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={handleInputChange}
        ref={fileInputRef}
        type="file"
      />
    </>
  );
}
