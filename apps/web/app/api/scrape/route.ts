import { type NextRequest, NextResponse } from "next/server";
import { runBackgroundSearch } from "@/lib/firecrawl/service";

export async function POST(req: NextRequest) {
  try {
    const { jobId, query } = await req.json();

    if (!(jobId && query)) {
      return NextResponse.json(
        { error: "Missing jobId or query" },
        { status: 400 }
      );
    }

    await runBackgroundSearch(jobId, query);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Scrape API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
