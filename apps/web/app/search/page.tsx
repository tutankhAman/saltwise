"use client";

import { Badge } from "@saltwise/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@saltwise/ui/components/card";
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
import { SearchIcon, XIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { MOCK_DRUGS } from "@/lib/mock-data";
import type { Drug, DrugSearchResponse } from "@/lib/types";

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const router = useRouter();

  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebounce(query, 300);
  const [results, setResults] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    // Sync URL with query state
    if (debouncedQuery) {
      router.replace(`/search?q=${encodeURIComponent(debouncedQuery)}`);
    } else {
      router.replace("/search");
    }
  }, [debouncedQuery, router]);

  useEffect(() => {
    async function fetchDrugs() {
      if (!debouncedQuery.trim()) {
        setResults([]);
        setHasSearched(false);
        return;
      }

      setLoading(true);
      setHasSearched(true);

      try {
        // Try real API first
        const res = await fetch(
          `/api/drugs/search?q=${encodeURIComponent(debouncedQuery)}`
        );
        if (res.ok) {
          const data: DrugSearchResponse = await res.json();
          setResults(data.drugs);
        } else {
          throw new Error("API not ready");
        }
      } catch (_error) {
        // Mock data fallback logic
        const lowerQuery = debouncedQuery.toLowerCase();
        // Simulate network delay for realism
        await new Promise((resolve) => setTimeout(resolve, 600));

        const mockResults = MOCK_DRUGS.filter(
          (drug) =>
            drug.brandName.toLowerCase().includes(lowerQuery) ||
            drug.salt.toLowerCase().includes(lowerQuery)
        );
        setResults(mockResults);
      } finally {
        setLoading(false);
      }
    }

    fetchDrugs();
  }, [debouncedQuery]);

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setHasSearched(false);
    router.replace("/search");
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="mb-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <SearchIcon className="size-5" />
          </div>
          <h1 className="font-medium font-title text-3xl">Drug Search</h1>
        </div>
        <p className="text-muted-foreground">
          Search for medicines by brand name or salt composition to find generic
          alternatives.
        </p>

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

      <div className="space-y-4">
        {loading && (
          <div className="space-y-4">
            {["s1", "s2", "s3", "s4"].map((id) => (
              <div
                className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                key={id}
              >
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && hasSearched && results.length === 0 && (
          <Empty className="py-12">
            <EmptyMedia variant="icon">
              <SearchIcon />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No medicines found</EmptyTitle>
              <EmptyDescription>
                We couldn't find any medicines matching "{query}". Try searching
                for a different brand or salt name.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {!loading && hasSearched && results.length > 0 && (
          <div className="grid gap-4">
            {results.map((drug) => (
              <Card
                className="group transition-all hover:border-primary/40 hover:shadow-sm"
                key={drug.id}
                size="sm"
              >
                <CardHeader className="flex flex-col gap-1 pb-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div>
                    <CardTitle className="text-lg text-primary group-hover:underline group-hover:underline-offset-4">
                      {drug.brandName}
                    </CardTitle>
                    <CardDescription className="mt-1 font-medium text-foreground/80">
                      {drug.salt}
                    </CardDescription>
                  </div>
                  <Badge className="w-fit shrink-0" variant="outline">
                    {drug.manufacturer}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Badge className="rounded-md" variant="secondary">
                      {drug.strength}
                    </Badge>
                    <Badge className="rounded-md" variant="secondary">
                      {drug.form}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!(loading || hasSearched) && (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/5 text-primary">
              <SearchIcon className="size-8" />
            </div>
            <h3 className="font-medium text-lg">Start your search</h3>
            <p className="mt-2 text-muted-foreground text-sm">
              Enter a medicine name above to see details and find cheaper
              alternatives.
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
