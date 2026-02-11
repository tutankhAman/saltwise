"use client";

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
import { Skeleton } from "@saltwise/ui/components/skeleton";
import { Loader2Icon, PillIcon, SearchIcon, XIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { MedicineCard } from "@/components/medicine-card";
import { PrescriptionChips } from "@/components/prescription-chips";
import { PrescriptionUpload } from "@/components/prescription-upload";
import { SearchProgressUI } from "@/components/search-progress";
import { useDebounce } from "@/hooks/use-debounce";
import type { SearchResult } from "@/lib/firecrawl/service";
import type { DrugSearchResult, PrescriptionMedicine } from "@/lib/types";

const PENDING_RX_KEY = "pendingPrescription";

function LoadingSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div
          className="overflow-hidden rounded-2xl border border-border/40 bg-white/60 backdrop-blur-xl dark:bg-white/4"
          key={i}
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <Skeleton className="h-36 w-full rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3.5 w-1/2" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <div className="flex items-end justify-between pt-4">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="size-8 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface DbDrugPrice {
  pharmacy: string;
  price: string;
  url: string | null;
  inStock: boolean | null;
}

interface DbGroupedDrug {
  id: string;
  brandName: string;
  saltComposition: string | null;
  manufacturer: string | null;
  updatedAt: Date;
  prices: DbDrugPrice[];
}

// Helper to map DB result shape to UI DrugSearchResult
function mapDbToDrugSearchResult(dbResult: DbGroupedDrug): DrugSearchResult {
  return {
    drug: {
      id: dbResult.id,
      brandName: dbResult.brandName,
      salt: dbResult.saltComposition ?? "Unknown",
      strength: "N/A",
      form: "Tablet",
      manufacturer: dbResult.manufacturer || "Unknown",
      manufacturerCountry: "India",
      gmpCertified: true,
      price: dbResult.prices[0]?.price ? Number(dbResult.prices[0].price) : 0,
      packSize: 10,
      regulatoryStatus: "approved",
    },
    alternatives: [],
    prices: dbResult.prices.map((p) => ({
      pharmacy: p.pharmacy,
      price: Number(p.price),
      packSize: 10,
      perUnit: Number(p.price) / 10,
      inStock: p.inStock ?? true,
      confidence: "live" as const,
      fetchedAt: new Date().toISOString(),
    })),
    isSubstitutable: true,
  };
}

async function fetchSearchResults(
  query: string
): Promise<{ results: DrugSearchResult[]; jobId?: string }> {
  try {
    const res = await fetch(
      `/api/search?q=${encodeURIComponent(query)}&type=medicine`
    );
    if (!res.ok) {
      throw new Error("API not ready");
    }

    const data: SearchResult = await res.json();

    if (Array.isArray(data.drugs)) {
      return {
        results: data.drugs.map(mapDbToDrugSearchResult),
        jobId: data.jobId,
      };
    }
    return { results: [] };
  } catch (error) {
    console.error(error);
    return { results: [] };
  }
}

/** Process a pending prescription from sessionStorage (homepage handoff). */
async function processPendingPrescription(): Promise<PrescriptionMedicine[]> {
  const raw = sessionStorage.getItem(PENDING_RX_KEY);
  if (!raw) {
    return [];
  }

  try {
    const { image } = JSON.parse(raw) as { image: string; fileName: string };
    sessionStorage.removeItem(PENDING_RX_KEY);

    const res = await fetch("/api/prescription/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image }),
    });

    if (!res.ok) {
      return [];
    }

    const data: { medicines: PrescriptionMedicine[] } = await res.json();
    return data.medicines;
  } catch {
    sessionStorage.removeItem(PENDING_RX_KEY);
    return [];
  }
}

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const isPendingPrescription = searchParams.get("prescription") === "pending";
  const router = useRouter();

  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebounce(query, 300);

  // Sync query with URL params (e.g. when navigating from other pages or using nav search)
  useEffect(() => {
    if (initialQuery !== debouncedQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery, debouncedQuery]);

  const [results, setResults] = useState<DrugSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | undefined>();

  // Prescription state
  const [prescriptionMedicines, setPrescriptionMedicines] = useState<
    PrescriptionMedicine[]
  >([]);
  const [activeChipIndex, setActiveChipIndex] = useState<number | null>(null);
  const [processingPrescription, setProcessingPrescription] = useState(false);
  const pendingProcessed = useRef(false);

  // Handle homepage prescription handoff
  useEffect(() => {
    if (!isPendingPrescription || pendingProcessed.current) {
      return;
    }
    pendingProcessed.current = true;

    setProcessingPrescription(true);
    processPendingPrescription()
      .then((medicines) => {
        if (medicines.length > 0) {
          setPrescriptionMedicines(medicines);
        }
        // Clean up URL param
        router.replace("/search");
      })
      .finally(() => setProcessingPrescription(false));
  }, [isPendingPrescription, router]);

  useEffect(() => {
    if (debouncedQuery) {
      router.replace(`/search?q=${encodeURIComponent(debouncedQuery)}`);
    } else if (!isPendingPrescription) {
      router.replace("/search");
    }
  }, [debouncedQuery, router, isPendingPrescription]);

  const resetResults = useCallback(() => {
    setResults([]);
    setHasSearched(false);
    setActiveJobId(undefined);
  }, []);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      resetResults();
      return;
    }

    setLoading(true);
    setHasSearched(true);
    setActiveJobId(undefined);

    fetchSearchResults(debouncedQuery)
      .then(({ results: medicineResults, jobId }) => {
        setResults(medicineResults);
        if (jobId) {
          setActiveJobId(jobId);
        }
      })
      .finally(() => setLoading(false));
  }, [debouncedQuery, resetResults]);

  const clearSearch = () => {
    setQuery("");
    resetResults();
    router.replace("/search");
  };

  // --- Prescription handlers ---

  const handleMedicinesIdentified = useCallback(
    (medicines: PrescriptionMedicine[]) => {
      setPrescriptionMedicines(medicines);
      setActiveChipIndex(null);
    },
    []
  );

  const handleChipSelect = useCallback(
    (medicine: PrescriptionMedicine, index: number) => {
      setActiveChipIndex(index);
      const searchTerm = medicine.name;
      setQuery(searchTerm);
    },
    []
  );

  const handleChipDismiss = useCallback(
    (index: number) => {
      setPrescriptionMedicines((prev) => prev.filter((_, i) => i !== index));
      if (activeChipIndex === index) {
        setActiveChipIndex(null);
      } else if (activeChipIndex !== null && activeChipIndex > index) {
        setActiveChipIndex(activeChipIndex - 1);
      }
    },
    [activeChipIndex]
  );

  const handleClearAllChips = useCallback(() => {
    setPrescriptionMedicines([]);
    setActiveChipIndex(null);
  }, []);

  const handleJobComplete = useCallback(async () => {
    setActiveJobId(undefined);
    // Re-fetch results to show new data
    if (debouncedQuery) {
      const { results: newResults } = await fetchSearchResults(debouncedQuery);
      setResults(newResults);
    }
  }, [debouncedQuery]);

  const hasPrescriptionMedicines = prescriptionMedicines.length > 0;

  return (
    <div className="relative min-h-screen">
      {/* Page content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-28 pb-16 sm:px-6 md:pt-32 lg:px-8">
        {/* Hero header area */}
        <div className="fade-in slide-in-from-bottom-4 mb-10 animate-in fill-mode-forwards duration-700 ease-out">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="font-title text-4xl text-foreground tracking-tight sm:text-5xl">
              Find your <span className="text-primary italic">medicine</span>
            </h1>
            <p className="mx-auto mt-3 max-w-md text-muted-foreground text-sm sm:text-base">
              Search by brand name or salt composition to discover generic
              alternatives and compare prices.
            </p>
          </div>

          {/* Search input */}
          <div className="fade-in slide-in-from-bottom-2 mx-auto mt-8 max-w-xl animate-in fill-mode-forwards delay-150 duration-700 ease-out">
            <div className="quick-search-container overflow-hidden rounded-2xl border border-border/40 bg-white/70 shadow-lg backdrop-blur-xl transition-all duration-300 focus-within:border-primary/40 focus-within:shadow-primary/5 focus-within:shadow-xl focus-within:ring-[3px] focus-within:ring-primary/10 hover:shadow-xl dark:bg-white/5">
              {/* Top accent */}
              <div className="h-px w-full bg-linear-to-r from-transparent via-primary/20 to-transparent opacity-0 transition-opacity duration-500 focus-within:opacity-100" />

              <InputGroup className="h-14 border-0 bg-transparent shadow-none ring-0 focus-within:ring-0">
                <InputGroupAddon className="pl-5">
                  <SearchIcon
                    className="size-[1.15rem] text-muted-foreground"
                    strokeWidth={2.5}
                  />
                </InputGroupAddon>
                <InputGroupInput
                  autoFocus
                  className="bg-transparent text-[0.95rem] placeholder:text-muted-foreground/50"
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search e.g. Dolo 650, Paracetamol..."
                  value={query}
                />
                {query && (
                  <InputGroupAddon className="pr-4">
                    <button
                      className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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

          {/* Prescription upload zone — hidden once medicines are identified */}
          {!hasPrescriptionMedicines && (
            <div className="mx-auto mt-4 max-w-xl">
              <PrescriptionUpload
                onMedicinesIdentified={handleMedicinesIdentified}
              />
            </div>
          )}

          {/* Pending prescription processing indicator */}
          {processingPrescription && (
            <div className="fade-in mx-auto mt-4 flex max-w-xl animate-in items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/5 fill-mode-forwards px-4 py-3 duration-300">
              <Loader2Icon className="size-4 animate-spin text-primary" />
              <span className="font-medium text-primary text-sm">
                Processing your prescription...
              </span>
            </div>
          )}
        </div>

        {/* Prescription medicine chips — outside hero, same width as results */}
        {hasPrescriptionMedicines && !processingPrescription && (
          <div className="mb-8">
            <PrescriptionChips
              activeIndex={activeChipIndex}
              medicines={prescriptionMedicines}
              onClearAll={handleClearAllChips}
              onDismiss={handleChipDismiss}
              onSelect={handleChipSelect}
            />
          </div>
        )}

        {/* Results area */}
        <div className="space-y-6">
          {activeJobId && (
            <SearchProgressUI
              isActive={!!activeJobId}
              jobId={activeJobId}
              onComplete={handleJobComplete}
              query={debouncedQuery}
            />
          )}

          {loading && <LoadingSkeleton />}

          {/* No results */}
          {!loading && hasSearched && results.length === 0 && !activeJobId && (
            <div className="fade-in animate-in fill-mode-forwards duration-500">
              <Empty className="py-16">
                <EmptyMedia variant="icon">
                  <SearchIcon />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle className="font-heading">
                    No medicines found
                  </EmptyTitle>
                  <EmptyDescription>
                    We couldn&apos;t find any medicines matching &quot;{query}
                    &quot;. Try searching by salt name (e.g. &quot;Paracetamol
                    &quot; instead of a brand name).
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          )}

          {/* Results grid */}
          {!loading && hasSearched && results.length > 0 && (
            <div className="fade-in animate-in fill-mode-forwards duration-500">
              <p className="mb-4 text-muted-foreground/70 text-xs">
                {results.length} {results.length === 1 ? "result" : "results"}{" "}
                for &quot;
                {debouncedQuery}&quot;
              </p>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {results.map((result, i) => (
                  <MedicineCard
                    index={i}
                    key={result.drug.id}
                    result={result}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty state - no search yet */}
          {!(
            loading ||
            hasSearched ||
            hasPrescriptionMedicines ||
            processingPrescription
          ) && (
            <div className="fade-in slide-in-from-bottom-4 animate-in fill-mode-forwards duration-700">
              <div className="mx-auto max-w-md py-20 text-center">
                {/* Decorative pill icon */}
                <div className="relative mx-auto mb-6 flex size-20 items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-linear-to-br from-primary/10 to-accent/10" />
                  <div className="absolute inset-1 rounded-full bg-white/80 backdrop-blur-sm dark:bg-white/5" />
                  <PillIcon
                    className="relative size-8 text-primary/60"
                    strokeWidth={1.5}
                  />
                </div>

                <h3 className="font-title text-foreground text-xl">
                  Start your search
                </h3>
                <p className="mx-auto mt-2 max-w-xs text-muted-foreground text-sm">
                  Enter a medicine name or salt to see details, generic
                  alternatives, and price comparisons.
                </p>

                {/* Popular searches */}
                <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                  <span className="flex items-center gap-1.5 text-muted-foreground/50 text-xs">
                    {/* biome-ignore lint/performance/noImgElement: salty mascot */}
                    <img
                      alt="Salty"
                      className="size-3.5 object-contain opacity-70 grayscale transition-all group-hover:grayscale-0"
                      height={14}
                      src="/salty.png"
                      width={14}
                    />
                    Popular
                  </span>
                  {["Dolo 650", "Pan 40", "Augmentin", "Shelcal"].map(
                    (term) => (
                      <button
                        className="inline-flex items-center rounded-full border border-border/40 bg-white/50 px-3 py-1.5 font-medium text-foreground/70 text-xs shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-primary/30 hover:bg-primary/5 hover:text-foreground hover:shadow-md active:scale-95 dark:bg-white/4"
                        key={term}
                        onClick={() => setQuery(term)}
                        type="button"
                      >
                        {term}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
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
