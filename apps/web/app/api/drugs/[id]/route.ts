import { db } from "@saltwise/db";
import { drugPrices, drugs } from "@saltwise/db/schema";
import { and, eq, ilike, ne } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

interface DrugMetadata {
  pack_size?: string;
  drug_class?: string;
  safety_info?: string;
}

const PACK_SIZE_REGEX = /(\d+)/;
const STRENGTH_REGEX = /(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|iu))/i;
const SALT_CLEAN_PARENS = /\(.*?\)/g;
const SALT_CLEAN_DOSAGE = /\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|iu)/gi;
const SALT_CLEAN_SEPARATORS = /[/,]/g;
const SALT_CLEAN_WHITESPACE = /\s+/g;

function parsePackSize(raw?: string): number {
  if (!raw) {
    return 10;
  }
  const match = raw.match(PACK_SIZE_REGEX);
  return match ? Number(match[1]) : 10;
}

function parseStrength(saltComposition: string | null): string {
  if (!saltComposition) {
    return "N/A";
  }
  const match = saltComposition.match(STRENGTH_REGEX);
  const captured = match?.[1];
  return captured ? captured.replace(SALT_CLEAN_WHITESPACE, "") : "N/A";
}

function extractBaseSalt(saltComposition: string | null): string | null {
  if (!saltComposition) {
    return null;
  }
  const cleaned = saltComposition
    .replace(SALT_CLEAN_PARENS, "")
    .replace(SALT_CLEAN_DOSAGE, "")
    .replace(SALT_CLEAN_SEPARATORS, " ")
    .replace(SALT_CLEAN_WHITESPACE, " ")
    .trim();
  const firstWord = cleaned.split(" ").at(0);
  return firstWord ?? null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const [drug] = await db
      .select()
      .from(drugs)
      .where(eq(drugs.id, id))
      .limit(1);

    if (!drug) {
      return NextResponse.json({ error: "Drug not found" }, { status: 404 });
    }

    // Get prices for this drug
    const prices = await db
      .select()
      .from(drugPrices)
      .where(eq(drugPrices.drugId, id));

    const metadata = (drug.metadata ?? {}) as DrugMetadata;
    const packSize = parsePackSize(metadata.pack_size);
    const strength = drug.strength || parseStrength(drug.saltComposition);

    // Find alternative drugs with the same salt
    const baseSalt = extractBaseSalt(drug.saltComposition);
    const alternativeDrugs: Array<{
      drug: typeof drug;
      prices: (typeof prices)[number][];
    }> = [];

    if (baseSalt) {
      const altDrugs = await db
        .select()
        .from(drugs)
        .where(
          and(ne(drugs.id, id), ilike(drugs.saltComposition, `%${baseSalt}%`))
        )
        .limit(10);

      // Fetch prices for all alternatives in one query batch
      for (const altDrug of altDrugs) {
        const altPrices = await db
          .select()
          .from(drugPrices)
          .where(eq(drugPrices.drugId, altDrug.id));

        alternativeDrugs.push({ drug: altDrug, prices: altPrices });
      }
    }

    // Build the primary drug price (lowest available)
    const mainPrice =
      prices.length > 0 ? Math.min(...prices.map((p) => Number(p.price))) : 0;

    const mainPerUnit = packSize > 0 ? mainPrice / packSize : 0;

    // Build alternatives response
    const alternativesResponse = alternativeDrugs
      .filter((alt) => alt.prices.length > 0)
      .map((alt) => {
        const altMeta = (alt.drug.metadata ?? {}) as DrugMetadata;
        const altPackSize = parsePackSize(altMeta.pack_size);
        const altStrength =
          alt.drug.strength || parseStrength(alt.drug.saltComposition);
        const lowestPrice = Math.min(...alt.prices.map((p) => Number(p.price)));
        const altPerUnit = altPackSize > 0 ? lowestPrice / altPackSize : 0;
        const savings = mainPrice - lowestPrice;
        const savingsPercent = mainPrice > 0 ? (savings / mainPrice) * 100 : 0;

        return {
          drug: {
            id: alt.drug.id,
            brandName: alt.drug.brandName,
            salt: alt.drug.saltComposition ?? "Unknown",
            strength: altStrength,
            form: alt.drug.form || "Tablet",
            manufacturer: alt.drug.manufacturer || "Unknown",
            manufacturerCountry: "India",
            gmpCertified: true,
            price: lowestPrice,
            packSize: altPackSize,
            regulatoryStatus: "approved" as const,
          },
          pricePerUnit: altPerUnit,
          totalPrice: lowestPrice,
          savings: Math.max(savings, 0),
          savingsPercent: Math.max(savingsPercent, 0),
          safetyTier: "exact_generic" as const,
          shoppingOptions: alt.prices.map((p) => ({
            pharmacy: p.pharmacyName as
              | "1mg"
              | "PharmEasy"
              | "Apollo"
              | "Netmeds",
            price: Number(p.price),
            url: p.url || "#",
            inStock: p.inStock ?? true,
          })),
        };
      })
      .sort((a, b) => a.pricePerUnit - b.pricePerUnit);

    const result = {
      drug: {
        id: drug.id,
        brandName: drug.brandName,
        salt: drug.saltComposition ?? "Unknown",
        strength,
        form: drug.form || "Tablet",
        manufacturer: drug.manufacturer || "Unknown",
        manufacturerCountry: "India",
        gmpCertified: true,
        price: mainPrice,
        pricePerUnit: mainPerUnit,
        packSize,
        drugClass: metadata.drug_class,
        regulatoryStatus: "approved",
      },
      alternatives: alternativesResponse,
      prices: prices.map((p) => ({
        pharmacy: p.pharmacyName,
        price: Number(p.price),
        packSize,
        perUnit: packSize > 0 ? Number(p.price) / packSize : Number(p.price),
        inStock: p.inStock ?? true,
        confidence: "live",
        fetchedAt: p.lastScrapedAt?.toISOString() || new Date().toISOString(),
      })),
      isSubstitutable: true,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Get Drug API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
