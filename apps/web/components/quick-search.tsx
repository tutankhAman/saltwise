"use client";

import { Kbd } from "@saltwise/ui/components/kbd";
import { useQuery } from "@tanstack/react-query";
import { PillIcon, SearchIcon, SparklesIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { getPopularMedicines, searchMedicines } from "@/app/actions";
import { useChatStore } from "@/hooks/use-chat-store";
import { useDebounce } from "@/hooks/use-debounce";
import { RecentChats } from "./recent-chats";

export function QuickSearch() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [isFocused, setIsFocused] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [placeholderText, setPlaceholderText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<
    { id: string; brandName: string; salt: string; form: string }[]
  >([]);
  const [placeholders, setPlaceholders] = useState<string[]>([
    "Dolo 650",
    "Crocin Advance",
  ]);

  const { data: popularSearches = [] } = useQuery({
    queryKey: ["popular-medicines"],
    queryFn: () => getPopularMedicines(),
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { startNewChat } = useChatStore();

  useEffect(() => {
    if (popularSearches.length > 0) {
      setPlaceholders(popularSearches.map((p) => p.label));
    }
  }, [popularSearches]);

  useEffect(() => {
    async function fetchSuggestions() {
      if (debouncedQuery.length >= 2 && !debouncedQuery.startsWith("@")) {
        const results = await searchMedicines(debouncedQuery);
        setSuggestions(results);
      } else {
        setSuggestions([]);
      }
    }
    fetchSuggestions();
  }, [debouncedQuery]);

  // Animated placeholder typing effect
  useEffect(() => {
    if (query.length > 0) {
      return;
    }

    const targetText = placeholders[placeholderIndex];
    if (!targetText) {
      return;
    }
    let charIndex = 0;
    let timeout: ReturnType<typeof setTimeout>;

    if (isTyping) {
      const typeChar = () => {
        if (charIndex <= targetText.length) {
          setPlaceholderText(targetText.slice(0, charIndex));
          charIndex++;
          timeout = setTimeout(typeChar, 60 + Math.random() * 40);
        } else {
          timeout = setTimeout(() => setIsTyping(false), 2000);
        }
      };
      typeChar();
    } else {
      charIndex = targetText.length;
      const deleteChar = () => {
        if (charIndex >= 0) {
          setPlaceholderText(targetText.slice(0, charIndex));
          charIndex--;
          timeout = setTimeout(deleteChar, 30);
        } else {
          setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
          setIsTyping(true);
        }
      };
      deleteChar();
    }

    return () => clearTimeout(timeout);
  }, [placeholderIndex, isTyping, query.length, placeholders]);

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isSaltyQuery = query.startsWith("@");

  const filteredSuggestions = suggestions;

  const showSuggestions = isFocused && filteredSuggestions.length > 0;

  const navigateToSearch = useCallback(
    (searchQuery: string) => {
      if (searchQuery.trim()) {
        router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      }
    },
    [router]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Detect @salty query — open global chat
    if (isSaltyQuery) {
      const message = query.slice(1).trim();
      if (message) {
        startNewChat(message);
        setQuery("");
        setIsFocused(false);
        inputRef.current?.blur();
      }
      return;
    }

    if (selectedIndex >= 0 && filteredSuggestions[selectedIndex]) {
      navigateToSearch(filteredSuggestions[selectedIndex].brandName);
    } else {
      navigateToSearch(query);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedIndex(-1);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) {
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredSuggestions.length - 1
      );
    } else if (e.key === "Escape") {
      setIsFocused(false);
      setSelectedIndex(-1);
    }
  };

  return (
    <div className="w-full max-w-xl" ref={containerRef}>
      {/* Search Container */}
      <form onSubmit={handleSubmit}>
        <div
          className={`quick-search-container group relative overflow-hidden rounded-[1.8rem] border bg-white/70 shadow-lg backdrop-blur-xl transition-all duration-500 ease-out dark:bg-white/5 ${
            isFocused
              ? "border-primary/40 shadow-primary/8 shadow-xl ring-[3px] ring-primary/10"
              : "border-border/50 hover:border-primary/25 hover:shadow-xl"
          }
          `}
        >
          {/* Animated gradient border accent on focus */}
          <div
            className={`pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-transparent via-primary to-transparent transition-opacity duration-500 ${isFocused ? "opacity-100" : "opacity-0"}
            `}
          />

          <div className="relative flex items-center gap-2 py-3.5 pr-14 pl-5">
            {/* Search / Salty Icon */}
            <div
              className={`shrink-0 transition-all duration-300 ${isFocused ? "scale-110 text-primary" : "text-muted-foreground"}
              `}
            >
              {isSaltyQuery ? (
                // biome-ignore lint/performance/noImgElement: salty mascot
                // biome-ignore lint/correctness/useImageSize: skip
                <img
                  alt="Salty"
                  className="size-6 object-contain"
                  src="/salty.png"
                />
              ) : (
                <SearchIcon className="size-[1.15rem]" strokeWidth={2.5} />
              )}
            </div>

            {/* Input */}
            <div className="relative min-w-0 flex-1">
              <input
                aria-label="Search for medicines or type @ to chat with Salty"
                className="w-full bg-transparent text-[0.95rem] text-foreground outline-none placeholder:text-transparent"
                onChange={handleInputChange}
                onFocus={() => setIsFocused(true)}
                onKeyDown={handleInputKeyDown}
                placeholder={
                  isSaltyQuery
                    ? "Ask Salty anything..."
                    : "Search for a medicine..."
                }
                ref={inputRef}
                type="text"
                value={query}
              />
              {/* Custom animated placeholder */}
              {query.length === 0 && (
                <div className="pointer-events-none absolute inset-0 flex items-center">
                  <span className="text-[0.95rem] text-muted-foreground/70">
                    Search for{" "}
                    <span className="text-muted-foreground">
                      {placeholderText}
                    </span>
                    <span
                      className={`ml-px inline-block h-[1.1em] w-0.5 translate-y-px rounded-full bg-primary/60 ${isFocused ? "animate-pulse" : "animate-pulse"}
                      `}
                    />
                  </span>
                </div>
              )}
            </div>

            {/* Kbd shortcut hint */}
            <div
              className={`hidden shrink-0 items-center gap-1 transition-opacity duration-200 sm:flex ${isFocused ? "opacity-0" : "opacity-100"}`}
            >
              <Kbd className="border border-border/60 bg-muted/60 px-1.5 font-body text-[0.6rem] text-muted-foreground">
                ⌘K
              </Kbd>
            </div>

            {/* Submit arrow */}
            <button
              aria-label="Search"
              className={`absolute top-1.5 right-1.5 bottom-1.5 z-10 flex aspect-square items-center justify-center rounded-full transition-all duration-300 ${
                query.length > 0
                  ? "opacity-100 hover:scale-105"
                  : "opacity-60 grayscale hover:opacity-100 hover:grayscale-0"
              }`}
              type="submit"
            >
              {/* biome-ignore lint/performance/noImgElement: static asset */}
              {/** biome-ignore lint/correctness/useImageSize: skip */}
              <img
                alt="Search"
                className="size-12 object-contain"
                src="/landing-assets/pill-triangle.webp"
              />
            </button>
          </div>

          {/* Inline Suggestions Dropdown */}
          {showSuggestions && (
            <div className="border-border/30 border-t">
              <div className="px-3 py-2">
                <span className="px-2 font-heading text-[0.65rem] text-muted-foreground/60 uppercase tracking-wider">
                  Suggestions
                </span>
              </div>
              <div className="px-2 pb-2" role="listbox">
                {filteredSuggestions.map((drug, index) => (
                  <div key={drug.id}>
                    <button
                      aria-selected={selectedIndex === index}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-150 ${
                        selectedIndex === index
                          ? "bg-primary/8 text-foreground"
                          : "text-foreground/80 hover:bg-muted/60"
                      }
                      `}
                      onClick={() => navigateToSearch(drug.brandName)}
                      role="option"
                      type="button"
                    >
                      <PillIcon
                        className={`size-3.5 shrink-0 ${selectedIndex === index ? "text-primary" : "text-muted-foreground/50"}
                        `}
                      />
                      <div className="min-w-0 flex-1">
                        <span className="font-medium text-sm">
                          {drug.brandName}
                        </span>
                        <span className="ml-2 text-muted-foreground text-xs">
                          {drug.salt}
                        </span>
                      </div>
                      <span className="shrink-0 rounded-md bg-muted/60 px-1.5 py-0.5 text-[0.6rem] text-muted-foreground">
                        {drug.form}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </form>

      {/* Popular Searches - Quick-Pick Pills */}
      <div
        className={`mt-4 flex flex-col items-center gap-4 transition-all duration-500 ${
          isFocused && filteredSuggestions.length > 0
            ? "translate-y-1 opacity-0"
            : "translate-y-0 opacity-100"
        }`}
      >
        <RecentChats />

        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="flex items-center gap-1.5 text-muted-foreground/60 text-xs">
            <SparklesIcon className="size-3" />
            Popular
          </span>
          {popularSearches.map((item) => (
            <button
              className={
                "group/pill inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-white/50 px-3 py-1 font-medium text-foreground/70 text-xs shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-primary/30 hover:bg-primary/5 hover:text-foreground hover:shadow-md active:scale-95 dark:bg-white/5"
              }
              key={item.id}
              onClick={() => navigateToSearch(item.label)}
              type="button"
            >
              <span>{item.label}</span>
              <span className="text-[0.6rem] text-muted-foreground/50 transition-colors group-hover/pill:text-primary/60">
                {item.salt}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
