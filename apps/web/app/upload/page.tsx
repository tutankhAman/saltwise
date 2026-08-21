"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { PrescriptionChips } from "@/components/prescription-chips";
import { PrescriptionUpload } from "@/components/prescription-upload";
import type { PrescriptionMedicine } from "@/lib/types";

export default function UploadPage() {
  const router = useRouter();
  const [medicines, setMedicines] = useState<PrescriptionMedicine[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const handleMedicinesIdentified = useCallback(
    (identified: PrescriptionMedicine[]) => {
      setMedicines(identified);
      setActiveIndex(null);
    },
    []
  );

  const handleSelect = useCallback(
    (medicine: PrescriptionMedicine, index: number) => {
      setActiveIndex(index);
      router.push(`/search?q=${encodeURIComponent(medicine.name)}`);
    },
    [router]
  );

  const handleDismiss = useCallback((index: number) => {
    setMedicines((prev) => prev.filter((_, i) => i !== index));
    setActiveIndex((prev) => {
      if (prev === index) {
        return null;
      }
      if (prev !== null && prev > index) {
        return prev - 1;
      }
      return prev;
    });
  }, []);

  const handleClearAll = useCallback(() => {
    setMedicines([]);
    setActiveIndex(null);
  }, []);

  const hasMedicines = medicines.length > 0;

  return (
    <div className="mx-auto max-w-3xl px-4 pt-28 pb-16 sm:px-6 md:pt-32 lg:px-8">
      <div className="fade-in slide-in-from-bottom-4 animate-in fill-mode-forwards duration-700 ease-out">
        <p className="font-heading text-primary text-xs uppercase tracking-widest">
          Upload Prescription
        </p>
        <h1 className="mt-3 font-title text-4xl text-foreground tracking-tight sm:text-5xl">
          Upload a <span className="text-primary italic">prescription</span>
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground leading-relaxed">
          Drop a clear photo of your prescription. We&apos;ll identify medicines
          with AI — then tap any medicine to search for generic alternatives and
          compare prices.
        </p>
        <p className="mt-2 text-muted-foreground/60 text-xs leading-relaxed">
          Prefer the combined flow? You can also upload directly on the{" "}
          <Link
            className="text-primary underline-offset-2 hover:underline"
            href="/search"
          >
            Search
          </Link>{" "}
          page.
        </p>
      </div>

      <div className="mt-8">
        {hasMedicines ? (
          <div className="space-y-6">
            <PrescriptionChips
              activeIndex={activeIndex}
              medicines={medicines}
              onClearAll={handleClearAll}
              onDismiss={handleDismiss}
              onSelect={handleSelect}
            />
            <div className="flex flex-wrap gap-3">
              <Link
                className="inline-flex items-center rounded-full bg-primary px-5 py-2.5 font-medium text-primary-foreground text-sm shadow-sm hover:bg-primary/90"
                href="/search"
              >
                Go to search
              </Link>
              <button
                className="inline-flex items-center rounded-full border border-border bg-white/60 px-5 py-2.5 font-medium text-foreground text-sm backdrop-blur-sm hover:bg-white dark:bg-white/[0.06]"
                onClick={handleClearAll}
                type="button"
              >
                Upload another
              </button>
            </div>
          </div>
        ) : (
          <PrescriptionUpload
            onMedicinesIdentified={handleMedicinesIdentified}
          />
        )}
      </div>

      <p className="mt-8 text-center text-muted-foreground/40 text-xs leading-relaxed">
        Your photo is processed to identify medicines and is not stored as a
        medical record. Always confirm with your doctor or pharmacist.
      </p>
    </div>
  );
}
