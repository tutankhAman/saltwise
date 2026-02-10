"use client";

import { Badge } from "@saltwise/ui/components/badge";
import {
  IndianRupeeIcon,
  PillIcon,
  TrendingDownIcon,
  XIcon,
} from "lucide-react";
import type { AggregateSavingsData } from "@/lib/types";

interface AggregateSavingsProps {
  savings: AggregateSavingsData;
  fileName: string;
  onDismiss: () => void;
}

export function AggregateSavings({
  savings,
  fileName,
  onDismiss,
}: AggregateSavingsProps) {
  if (savings.totalSavings <= 0) {
    return null;
  }

  return (
    <div className="fade-in slide-in-from-top-3 animate-in fill-mode-forwards duration-500">
      <div className="relative overflow-hidden rounded-2xl border border-emerald-200/60 bg-gradient-to-r from-emerald-50/80 via-emerald-50/40 to-teal-50/80 shadow-sm backdrop-blur-xl dark:border-emerald-800/40 dark:from-emerald-950/30 dark:via-emerald-950/20 dark:to-teal-950/30">
        {/* Top accent */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />

        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: summary */}
          <div className="flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
              <TrendingDownIcon className="size-5 text-emerald-600 dark:text-emerald-400" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-heading font-semibold text-emerald-800 text-sm dark:text-emerald-200">
                  Prescription Savings Summary
                </h3>
                <Badge className="border-0 bg-emerald-100 text-[0.6rem] text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  {fileName}
                </Badge>
              </div>
              <p className="mt-1 text-emerald-700/70 text-xs dark:text-emerald-300/70">
                Switch to generics and save on{" "}
                <span className="font-medium">
                  {savings.medicineCount} medicines
                </span>
              </p>
            </div>
          </div>

          {/* Right: numbers */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-5 rounded-xl bg-white/60 px-5 py-3 backdrop-blur-sm dark:bg-white/[0.06]">
              <div className="text-center">
                <p className="text-[0.6rem] text-emerald-600/60 uppercase tracking-wider dark:text-emerald-400/60">
                  Original
                </p>
                <p className="flex items-center gap-0.5 font-heading font-semibold text-foreground/60 text-sm tabular-nums line-through decoration-destructive/40">
                  <IndianRupeeIcon className="size-3" />
                  {savings.totalOriginalCost.toFixed(0)}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <PillIcon className="size-3.5 text-emerald-500" />
              </div>

              <div className="text-center">
                <p className="text-[0.6rem] text-emerald-600/60 uppercase tracking-wider dark:text-emerald-400/60">
                  With Generics
                </p>
                <p className="flex items-center gap-0.5 font-heading font-semibold text-emerald-700 text-sm tabular-nums dark:text-emerald-300">
                  <IndianRupeeIcon className="size-3" />
                  {savings.totalCheapestCost.toFixed(0)}
                </p>
              </div>

              <div className="border-emerald-200 border-l pl-4 text-center dark:border-emerald-800">
                <p className="text-[0.6rem] text-emerald-600/60 uppercase tracking-wider dark:text-emerald-400/60">
                  You Save
                </p>
                <p className="font-bold font-heading text-base text-emerald-600 tabular-nums dark:text-emerald-400">
                  {savings.savingsPercent.toFixed(0)}%
                </p>
              </div>
            </div>

            <button
              className="rounded-full p-1.5 text-emerald-600/40 transition-colors hover:bg-emerald-100 hover:text-emerald-700 dark:text-emerald-400/40 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-300"
              onClick={onDismiss}
              type="button"
            >
              <XIcon className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
