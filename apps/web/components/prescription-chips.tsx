"use client";

import { PillIcon, SparklesIcon, XIcon } from "lucide-react";
import { useCallback } from "react";
import type { PrescriptionMedicine } from "@/lib/types";

interface PrescriptionChipsProps {
  medicines: PrescriptionMedicine[];
  activeIndex: number | null;
  onSelect: (medicine: PrescriptionMedicine, index: number) => void;
  onDismiss: (index: number) => void;
  onClearAll: () => void;
}

export function PrescriptionChips({
  medicines,
  activeIndex,
  onSelect,
  onDismiss,
  onClearAll,
}: PrescriptionChipsProps) {
  const handleDismiss = useCallback(
    (e: React.MouseEvent, index: number) => {
      e.stopPropagation();
      onDismiss(index);
    },
    [onDismiss]
  );

  if (medicines.length === 0) {
    return null;
  }

  return (
    <div className="fade-in slide-in-from-bottom-2 animate-in fill-mode-forwards duration-500 ease-out">
      {/* Header */}
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <SparklesIcon className="size-3 text-primary/70" />
          <span className="font-heading font-medium text-[0.7rem] text-foreground/70 uppercase tracking-wider">
            Prescription Medicines
          </span>
          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 font-medium text-[0.6rem] text-primary tabular-nums">
            {medicines.length}
          </span>
        </div>
        <button
          className="font-medium text-[0.65rem] text-muted-foreground/50 transition-colors hover:text-foreground"
          onClick={onClearAll}
          type="button"
        >
          Clear all
        </button>
      </div>

      {/* Chips */}
      <div className="flex flex-wrap gap-2">
        {medicines.map((med, i) => {
          const isActive = activeIndex === i;
          const label = med.strength ? `${med.name} ${med.strength}` : med.name;

          return (
            <button
              className={`group inline-flex items-center gap-1.5 rounded-full border py-1.5 pr-1.5 pl-3 font-medium text-xs shadow-sm transition-all duration-200 active:scale-[0.97] ${
                isActive
                  ? "border-primary/40 bg-primary/10 text-primary shadow-primary/10 ring-2 ring-primary/20"
                  : "border-border/50 bg-white/70 text-foreground/80 backdrop-blur-sm hover:border-primary/30 hover:bg-primary/5 hover:text-foreground hover:shadow-md dark:bg-white/[0.05] dark:hover:bg-white/[0.08]"
              }`}
              key={`${med.name}-${i}`}
              onClick={() => onSelect(med, i)}
              style={{ animationDelay: `${i * 60}ms` }}
              type="button"
            >
              <PillIcon
                className={`size-3 ${isActive ? "text-primary" : "text-muted-foreground/50 group-hover:text-primary/60"}`}
                strokeWidth={2}
              />
              <span className="max-w-[200px] truncate">{label}</span>
              {med.form && (
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[0.6rem] ${
                    isActive
                      ? "bg-primary/10 text-primary/80"
                      : "bg-muted/50 text-muted-foreground/60"
                  }`}
                >
                  {med.form}
                </span>
              )}
              {/* biome-ignore lint/a11y/useSemanticElements: nested inside a parent button — cannot nest <button> */}
              <span
                aria-label={`Remove ${med.name}`}
                className={`ml-0.5 inline-flex size-5 items-center justify-center rounded-full transition-colors ${
                  isActive
                    ? "text-primary/50 hover:bg-primary/20 hover:text-primary"
                    : "text-muted-foreground/30 hover:bg-muted hover:text-foreground"
                }`}
                onClick={(e) => handleDismiss(e, i)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleDismiss(e as unknown as React.MouseEvent, i);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <XIcon className="size-3" />
              </span>
            </button>
          );
        })}
      </div>

      {/* Hint */}
      <p className="mt-2 text-[0.65rem] text-muted-foreground/40">
        Click a medicine to search for alternatives and prices
      </p>
    </div>
  );
}
