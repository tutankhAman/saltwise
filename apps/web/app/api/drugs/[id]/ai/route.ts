import { db } from "@saltwise/db";
import { drugs } from "@saltwise/db/schema";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { generateDrugInsights } from "@/lib/ai/drug-insights";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Get drug details from database
    const [drug] = await db
      .select({
        id: drugs.id,
        brandName: drugs.brandName,
        saltComposition: drugs.saltComposition,
        strength: drugs.strength,
        form: drugs.form,
        manufacturer: drugs.manufacturer,
      })
      .from(drugs)
      .where(eq(drugs.id, id))
      .limit(1);

    if (!drug) {
      return NextResponse.json({ error: "Drug not found" }, { status: 404 });
    }

    // Generate AI insights
    const insights = await generateDrugInsights({
      id: drug.id,
      brandName: drug.brandName,
      saltComposition: drug.saltComposition,
      strength: drug.strength,
      form: drug.form,
      manufacturer: drug.manufacturer,
    });

    return NextResponse.json(insights);
  } catch (error) {
    console.error("AI insights API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
