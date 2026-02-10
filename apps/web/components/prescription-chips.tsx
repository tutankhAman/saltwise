"use client";

import { PillIcon, SearchIcon, SparklesIcon, XIcon } from "lucide-react";
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
    <div className="fade-in slide-in-from-bottom-3 animate-in fill-mode-forwards duration-600 ease-out">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-5 items-center justify-center rounded-md bg-primary/10">
            <SparklesIcon className="size-3 text-primary" />
          </div>
          <span className="font-heading font-semibold text-foreground/80 text-xs uppercase tracking-wider">
            Medicines Found
          </span>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-[0.65rem] text-primary tabular-nums leading-none">
            {medicines.length}
          </span>
        </div>
        <button
          className="rounded-lg px-2 py-1 font-medium text-muted-foreground/50 text-xs transition-colors hover:bg-muted/50 hover:text-foreground"
          onClick={onClearAll}
          type="button"
        >
          Clear all
        </button>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
        {medicines.map((med, i) => {
          const isActive = activeIndex === i;

          return (
            <button
              className={`fade-in slide-in-from-bottom-2 group relative flex animate-in flex-col items-start gap-2 rounded-xl border fill-mode-forwards p-3.5 text-left shadow-sm transition-all duration-200 active:scale-[0.97] ${
                isActive
                  ? "border-primary/50 bg-primary/[0.08] shadow-md shadow-primary/10 ring-2 ring-primary/20"
                  : "border-border/50 bg-white/70 backdrop-blur-sm hover:border-primary/30 hover:bg-primary/5 hover:shadow-md dark:bg-white/[0.05] dark:hover:bg-white/[0.08]"
              }`}
              key={`${med.name}-${i}`}
              onClick={() => onSelect(med, i)}
              style={{ animationDelay: `${i * 75}ms` }}
              type="button"
            >
              {/* Dismiss button */}
              {/* biome-ignore lint/a11y/useSemanticElements: nested inside a parent button — cannot nest <button> */}
              <span
                aria-label={`Remove ${med.name}`}
                className={`absolute top-2 right-2 inline-flex size-6 items-center justify-center rounded-lg opacity-0 transition-all group-hover:opacity-100 ${
                  isActive
                    ? "text-primary/50 hover:bg-primary/20 hover:text-primary"
                    : "text-muted-foreground/40 hover:bg-muted hover:text-foreground"
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
                <XIcon className="size-3.5" />
              </span>

              {/* Icon + Name row */}
              <div className="flex w-full items-start gap-2.5 pr-5">
                <div
                  className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary/15 text-primary"
                      : "bg-muted/60 text-muted-foreground/50 group-hover:bg-primary/10 group-hover:text-primary/70 dark:bg-white/[0.08]"
                  }`}
                >
                  <PillIcon className="size-4" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate font-semibold text-sm leading-tight ${
                      isActive ? "text-primary" : "text-foreground/90"
                    }`}
                  >
                    {med.name}
                  </p>
                  {med.strength && (
                    <p
                      className={`mt-0.5 truncate text-xs ${
                        isActive
                          ? "text-primary/60"
                          : "text-muted-foreground/60"
                      }`}
                    >
                      {med.strength}
                    </p>
                  )}
                </div>
              </div>

              {/* Metadata row */}
              <div className="flex w-full items-center gap-1.5">
                {med.form && (
                  <span
                    className={`rounded-md px-1.5 py-0.5 font-medium text-[0.6rem] capitalize leading-none ${
                      isActive
                        ? "bg-primary/10 text-primary/70"
                        : "bg-muted/50 text-muted-foreground/50 dark:bg-white/[0.06]"
                    }`}
                  >
                    {med.form}
                  </span>
                )}
                {med.quantity && (
                  <span
                    className={`rounded-md px-1.5 py-0.5 font-medium text-[0.6rem] leading-none ${
                      isActive
                        ? "bg-primary/10 text-primary/70"
                        : "bg-muted/50 text-muted-foreground/50 dark:bg-white/[0.06]"
                    }`}
                  >
                    Qty: {med.quantity}
                  </span>
                )}
                <div className="flex-1" />
                <SearchIcon
                  className={`size-3 transition-opacity ${
                    isActive
                      ? "text-primary/50"
                      : "text-muted-foreground/30 opacity-0 group-hover:opacity-100"
                  }`}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Hint */}
      <p className="mt-3 text-center text-[0.7rem] text-muted-foreground/40">
        Tap a medicine to search for generic alternatives and compare prices
      </p>
    </div>
  );
}
