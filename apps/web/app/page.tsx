import { Button } from "@saltwise/ui/components/button";
import { UploadIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { MeshBackground } from "@/components/mesh-background";
import { QuickSearch } from "@/components/quick-search";

export default function Home() {
  return (
    <div className="flex flex-col">
      <MeshBackground />
      <section className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden px-4 pt-40 pb-24 text-center sm:px-6 md:pt-56 lg:px-8">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="fade-in slide-in-from-left-10 absolute top-[30%] left-[15%] h-16 w-16 animate-in opacity-60 delay-300 duration-1000 sm:h-24 sm:w-24">
            <Image
              alt="Pill Circle"
              className="rotate-12 object-contain"
              fill
              src="/landing-assets/pill-circle.webp"
            />
          </div>

          <div className="fade-in slide-in-from-right-10 absolute right-[15%] bottom-[35%] h-20 w-20 animate-in opacity-40 delay-500 duration-1000 sm:h-28 sm:w-28">
            <Image
              alt="Pill Squircle"
              className="-rotate-12 object-contain"
              fill
              src="/landing-assets/pill-squircle.webp"
            />
          </div>

          <div className="fade-in zoom-in-50 absolute top-[22%] right-[22%] h-14 w-14 animate-in opacity-35 delay-700 duration-1000 sm:h-20 sm:w-20">
            <Image
              alt="Pill Triangle"
              className="rotate-45 object-contain"
              fill
              src="/landing-assets/pill-triangle.webp"
            />
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center overflow-hidden">
          <div className="fade-in zoom-in-50 h-[160px] w-[160px] -translate-y-36 animate-in opacity-100 transition-all duration-1000 ease-out sm:h-[320px] sm:w-[320px] lg:-translate-y-20 dark:opacity-50">
            <Image
              alt="Medicine Bottle"
              className="object-contain"
              fill
              priority
              src="/landing-assets/bottle.webp"
            />
          </div>
        </div>

        <div className="fade-in zoom-in-95 slide-in-from-bottom-4 relative z-10 max-w-4xl animate-in space-y-8 fill-mode-forwards duration-1000 ease-out">
          <h1 className="relative font-medium font-title text-5xl text-foreground tracking-tight sm:text-5xl md:text-[8rem]">
            Lowest prices <br />
            on prescription drugs <br />
            <span className="text-primary italic">Save on every pill.</span>
          </h1>
          <p className="mx-auto max-w-xs text-muted-foreground text-sm sm:text-xl lg:max-w-2xl">
            Find safe, government-approved generic alternatives for your branded
            medicines. Search by name or upload a prescription.
          </p>

          <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-3 pt-2">
            <QuickSearch />
          </div>

          <div className="flex items-center justify-center gap-3 pt-1">
            <span className="text-muted-foreground/50 text-sm">or</span>
            <Link href="/upload">
              <Button
                className="gap-2 rounded-full border-border/40 bg-white/50 backdrop-blur-sm transition-all duration-200 hover:bg-white/70 hover:shadow-md dark:bg-white/5 dark:hover:bg-white/10"
                variant="outline"
              >
                <UploadIcon className="size-3.5" />
                Upload Prescription
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
