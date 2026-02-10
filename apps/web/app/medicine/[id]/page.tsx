"use client";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@saltwise/ui/components/alert";
import { Badge } from "@saltwise/ui/components/badge";
import { Button } from "@saltwise/ui/components/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@saltwise/ui/components/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@saltwise/ui/components/table";
import {
  ActivityIcon,
  AlertTriangleIcon,
  ArrowDownIcon,
  ArrowLeftIcon,
  BabyIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  CircleIcon,
  HeartPulseIcon,
  InfoIcon,
  PillIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  StoreIcon,
  SyringeIcon,
  TagIcon,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getDrugById } from "@/lib/mock-data";
import type {
  DrugAlternative,
  DrugInteraction,
  DrugSearchResult,
  PharmacyPrice,
  SafetyInfo,
  ShoppingOption,
} from "@/lib/types";

/* ─── Utility ───────────────────────────────────────────────────────── */

function PharmacyLogo({ pharmacy }: { pharmacy: ShoppingOption["pharmacy"] }) {
  switch (pharmacy) {
    case "1mg":
      return (
        <span className="font-bold text-[#ff6f61] tracking-tighter">1mg</span>
      );
    case "PharmEasy":
      return (
        <div className="flex items-center gap-0.5 font-bold tracking-tight">
          <span className="text-gray-700 dark:text-gray-300">Pharm</span>
          <span className="text-[#10847e]">Easy</span>
        </div>
      );
    case "Apollo":
      return (
        <span className="font-bold text-[#f37021] tracking-tight">Apollo</span>
      );
    case "Netmeds":
      return (
        <span className="font-bold text-[#32aeb1] tracking-tight">Netmeds</span>
      );
    default:
      return (
        <span className="font-bold text-foreground/80 tracking-tight">
          {pharmacy}
        </span>
      );
  }
}

function confidenceBadgeVariant(confidence: PharmacyPrice["confidence"]) {
  switch (confidence) {
    case "live":
      return "default";
    case "recent":
      return "secondary";
    case "cached":
      return "outline";
    case "estimated":
      return "ghost";
    default:
      return "outline";
  }
}

function severityColor(severity: DrugInteraction["severity"]) {
  switch (severity) {
    case "mild":
      return {
        bg: "bg-yellow-50 dark:bg-yellow-500/5",
        border: "border-yellow-200/60 dark:border-yellow-500/20",
        text: "text-yellow-700 dark:text-yellow-400",
        badge:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/10 dark:text-yellow-400",
        dot: "bg-yellow-400",
      };
    case "moderate":
      return {
        bg: "bg-orange-50 dark:bg-orange-500/5",
        border: "border-orange-200/60 dark:border-orange-500/20",
        text: "text-orange-700 dark:text-orange-400",
        badge:
          "bg-orange-100 text-orange-800 dark:bg-orange-500/10 dark:text-orange-400",
        dot: "bg-orange-400",
      };
    case "severe":
      return {
        bg: "bg-red-50 dark:bg-red-500/5",
        border: "border-red-200/60 dark:border-red-500/20",
        text: "text-red-700 dark:text-red-400",
        badge: "bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400",
        dot: "bg-red-500",
      };
    case "contraindicated":
      return {
        bg: "bg-red-100 dark:bg-red-500/10",
        border: "border-red-300/60 dark:border-red-500/30",
        text: "text-red-800 dark:text-red-300",
        badge: "bg-red-200 text-red-900 dark:bg-red-500/20 dark:text-red-300",
        dot: "bg-red-600",
      };
    default:
      return {
        bg: "bg-muted/30 dark:bg-muted/10",
        border: "border-border/40",
        text: "text-muted-foreground",
        badge: "bg-muted text-muted-foreground",
        dot: "bg-muted-foreground",
      };
  }
}

function pregnancyCategoryLabel(category: SafetyInfo["pregnancyCategory"]) {
  switch (category) {
    case "A":
      return "Safe — No risk in controlled studies";
    case "B":
      return "Presumed safe — No risk in animal studies";
    case "C":
      return "Use with caution — Risk not ruled out";
    case "D":
      return "Positive evidence of risk — Use only if needed";
    case "X":
      return "Contraindicated — Do not use in pregnancy";
    default:
      return "Unknown category";
  }
}

function pregnancyCategoryColor(category: SafetyInfo["pregnancyCategory"]) {
  switch (category) {
    case "A":
      return "text-emerald-600 dark:text-emerald-400";
    case "B":
      return "text-emerald-600 dark:text-emerald-400";
    case "C":
      return "text-yellow-600 dark:text-yellow-400";
    case "D":
      return "text-orange-600 dark:text-orange-400";
    case "X":
      return "text-red-600 dark:text-red-400";
    default:
      return "text-muted-foreground";
  }
}

function safetyExplanation(
  alternative: DrugAlternative,
  originalDrug: DrugSearchResult["drug"]
): string {
  if (alternative.safetyTier === "exact_generic") {
    return `${alternative.drug.brandName} contains the exact same active ingredient (${originalDrug.salt}) in the same strength (${originalDrug.strength}) and dosage form as ${originalDrug.brandName}. Generic medicines are required by CDSCO to demonstrate bioequivalence — meaning they are absorbed into the body at the same rate and to the same extent as the branded version.${alternative.drug.gmpCertified ? ` ${alternative.drug.manufacturer} is a GMP-certified manufacturer, ensuring quality standards are met.` : ""}`;
  }
  return `${alternative.drug.brandName} contains a therapeutically equivalent formulation to ${originalDrug.brandName}. While not an exact generic, it belongs to the same drug class and works through the same mechanism. Your doctor can confirm if this substitution is appropriate for your condition.`;
}

/* ─── Sub-Components ────────────────────────────────────────────────── */

function SectionHeader({
  icon: Icon,
  title,
  count,
  delay = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  count?: number;
  delay?: number;
}) {
  return (
    <div
      className="fade-in slide-in-from-bottom-2 flex animate-in items-center gap-3 fill-mode-forwards duration-500 ease-out"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex size-9 items-center justify-center rounded-xl bg-primary/5">
        <Icon className="size-4 text-primary/70" />
      </div>
      <div>
        <h2 className="font-heading font-semibold text-sm tracking-tight">
          {title}
        </h2>
        {count != null && count > 0 && (
          <p className="text-muted-foreground/60 text-xs">
            {count} {count === 1 ? "option" : "options"} found
          </p>
        )}
      </div>
    </div>
  );
}

function AlternativeCard({
  alternative,
  originalDrug,
  index,
}: {
  alternative: DrugSearchResult["alternatives"][number];
  originalDrug: DrugSearchResult["drug"];
  index: number;
}) {
  const { drug, pricePerUnit, savings, savingsPercent, safetyTier } =
    alternative;

  return (
    <div
      className="fade-in slide-in-from-bottom-2 animate-in fill-mode-forwards duration-500 ease-out"
      style={{ animationDelay: `${300 + index * 100}ms` }}
    >
      <div className="group relative overflow-hidden rounded-xl border border-border/40 bg-white/60 p-4 backdrop-blur-xl transition-all duration-300 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]">
        {/* Top accent */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary/5">
                <PillIcon className="size-3.5 text-primary/60" />
              </div>
              <span className="font-heading font-semibold text-sm">
                {drug.brandName}
              </span>
              <Badge
                className="border-border/50 bg-white/80 text-[0.55rem] dark:bg-white/5"
                variant="outline"
              >
                {safetyTier === "exact_generic"
                  ? "Exact Generic"
                  : "Therapeutic Equivalent"}
              </Badge>
            </div>
            <p className="pl-9 text-muted-foreground text-xs">
              {drug.manufacturer}
              {drug.gmpCertified && (
                <span className="ml-1.5 inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheckIcon className="size-3" />
                  GMP
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-4 pl-9 sm:pl-0">
            <div className="text-right">
              <p className="font-heading font-semibold text-sm tabular-nums">
                <span className="text-foreground/40 text-xs">₹</span>
                {pricePerUnit.toFixed(2)}
                <span className="text-muted-foreground text-xs">/unit</span>
              </p>
              {drug.price != null && (
                <p className="text-muted-foreground/70 text-xs">
                  ₹{drug.price.toFixed(2)}/pack
                </p>
              )}
            </div>
            {savings > 0 && (
              <Badge className="gap-1 border-0 bg-emerald-500/90 text-[0.6rem] text-white shadow-sm dark:bg-emerald-500/80">
                <ArrowDownIcon className="size-2.5" />
                Save {savingsPercent.toFixed(0)}%
              </Badge>
            )}
          </div>
        </div>

        {/* Why is this safe? */}
        <Collapsible className="mt-3 w-full">
          <CollapsibleTrigger className="group/trigger flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-muted-foreground text-xs transition-colors hover:bg-muted/30 hover:text-foreground">
            <InfoIcon className="size-3 shrink-0" />
            <span>Why is this safe?</span>
            <ChevronDownIcon className="ml-auto size-3 shrink-0 transition-transform group-data-[panel-open]/trigger:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="animate-collapse-in overflow-hidden data-[ending-style]:animate-collapse-out data-[starting-style]:animate-collapse-out">
            <p className="mt-2 rounded-lg border border-border/30 bg-muted/20 p-3 text-muted-foreground text-xs leading-relaxed backdrop-blur-sm">
              {safetyExplanation(alternative, originalDrug)}
            </p>
          </CollapsibleContent>
        </Collapsible>

        {/* Shopping Options */}
        {alternative.shoppingOptions &&
          alternative.shoppingOptions.length > 0 && (
            <div className="mt-4 border-border/30 border-t pt-4">
              <p className="mb-2 text-[0.6rem] text-muted-foreground/60 uppercase tracking-wider">
                Available at
              </p>
              <div className="flex flex-wrap gap-2">
                {alternative.shoppingOptions.map((option) => (
                  <Link
                    className="group/shop flex items-center gap-3 rounded-lg border border-border/30 bg-muted/20 px-3 py-2 transition-all hover:bg-white/60 hover:shadow-sm dark:hover:bg-white/5"
                    href={option.url}
                    key={option.pharmacy}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <div className="scale-90 transition-transform group-hover/shop:scale-100">
                      <PharmacyLogo pharmacy={option.pharmacy} />
                    </div>
                    <div className="h-4 w-px bg-border/40" />
                    <span className="font-heading font-medium text-foreground/80 text-xs tabular-nums group-hover/shop:text-foreground">
                      ₹{option.price}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
      </div>
    </div>
  );
}

function PriceComparisonTable({ prices }: { prices: PharmacyPrice[] }) {
  if (prices.length === 0) {
    return null;
  }

  const sorted = [...prices].sort((a, b) => a.perUnit - b.perUnit);
  const lowestPerUnit = sorted[0]?.perUnit;

  return (
    <div className="overflow-hidden rounded-xl border border-border/40 bg-white/60 backdrop-blur-xl dark:bg-white/[0.04]">
      <Table>
        <TableHeader>
          <TableRow className="border-border/30 hover:bg-transparent">
            <TableHead className="font-heading text-xs">Pharmacy</TableHead>
            <TableHead className="text-right font-heading text-xs">
              Price
            </TableHead>
            <TableHead className="text-right font-heading text-xs">
              Pack
            </TableHead>
            <TableHead className="text-right font-heading text-xs">
              Per Unit
            </TableHead>
            <TableHead className="text-center font-heading text-xs">
              Stock
            </TableHead>
            <TableHead className="text-center font-heading text-xs">
              Data
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((price, i) => (
            <TableRow
              className="border-border/20 transition-colors hover:bg-primary/[0.02]"
              key={price.pharmacy}
              style={{ animationDelay: `${600 + i * 80}ms` }}
            >
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {price.pharmacy}
                  {price.perUnit === lowestPerUnit && (
                    <Badge className="border-0 bg-emerald-500/90 text-[0.5rem] text-white">
                      Best
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                ₹{price.price.toFixed(2)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {price.packSize}
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                ₹{price.perUnit.toFixed(2)}
              </TableCell>
              <TableCell className="text-center">
                {price.inStock ? (
                  <CheckCircleIcon className="mx-auto size-3.5 text-emerald-500" />
                ) : (
                  <CircleIcon className="mx-auto size-3.5 text-muted-foreground/30" />
                )}
              </TableCell>
              <TableCell className="text-center">
                <Badge
                  className="text-[0.5rem]"
                  variant={confidenceBadgeVariant(price.confidence)}
                >
                  {price.confidence}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function CostComparisonBar({
  originalDrug,
  originalPerUnit,
  alternatives,
}: {
  originalDrug: DrugSearchResult["drug"];
  originalPerUnit: number;
  alternatives: DrugAlternative[];
}) {
  const cheapest = [...alternatives].sort(
    (a, b) => a.pricePerUnit - b.pricePerUnit
  )[0];
  if (!cheapest) {
    return null;
  }

  const optimizedPerUnit = cheapest.pricePerUnit;
  const savingsPerUnit = originalPerUnit - optimizedPerUnit;
  const savingsPercent =
    originalPerUnit > 0 ? (savingsPerUnit / originalPerUnit) * 100 : 0;

  if (savingsPerUnit <= 0) {
    return null;
  }

  const optimizedBarPercent = (optimizedPerUnit / originalPerUnit) * 100;

  return (
    <div
      className="fade-in slide-in-from-bottom-2 animate-in fill-mode-forwards duration-700"
      style={{ animationDelay: "500ms" }}
    >
      <div className="overflow-hidden rounded-xl border border-border/40 bg-white/60 p-5 backdrop-blur-xl dark:bg-white/[0.04]">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />

        <div className="space-y-4">
          {/* Original cost bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {originalDrug.brandName}
                <span className="ml-1 text-muted-foreground/50">(Current)</span>
              </span>
              <span className="font-heading font-medium tabular-nums">
                ₹{originalPerUnit.toFixed(2)}/unit
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-muted/40">
              <div
                className="h-full rounded-full bg-foreground/15 transition-all duration-1000 ease-out"
                style={{ width: "100%" }}
              />
            </div>
          </div>

          {/* Optimized cost bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                {cheapest.drug.brandName}
                <span className="ml-1 font-normal text-emerald-600/60 dark:text-emerald-400/60">
                  (Cheapest)
                </span>
              </span>
              <span className="font-heading font-medium text-emerald-600 tabular-nums dark:text-emerald-400">
                ₹{optimizedPerUnit.toFixed(2)}/unit
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-muted/40">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all delay-300 duration-1000 ease-out"
                style={{ width: `${Math.max(optimizedBarPercent, 4)}%` }}
              />
            </div>
          </div>

          {/* Savings summary */}
          <div className="flex items-center justify-between rounded-lg bg-emerald-50/60 p-3 dark:bg-emerald-500/5">
            <span className="text-muted-foreground text-xs">
              Potential savings per unit
            </span>
            <div className="flex items-center gap-2">
              <span className="font-heading font-semibold text-emerald-600 text-sm tabular-nums dark:text-emerald-400">
                ₹{savingsPerUnit.toFixed(2)}
              </span>
              <Badge className="gap-1 border-0 bg-emerald-500/90 text-[0.6rem] text-white shadow-sm">
                <ArrowDownIcon className="size-2.5" />
                {savingsPercent.toFixed(0)}%
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Sidebar Components ────────────────────────────────────────────── */

function GlassCard({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      className={`fade-in slide-in-from-bottom-2 animate-in fill-mode-forwards duration-500 ease-out ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="relative overflow-hidden rounded-xl border border-border/40 bg-white/60 p-4 backdrop-blur-xl dark:bg-white/[0.04]">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
        {children}
      </div>
    </div>
  );
}

function QuickFactsCard({
  drug,
  delay,
}: {
  drug: DrugSearchResult["drug"];
  delay: number;
}) {
  const facts = [
    { label: "Drug Class", value: drug.drugClass },
    { label: "Regulatory Status", value: drug.regulatoryStatus },
    { label: "Manufacturer", value: drug.manufacturer },
    { label: "Country", value: drug.manufacturerCountry },
    { label: "Dosage Form", value: drug.form },
    { label: "Strength", value: drug.strength },
  ].filter((f) => f.value);

  return (
    <GlassCard delay={delay}>
      <div className="mb-3 flex items-center gap-2">
        <BookOpenIcon className="size-3.5 text-primary/70" />
        <h3 className="font-heading font-semibold text-xs tracking-tight">
          Quick Facts
        </h3>
      </div>
      <dl className="space-y-2.5">
        {facts.map((fact) => (
          <div key={fact.label}>
            <dt className="text-[0.65rem] text-muted-foreground/60 uppercase tracking-wider">
              {fact.label}
            </dt>
            <dd className="mt-0.5 font-medium text-foreground text-xs capitalize">
              {fact.value}
            </dd>
          </div>
        ))}
      </dl>
    </GlassCard>
  );
}

function SafetyInfoCard({
  safetyInfo,
  delay,
}: {
  safetyInfo: SafetyInfo;
  delay: number;
}) {
  return (
    <GlassCard delay={delay}>
      <div className="mb-3 flex items-center gap-2">
        <ShieldAlertIcon className="size-3.5 text-primary/70" />
        <h3 className="font-heading font-semibold text-xs tracking-tight">
          Safety Information
        </h3>
      </div>

      <div className="space-y-4">
        {/* Side Effects */}
        <div>
          <div className="mb-1.5 flex items-center gap-1.5">
            <ActivityIcon className="size-3 text-muted-foreground/60" />
            <span className="font-medium text-[0.65rem] text-muted-foreground uppercase tracking-wider">
              Common Side Effects
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {safetyInfo.sideEffects.map((effect) => (
              <span
                className="inline-block rounded-md bg-muted/40 px-1.5 py-0.5 text-[0.6rem] text-muted-foreground"
                key={effect}
              >
                {effect}
              </span>
            ))}
          </div>
        </div>

        {/* Dosage */}
        <div>
          <div className="mb-1.5 flex items-center gap-1.5">
            <SyringeIcon className="size-3 text-muted-foreground/60" />
            <span className="font-medium text-[0.65rem] text-muted-foreground uppercase tracking-wider">
              Dosage
            </span>
          </div>
          <p className="text-foreground/80 text-xs leading-relaxed">
            {safetyInfo.dosageInfo}
          </p>
          <p className="mt-1 text-[0.65rem] text-muted-foreground/70">
            Max daily dose: {safetyInfo.maxDailyDose}
          </p>
        </div>

        {/* Pregnancy Category */}
        <div>
          <div className="mb-1.5 flex items-center gap-1.5">
            <HeartPulseIcon className="size-3 text-muted-foreground/60" />
            <span className="font-medium text-[0.65rem] text-muted-foreground uppercase tracking-wider">
              Pregnancy Category
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`font-bold font-heading text-lg ${pregnancyCategoryColor(safetyInfo.pregnancyCategory)}`}
            >
              {safetyInfo.pregnancyCategory}
            </span>
            <span className="text-[0.65rem] text-muted-foreground leading-tight">
              {pregnancyCategoryLabel(safetyInfo.pregnancyCategory)}
            </span>
          </div>
          {safetyInfo.lactationWarning && (
            <p className="mt-1.5 text-[0.6rem] text-muted-foreground/70 leading-relaxed">
              {safetyInfo.lactationWarning}
            </p>
          )}
        </div>

        {/* Age Warnings */}
        {(safetyInfo.pediatricWarning || safetyInfo.geriatricWarning) && (
          <div className="space-y-2">
            {safetyInfo.pediatricWarning && (
              <div>
                <div className="mb-1 flex items-center gap-1.5">
                  <BabyIcon className="size-3 text-muted-foreground/60" />
                  <span className="font-medium text-[0.65rem] text-muted-foreground uppercase tracking-wider">
                    Pediatric
                  </span>
                </div>
                <p className="text-[0.65rem] text-foreground/70 leading-relaxed">
                  {safetyInfo.pediatricWarning}
                </p>
              </div>
            )}
            {safetyInfo.geriatricWarning && (
              <div>
                <div className="mb-1 flex items-center gap-1.5">
                  <UserIcon className="size-3 text-muted-foreground/60" />
                  <span className="font-medium text-[0.65rem] text-muted-foreground uppercase tracking-wider">
                    Geriatric
                  </span>
                </div>
                <p className="text-[0.65rem] text-foreground/70 leading-relaxed">
                  {safetyInfo.geriatricWarning}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </GlassCard>
  );
}

function InteractionsCard({
  interactions,
  delay,
}: {
  interactions: DrugInteraction[];
  delay: number;
}) {
  return (
    <GlassCard delay={delay}>
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangleIcon className="size-3.5 text-primary/70" />
        <h3 className="font-heading font-semibold text-xs tracking-tight">
          Drug Interactions
        </h3>
        <Badge
          className="ml-auto border-border/50 bg-white/80 text-[0.5rem] dark:bg-white/5"
          variant="outline"
        >
          {interactions.length}
        </Badge>
      </div>

      <div className="space-y-2.5">
        {interactions.map((interaction) => {
          const colors = severityColor(interaction.severity);
          return (
            <Collapsible className="w-full" key={interaction.drugId}>
              <CollapsibleTrigger className="group/trigger w-full text-left">
                <div
                  className={`flex items-center gap-2 rounded-lg border p-2.5 transition-colors hover:bg-muted/20 ${colors.border}`}
                >
                  <div
                    className={`size-1.5 shrink-0 rounded-full ${colors.dot}`}
                  />
                  <span className="flex-1 font-medium text-xs">
                    {interaction.drugName}
                  </span>
                  <Badge className={`border-0 text-[0.5rem] ${colors.badge}`}>
                    {interaction.severity}
                  </Badge>
                  <ChevronDownIcon className="size-3 shrink-0 text-muted-foreground/50 transition-transform group-data-[panel-open]/trigger:rotate-180" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="animate-collapse-in overflow-hidden data-[ending-style]:animate-collapse-out data-[starting-style]:animate-collapse-out">
                <p
                  className={`mt-1.5 rounded-lg p-2.5 text-[0.65rem] leading-relaxed ${colors.bg} ${colors.text}`}
                >
                  {interaction.description}
                </p>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </GlassCard>
  );
}

function AIExplanationCard({
  explanation,
  drugName,
  delay,
}: {
  explanation: string;
  drugName: string;
  delay: number;
}) {
  return (
    <GlassCard delay={delay}>
      <div className="mb-3 flex items-center gap-2">
        {/* biome-ignore lint/performance/noImgElement: salty mascot */}
        <img
          alt="Salty"
          className="size-4 object-contain"
          height={16}
          src="/salty.png"
          width={16}
        />
        <h3 className="font-heading font-semibold text-xs tracking-tight">
          Why is this cheaper?
        </h3>
      </div>
      <p className="text-foreground/80 text-xs leading-relaxed">
        {explanation}
      </p>
      <div className="mt-3 flex items-center gap-1.5 rounded-md bg-muted/30 px-2 py-1.5">
        <InfoIcon className="size-2.5 shrink-0 text-muted-foreground/50" />
        <span className="text-[0.6rem] text-muted-foreground/70">
          AI-generated explanation for {drugName}
        </span>
      </div>
    </GlassCard>
  );
}

/* ─── Loading & Error States ────────────────────────────────────────── */

function LoadingState() {
  return (
    <div className="relative min-h-screen">
      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-28 pb-16 sm:px-6 md:pt-32 lg:px-8">
        <div className="mb-8 h-8 w-32 animate-pulse rounded-lg bg-muted/40" />
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <div className="h-48 w-full animate-pulse rounded-2xl bg-muted/30" />
            <div className="h-64 w-full animate-pulse rounded-2xl bg-muted/30" />
            <div className="h-48 w-full animate-pulse rounded-2xl bg-muted/30" />
          </div>
          <div className="hidden space-y-4 lg:block">
            <div className="h-48 w-full animate-pulse rounded-xl bg-muted/30" />
            <div className="h-64 w-full animate-pulse rounded-xl bg-muted/30" />
            <div className="h-32 w-full animate-pulse rounded-xl bg-muted/30" />
          </div>
        </div>
      </div>
    </div>
  );
}

function NotFoundState() {
  return (
    <div className="relative min-h-screen">
      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-28 pb-16 sm:px-6 md:pt-32 lg:px-8">
        <div className="py-20 text-center">
          <div className="relative mx-auto mb-6 flex size-20 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/10 to-accent/10" />
            <div className="absolute inset-1 rounded-full bg-white/80 backdrop-blur-sm dark:bg-white/5" />
            <PillIcon
              className="relative size-8 text-muted-foreground/40"
              strokeWidth={1.5}
            />
          </div>
          <h2 className="font-title text-2xl text-foreground">
            Medicine not found
          </h2>
          <p className="mt-2 text-muted-foreground text-sm">
            We couldn&apos;t find this medicine in our database.
          </p>
          <Link href="/search">
            <Button
              className="mt-6 gap-2 rounded-full border-border/40 bg-white/50 backdrop-blur-sm hover:bg-white/70 hover:shadow-md dark:bg-white/5 dark:hover:bg-white/10"
              variant="outline"
            >
              <ArrowLeftIcon className="size-3.5" />
              Back to Search
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────── */

export default function MedicineDetailsPage() {
  const { id } = useParams();
  const [result, setResult] = useState<DrugSearchResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      setTimeout(() => {
        const drug = getDrugById(id as string);
        setResult(drug);
        setLoading(false);
      }, 500);
    }
  }, [id]);

  if (loading) {
    return <LoadingState />;
  }

  if (!result) {
    return <NotFoundState />;
  }

  const {
    drug,
    alternatives,
    prices,
    isSubstitutable,
    ntiWarning,
    safetyInfo,
    interactions,
    aiExplanation,
  } = result;
  const originalPerUnit =
    drug.price && drug.packSize ? drug.price / drug.packSize : null;

  return (
    <div className="relative min-h-screen">
      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-28 pb-16 sm:px-6 md:pt-32 lg:px-8">
        {/* Back navigation */}
        <div className="fade-in slide-in-from-left-4 mb-8 animate-in fill-mode-forwards duration-500 ease-out">
          <Link
            className="group inline-flex items-center gap-2 rounded-full border border-border/40 bg-white/50 px-4 py-2 text-muted-foreground text-sm shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-primary/30 hover:bg-white/70 hover:text-foreground hover:shadow-md dark:bg-white/5 dark:hover:bg-white/10"
            href="/search"
          >
            <ArrowLeftIcon className="size-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
            Back to Search
          </Link>
        </div>

        {/* 2-Column Layout */}
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          {/* ─── Left Column (Main Content) ─── */}
          <div className="min-w-0">
            {/* Medicine Identity Hero */}
            <div
              className="fade-in slide-in-from-bottom-4 animate-in fill-mode-forwards duration-700 ease-out"
              style={{ animationDelay: "100ms" }}
            >
              <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-white/60 p-6 shadow-sm backdrop-blur-xl sm:p-8 dark:bg-white/[0.04]">
                {/* Top accent */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent" />

                {/* Decorative background */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                  <div className="absolute -top-20 -right-20 size-60 rounded-full bg-primary/[0.03]" />
                  <div className="absolute -bottom-10 -left-10 size-40 rounded-full bg-accent/[0.04]" />
                </div>

                <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-3">
                    {/* Brand name */}
                    <h1 className="font-title text-3xl text-foreground tracking-tight sm:text-4xl">
                      {drug.brandName}
                    </h1>

                    {/* Salt composition */}
                    <p className="font-heading text-muted-foreground text-sm">
                      {drug.salt}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <Badge
                        className="border-border/50 bg-white/80 text-[0.6rem] dark:bg-white/5"
                        variant="outline"
                      >
                        {drug.strength}
                      </Badge>
                      <Badge
                        className="border-border/50 bg-white/80 text-[0.6rem] dark:bg-white/5"
                        variant="outline"
                      >
                        {drug.form}
                      </Badge>
                      {drug.drugClass && (
                        <Badge
                          className="border-border/50 bg-white/80 text-[0.6rem] dark:bg-white/5"
                          variant="outline"
                        >
                          {drug.drugClass}
                        </Badge>
                      )}
                      {drug.regulatoryStatus && (
                        <Badge className="gap-1 border-0 bg-emerald-50 text-[0.6rem] text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                          <CheckCircleIcon className="size-2.5" />
                          {drug.regulatoryStatus === "approved"
                            ? "CDSCO Approved"
                            : drug.regulatoryStatus}
                        </Badge>
                      )}
                      {drug.gmpCertified && (
                        <Badge className="gap-1 border-0 bg-emerald-50 text-[0.6rem] text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                          <ShieldCheckIcon className="size-2.5" />
                          GMP Certified
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Price callout */}
                  {originalPerUnit != null && (
                    <div className="shrink-0 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 p-4 text-right sm:min-w-[140px]">
                      <p className="font-title text-3xl tabular-nums">
                        <span className="text-foreground/40 text-lg">₹</span>
                        {drug.price?.toFixed(2)}
                      </p>
                      <p className="mt-0.5 text-muted-foreground text-xs">
                        ₹{originalPerUnit.toFixed(2)}/unit
                        {drug.packSize ? ` · Pack of ${drug.packSize}` : ""}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* NTI Warning */}
            {ntiWarning && (
              <div
                className="fade-in slide-in-from-bottom-2 mt-6 animate-in fill-mode-forwards duration-500"
                style={{ animationDelay: "200ms" }}
              >
                <Alert variant="destructive">
                  <AlertTriangleIcon className="size-4" />
                  <AlertTitle>Non-Substitutable Medicine</AlertTitle>
                  <AlertDescription>{ntiWarning}</AlertDescription>
                </Alert>
              </div>
            )}

            {/* Generic Alternatives */}
            {isSubstitutable && (
              <div className="mt-10 space-y-4">
                <SectionHeader
                  count={alternatives.length}
                  delay={250}
                  icon={TagIcon}
                  title="Generic Alternatives"
                />

                {alternatives.length > 0 ? (
                  <div className="space-y-3">
                    {alternatives.map((alt, i) => (
                      <AlternativeCard
                        alternative={alt}
                        index={i}
                        key={alt.drug.id}
                        originalDrug={drug}
                      />
                    ))}
                  </div>
                ) : (
                  <div
                    className="fade-in animate-in fill-mode-forwards duration-500"
                    style={{ animationDelay: "350ms" }}
                  >
                    <div className="rounded-xl border border-border/40 bg-white/60 p-6 text-center backdrop-blur-xl dark:bg-white/[0.04]">
                      <p className="text-muted-foreground text-sm">
                        No generic alternatives found. This is already the most
                        cost-effective option we know of.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cost Comparison */}
            {isSubstitutable &&
              alternatives.length > 0 &&
              originalPerUnit != null && (
                <div className="mt-10 space-y-4">
                  <SectionHeader
                    delay={450}
                    icon={ArrowDownIcon}
                    title="Cost Comparison"
                  />
                  <CostComparisonBar
                    alternatives={alternatives}
                    originalDrug={drug}
                    originalPerUnit={originalPerUnit}
                  />
                </div>
              )}

            {/* Price Comparison */}
            {prices.length > 0 && (
              <div className="mt-10 space-y-4">
                <SectionHeader
                  count={prices.length}
                  delay={550}
                  icon={StoreIcon}
                  title="Pharmacy Prices"
                />
                <div
                  className="fade-in slide-in-from-bottom-2 animate-in fill-mode-forwards duration-500"
                  style={{ animationDelay: "600ms" }}
                >
                  <PriceComparisonTable prices={prices} />
                </div>
              </div>
            )}
          </div>

          {/* ─── Right Column (Sidebar) ─── */}
          <div className="space-y-4 lg:sticky lg:top-28 lg:self-start">
            {/* Quick Facts */}
            <QuickFactsCard delay={200} drug={drug} />

            {/* Safety Information */}
            {safetyInfo && (
              <SafetyInfoCard delay={350} safetyInfo={safetyInfo} />
            )}

            {/* Drug Interactions */}
            {interactions && interactions.length > 0 && (
              <InteractionsCard delay={500} interactions={interactions} />
            )}

            {/* AI Explanation */}
            {aiExplanation && (
              <AIExplanationCard
                delay={650}
                drugName={drug.brandName}
                explanation={aiExplanation}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
