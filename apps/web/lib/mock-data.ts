import type {
  AggregateSavingsData,
  Drug,
  DrugAlternative,
  DrugInteraction,
  DrugSearchResult,
  PharmacyPrice,
  PrescriptionMedicine,
  PrescriptionParseResult,
  SafetyInfo,
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
    drugClass: "Analgesic / Antipyretic",
    regulatoryStatus: "approved",
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
    drugClass: "Analgesic / Antipyretic",
    regulatoryStatus: "approved",
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
    drugClass: "Antibiotic (Penicillin + Beta-Lactamase Inhibitor)",
    regulatoryStatus: "approved",
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
    drugClass: "Antidiabetic (Biguanide + Sulfonylurea)",
    regulatoryStatus: "approved",
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
    drugClass: "Proton Pump Inhibitor (PPI)",
    regulatoryStatus: "approved",
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
    drugClass: "Thyroid Hormone",
    regulatoryStatus: "approved",
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
    drugClass: "Nutritional Supplement",
    regulatoryStatus: "approved",
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
    drugClass: "Nutritional Supplement",
    regulatoryStatus: "approved",
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
    drugClass: "Mucolytic / Bronchodilator",
    regulatoryStatus: "approved",
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
    drugClass: "Angiotensin II Receptor Blocker (ARB)",
    regulatoryStatus: "approved",
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

const MOCK_SAFETY_INFO: Record<string, SafetyInfo> = {
  d1: {
    sideEffects: [
      "Nausea",
      "Allergic skin rash",
      "Liver damage (overdose)",
      "Loss of appetite",
    ],
    dosageInfo:
      "1 tablet every 4-6 hours as needed. Do not exceed 4 tablets in 24 hours.",
    maxDailyDose: "4g (4000mg)",
    pregnancyCategory: "B",
    lactationWarning:
      "Considered safe during breastfeeding in recommended doses.",
    pediatricWarning:
      "Not recommended for children under 6 years without medical advice. Use age-appropriate formulations.",
    geriatricWarning:
      "Use with caution in elderly patients with liver or kidney impairment. Dose adjustment may be needed.",
  },
  d2: {
    sideEffects: [
      "Nausea",
      "Allergic skin rash",
      "Liver damage (overdose)",
      "Loss of appetite",
    ],
    dosageInfo:
      "1 tablet every 4-6 hours as needed. Do not exceed 8 tablets in 24 hours.",
    maxDailyDose: "4g (4000mg)",
    pregnancyCategory: "B",
    lactationWarning:
      "Considered safe during breastfeeding in recommended doses.",
    pediatricWarning:
      "Not recommended for children under 6 years. Use paediatric formulations.",
  },
  d3: {
    sideEffects: [
      "Diarrhoea",
      "Nausea / Vomiting",
      "Skin rash / Urticaria",
      "Abdominal discomfort",
      "Candidiasis (prolonged use)",
    ],
    dosageInfo:
      "1 tablet twice daily, preferably at the start of a meal. Complete the full prescribed course.",
    maxDailyDose: "1500mg Amoxycillin + 375mg Clavulanic Acid",
    pregnancyCategory: "B",
    lactationWarning:
      "Excreted in breast milk in small amounts. Use with caution.",
    pediatricWarning:
      "Safe for children; dose based on body weight. Use suspension for children under 12.",
    geriatricWarning:
      "Dose adjustment required in patients with renal impairment.",
  },
  d4: {
    sideEffects: [
      "Hypoglycaemia",
      "Nausea / Vomiting",
      "Diarrhoea",
      "Metallic taste",
      "Lactic acidosis (rare)",
      "Weight gain (Glimepiride component)",
    ],
    dosageInfo:
      "1 tablet once or twice daily with meals. Take with breakfast or the first main meal.",
    maxDailyDose: "2000mg Metformin + 8mg Glimepiride",
    pregnancyCategory: "C",
    lactationWarning:
      "Metformin is excreted in breast milk. Not recommended during breastfeeding.",
    pediatricWarning:
      "Not recommended for children under 18 years. Limited paediatric safety data.",
    geriatricWarning:
      "Higher risk of hypoglycaemia in elderly. Start with lowest dose and monitor blood glucose closely.",
  },
  d5: {
    sideEffects: [
      "Headache",
      "Diarrhoea",
      "Nausea",
      "Abdominal pain",
      "Flatulence",
      "Dizziness",
    ],
    dosageInfo:
      "1 tablet once daily, 30-60 minutes before a meal (preferably morning). Swallow whole, do not crush.",
    maxDailyDose: "80mg",
    pregnancyCategory: "C",
    lactationWarning:
      "Limited data on excretion in breast milk. Use only if clearly needed.",
    pediatricWarning:
      "Safety not established in children under 5 years for most indications.",
    geriatricWarning:
      "No dose adjustment needed. Monitor for vitamin B12 deficiency with long-term use.",
  },
  d6: {
    sideEffects: [
      "Palpitations / Tachycardia",
      "Weight loss",
      "Tremors",
      "Insomnia",
      "Heat intolerance",
      "Diarrhoea",
    ],
    dosageInfo:
      "Take once daily on an empty stomach, 30-60 minutes before breakfast. Maintain consistent timing.",
    maxDailyDose: "300mcg (varies by condition)",
    pregnancyCategory: "A",
    lactationWarning:
      "Safe during breastfeeding. Minimal amounts excreted in breast milk.",
    pediatricWarning:
      "Safe for children. Dose is weight-based and requires regular thyroid function monitoring.",
    geriatricWarning:
      "Start with lower dose (25-50mcg) in elderly and patients with cardiac disease. Titrate slowly.",
  },
  d7: {
    sideEffects: [
      "Constipation",
      "Bloating / Gas",
      "Nausea",
      "Hypercalcaemia (excessive use)",
    ],
    dosageInfo: "1 tablet twice daily after meals. Chew or swallow with water.",
    maxDailyDose: "2500mg Calcium",
    pregnancyCategory: "A",
    lactationWarning: "Safe during breastfeeding in recommended doses.",
    geriatricWarning:
      "Monitor calcium levels in patients with kidney disease. Avoid excessive supplementation.",
  },
  d8: {
    sideEffects: [
      "Mild GI discomfort",
      "Bright yellow urine (harmless)",
      "Nausea (if taken on empty stomach)",
    ],
    dosageInfo: "1 capsule once or twice daily after meals.",
    maxDailyDose: "2 capsules",
    pregnancyCategory: "A",
    lactationWarning:
      "Safe during breastfeeding. Water-soluble vitamins are excreted in breast milk.",
  },
  d9: {
    sideEffects: [
      "Nausea",
      "Diarrhoea",
      "Tremor",
      "Headache",
      "Palpitations",
      "Allergic reactions",
    ],
    dosageInfo: "10ml (2 teaspoons) three times daily. Shake well before use.",
    maxDailyDose: "30ml (6 teaspoons)",
    pregnancyCategory: "C",
    lactationWarning:
      "Levosalbutamol may inhibit uterine contractions. Avoid unless clearly needed.",
    pediatricWarning:
      "Use paediatric dose (5ml) for children 6-12 years. Not recommended under 6 without prescription.",
    geriatricWarning:
      "Use with caution in elderly patients with cardiovascular disease due to bronchodilator component.",
  },
  d10: {
    sideEffects: [
      "Dizziness",
      "Back pain",
      "Diarrhoea",
      "Upper respiratory infection",
      "Fatigue",
      "Hypotension (rare)",
    ],
    dosageInfo:
      "1 tablet once daily, with or without food. Take at the same time each day.",
    maxDailyDose: "80mg",
    pregnancyCategory: "D",
    lactationWarning:
      "Not recommended during breastfeeding. May affect infant kidney development.",
    pediatricWarning:
      "Not recommended for children under 18 years. Limited safety data.",
    geriatricWarning:
      "Start with lowest dose. Monitor blood pressure and kidney function regularly.",
  },
};

const MOCK_INTERACTIONS: Record<string, DrugInteraction[]> = {
  d1: [
    {
      drugId: "d3",
      drugName: "Augmentin 625 Duo",
      severity: "mild",
      description:
        "Paracetamol may slightly reduce the absorption of Amoxycillin. No dose adjustment usually needed.",
    },
    {
      drugId: "d10",
      drugName: "Telma 40",
      severity: "mild",
      description:
        "Regular high-dose Paracetamol may reduce the antihypertensive effect of Telmisartan. Occasional use is safe.",
    },
  ],
  d3: [
    {
      drugId: "d4",
      drugName: "Glycomet-GP 1",
      severity: "moderate",
      description:
        "Amoxycillin may increase the hypoglycaemic effect of Glimepiride. Monitor blood sugar levels during antibiotic course.",
    },
  ],
  d4: [
    {
      drugId: "d3",
      drugName: "Augmentin 625 Duo",
      severity: "moderate",
      description:
        "Antibiotics may enhance the hypoglycaemic effect of Sulfonylureas. Increased risk of low blood sugar.",
    },
    {
      drugId: "d10",
      drugName: "Telma 40",
      severity: "mild",
      description:
        "Telmisartan may slightly increase Metformin levels. Generally safe but monitor kidney function.",
    },
  ],
  d5: [
    {
      drugId: "d6",
      drugName: "Thyronorm",
      severity: "moderate",
      description:
        "Pantoprazole reduces stomach acid, which may decrease Thyroxine absorption. Take Thyroxine at least 4 hours before Pantoprazole.",
    },
    {
      drugId: "d7",
      drugName: "Shelcal 500",
      severity: "moderate",
      description:
        "PPIs like Pantoprazole reduce calcium absorption with long-term use. Consider monitoring calcium levels.",
    },
  ],
  d6: [
    {
      drugId: "d5",
      drugName: "Pan 40",
      severity: "moderate",
      description:
        "PPIs may reduce Thyroxine absorption. Maintain at least 4-hour gap between the two medicines.",
    },
    {
      drugId: "d7",
      drugName: "Shelcal 500",
      severity: "moderate",
      description:
        "Calcium supplements can significantly reduce Thyroxine absorption. Take Thyroxine at least 4 hours before calcium.",
    },
  ],
  d10: [
    {
      drugId: "d1",
      drugName: "Dolo 650",
      severity: "mild",
      description:
        "High-dose Paracetamol used regularly may reduce the blood pressure-lowering effect of Telmisartan.",
    },
    {
      drugId: "d4",
      drugName: "Glycomet-GP 1",
      severity: "mild",
      description:
        "Telmisartan may slightly increase Metformin levels. Generally safe in combination.",
    },
  ],
};

const MOCK_AI_EXPLANATIONS: Record<string, string> = {
  d1: "Dolo 650 is one of India's most recognised paracetamol brands. Generic paracetamol tablets contain the identical active ingredient — the price difference is purely marketing and distribution costs. All CDSCO-approved generics must pass the same bioequivalence tests, meaning they work identically in your body.",
  d2: 'Crocin Advance is a premium-priced paracetamol from GlaxoSmithKline. The "Advance" branding adds cost but not additional efficacy over standard paracetamol 500mg tablets. Generics from Cipla or Ipca offer the same relief at a fraction of the price.',
  d3: "Augmentin is a globally recognised antibiotic brand. Indian generics of Amoxycillin + Clavulanic Acid are manufactured in WHO-GMP certified facilities and are widely used in government hospitals. The branded version costs more due to multinational company overheads, not superior quality.",
  d4: "Glycomet-GP is a well-known antidiabetic combination. Generic versions of Metformin + Glimepiride are extensively used across India's public health system. The active ingredients are identical — cost differences reflect brand premium, not therapeutic value.",
  d5: "Pan 40 is a popular acid reducer. Pantoprazole generics are among the most commonly dispensed medicines in India. The patent expired years ago, and numerous manufacturers produce bioequivalent versions at significantly lower cost.",
  d6: "Thyronorm is a Narrow Therapeutic Index (NTI) drug, meaning even small dose variations can affect thyroid levels. For NTI drugs, switching brands without medical supervision is not recommended — your doctor should approve any change and monitor TSH levels after switching.",
  d7: "Shelcal is a premium calcium supplement. Generic Calcium + Vitamin D3 tablets are widely available at lower cost. Since these are nutritional supplements, generic versions offer identical nutritional value.",
  d8: "Becosules is Pfizer's branded B-Complex supplement. Generic B-vitamin complexes contain identical water-soluble vitamins. These vitamins are commodity ingredients — brand premium adds no nutritional benefit.",
  d9: "Ascoril LS is a combination cough syrup. Generic versions with the same triple combination (Levosalbutamol + Ambroxol + Guaiphenesin) are available from multiple manufacturers at lower cost. The formulation and dosage are standardised.",
  d10: "Telma 40 is a popular blood pressure medicine. Telmisartan generics are extensively available and used in government healthcare programs. All approved generics meet CDSCO bioequivalence standards.",
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

    // Generate consistent mock shopping options
    const basePrice = alt.price ?? 100;
    const allOptions = [
      {
        pharmacy: "1mg" as const,
        price: basePrice,
        url: `https://1mg.com/search/all?name=${encodeURIComponent(alt.brandName)}`,
        inStock: true,
      },
      {
        pharmacy: "PharmEasy" as const,
        price: Math.round(basePrice * 0.95), // 5% discount
        url: `https://pharmeasy.in/search/all?name=${encodeURIComponent(alt.brandName)}`,
        inStock: true,
      },
      {
        pharmacy: "Apollo" as const,
        price: Math.round(basePrice * 1.05), // 5% premium
        url: `https://www.apollopharmacy.in/search-medicines/${encodeURIComponent(alt.brandName)}`,
        inStock: true,
      },
      {
        pharmacy: "Netmeds" as const,
        price: Math.round(basePrice * 0.98), // 2% discount
        url: `https://www.netmeds.com/catalogsearch/result?q=${encodeURIComponent(alt.brandName)}`,
        inStock: Math.random() > 0.3, // Randomly out of stock
      },
    ];
    const shoppingOptions = allOptions.filter((o) => o.inStock);

    return {
      drug: alt,
      pricePerUnit: altPerUnit,
      totalPrice: alt.price ?? 0,
      savings: Math.max(0, savings),
      savingsPercent: Math.max(0, savingsPercent),
      safetyTier: "exact_generic" as const,
      shoppingOptions,
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
    safetyInfo: MOCK_SAFETY_INFO[drug.id],
    interactions: MOCK_INTERACTIONS[drug.id],
    aiExplanation: MOCK_AI_EXPLANATIONS[drug.id],
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

export function getDrugById(id: string): DrugSearchResult | null {
  const drug = MOCK_DRUGS.find((d) => d.id === id);
  if (!drug) {
    return null;
  }
  return buildMockSearchResult(drug);
}

/**
 * Simulated prescription "parsing" — picks a random subset of mock drugs to
 * mimic what an OCR / AI pipeline would return from a prescription image.
 */
const PRESCRIPTION_PRESETS: PrescriptionMedicine[][] = [
  [
    { name: "Dolo 650", strength: "650mg", quantity: 15 },
    { name: "Pan 40", strength: "40mg", quantity: 15 },
    { name: "Augmentin 625 Duo", strength: "500mg + 125mg", quantity: 10 },
  ],
  [
    { name: "Shelcal 500", strength: "500mg + 250IU", quantity: 30 },
    { name: "Thyronorm", strength: "100mcg", quantity: 30 },
    { name: "Becosules", strength: "N/A", quantity: 20 },
  ],
  [
    { name: "Dolo 650", strength: "650mg", quantity: 15 },
    { name: "Telma 40", strength: "40mg", quantity: 15 },
    { name: "Glycomet-GP 1", strength: "500mg + 1mg", quantity: 15 },
    { name: "Pan 40", strength: "40mg", quantity: 15 },
  ],
];

export async function parseMockPrescription(
  _fileName: string
): Promise<PrescriptionParseResult> {
  // Simulate network + OCR processing delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const presetIndex = Math.floor(Math.random() * PRESCRIPTION_PRESETS.length);
  const medicines: PrescriptionMedicine[] =
    PRESCRIPTION_PRESETS[presetIndex] ?? [];

  return { medicines, confidence: 0.9 };
}

/**
 * Compute aggregate savings across a set of search results.
 */
export function computeAggregateSavings(
  results: DrugSearchResult[]
): AggregateSavingsData {
  let totalOriginalCost = 0;
  let totalCheapestCost = 0;
  let medicinesWithSavings = 0;

  for (const result of results) {
    const originalPrice = result.drug.price ?? 0;
    totalOriginalCost += originalPrice;

    if (result.alternatives.length > 0) {
      const cheapest = Math.min(
        ...result.alternatives.map((a) => a.totalPrice)
      );
      totalCheapestCost += cheapest;
      medicinesWithSavings++;
    } else {
      totalCheapestCost += originalPrice;
    }
  }

  const totalSavings = Math.max(0, totalOriginalCost - totalCheapestCost);
  const savingsPercent =
    totalOriginalCost > 0 ? (totalSavings / totalOriginalCost) * 100 : 0;

  return {
    totalOriginalCost,
    totalCheapestCost,
    totalSavings,
    savingsPercent,
    medicineCount: medicinesWithSavings,
  };
}
