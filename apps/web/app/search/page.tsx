"use client";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@saltwise/ui/components/alert";
import { Badge } from "@saltwise/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@saltwise/ui/components/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@saltwise/ui/components/collapsible";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@saltwise/ui/components/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@saltwise/ui/components/input-group";
import { Separator } from "@saltwise/ui/components/separator";
import { Skeleton } from "@saltwise/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@saltwise/ui/components/table";
import {
  AlertTriangleIcon,
  ArrowDownIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  CircleIcon,
  InfoIcon,
  SearchIcon,
  ShieldCheckIcon,
  XIcon,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { searchMockDrugs } from "@/lib/mock-data";
import type {
  DrugAlternative,
  DrugSearchResult,
  PharmacyPrice,
} from "@/lib/types";

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

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {["s1", "s2"].map((id) => (
        <div className="space-y-4 rounded-lg border p-6" key={id}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-56" />
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
            </div>
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
          <Skeleton className="h-px w-full" />
          <div className="space-y-3">
            <Skeleton className="h-5 w-48" />
            <div className="space-y-2">
              <Skeleton className="h-16 w-full rounded-md" />
              <Skeleton className="h-16 w-full rounded-md" />
            </div>
          </div>
          <Skeleton className="h-px w-full" />
          <div className="space-y-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-24 w-full rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
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

function AlternativeCard({
  alternative,
  originalDrug,
}: {
  alternative: DrugSearchResult["alternatives"][number];
  originalDrug: DrugSearchResult["drug"];
}) {
  const { drug, pricePerUnit, savings, savingsPercent, safetyTier } =
    alternative;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-card p-4 transition-colors hover:border-primary/30 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{drug.brandName}</span>
          <Badge className="text-[0.55rem]" variant="outline">
            {safetyTier === "exact_generic"
              ? "Exact Generic"
              : "Therapeutic Equivalent"}
          </Badge>
        </div>
        <p className="text-muted-foreground text-xs">
          {drug.manufacturer}
          {drug.gmpCertified && (
            <span className="ml-1.5 inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
              <ShieldCheckIcon className="size-3" />
              GMP
            </span>
          )}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="font-medium text-sm">
            ₹{pricePerUnit.toFixed(2)}
            <span className="text-muted-foreground text-xs">/unit</span>
          </p>
          {drug.price != null && (
            <p className="text-muted-foreground text-xs">
              ₹{drug.price.toFixed(2)}/pack
            </p>
          )}
        </div>
        {savings > 0 && (
          <Badge className="gap-1 text-[0.6rem]" variant="default">
            <ArrowDownIcon className="size-2.5" />
            Save {savingsPercent.toFixed(0)}%
          </Badge>
        )}
      </div>

      {/* Why is this safe? */}
      <Collapsible className="w-full">
        <CollapsibleTrigger className="group flex w-full items-center gap-1.5 rounded-md px-1 py-1 text-left text-muted-foreground text-xs transition-colors hover:text-foreground">
          <InfoIcon className="size-3 shrink-0" />
          <span>Why is this safe?</span>
          <ChevronDownIcon className="ml-auto size-3 shrink-0 transition-transform group-data-[panel-open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="animate-collapse-in overflow-hidden data-[ending-style]:animate-collapse-out data-[starting-style]:animate-collapse-out">
          <p className="mt-2 rounded-md bg-muted/50 p-3 text-muted-foreground text-xs leading-relaxed">
            {safetyExplanation(alternative, originalDrug)}
          </p>
        </CollapsibleContent>
      </Collapsible>
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Pharmacy</TableHead>
          <TableHead className="text-right">Price</TableHead>
          <TableHead className="text-right">Pack Size</TableHead>
          <TableHead className="text-right">Per Unit</TableHead>
          <TableHead className="text-center">Stock</TableHead>
          <TableHead className="text-center">Data</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((price) => (
          <TableRow key={price.pharmacy}>
            <TableCell className="font-medium">
              {price.pharmacy}
              {price.perUnit === lowestPerUnit && (
                <Badge className="ml-2 text-[0.5rem]" variant="default">
                  Best
                </Badge>
              )}
            </TableCell>
            <TableCell className="text-right">
              ₹{price.price.toFixed(2)}
            </TableCell>
            <TableCell className="text-right">{price.packSize}</TableCell>
            <TableCell className="text-right font-medium">
              ₹{price.perUnit.toFixed(2)}
            </TableCell>
            <TableCell className="text-center">
              {price.inStock ? (
                <CheckCircleIcon className="mx-auto size-3.5 text-emerald-500" />
              ) : (
                <CircleIcon className="mx-auto size-3.5 text-muted-foreground/40" />
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
  // Find the cheapest alternative
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

  // For the visual bar, the original price is 100% width
  const optimizedBarPercent = (optimizedPerUnit / originalPerUnit) * 100;

  return (
    <>
      <Separator />
      <div className="space-y-3">
        <h3 className="font-heading font-medium text-sm">Cost Comparison</h3>
        <div className="space-y-3 rounded-lg border border-border/60 bg-muted/30 p-4">
          {/* Original cost bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {originalDrug.brandName} (Original)
              </span>
              <span className="font-medium tabular-nums">
                ₹{originalPerUnit.toFixed(2)}/unit
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-foreground/20"
                style={{ width: "100%" }}
              />
            </div>
          </div>

          {/* Optimized cost bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                {cheapest.drug.brandName} (Cheapest Alternative)
              </span>
              <span className="font-medium text-emerald-600 tabular-nums dark:text-emerald-400">
                ₹{optimizedPerUnit.toFixed(2)}/unit
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${Math.max(optimizedBarPercent, 4)}%` }}
              />
            </div>
          </div>

          {/* Savings summary */}
          <div className="flex items-center justify-between border-border/60 border-t pt-3">
            <span className="text-muted-foreground text-xs">
              Potential savings per unit
            </span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-emerald-600 text-sm tabular-nums dark:text-emerald-400">
                ₹{savingsPerUnit.toFixed(2)}
              </span>
              <Badge className="gap-1 text-[0.6rem]" variant="default">
                <ArrowDownIcon className="size-2.5" />
                {savingsPercent.toFixed(0)}%
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function MedicineResultCard({ result }: { result: DrugSearchResult }) {
  const { drug, alternatives, prices, isSubstitutable, ntiWarning } = result;
  const originalPerUnit =
    drug.price && drug.packSize ? drug.price / drug.packSize : null;

  return (
    <Card className="overflow-hidden" size="sm">
      {/* Medicine Identity */}
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-primary text-xl">
              {drug.brandName}
            </CardTitle>
            <CardDescription className="font-medium text-foreground/80">
              {drug.salt}
            </CardDescription>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <Badge className="rounded-md text-[0.6rem]" variant="secondary">
                {drug.strength}
              </Badge>
              <Badge className="rounded-md text-[0.6rem]" variant="secondary">
                {drug.form}
              </Badge>
              <Badge className="rounded-md text-[0.6rem]" variant="outline">
                {drug.manufacturer}
              </Badge>
              {drug.gmpCertified && (
                <Badge
                  className="gap-1 rounded-md text-[0.6rem] text-emerald-700 dark:text-emerald-400"
                  variant="outline"
                >
                  <ShieldCheckIcon className="size-2.5" />
                  GMP Certified
                </Badge>
              )}
            </div>
          </div>
          {originalPerUnit != null && (
            <div className="shrink-0 text-right">
              <p className="font-medium text-lg">₹{drug.price?.toFixed(2)}</p>
              <p className="text-muted-foreground text-xs">
                ₹{originalPerUnit.toFixed(2)}/unit
                {drug.packSize ? ` (pack of ${drug.packSize})` : ""}
              </p>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* NTI Warning */}
        {ntiWarning && (
          <Alert variant="destructive">
            <AlertTriangleIcon className="size-4" />
            <AlertTitle>Non-Substitutable Medicine</AlertTitle>
            <AlertDescription>{ntiWarning}</AlertDescription>
          </Alert>
        )}

        {/* Generic Alternatives */}
        {isSubstitutable && (
          <>
            <Separator />
            <div className="space-y-3">
              <h3 className="font-heading font-medium text-sm">
                Generic Alternatives
                {alternatives.length > 0 && (
                  <span className="ml-2 text-muted-foreground text-xs">
                    ({alternatives.length} found)
                  </span>
                )}
              </h3>
              {alternatives.length > 0 ? (
                <div className="space-y-2">
                  {alternatives.map((alt) => (
                    <AlternativeCard
                      alternative={alt}
                      key={alt.drug.id}
                      originalDrug={drug}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-xs">
                  No generic alternatives found. This is already the most
                  cost-effective option we know of.
                </p>
              )}
            </div>
          </>
        )}

        {/* Cost Comparison Bar */}
        {isSubstitutable &&
          alternatives.length > 0 &&
          originalPerUnit != null && (
            <CostComparisonBar
              alternatives={alternatives}
              originalDrug={drug}
              originalPerUnit={originalPerUnit}
            />
          )}

        {/* Price Comparison */}
        {prices.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h3 className="font-heading font-medium text-sm">
                Price Comparison
              </h3>
              <PriceComparisonTable prices={prices} />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/** Fetch search results from the API with mock fallback. */
async function fetchSearchResults(query: string): Promise<DrugSearchResult[]> {
  try {
    const res = await fetch(
      `/api/search?q=${encodeURIComponent(query)}&type=medicine`
    );
    if (!res.ok) {
      throw new Error("API not ready");
    }

    const data = await res.json();

    if (data.type === "medicine" && Array.isArray(data.results)) {
      return data.results as DrugSearchResult[];
    }
    return [];
  } catch {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return searchMockDrugs(query);
  }
}

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const router = useRouter();

  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebounce(query, 300);
  const [results, setResults] = useState<DrugSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (debouncedQuery) {
      router.replace(`/search?q=${encodeURIComponent(debouncedQuery)}`);
    } else {
      router.replace("/search");
    }
  }, [debouncedQuery, router]);

  const resetResults = useCallback(() => {
    setResults([]);
    setHasSearched(false);
  }, []);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      resetResults();
      return;
    }

    setLoading(true);
    setHasSearched(true);

    fetchSearchResults(debouncedQuery)
      .then((medicineResults) => {
        setResults(medicineResults);
      })
      .finally(() => setLoading(false));
  }, [debouncedQuery, resetResults]);

  const clearSearch = () => {
    setQuery("");
    resetResults();
    router.replace("/search");
  };

  return (
    <div className="mx-auto max-w-4xl px-4 pt-24 pb-12 sm:px-6 md:pt-28">
      {/* Search Header */}
      <div className="mb-8 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <SearchIcon className="size-5" />
            </div>
            <div>
              <h1 className="font-medium font-title text-2xl sm:text-3xl">
                Medicine Search
              </h1>
              <p className="text-muted-foreground text-sm">
                Find generic alternatives and compare prices across pharmacies.
              </p>
            </div>
          </div>
        </div>

        <div className="relative">
          <InputGroup className="h-12 shadow-sm focus-within:ring-2 focus-within:ring-primary/20">
            <InputGroupAddon className="pl-3">
              <SearchIcon className="size-5 text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput
              autoFocus
              className="text-base placeholder:text-muted-foreground/50"
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search e.g. Dolo 650, Paracetamol..."
              value={query}
            />
            {query && (
              <InputGroupAddon className="pr-3">
                <button
                  className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  onClick={clearSearch}
                  type="button"
                >
                  <XIcon className="size-4" />
                </button>
              </InputGroupAddon>
            )}
          </InputGroup>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-6">
        {loading && <LoadingSkeleton />}

        {/* Medicine Results */}
        {!loading && hasSearched && results.length === 0 && (
          <Empty className="py-12">
            <EmptyMedia variant="icon">
              <SearchIcon />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No medicines found</EmptyTitle>
              <EmptyDescription>
                We couldn&apos;t find any medicines matching &quot;{query}
                &quot;. Try searching by salt name (e.g. &quot;Paracetamol&quot;
                instead of a brand name).
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {!loading && hasSearched && results.length > 0 && (
          <>
            <p className="text-muted-foreground text-xs">
              {results.length} {results.length === 1 ? "result" : "results"} for
              &quot;{debouncedQuery}&quot;
            </p>
            <div className="grid gap-6">
              {results.map((result) => (
                <MedicineResultCard key={result.drug.id} result={result} />
              ))}
            </div>
          </>
        )}

        {!(loading || hasSearched) && (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/5 text-primary">
              <SearchIcon className="size-8" />
            </div>
            <h3 className="font-medium text-lg">Start your search</h3>
            <p className="mx-auto mt-2 max-w-sm text-muted-foreground text-sm">
              Enter a medicine name or salt to see details, generic
              alternatives, and price comparisons across pharmacies.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}
