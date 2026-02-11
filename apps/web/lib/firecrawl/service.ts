import FirecrawlApp from "@mendable/firecrawl-js";
import { db } from "@saltwise/db";
import { drugPrices, drugs, scrapeJobs } from "@saltwise/db/schema";
import { and, eq, ilike, or, sql } from "drizzle-orm";

let _firecrawl: FirecrawlApp | null = null;

function getFirecrawl(): FirecrawlApp {
  if (!_firecrawl) {
    _firecrawl = new FirecrawlApp({
      apiKey: process.env.FIRECRAWL_API_KEY || "",
    });
  }
  return _firecrawl;
}

const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000;
const SCRAPE_COOLDOWN_MS = 60 * 60 * 1000;

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

export async function searchAndScrape(query: string): Promise<SearchResult> {
  console.log(`[search] Starting search for: "${query}"`);

  // ── Step 1: Check DB first (fast, fuzzy via pg_trgm) ──
  const dbResults = await queryDatabase(query);
  const groupedDrugs = groupDbResults(dbResults);
  console.log(`[search] DB returned ${groupedDrugs.length} grouped drugs`);

  // If we have fresh results, return immediately — no external calls
  if (groupedDrugs.length >= 1 && !isAnyStale(groupedDrugs)) {
    console.log("[search] Fresh DB results, returning without external search");
    return { source: "db", drugs: groupedDrugs };
  }

  // ── Step 2: Firecrawl search (background) ──
  let jobId: string | undefined;
  const shouldFetchExternal =
    groupedDrugs.length === 0 || isAnyStale(groupedDrugs);

  if (shouldFetchExternal && !(await hasRecentJob(query))) {
    const job = await createJob(query);
    if (job) {
      jobId = job.id;
      runBackgroundSearch(job.id, query).catch((err) =>
        console.error("[search] Background search failed:", err)
      );
    }
  }

  return {
    source: groupedDrugs.length > 0 ? "db" : "firecrawl",
    drugs: groupedDrugs,
    jobId,
  };
}

export async function runBackgroundSearch(jobId: string, query: string) {
  try {
    await db
      .update(scrapeJobs)
      .set({ status: "processing" })
      .where(eq(scrapeJobs.id, jobId));

    const storedCount = await firecrawlSearch(query);

    console.log(`[backgroundSearch] Stored ${storedCount} results`);

    await db
      .update(scrapeJobs)
      .set({ status: "completed", resultCount: storedCount.toString() })
      .where(eq(scrapeJobs.id, jobId));
  } catch (error) {
    console.error("[backgroundSearch] Job failed:", error);
    await db
      .update(scrapeJobs)
      .set({ status: "failed", error: String(error) })
      .where(eq(scrapeJobs.id, jobId));
  }
}

async function firecrawlSearch(query: string): Promise<number> {
  const queryStr = `${query} medicine price India`;
  console.log(`[firecrawl] Searching: ${queryStr}`);

  const searchResults = await getFirecrawl().search(queryStr, {
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

  const webResults = searchResults.web;

  if (!webResults || webResults.length === 0) {
    console.log("[firecrawl] No results found");
    return 0;
  }

  console.log(`[firecrawl] Found ${webResults.length} results`);

  let count = 0;
  for (const result of webResults) {
    try {
      const doc = result as {
        url?: string;
        json?: unknown;
        metadata?: { sourceURL?: string };
      };
      const url = doc.url ?? doc.metadata?.sourceURL ?? null;
      const data = doc.json as ExtractedMedicine | null;

      if (data?.brand_name && data.price && url) {
        await storeMedicine(data, url);
        count++;
      } else if (url) {
        await extractAndStoreMedicine(url);
        count++;
      }
    } catch (e) {
      console.error("[firecrawl] Failed to process result:", e);
    }
  }

  return count;
}

async function extractAndStoreMedicine(url: string) {
  const scrapeResult = await getFirecrawl().scrape(url, {
    formats: [
      {
        type: "json",
        schema: medicineSchema,
        prompt:
          "Extract medicine details including brand name, salt composition, price (numeric only), and manufacturer.",
      },
    ],
  });

  if (!scrapeResult?.json) {
    return;
  }

  const data = scrapeResult.json as ExtractedMedicine;

  if (!(data.brand_name && data.price)) {
    return;
  }

  await storeMedicine(data, url);
}

function detectPharmacy(url: string): string {
  if (url.includes("1mg")) {
    return "1mg";
  }
  if (url.includes("pharmeasy")) {
    return "PharmEasy";
  }
  if (url.includes("apollo")) {
    return "Apollo";
  }
  if (url.includes("netmeds")) {
    return "Netmeds";
  }
  return "Other";
}

async function storeMedicine(data: ExtractedMedicine, url: string) {
  if (!(data.brand_name && data.price)) {
    return;
  }

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

  const pharmacyName = detectPharmacy(url);

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

async function queryDatabase(query: string): Promise<DbRow[]> {
  return await db
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
        sql`similarity(${drugs.brandName}, ${query}) > 0.3`,
        sql`similarity(${drugs.saltComposition}, ${query}) > 0.3`
      )
    )
    .orderBy(sql`similarity(${drugs.brandName}, ${query}) DESC`)
    .limit(10);
}

function isAnyStale(grouped: GroupedDrug[]): boolean {
  const now = Date.now();
  return grouped.some(
    (d) => now - new Date(d.updatedAt).getTime() > STALE_THRESHOLD_MS
  );
}

async function hasRecentJob(query: string): Promise<boolean> {
  const cutoff = new Date(Date.now() - SCRAPE_COOLDOWN_MS).toISOString();

  const existing = await db
    .select({ id: scrapeJobs.id, status: scrapeJobs.status })
    .from(scrapeJobs)
    .where(
      and(
        ilike(scrapeJobs.query, `%${query}%`),
        or(
          eq(scrapeJobs.status, "pending"),
          eq(scrapeJobs.status, "processing"),
          and(
            eq(scrapeJobs.status, "completed"),
            sql`${scrapeJobs.createdAt} > ${cutoff}`
          )
        )
      )
    )
    .limit(1)
    .then((rows) => rows[0]);

  if (existing) {
    console.log(
      `[search] Skipping external search — recent job exists: ${existing.id} (${existing.status})`
    );
    return true;
  }

  return false;
}

async function createJob(query: string) {
  return await db
    .insert(scrapeJobs)
    .values({ query, status: "pending" })
    .returning({ id: scrapeJobs.id })
    .then((rows) => rows[0]);
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
