import type {
  Drug,
  DrugAlternative,
  DrugSearchResult,
  PharmacyPrice,
} from "./types";

export const MOCK_DRUGS: Drug[] = [
  {
    id: "d1",
    brandName: "Dolo 650",
    salt: "Paracetamol",
    strength: "650mg",
    form: "Tablet",
    manufacturer: "Micro Labs Ltd",
    manufacturerCountry: "India",
    gmpCertified: true,
    price: 30.5,
    packSize: 15,
  },
  {
    id: "d2",
    brandName: "Crocin Advance",
    salt: "Paracetamol",
    strength: "500mg",
    form: "Tablet",
    manufacturer: "GlaxoSmithKline",
    manufacturerCountry: "India",
    gmpCertified: true,
    price: 28.0,
    packSize: 15,
  },
  {
    id: "d3",
    brandName: "Augmentin 625 Duo",
    salt: "Amoxycillin + Clavulanic Acid",
    strength: "500mg + 125mg",
    form: "Tablet",
    manufacturer: "GlaxoSmithKline",
    manufacturerCountry: "India",
    gmpCertified: true,
    price: 228.0,
    packSize: 10,
  },
  {
    id: "d4",
    brandName: "Glycomet-GP 1",
    salt: "Metformin + Glimepiride",
    strength: "500mg + 1mg",
    form: "Tablet",
    manufacturer: "USV Ltd",
    manufacturerCountry: "India",
    gmpCertified: true,
    price: 136.0,
    packSize: 15,
  },
  {
    id: "d5",
    brandName: "Pan 40",
    salt: "Pantoprazole",
    strength: "40mg",
    form: "Tablet",
    manufacturer: "Alkem Laboratories",
    manufacturerCountry: "India",
    gmpCertified: true,
    price: 120.0,
    packSize: 15,
  },
  {
    id: "d6",
    brandName: "Thyronorm",
    salt: "Thyroxine Sodium",
    strength: "100mcg",
    form: "Tablet",
    manufacturer: "Abbott",
    manufacturerCountry: "India",
    gmpCertified: true,
    isNti: true,
    price: 122.0,
    packSize: 120,
  },
  {
    id: "d7",
    brandName: "Shelcal 500",
    salt: "Calcium + Vitamin D3",
    strength: "500mg + 250IU",
    form: "Tablet",
    manufacturer: "Torrent Pharmaceuticals",
    manufacturerCountry: "India",
    gmpCertified: true,
    price: 192.0,
    packSize: 15,
  },
  {
    id: "d8",
    brandName: "Becosules",
    salt: "B-Complex + Vitamin C",
    strength: "N/A",
    form: "Capsule",
    manufacturer: "Pfizer",
    manufacturerCountry: "India",
    gmpCertified: true,
    price: 32.0,
    packSize: 20,
  },
  {
    id: "d9",
    brandName: "Ascoril LS",
    salt: "Levosalbutamol + Ambroxol + Guaiphenesin",
    strength: "1mg + 30mg + 50mg",
    form: "Syrup",
    manufacturer: "Glenmark Pharmaceuticals",
    manufacturerCountry: "India",
    gmpCertified: true,
    price: 128.0,
    packSize: 1,
  },
  {
    id: "d10",
    brandName: "Telma 40",
    salt: "Telmisartan",
    strength: "40mg",
    form: "Tablet",
    manufacturer: "Glenmark Pharmaceuticals",
    manufacturerCountry: "India",
    gmpCertified: true,
    price: 148.0,
    packSize: 15,
  },
];

// Alternative drugs mapped by the original drug's salt
const MOCK_ALTERNATIVES_MAP: Record<string, Drug[]> = {
  Paracetamol: [
    {
      id: "alt-p1",
      brandName: "Calpol 650",
      salt: "Paracetamol",
      strength: "650mg",
      form: "Tablet",
      manufacturer: "GlaxoSmithKline",
      gmpCertified: true,
      price: 18.5,
      packSize: 15,
    },
    {
      id: "alt-p2",
      brandName: "P-650",
      salt: "Paracetamol",
      strength: "650mg",
      form: "Tablet",
      manufacturer: "Cipla Ltd",
      gmpCertified: true,
      price: 12.0,
      packSize: 10,
    },
    {
      id: "alt-p3",
      brandName: "Pacimol 650",
      salt: "Paracetamol",
      strength: "650mg",
      form: "Tablet",
      manufacturer: "Ipca Laboratories",
      gmpCertified: true,
      price: 14.0,
      packSize: 15,
    },
  ],
  "Amoxycillin + Clavulanic Acid": [
    {
      id: "alt-a1",
      brandName: "Moxikind-CV 625",
      salt: "Amoxycillin + Clavulanic Acid",
      strength: "500mg + 125mg",
      form: "Tablet",
      manufacturer: "Mankind Pharma",
      gmpCertified: true,
      price: 165.0,
      packSize: 10,
    },
    {
      id: "alt-a2",
      brandName: "Clavam 625",
      salt: "Amoxycillin + Clavulanic Acid",
      strength: "500mg + 125mg",
      form: "Tablet",
      manufacturer: "Alkem Laboratories",
      gmpCertified: true,
      price: 178.0,
      packSize: 10,
    },
  ],
  Pantoprazole: [
    {
      id: "alt-pan1",
      brandName: "Pantop 40",
      salt: "Pantoprazole",
      strength: "40mg",
      form: "Tablet",
      manufacturer: "Aristo Pharmaceuticals",
      gmpCertified: true,
      price: 68.0,
      packSize: 15,
    },
    {
      id: "alt-pan2",
      brandName: "Pantocid 40",
      salt: "Pantoprazole",
      strength: "40mg",
      form: "Tablet",
      manufacturer: "Sun Pharma",
      gmpCertified: true,
      price: 82.0,
      packSize: 15,
    },
  ],
  Telmisartan: [
    {
      id: "alt-t1",
      brandName: "Telsartan 40",
      salt: "Telmisartan",
      strength: "40mg",
      form: "Tablet",
      manufacturer: "Cipla Ltd",
      gmpCertified: true,
      price: 85.0,
      packSize: 15,
    },
    {
      id: "alt-t2",
      brandName: "Telday 40",
      salt: "Telmisartan",
      strength: "40mg",
      form: "Tablet",
      manufacturer: "Hetero Healthcare",
      gmpCertified: true,
      price: 72.0,
      packSize: 15,
    },
  ],
};

const MOCK_PHARMACY_PRICES: Record<string, PharmacyPrice[]> = {
  d1: [
    {
      pharmacy: "1mg",
      price: 30.5,
      packSize: 15,
      perUnit: 2.03,
      inStock: true,
      confidence: "live",
      fetchedAt: "2026-02-10T08:00:00Z",
    },
    {
      pharmacy: "PharmEasy",
      price: 28.0,
      packSize: 15,
      perUnit: 1.87,
      inStock: true,
      confidence: "recent",
      fetchedAt: "2026-02-09T20:00:00Z",
    },
    {
      pharmacy: "Netmeds",
      price: 31.0,
      packSize: 15,
      perUnit: 2.07,
      inStock: true,
      confidence: "cached",
      fetchedAt: "2026-02-08T12:00:00Z",
    },
    {
      pharmacy: "Apollo Pharmacy",
      price: 32.0,
      packSize: 15,
      perUnit: 2.13,
      inStock: false,
      confidence: "estimated",
      fetchedAt: "2026-02-05T10:00:00Z",
    },
  ],
  d3: [
    {
      pharmacy: "1mg",
      price: 228.0,
      packSize: 10,
      perUnit: 22.8,
      inStock: true,
      confidence: "live",
      fetchedAt: "2026-02-10T08:00:00Z",
    },
    {
      pharmacy: "PharmEasy",
      price: 220.0,
      packSize: 10,
      perUnit: 22.0,
      inStock: true,
      confidence: "recent",
      fetchedAt: "2026-02-09T18:00:00Z",
    },
    {
      pharmacy: "Netmeds",
      price: 225.0,
      packSize: 10,
      perUnit: 22.5,
      inStock: false,
      confidence: "cached",
      fetchedAt: "2026-02-07T10:00:00Z",
    },
  ],
  d5: [
    {
      pharmacy: "1mg",
      price: 120.0,
      packSize: 15,
      perUnit: 8.0,
      inStock: true,
      confidence: "live",
      fetchedAt: "2026-02-10T08:00:00Z",
    },
    {
      pharmacy: "PharmEasy",
      price: 115.0,
      packSize: 15,
      perUnit: 7.67,
      inStock: true,
      confidence: "live",
      fetchedAt: "2026-02-10T07:30:00Z",
    },
    {
      pharmacy: "Netmeds",
      price: 118.0,
      packSize: 15,
      perUnit: 7.87,
      inStock: true,
      confidence: "recent",
      fetchedAt: "2026-02-09T22:00:00Z",
    },
  ],
  d10: [
    {
      pharmacy: "1mg",
      price: 148.0,
      packSize: 15,
      perUnit: 9.87,
      inStock: true,
      confidence: "live",
      fetchedAt: "2026-02-10T08:00:00Z",
    },
    {
      pharmacy: "PharmEasy",
      price: 140.0,
      packSize: 15,
      perUnit: 9.33,
      inStock: true,
      confidence: "recent",
      fetchedAt: "2026-02-09T19:00:00Z",
    },
    {
      pharmacy: "Apollo Pharmacy",
      price: 155.0,
      packSize: 15,
      perUnit: 10.33,
      inStock: true,
      confidence: "cached",
      fetchedAt: "2026-02-08T14:00:00Z",
    },
  ],
};

function buildAlternatives(drug: Drug): DrugAlternative[] {
  const saltKey = drug.salt;
  const alts = MOCK_ALTERNATIVES_MAP[saltKey];
  if (!alts) {
    return [];
  }

  const originalPerUnit =
    drug.price && drug.packSize ? drug.price / drug.packSize : 0;

  return alts.map((alt) => {
    const altPerUnit = alt.price && alt.packSize ? alt.price / alt.packSize : 0;
    const savings = originalPerUnit > 0 ? originalPerUnit - altPerUnit : 0;
    const savingsPercent =
      originalPerUnit > 0 ? (savings / originalPerUnit) * 100 : 0;

    return {
      drug: alt,
      pricePerUnit: altPerUnit,
      totalPrice: alt.price ?? 0,
      savings: Math.max(0, savings),
      savingsPercent: Math.max(0, savingsPercent),
      safetyTier: "exact_generic" as const,
    };
  });
}

/**
 * Given a drug, build the full search result with alternatives and prices.
 */
export function buildMockSearchResult(drug: Drug): DrugSearchResult {
  return {
    drug,
    alternatives: drug.isNti ? [] : buildAlternatives(drug),
    prices: MOCK_PHARMACY_PRICES[drug.id] ?? [],
    isSubstitutable: !drug.isNti,
    ntiWarning: drug.isNti
      ? `${drug.salt} is a Narrow Therapeutic Index (NTI) drug. Generic substitution is not recommended without doctor approval.`
      : undefined,
  };
}

/**
 * Search mock drugs and return full results with alternatives and pricing.
 */
export function searchMockDrugs(query: string): DrugSearchResult[] {
  const lowerQuery = query.toLowerCase();
  const matched = MOCK_DRUGS.filter(
    (drug) =>
      drug.brandName.toLowerCase().includes(lowerQuery) ||
      drug.salt.toLowerCase().includes(lowerQuery)
  );
  return matched.map(buildMockSearchResult);
}
