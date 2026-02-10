"use client";

import { Kbd } from "@saltwise/ui/components/kbd";
import {
  ArrowRightIcon,
  PillIcon,
  SearchIcon,
  SparklesIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { MOCK_DRUGS } from "@/lib/mock-data";
import { SaltyChat } from "./salty-chat";

const PLACEHOLDER_MEDICINES = [
  "Dolo 650",
  "Crocin Advance",
  "Augmentin 625",
  "Pan 40",
  "Thyronorm 100mcg",
  "Shelcal 500",
];

const POPULAR_SEARCHES = [
  { label: "Dolo 650", salt: "Paracetamol" },
  { label: "Pan 40", salt: "Pantoprazole" },
  { label: "Augmentin", salt: "Amoxycillin" },
  { label: "Thyronorm", salt: "Thyroxine" },
  { label: "Shelcal", salt: "Calcium + D3" },
];

export function QuickSearch() {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [placeholderText, setPlaceholderText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [mode, setMode] = useState<"search" | "salty">("search");
  const [saltyInitialMessage, setSaltyInitialMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Animated placeholder typing effect
  useEffect(() => {
    if (query.length > 0 || mode === "salty") {
      return;
    }

    const targetText = PLACEHOLDER_MEDICINES[placeholderIndex];
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
          setPlaceholderIndex(
            (prev) => (prev + 1) % PLACEHOLDER_MEDICINES.length
          );
          setIsTyping(true);
        }
      };
      deleteChar();
    }

    return () => clearTimeout(timeout);
  }, [placeholderIndex, isTyping, query.length, mode]);

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

  const filteredSuggestions =
    mode === "search" && !isSaltyQuery && query.length >= 2
      ? MOCK_DRUGS.filter(
          (drug) =>
            drug.brandName.toLowerCase().includes(query.toLowerCase()) ||
            drug.salt.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5)
      : [];

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
    if (mode === "salty") {
      return;
    }

    // Detect @salty query — switch to chat mode with the message
    if (isSaltyQuery) {
      const message = query.slice(1).trim();
      if (message) {
        setSaltyInitialMessage(message);
        setMode("salty");
        setQuery("");
        setIsFocused(true);
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

  const exitSaltyMode = useCallback(() => {
    setMode("search");
    setQuery("");
    setSaltyInitialMessage("");
    setSelectedIndex(-1);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

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
              {mode === "salty" || isSaltyQuery ? (
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

            {/* Input — shown in search mode */}
            {mode === "search" && (
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
            )}

            {/* Salty mode label — replaces input when in salty mode */}
            {mode === "salty" && (
              <div className="min-w-0 flex-1">
                <span className="text-[0.95rem] text-primary/80">
                  Chatting with Salty
                </span>
              </div>
            )}

            {/* Kbd shortcut hint — search mode only */}
            {mode === "search" && (
              <div
                className={`hidden shrink-0 items-center gap-1 transition-opacity duration-200 sm:flex ${isFocused ? "opacity-0" : "opacity-100"}`}
              >
                <Kbd className="border border-border/60 bg-muted/60 px-1.5 font-body text-[0.6rem] text-muted-foreground">
                  ⌘K
                </Kbd>
              </div>
            )}

            {/* Submit arrow — search mode */}
            {mode === "search" && (
              <button
                aria-label="Search"
                className={`absolute top-1.5 right-1.5 bottom-1.5 z-10 flex aspect-square items-center justify-center rounded-full shadow-sm transition-colors ${
                  query.length > 0
                    ? "bg-primary text-primary-foreground hover:bg-primary/80"
                    : "bg-muted text-muted-background/50 hover:bg-primary/40"
                }`}
                type="submit"
              >
                <ArrowRightIcon className="size-5" strokeWidth={2.5} />
              </button>
            )}

            {/* Close button — salty mode */}
            {mode === "salty" && (
              <button
                aria-label="Back to search"
                className="absolute top-1.5 right-1.5 bottom-1.5 z-10 flex aspect-square items-center justify-center rounded-full bg-muted text-muted-foreground shadow-sm transition-colors hover:bg-muted/80"
                onClick={exitSaltyMode}
                type="button"
              >
                <SearchIcon className="size-4" strokeWidth={2.5} />
              </button>
            )}
          </div>

          {/* Inline Suggestions Dropdown — search mode only */}
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

          {/* Salty Chat — shown in salty mode */}
          {mode === "salty" && (
            <div className="border-border/30 border-t">
              <SaltyChat
                initialMessage={saltyInitialMessage}
                onClose={exitSaltyMode}
              />
            </div>
          )}
        </div>
      </form>

      {/* Popular Searches - Quick-Pick Pills — only in search mode */}
      {mode === "search" && (
        <div
          className={`mt-4 flex flex-wrap items-center justify-center gap-2 transition-all duration-500 ${isFocused && filteredSuggestions.length > 0 ? "translate-y-1 opacity-0" : "translate-y-0 opacity-100"}
          `}
        >
          <span className="flex items-center gap-1.5 text-muted-foreground/60 text-xs">
            <SparklesIcon className="size-3" />
            Popular
          </span>
          {POPULAR_SEARCHES.map((item) => (
            <button
              className={
                "group/pill inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-white/50 px-3 py-1 font-medium text-foreground/70 text-xs shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-primary/30 hover:bg-primary/5 hover:text-foreground hover:shadow-md active:scale-95 dark:bg-white/5"
              }
              key={item.label}
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
      )}
    </div>
  );
}
