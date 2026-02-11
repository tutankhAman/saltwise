import type { Metadata } from "next";
import { Instrument_Sans, Instrument_Serif, Outfit } from "next/font/google";
import { Suspense } from "react";
import { ChatDialog } from "@/components/chat/chat-dialog";
import { ReactQueryProvider } from "@/components/providers/query-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-title",
  display: "swap",
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-heading",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Saltwise",
  description:
    "Reduce your medicine costs by finding safe, lower-cost generic alternatives at the salt level.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${instrumentSerif.variable} ${instrumentSans.variable} ${outfit.variable} font-body antialiased`}
      >
        <ReactQueryProvider>
          <Suspense>
            <SiteHeader />
          </Suspense>
          <main className="min-h-screen">{children}</main>
          <SiteFooter />
          <ChatDialog />
        </ReactQueryProvider>
      </body>
    </html>
  );
}
