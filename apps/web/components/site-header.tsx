"use client";

import { Button } from "@saltwise/ui/components/button";
import { Separator } from "@saltwise/ui/components/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@saltwise/ui/components/sheet";
import { HistoryIcon, MenuIcon, SearchIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navLinks = [
  { href: "/search", label: "Search", icon: SearchIcon },
  { href: "/history", label: "History", icon: HistoryIcon },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 right-0 left-0 z-40 flex w-full justify-center">
      {/* Desktop pill nav */}
      <div className="fade-in slide-in-from-top-4 mt-4 hidden w-full max-w-5xl animate-in items-center justify-between rounded-full border border-white/30 bg-white/80 px-3 py-1.5 shadow-lg backdrop-blur-2xl backdrop-saturate-150 duration-700 ease-out md:flex dark:border-white/[0.1] dark:bg-white/[0.05] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.05)] dark:backdrop-saturate-125">
        {/* Logo */}
        <Link
          className="flex items-center gap-2.5 rounded-full py-1.5 pr-4 pl-2.5 transition-colors duration-200 hover:bg-white/50 dark:hover:bg-white/[0.08]"
          href="/"
        >
          <Image
            alt="Saltwise"
            className="size-7"
            height={28}
            src="/logo.png"
            width={28}
          />
          <span className="font-bold font-heading text-base tracking-tight">
            Salt<span className="text-primary">wise</span>
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link href={link.href} key={link.href}>
                <Button
                  className="gap-2 rounded-full"
                  size="sm"
                  variant={isActive ? "secondary" : "ghost"}
                >
                  <link.icon className="size-3.5" data-icon="inline-start" />
                  {link.label}
                </Button>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Mobile header bar */}
      <div className="flex h-14 w-full items-center justify-between bg-background/80 px-4 backdrop-blur-md md:hidden">
        <Link className="flex items-center gap-2.5" href="/">
          <Image
            alt="Saltwise"
            className="size-7"
            height={28}
            src="/logo.png"
            width={28}
          />
          <span className="font-heading text-lg tracking-tight">Saltwise</span>
        </Link>

        <Sheet onOpenChange={setMobileOpen} open={mobileOpen}>
          <SheetTrigger
            render={
              <Button size="icon-sm" variant="ghost">
                <MenuIcon />
                <span className="sr-only">Open menu</span>
              </Button>
            }
          />
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>
                <Link
                  className="flex items-center gap-2.5"
                  href="/"
                  onClick={() => setMobileOpen(false)}
                >
                  <Image
                    alt="Saltwise"
                    className="size-6"
                    height={24}
                    src="/logo.png"
                    width={24}
                  />
                  <span className="font-heading text-base tracking-tight">
                    Saltwise
                  </span>
                </Link>
              </SheetTitle>
            </SheetHeader>
            <Separator />
            <nav className="flex flex-col gap-1 p-4">
              {navLinks.map((link) => {
                const isActive = pathname.startsWith(link.href);
                return (
                  <Link
                    href={link.href}
                    key={link.href}
                    onClick={() => setMobileOpen(false)}
                  >
                    <Button
                      className="w-full justify-start gap-2"
                      size="lg"
                      variant={isActive ? "secondary" : "ghost"}
                    >
                      <link.icon className="size-4" data-icon="inline-start" />
                      {link.label}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
