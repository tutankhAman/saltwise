import FirecrawlApp from "@mendable/firecrawl-js";
import { db } from "@saltwise/db";
import { drugPrices, drugs, scrapeJobs } from "@saltwise/db/schema";
import { and, eq, ilike, or, sql } from "drizzle-orm";

const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY || "",
});

interface DrugPrice {
  pharmacy: string;
  price: string;
  url: string | null;
  inStock: boolean | null;
}

interface GroupedDrug {
  id: string;
  brandName: string;
  saltComposition: string | null;
  manufacturer: string | null;
  updatedAt: Date;
  prices: DrugPrice[];
}

export interface SearchResult {
  source: "db" | "firecrawl";
  drugs: GroupedDrug[];
  jobId?: string;
}

interface DbRow {
  id: string;
  brandName: string;
  saltComposition: string | null;
  strength: string | null;
  manufacturer: string | null;
  price: string | null;
  pharmacy: string | null;
  inStock: boolean | null;
  url: string | null;
  updatedAt: Date;
}

interface ExtractedMedicine {
  brand_name?: string;
  salt_composition?: string;
  manufacturer?: string;
  price?: number;
  pack_size?: string;
  in_stock?: boolean;
}

export async function searchAndScrape(query: string): Promise<SearchResult> {
  console.log(`[searchAndScrape] Starting search for: ${query}`);
  try {
    console.log("[searchAndScrape] Querying DB...");

    // Use trigram similarity (pg_trgm) for fuzzy matching alongside exact ilike
    // This handles typos like "norflux" matching "NORflox"
    const dbResults = await db
      .select({
        id: drugs.id,
        brandName: drugs.brandName,
        saltComposition: drugs.saltComposition,
        strength: drugs.strength,
        manufacturer: drugs.manufacturer,
        price: drugPrices.price,
        pharmacy: drugPrices.pharmacyName,
        inStock: drugPrices.inStock,
        url: drugPrices.url,
        updatedAt: drugs.updatedAt,
      })
      .from(drugs)
      .leftJoin(drugPrices, eq(drugs.id, drugPrices.drugId))
      .where(
        or(
          ilike(drugs.brandName, `%${query}%`),
          ilike(drugs.saltComposition, `%${query}%`),
          // Trigram fuzzy match: catches typos and misspellings
          sql`similarity(${drugs.brandName}, ${query}) > 0.3`,
          sql`similarity(${drugs.saltComposition}, ${query}) > 0.3`
        )
      )
      .orderBy(sql`similarity(${drugs.brandName}, ${query}) DESC`)
      .limit(10);
    console.log(`[searchAndScrape] DB returned ${dbResults.length} rows`);

    const groupedDrugs = groupDbResults(dbResults);

    const isStale = groupedDrugs.some((d) => {
      const lastUpdate = new Date(d.updatedAt).getTime();
      const now = Date.now();
      return now - lastUpdate > 24 * 60 * 60 * 1000;
    });

    const shouldScrape = groupedDrugs.length < 3 || isStale;

    let jobId: string | undefined;

    if (shouldScrape) {
      // Check if there's already a recent pending/processing job for a similar query
      // to avoid duplicate scrapes burning API credits
      const recentJob = await db
        .select({ id: scrapeJobs.id, status: scrapeJobs.status })
        .from(scrapeJobs)
        .where(
          and(
            ilike(scrapeJobs.query, `%${query}%`),
            or(
              eq(scrapeJobs.status, "pending"),
              eq(scrapeJobs.status, "processing")
            )
          )
        )
        .limit(1)
        .then((rows) => rows[0]);

      if (recentJob) {
        // A scrape is already in progress for this query, just return its jobId
        console.log(`[searchAndScrape] Reusing existing job: ${recentJob.id}`);
        jobId = recentJob.id;
      } else {
        const job = await db
          .insert(scrapeJobs)
          .values({
            query,
            status: "pending",
          })
          .returning({ id: scrapeJobs.id })
          .then((rows) => rows[0]);

        if (job) {
          jobId = job.id;
          runBackgroundScrape(job.id, query).catch((err) =>
            console.error("Background scrape failed:", err)
          );
        }
      }
    }

    return {
      source: "db",
      drugs: groupedDrugs,
      jobId,
    };
  } catch (err) {
    console.error("[searchAndScrape] Critical error:", err);
    throw err;
  }
}

const medicineSchema = {
  type: "object" as const,
  properties: {
    brand_name: { type: "string" as const },
    salt_composition: { type: "string" as const },
    manufacturer: { type: "string" as const },
    price: { type: "number" as const },
    pack_size: { type: "string" as const },
    in_stock: { type: "boolean" as const },
  },
  required: ["brand_name", "price"],
};

export async function runBackgroundScrape(jobId: string, query: string) {
  try {
    await db
      .update(scrapeJobs)
      .set({ status: "processing" })
      .where(eq(scrapeJobs.id, jobId));

    const queryStr = `${query} medicine price India`;
    console.log(
      `[runBackgroundScrape] Searching Firecrawl with inline extraction: ${queryStr}`
    );

    // Use search with scrapeOptions to extract structured data in one call
    // This eliminates the slow sequential per-URL scrape loop
    const searchResults = await firecrawl.search(queryStr, {
      limit: 5,
      scrapeOptions: {
        formats: [
          {
            type: "json",
            schema: medicineSchema,
            prompt:
              "Extract medicine details: brand name, salt/generic composition, price (numeric only, in INR), manufacturer, pack size (e.g. 'strip of 15 tablets'), and stock availability.",
          },
        ],
      },
    });

    // v2 SDK returns { web: [...] }
    const webResults = searchResults.web;

    if (!webResults || webResults.length === 0) {
      console.log(`[runBackgroundScrape] No results found for: ${queryStr}`);
      await db
        .update(scrapeJobs)
        .set({ status: "completed", resultCount: "0" })
        .where(eq(scrapeJobs.id, jobId));
      return;
    }

    console.log(
      `[runBackgroundScrape] Found ${webResults.length} results with extracted data`
    );

    let newCount = 0;
    for (const result of webResults) {
      try {
        // With scrapeOptions, results come back as Document with json field
        const doc = result as {
          url?: string;
          json?: unknown;
          metadata?: { sourceURL?: string };
        };
        const url = doc.url ?? doc.metadata?.sourceURL ?? null;
        const data = doc.json as ExtractedMedicine | null;

        if (data?.brand_name && data.price && url) {
          console.log(
            `[runBackgroundScrape] Storing: ${data.brand_name} @ ₹${data.price} from ${url}`
          );
          await storeMedicine(data, url);
          newCount++;
        } else if (url) {
          // Fallback: if search didn't extract data, do a single scrape
          console.log(
            `[runBackgroundScrape] No extracted data, falling back to scrape: ${url}`
          );
          await extractAndStoreMedicine(url);
          newCount++;
        }
      } catch (e) {
        console.error("[runBackgroundScrape] Failed to process result:", e);
      }
    }

    await db
      .update(scrapeJobs)
      .set({ status: "completed", resultCount: newCount.toString() })
      .where(eq(scrapeJobs.id, jobId));
  } catch (error) {
    console.error("Scrape job failed:", error);
    await db
      .update(scrapeJobs)
      .set({ status: "failed", error: String(error) })
      .where(eq(scrapeJobs.id, jobId));
  }
}

async function extractAndStoreMedicine(url: string) {
  // v2 SDK: use `scrape()` (not `scrapeUrl()`)
  // Use JsonFormat for structured extraction
  const scrapeResult = await firecrawl.scrape(url, {
    formats: [
      {
        type: "json",
        schema: medicineSchema,
        prompt:
          "Extract medicine details including brand name, salt composition, price (numeric only), and manufacturer.",
      },
    ],
  });

  // v2 scrape returns Document directly (no .data wrapper)
  if (!scrapeResult?.json) {
    return;
  }

  const data = scrapeResult.json as ExtractedMedicine;

  if (!(data.brand_name && data.price)) {
    console.log("[extractAndStoreMedicine] Missing required fields, skipping");
    return;
  }

  await storeMedicine(data, url);
}

/** Store extracted medicine data into DB (used by both search+extract and fallback scrape) */
async function storeMedicine(data: ExtractedMedicine, url: string) {
  if (!(data.brand_name && data.price)) {
    return;
  }

  // Upsert drug using unique constraint on (brand_name, manufacturer)
  const drug = await db
    .insert(drugs)
    .values({
      brandName: data.brand_name,
      saltComposition: data.salt_composition ?? null,
      manufacturer: data.manufacturer ?? null,
      metadata: data.pack_size ? { pack_size: data.pack_size } : null,
    })
    .onConflictDoUpdate({
      target: [drugs.brandName, drugs.manufacturer],
      set: {
        saltComposition: data.salt_composition ?? undefined,
        updatedAt: new Date(),
      },
    })
    .returning({ id: drugs.id })
    .then((rows) => rows[0]);

  if (!drug) {
    return;
  }

  let pharmacyName = "Other";
  if (url.includes("1mg")) {
    pharmacyName = "1mg";
  } else if (url.includes("pharmeasy")) {
    pharmacyName = "PharmEasy";
  } else if (url.includes("apollo")) {
    pharmacyName = "Apollo";
  }

  // Upsert price using unique constraint on (drug_id, pharmacy_name)
  await db
    .insert(drugPrices)
    .values({
      drugId: drug.id,
      pharmacyName,
      price: data.price.toString(),
      url,
      inStock: data.in_stock ?? true,
      lastScrapedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [drugPrices.drugId, drugPrices.pharmacyName],
      set: {
        price: data.price.toString(),
        url,
        inStock: data.in_stock ?? true,
        lastScrapedAt: new Date(),
      },
    });
}

function groupDbResults(rows: DbRow[]): GroupedDrug[] {
  const map = new Map<string, GroupedDrug>();
  for (const row of rows) {
    if (!map.has(row.id)) {
      map.set(row.id, {
        id: row.id,
        brandName: row.brandName,
        saltComposition: row.saltComposition,
        manufacturer: row.manufacturer,
        updatedAt: row.updatedAt,
        prices: [],
      });
    }
    if (row.price && row.pharmacy) {
      const drug = map.get(row.id);
      drug?.prices.push({
        pharmacy: row.pharmacy,
        price: row.price,
        url: row.url,
        inStock: row.inStock,
      });
    }
  }
  return Array.from(map.values());
}
