"use server";

import { db } from "@saltwise/db";
import { drugs, searchHistory } from "@saltwise/db/schema";
import { desc, ilike, inArray, or, sql } from "drizzle-orm";

export async function getPopularMedicines() {
  try {
    // innovative approach: use search history to find popular drugs
    const popularDrugs = await db
      .select({
        drugId: searchHistory.resultDrugId,
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(searchHistory)
      .where(sql`${searchHistory.resultDrugId} IS NOT NULL`)
      .groupBy(searchHistory.resultDrugId)
      .orderBy(desc(sql`count(*)`))
      .limit(5);

    if (popularDrugs.length > 0) {
      const drugIds = popularDrugs
        .map((d) => d.drugId)
        .filter(Boolean) as string[];

      if (drugIds.length > 0) {
        const results = await db
          .select({
            id: drugs.id,
            brandName: drugs.brandName,
            saltComposition: drugs.saltComposition,
          })
          .from(drugs)
          .where(inArray(drugs.id, drugIds));

        // Map back to maintain order if possible, or just return results
        return results.map((d) => ({
          label: d.brandName,
          salt: d.saltComposition ?? "Unknown",
          id: d.id,
        }));
      }
    }

    // Fallback if no history: fetch random drugs
    const randomDrugs = await db
      .select({
        id: drugs.id,
        brandName: drugs.brandName,
        saltComposition: drugs.saltComposition,
      })
      .from(drugs)
      .limit(5);

    return randomDrugs.map((d) => ({
      label: d.brandName,
      salt: d.saltComposition ?? "Unknown",
      id: d.id,
    }));
  } catch (error) {
    console.error("Error fetching popular medicines:", error);
    return [];
  }
}

export async function searchMedicines(query: string) {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    const results = await db
      .select({
        id: drugs.id,
        brandName: drugs.brandName,
        saltComposition: drugs.saltComposition,
        form: drugs.form,
        manufacturer: drugs.manufacturer,
      })
      .from(drugs)
      .where(
        or(
          ilike(drugs.brandName, `%${query}%`),
          ilike(drugs.saltComposition, `%${query}%`)
        )
      )
      .limit(5);

    return results.map((d) => ({
      id: d.id,
      brandName: d.brandName,
      salt: d.saltComposition ?? "Unknown",
      form: d.form ?? "Tablet",
      manufacturer: d.manufacturer ?? "Unknown",
    }));
  } catch (error) {
    console.error("Error searching medicines:", error);
    return [];
  }
}
