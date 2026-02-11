import { db } from "@saltwise/db";
import { scrapeJobs } from "@saltwise/db/schema";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const job = await db
      .select()
      .from(scrapeJobs)
      .where(eq(scrapeJobs.id, id))
      .limit(1)
      .then((rows) => rows[0]);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Calculate pharmacies scraped based on status
    let pharmaciesScraped = 0;
    if (job.status === "completed") {
      pharmaciesScraped = 4;
    } else if (job.status === "processing") {
      pharmaciesScraped = 2;
    }

    return NextResponse.json({
      status: job.status,
      resultCount: job.resultCount ? Number.parseInt(job.resultCount, 10) : 0,
      error: job.error,
      // Mock additional data for UI
      currentStep: job.status === "processing" ? "scrape" : undefined,
      pharmaciesScraped,
      totalPharmacies: 5,
    });
  } catch (error) {
    console.error("Error fetching job status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
