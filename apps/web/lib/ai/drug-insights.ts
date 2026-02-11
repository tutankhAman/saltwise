import { db } from "@saltwise/db";
import { drugAiCache } from "@saltwise/db/schema";
import { aiLogger } from "@saltwise/logger";
import { and, eq, gt } from "drizzle-orm";
import type { DrugInteraction, SafetyInfo } from "@/lib/types";
import { getGroqClient, INSIGHTS_MODEL } from "./groq";

export interface DrugInsights {
  safetyInfo?: SafetyInfo;
  interactions?: DrugInteraction[];
  aiExplanation?: string;
}

export interface DrugInput {
  id: string;
  brandName: string;
  saltComposition: string | null;
  strength: string | null;
  form: string | null;
  manufacturer: string | null;
}

const CACHE_TTL_DAYS = 7;
const CACHE_TTL_MS = CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;

/**
 * Check if we have fresh cached insights for a drug
 */
async function getCachedInsights(
  drugId: string
): Promise<Partial<DrugInsights>> {
  const now = new Date();

  const cached = await db
    .select()
    .from(drugAiCache)
    .where(and(eq(drugAiCache.drugId, drugId), gt(drugAiCache.expiresAt, now)))
    .limit(3); // Get all three cache types

  const insights: Partial<DrugInsights> = {};

  for (const entry of cached) {
    switch (entry.cacheType) {
      case "safety_info":
        insights.safetyInfo = entry.content as SafetyInfo;
        break;
      case "interactions":
        insights.interactions = entry.content as DrugInteraction[];
        break;
      case "ai_explanation":
        insights.aiExplanation = (
          entry.content as { explanation: string }
        ).explanation;
        break;
      default:
        aiLogger.warn({ cacheType: entry.cacheType }, "Unknown cache type");
        break;
    }
  }

  return insights;
}

/**
 * Store insights in cache
 */
async function cacheInsights(
  drugId: string,
  drugInput: DrugInput,
  insights: DrugInsights
): Promise<void> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CACHE_TTL_MS);

  const entries: Array<{
    drugId: string;
    cacheType: "safety_info" | "interactions" | "ai_explanation";
    content: SafetyInfo | DrugInteraction[] | { explanation: string };
    model: string;
    saltComposition: string;
    expiresAt: Date;
  }> = [];

  if (insights.safetyInfo) {
    entries.push({
      drugId,
      cacheType: "safety_info",
      content: insights.safetyInfo,
      model: INSIGHTS_MODEL,
      saltComposition: drugInput.saltComposition || "",
      expiresAt,
    });
  }

  if (insights.interactions) {
    entries.push({
      drugId,
      cacheType: "interactions",
      content: insights.interactions,
      model: INSIGHTS_MODEL,
      saltComposition: drugInput.saltComposition || "",
      expiresAt,
    });
  }

  if (insights.aiExplanation) {
    entries.push({
      drugId,
      cacheType: "ai_explanation",
      content: { explanation: insights.aiExplanation },
      model: INSIGHTS_MODEL,
      saltComposition: drugInput.saltComposition || "",
      expiresAt,
    });
  }

  if (entries.length > 0) {
    // Insert each entry individually to handle conflicts properly
    for (const entry of entries) {
      await db
        .insert(drugAiCache)
        .values(entry)
        .onConflictDoUpdate({
          target: [drugAiCache.drugId, drugAiCache.cacheType],
          set: {
            content: entry.content,
            expiresAt: entry.expiresAt,
          },
        });
    }
  }
}

/**
 * Generate safety information for a drug using LLM
 */
async function generateSafetyInfo(drugInput: DrugInput): Promise<SafetyInfo> {
  const prompt = `Generate comprehensive safety information for this medicine based on standard pharmaceutical knowledge and Indian drug regulations.

Medicine Details:
- Brand Name: ${drugInput.brandName}
- Active Ingredient (Salt): ${drugInput.saltComposition || "Unknown"}
- Strength: ${drugInput.strength || "N/A"}
- Form: ${drugInput.form || "Tablet"}
- Manufacturer: ${drugInput.manufacturer || "Unknown"}

Return a JSON object with the following structure:
- sideEffects: array of common side effects as strings
- dosageInfo: string describing recommended dosage
- maxDailyDose: string with maximum daily dosage
- pregnancyCategory: one of "A", "B", "C", "D", "X"
- lactationWarning: optional string about breastfeeding safety
- pediatricWarning: optional string about pediatric use
- geriatricWarning: optional string about geriatric use

Focus on evidence-based information from standard pharmacological references. Use conservative, evidence-based safety information.`;

  const response = await getGroqClient().chat.completions.create({
    model: INSIGHTS_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are a pharmaceutical safety expert. Generate structured safety information for medicines based on established pharmacological knowledge. Return only valid JSON.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: {
      type: "json_object",
    },
    temperature: 0.3,
    max_tokens: 1000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from LLM for safety info");
  }

  try {
    return JSON.parse(content) as SafetyInfo;
  } catch (error) {
    aiLogger.error({ err: error, content }, "Failed to parse safety info JSON");
    throw new Error("Invalid JSON response for safety info");
  }
}

/**
 * Generate drug interactions for a medicine using LLM
 */
async function generateInteractions(
  drugInput: DrugInput
): Promise<DrugInteraction[]> {
  const prompt = `Generate clinically significant drug interactions for this medicine. Focus on common, well-documented interactions that are relevant in Indian clinical practice.

Medicine Details:
- Brand Name: ${drugInput.brandName}
- Active Ingredient (Salt): ${drugInput.saltComposition || "Unknown"}
- Strength: ${drugInput.strength || "N/A"}
- Form: ${drugInput.form || "Tablet"}

Return a JSON array of objects with this structure:
- drugId: placeholder string (will be ignored)
- drugName: name of the interacting drug
- severity: one of "mild", "moderate", "severe", "contraindicated"
- description: brief explanation of the interaction

Include only clinically significant interactions. Prioritize interactions with:
1. Common cardiovascular drugs
2. Antibiotics
3. Antidiabetic drugs
4. NSAIDs
5. Anticoagulants
6. Other commonly prescribed medicines

Limit to 5-8 most important interactions.`;

  const response = await getGroqClient().chat.completions.create({
    model: INSIGHTS_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are a clinical pharmacology expert. Generate structured drug interaction data based on established pharmacokinetic and pharmacodynamic interactions. Return only valid JSON.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: {
      type: "json_object",
    },
    temperature: 0.3,
    max_tokens: 1500,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from LLM for interactions");
  }

  try {
    const parsed = JSON.parse(content);
    const interactionsArray = parsed.interactions || parsed;
    const interactions = interactionsArray as Omit<DrugInteraction, "drugId">[];
    // Add placeholder IDs
    return interactions.map((interaction, index) => ({
      ...interaction,
      drugId: `ai-interaction-${index}`,
    }));
  } catch (error) {
    aiLogger.error(
      { err: error, content },
      "Failed to parse interactions JSON"
    );
    throw new Error("Invalid JSON response for interactions");
  }
}

/**
 * Generate AI explanation for why generics are cheaper
 */
async function generateAiExplanation(drugInput: DrugInput): Promise<string> {
  const prompt = `Explain why generic versions of this medicine are typically cheaper than the branded version, in a way that's educational and helpful for Indian patients.

Medicine Details:
- Brand Name: ${drugInput.brandName}
- Active Ingredient (Salt): ${drugInput.saltComposition || "Unknown"}
- Manufacturer: ${drugInput.manufacturer || "Unknown"}

Focus on these key points:
1. What makes a medicine "generic" vs "branded"
2. The regulatory requirements (CDSCO bioequivalence standards)
3. Manufacturing and marketing cost differences
4. Quality and safety equivalence
5. Economic benefits for patients

Keep the explanation concise (200-300 words), professional but accessible language. Use simple analogies where helpful.`;

  const response = await getGroqClient().chat.completions.create({
    model: INSIGHTS_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are SaltWise's AI assistant. Explain pharmaceutical economics and generic medicine benefits in clear, patient-friendly language. Be educational and reassuring.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.4,
    max_tokens: 500,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from LLM for AI explanation");
  }

  return content.trim();
}

/**
 * Generate all AI insights for a drug (with caching)
 */
export async function generateDrugInsights(
  drugInput: DrugInput
): Promise<DrugInsights> {
  const startTime = Date.now();

  aiLogger.debug(
    { drugId: drugInput.id, model: INSIGHTS_MODEL },
    "Starting drug insights generation"
  );

  // Check cache first
  const cachedInsights = await getCachedInsights(drugInput.id);

  const insights: DrugInsights = { ...cachedInsights };

  // Generate missing insights in parallel
  const promises: Promise<void>[] = [];

  if (!insights.safetyInfo) {
    promises.push(
      generateSafetyInfo(drugInput).then((safetyInfo) => {
        insights.safetyInfo = safetyInfo;
      })
    );
  }

  if (!insights.interactions) {
    promises.push(
      generateInteractions(drugInput).then((interactions) => {
        insights.interactions = interactions;
      })
    );
  }

  if (!insights.aiExplanation) {
    promises.push(
      generateAiExplanation(drugInput).then((explanation) => {
        insights.aiExplanation = explanation;
      })
    );
  }

  if (promises.length > 0) {
    await Promise.all(promises);

    // Cache the newly generated insights
    await cacheInsights(drugInput.id, drugInput, insights);

    aiLogger.info(
      {
        drugId: drugInput.id,
        generatedTypes: Object.keys(insights).filter(
          (key) => !cachedInsights[key as keyof DrugInsights]
        ),
        durationMs: Date.now() - startTime,
      },
      "Generated new drug insights"
    );
  } else {
    aiLogger.debug(
      { drugId: drugInput.id, durationMs: Date.now() - startTime },
      "Used cached drug insights"
    );
  }

  return insights;
}
