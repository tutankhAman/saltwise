export interface Drug {
  id: string;
  brandName: string;
  salt: string;
  strength: string;
  form: string;
  manufacturer: string;
  manufacturerCountry?: string;
  gmpCertified?: boolean;
  isNti?: boolean;
  price?: number;
  packSize?: number;
}

export type SafetyTier = "exact_generic" | "therapeutic_equivalent";

export type PriceConfidence = "live" | "recent" | "cached" | "estimated";

export interface DrugAlternative {
  drug: Drug;
  pricePerUnit: number;
  totalPrice: number;
  savings: number;
  savingsPercent: number;
  safetyTier: SafetyTier;
}

export interface PharmacyPrice {
  pharmacy: string;
  price: number;
  packSize: number;
  perUnit: number;
  inStock: boolean;
  confidence: PriceConfidence;
  fetchedAt: string;
}

export interface DrugSearchResult {
  drug: Drug;
  alternatives: DrugAlternative[];
  prices: PharmacyPrice[];
  isSubstitutable: boolean;
  ntiWarning?: string;
}

export interface DrugSearchResponse {
  drugs: Drug[];
}

export interface UnifiedSearchResponse {
  type: "medicine" | "ai_response";
  results?: DrugSearchResult[];
  answer?: string;
  relatedDrugs?: Drug[];
}
