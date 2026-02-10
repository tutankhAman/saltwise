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
  image?: string;
  drugClass?: string;
  regulatoryStatus?: "approved" | "tentative" | "withdrawn";
  schedule?: string;
}

export type PregnancyCategory = "A" | "B" | "C" | "D" | "X";

export type InteractionSeverity =
  | "mild"
  | "moderate"
  | "severe"
  | "contraindicated";

export interface DrugInteraction {
  drugId: string;
  drugName: string;
  severity: InteractionSeverity;
  description: string;
}

export interface SafetyInfo {
  sideEffects: string[];
  dosageInfo: string;
  maxDailyDose: string;
  pregnancyCategory: PregnancyCategory;
  lactationWarning?: string;
  pediatricWarning?: string;
  geriatricWarning?: string;
}

export type SafetyTier = "exact_generic" | "therapeutic_equivalent";

export type PriceConfidence = "live" | "recent" | "cached" | "estimated";

export interface ShoppingOption {
  pharmacy: "1mg" | "PharmEasy" | "Apollo" | "Netmeds";
  price: number;
  url: string;
  inStock: boolean;
}

export interface DrugAlternative {
  drug: Drug;
  pricePerUnit: number;
  totalPrice: number;
  savings: number;
  savingsPercent: number;
  safetyTier: SafetyTier;
  shoppingOptions: ShoppingOption[];
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
  safetyInfo?: SafetyInfo;
  interactions?: DrugInteraction[];
  aiExplanation?: string;
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

export interface PrescriptionMedicine {
  name: string;
  strength?: string;
  form?: string;
  quantity?: number;
}

export interface PrescriptionParseResult {
  medicines: PrescriptionMedicine[];
  confidence: number;
}

export interface AggregateSavingsData {
  totalOriginalCost: number;
  totalCheapestCost: number;
  totalSavings: number;
  savingsPercent: number;
  medicineCount: number;
}
